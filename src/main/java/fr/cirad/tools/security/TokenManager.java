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
package fr.cirad.tools.security;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import javax.ejb.ObjectNotFoundException;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;

import fr.cirad.security.ReloadableInMemoryDaoImpl;
import fr.cirad.security.base.IRoleDefinition;
import fr.cirad.tools.Helper;
import fr.cirad.tools.mongo.MongoTemplateManager;
import fr.cirad.tools.security.base.AbstractTokenManager;

/**
 *
 * @author petel, sempere
 */
@Component
public class TokenManager extends AbstractTokenManager {

    static private final Logger LOG = Logger.getLogger(TokenManager.class);

    private Map<String, Long> tokenLastUseTimes = new HashMap<>();
    private Map<String, Authentication> tokenToAuthenticationMap = new HashMap<>();

	@Autowired private ReloadableInMemoryDaoImpl userDao;
	@Autowired @Qualifier("authenticationManager") private AuthenticationManager authenticationManager;

	protected int sessionTimeoutInSeconds = 3600;	// one hour by default

	@Override
    public int getSessionTimeoutInSeconds() {
        return sessionTimeoutInSeconds;
    }
    
    @Override
    public void setSessionTimeoutInSeconds(int sessionTimeoutInSeconds) {
        this.sessionTimeoutInSeconds = sessionTimeoutInSeconds;
    }
    
    /**
     * update an existing token's expiry date
     *
     * @param token
     * @param dateTime
     */
    public void updateToken(String token, Long dateTime) {

    	if (token == null || token.length() == 0)
    		return;

    	if (!tokenLastUseTimes.keySet().contains(token))
    		LOG.debug("Adding token : " + token);
        tokenLastUseTimes.put(token, dateTime);
//        System.out.println(tokenLastUseTimes.size() + " token(s) in map");
    }
    
    /**
     * check if user has permission to read some contents of a database
     *
     * @param token
     * @param module
     * @return true if allowed to read some contents of a database
     * @throws ObjectNotFoundException 
     */
    @Override
    public boolean canUserReadDB(String token, String module) throws ObjectNotFoundException {
    	Authentication authentication = getAuthenticationFromToken(token);
    	boolean fResult = canUserReadDB(authentication == null ? null : userDao.getUserAuthorities(authentication), module);
    	if (fResult)
    		updateToken(token, System.currentTimeMillis());
        return fResult;
    }
    
    /**
     * check if user has permission to read some contents of a database
     *
     * @param authentication
     * @param module
     * @return true if allowed to read some contents of a database
     * @throws ObjectNotFoundException 
     */
    @Override
    public boolean canUserReadDB(Collection<? extends GrantedAuthority> authorities, String module) throws ObjectNotFoundException {
    	if (MongoTemplateManager.get(module) == null)
    		throw new ObjectNotFoundException("Database " + module + " does not exist");
        boolean hasAccess = false;
        if (MongoTemplateManager.isModulePublic(module))
            hasAccess = true;	// if the database is public, return true, no need to check for rights
        else
        {	// database is not public
    		boolean fAdminUser = authorities != null && authorities.contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
            if (fAdminUser || (authorities != null && (userDao.getSupervisedModules(authorities).contains(module) || userDao.getManagedEntitiesByModuleAndType(authorities).get(module) != null) || userDao.getCustomRolesByModuleAndEntityType(authorities).get(module) != null))
                hasAccess = true;
        }
        return hasAccess;
    }
    
    /**
     * check if user has permission to write some contents to a database
     *
     * @param token
     * @param module
     * @return true if allowed to read some contents of a database
     */
    public boolean canUserWriteToDB(String token, String module) {
    	Authentication authentication = getAuthenticationFromToken(token);
    	boolean fResult = canUserWriteToDB(authentication == null ? null : userDao.getUserAuthorities(authentication), module);
    	if (fResult)
    		updateToken(token, System.currentTimeMillis());
        return fResult;
    }
    
