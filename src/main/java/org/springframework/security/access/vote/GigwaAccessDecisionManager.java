/*******************************************************************************
 * GIGWA - Genotype Investigator for Genome Wide Analyses
 * Copyright (C) 2016 - 2019, <CIRAD> <IRD>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License, version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * See <http://www.gnu.org/licenses/agpl.html> for details about GNU General
 * Public License V3.
 *******************************************************************************/
package org.springframework.security.access.vote;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDecisionVoter;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.ConfigAttribute;
import org.springframework.security.access.vote.AffirmativeBased;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.FilterInvocation;
import org.springframework.stereotype.Component;

import fr.cirad.security.ReloadableInMemoryDaoImpl;
import fr.cirad.security.base.IRoleDefinition;
import fr.cirad.tools.mongo.MongoTemplateManager;
import fr.cirad.tools.security.TokenManager;
import fr.cirad.web.controller.security.UserPermissionController;

/**
 * The Class GigwaAccessDecisionManager.
 */
@Component
public class GigwaAccessDecisionManager extends AffirmativeBased
{
	@SuppressWarnings("unused")
	private static final Logger LOG = Logger.getLogger(GigwaAccessDecisionManager.class);

	@Autowired private ReloadableInMemoryDaoImpl userDao;
	@Autowired private TokenManager tokenManager;
	
	public GigwaAccessDecisionManager(List<AccessDecisionVoter<?>> decisionVoters) {
		super(decisionVoters);
	}
	
    /* (non-Javadoc)
     * @see org.springframework.security.access.vote.AffirmativeBased#decide(org.springframework.security.core.Authentication, java.lang.Object, java.util.Collection)
     */
    @Override
    public void decide(Authentication authentication, Object object, Collection<ConfigAttribute> configAttributes) throws AccessDeniedException
    {
    	if (object instanceof FilterInvocation)
    	{    		
    	    // not exactly sure how risky it is not to use the passed Authentication parameter, but the authorities Collection we get through getLoggedUserAuthorities provides us always up-to-date info (without need for re-authentication)
    		final String token = tokenManager.readToken(((FilterInvocation) object).getHttpRequest());
    		Authentication auth = tokenManager.getAuthenticationFromToken(token);
    		Collection<? extends GrantedAuthority> authorities = auth != null ? userDao.getUserAuthorities(auth) : userDao.getLoggedUserAuthorities(); 

    		FilterInvocation fi = (FilterInvocation) object;
    		String sModule = fi.getRequest().getParameter("module");
    		if (sModule != null && MongoTemplateManager.get(sModule) != null && !MongoTemplateManager.isModulePublic(sModule))
    		{
    			boolean fIsAnonymous = authorities != null && authorities.contains(new SimpleGrantedAuthority("ROLE_ANONYMOUS"));
    			boolean fIsAdmin = authorities != null && authorities.contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
    			boolean fHasRequiredRole;
    			
    			// deal with specific URLs
    			if (fi.getRequestUrl().startsWith(UserPermissionController.userPermissionURL))
    			{	// page for granting roles to users
    			    if (userDao.getSupervisedModules(authorities).contains(sModule))
    			        fHasRequiredRole = true;
    			    else {
        				Map<String /*entity-type*/, Collection<Comparable> /*entity-IDs*/> managedEntitiesByType = userDao.getManagedEntitiesByModuleAndType(authorities).get(sModule);
        				fHasRequiredRole = managedEntitiesByType != null && managedEntitiesByType.size() > 0;
    			    }
    			}
    			else
    			{	/*FIXME: this class needs to be refactored or even discarded*/
    				fHasRequiredRole = true;	// authorities != null && authorities.contains(new GrantedAuthorityImpl(USER_ROLE_PREFIX + sModule.toUpperCase().replaceAll(" ", "_")));
    			}
    			if (fIsAnonymous || (!fIsAdmin && !fHasRequiredRole))
	    			throw new AccessDeniedException("You are not allowed to access module '" + sModule + "'");
    		}
    	}
    	super.decide(authentication, object, configAttributes);
    }

}