    public boolean canUserWriteToDB(Collection<? extends GrantedAuthority> authorities, String module) {
        boolean hasAccess = false;
		boolean fAdminUser = authorities != null && authorities.contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
        if (fAdminUser || (authorities != null && (userDao.getSupervisedModules(authorities).contains(module) || userDao.getManagedEntitiesByModuleAndType(authorities).get(module) != null)))
            hasAccess = true;
        return hasAccess;
    }
    
    /**
     * check if user has permission to create a project in a given database
     *
     * @param token
     * @param module
     * @return true if allowed to read some contents of a database
     */
    public boolean canUserCreateProjectInDB(String token, String module) {
    	Authentication authentication = getAuthenticationFromToken(token);
    	boolean fResult = canUserCreateProjectInDB(authentication == null ? null : userDao.getUserAuthorities(authentication), module);
    	if (fResult)
    		updateToken(token, System.currentTimeMillis());
        return fResult;
    }
    
    public boolean canUserCreateProjectInDB(Collection<? extends GrantedAuthority> authorities, String module) {
    	if (authorities == null)
    		return false;

        boolean fAdminUser = authorities != null && authorities.contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
        if (fAdminUser || (authorities != null  && userDao.getSupervisedModules(authorities).contains(module)))
            return true;
        return false;
    }

    /**
     * return readable modules a given Authentication instance
     *
     * @return List<String> readable modules
     */
    public Collection<String> listReadableDBs(Collection<? extends GrantedAuthority> authorities)
    {
        boolean fAdminUser = authorities != null && authorities.contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
        Map<String, Map<String, Map<String, Collection<Comparable>>>> customRolesByModuleAndEntityType = userDao.getCustomRolesByModuleAndEntityType(authorities);
        Map<String, Map<String, Collection<Comparable>>> managedEntitiesByModuleAndType = userDao.getManagedEntitiesByModuleAndType(authorities);
        Collection<String> modules = MongoTemplateManager.getAvailableModules(), authorizedModules = new ArrayList<String>();
        HashSet<String> supervisedModules = userDao.getSupervisedModules(authorities);
        for (String module : modules)
        {
            boolean fHiddenModule = MongoTemplateManager.isModuleHidden(module);
            boolean fPublicModule = MongoTemplateManager.isModulePublic(module);
            boolean fIsSupervisor = !fAdminUser && supervisedModules.contains(module);
            boolean fAuthorizedUser = authorities != null && (fIsSupervisor || customRolesByModuleAndEntityType.get(module) != null || managedEntitiesByModuleAndType.get(module) != null);
            if (fAdminUser || fIsSupervisor || (!fHiddenModule && (fAuthorizedUser || fPublicModule)))
                authorizedModules.add(module);
        }
        return authorizedModules;
    }
    
    /**
     * return readable modules for a given token
     *
     * @return List<String> readable modules
     */
    public Collection<String> listReadableDBs(String token) {
    	Authentication authentication = getAuthenticationFromToken(token);
    	Collection<String> authorizedModules = listReadableDBs(authentication == null ? null : userDao.getUserAuthorities(authentication));
		if (authorizedModules.size() > 0)
			updateToken(token, System.currentTimeMillis());
    	return authorizedModules;
    }
    
    /**
     * return writable modules for user
     *
     * @return List<String> writable modules
     */
    public Collection<String> listWritableDBs(String token) {
    	Authentication authentication = getAuthenticationFromToken(token);
    	Collection<String> authorizedModules = listWritableDBs(authentication == null ? null : userDao.getUserAuthorities(authentication));
		if (authorizedModules.size() > 0)
			updateToken(token, System.currentTimeMillis());
    	return authorizedModules;
    }
    
    /**
     * return writable modules for user
     *
     * @return List<String> writable modules
     */
    public Collection<String> listWritableDBs(Collection<? extends GrantedAuthority> authorities) {
        if (authorities != null && authorities.contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN)))
            return MongoTemplateManager.getAvailableModules();
        
		HashSet<String> authorizedModules = userDao.getSupervisedModules(authorities);
		Map<String, Map<String, Collection<Comparable>>> managedEntitiesByModuleAndType = userDao.getManagedEntitiesByModuleAndType(authorities);
		for (String module : managedEntitiesByModuleAndType.keySet()) {
			Collection<Comparable> managedProjects = managedEntitiesByModuleAndType.get(module).get(ENTITY_PROJECT);
			if (managedProjects != null && !managedProjects.isEmpty())
				authorizedModules.add(module);
		}
        return authorizedModules;
    }
    
	public boolean canUserWriteToProject(String token, String sModule, int projectId)
	{
    	Authentication authentication = getAuthenticationFromToken(token);
    	boolean fResult = canUserWriteToProject(authentication == null ? null : userDao.getUserAuthorities(authentication), sModule, projectId);
    	if (fResult)
    		updateToken(token, System.currentTimeMillis());
        return fResult;
	}
    
	public boolean canUserWriteToProject(Collection<? extends GrantedAuthority> authorities, String sModule, int projectId)
	{
		if (authorities != null && authorities.contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN)))
			return true;
		
		if (authorities == null)
			return false;
		
		if (userDao.getSupervisedModules(authorities).contains(sModule))
		    return true;
		
		Map<String, Collection<Comparable>> managedEntitesByType = userDao.getManagedEntitiesByModuleAndType(authorities).get(sModule);
		if (managedEntitesByType != null) {
			Collection<Comparable> managedProjects = managedEntitesByType.get(ENTITY_PROJECT);
			if (managedProjects != null && managedProjects.contains(projectId))
				return true;
		}
		return false;
	}
    
	@Override
    public boolean canUserReadProject(String token, String module, int projectId) throws ObjectNotFoundException
    {
        Authentication authentication = getAuthenticationFromToken(token);
        boolean fResult = canUserReadProject(authentication == null ? null : userDao.getUserAuthorities(authentication), module, projectId);
        if (fResult)
            updateToken(token, System.currentTimeMillis());
        return fResult;
    }
    
	@Override
	public boolean canUserReadProject(Collection<? extends GrantedAuthority> authorities, String sModule, int projectId) throws ObjectNotFoundException
	{
    	if (MongoTemplateManager.get(sModule) == null)
    		throw new ObjectNotFoundException("Database " + sModule + " does not exist");

        if (MongoTemplateManager.isModulePublic(sModule))
            return true;
        
		if (authorities == null)
		    return false;
		
		if (authorities.contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN)) || userDao.getSupervisedModules(authorities).contains(sModule))
            return true;

		Map<String, Map<String, Collection<Comparable>>> customRolesByEntityType = userDao.getCustomRolesByModuleAndEntityType(authorities).get(sModule);
		if (customRolesByEntityType != null)
		{
			Map<String, Collection<Comparable>> customRolesOnProjects = customRolesByEntityType.get(ENTITY_PROJECT);
			if (customRolesOnProjects != null)
			{
				Collection<Comparable> projectCustomRoles = customRolesOnProjects.get(ROLE_READER);
				if (projectCustomRoles == null)
					projectCustomRoles = customRolesOnProjects.get(IRoleDefinition.ENTITY_MANAGER_ROLE);
				if (projectCustomRoles != null && projectCustomRoles.contains(projectId))
					return true;
			}
		}
		
		Map<String, Collection<Comparable>> managedEntitesByType = userDao.getManagedEntitiesByModuleAndType(authorities).get(sModule);
		if (managedEntitesByType != null)
		{
			Collection<Comparable> managedProjects = managedEntitesByType.get(ENTITY_PROJECT);
			if (managedProjects != null && managedProjects.contains(projectId))
				return true;

		}
		return false;
	}

    /**
     * remove expired tokens from the map
     * this method is to be called periodically
     *
     */
	@Override
    public void cleanupTokenMap() {
        List<String> expiredTokens = new ArrayList<>();
        for (String token : tokenLastUseTimes.keySet()) {
        	Long time = tokenLastUseTimes.get(token);            
            if (System.currentTimeMillis() - time > sessionTimeoutInSeconds * 1000)
                expiredTokens.add(token);	// token has expired
        }

        MongoTemplateManager.dropAllTempColls(expiredTokens);
        for (String expiredToken : expiredTokens)
            removeToken(expiredToken);
        if (expiredTokens.size() > 0)
        	LOG.debug("cleanupTokenMap removed " + expiredTokens.size() + " token(s)");
    }
	
	@Override
    public void clearTokensTiedToAuthentication(Authentication auth) {
        List<String> tokensForOutOfDateAuth = new ArrayList<>();
        for (String token : tokenToAuthenticationMap.keySet()) {
        	Authentication tokenAuth = tokenToAuthenticationMap.get(token);   
        	if (tokenAuth.equals(auth))
        		tokensForOutOfDateAuth.add(token);
        }

        MongoTemplateManager.dropAllTempColls(tokensForOutOfDateAuth);
        for (String expiredToken : tokensForOutOfDateAuth)
            removeToken(expiredToken);
        if (tokensForOutOfDateAuth.size() > 0)
        	LOG.debug("cleanupTokensTiedToAuthentication removed " + tokensForOutOfDateAuth.size() + " token(s)");
    }
    
	public void reloadUserPermissions(SecurityContext securityContext) throws IOException {
		userDao.reloadProperties();
		if (securityContext.getAuthentication() != null)	// otherwise the importing user has logged off in the meantime
			securityContext.setAuthentication(authenticationManager.authenticate(securityContext.getAuthentication()));
	}

    @Override
    public boolean removeToken(String token) {
		return tokenToAuthenticationMap.remove(token) != null && tokenLastUseTimes.remove(token) != null;
	}
	
//    @Override
//    public String createAndAttachToken(String username, String password) throws IllegalArgumentException, UnsupportedEncodingException
//    {
//    	LOG.debug("createAndAttachToken called");
//    	boolean fLoginAttempt = username != null && username.length() > 0;
//        
//		Authentication authentication = null;
//		if (fLoginAttempt)
//		{
//			try
//			{
//				SecurityContextHolder.getContext().setAuthentication(authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password)));
//			}
//			catch (BadCredentialsException ignored)
//			{	// log him out
//				SecurityContextHolder.getContext().setAuthentication(null);
//			}
//		}
//
//		String token = null;
//		authentication = SecurityContextHolder.getContext().getAuthentication();
//		if (authentication == null && fLoginAttempt)
//			LOG.info("Authentication failed for user " + username);
//		else
//		{	// either login succeeded or anonymous user without login attempt
//		    token = generateToken(authentication);    	
//			if (!"anonymousUser".equals(authentication.getName()))
//				LOG.info("User " + authentication.getName() + " was provided with token " + token);
//			else// if (fLoginAttempt)
//				LOG.info("Anonymous user was provided with token " + token);
//		}
//    	return token;
//    }

    @Override
    public Authentication getAuthenticationFromToken(String token) {
    	Long lastUseTime = tokenLastUseTimes.get(token);
    	if (lastUseTime == null)
    		return null;

        if (System.currentTimeMillis() - lastUseTime > sessionTimeoutInSeconds * 1000)
        	removeToken(token);	// it's expired
    	return tokenToAuthenticationMap.get(token);
    }
    
    @Override
    public String generateToken(Authentication auth/*, int nMaxInactiveSeconds*/) throws IllegalArgumentException, UnsupportedEncodingException
    {
    	Algorithm algorithm = Algorithm.HMAC256(Helper.convertToMD5(getClass().getName()));
    	Date now = new Date();
	    String token = JWT.create().withIssuer("auth0").withIssuedAt(now)/*.withExpiresAt(new Date(now.getTime() + nMaxInactiveSeconds * 1000))*/.sign(algorithm);
	    tokenToAuthenticationMap.put(token, auth);
	    updateToken(token, System.currentTimeMillis());
	    return token;
    }
}
