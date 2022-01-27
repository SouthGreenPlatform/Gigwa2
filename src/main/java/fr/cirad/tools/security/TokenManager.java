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
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ejb.ObjectNotFoundException;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
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
    	if (authentication == null)
    		authentication = SecurityContextHolder.getContext().getAuthentication();
    	boolean fResult = canUserReadDB(authentication, module);
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
    public boolean canUserReadDB(Authentication authentication, String module) throws ObjectNotFoundException {
    	if (MongoTemplateManager.get(module) == null)
    		throw new ObjectNotFoundException("Database " + module + " does not exist");
        boolean hasAccess = false;
        if (MongoTemplateManager.isModulePublic(module))
            hasAccess = true;	// if the database is public, return true, no need to check for rights
        else
        {	// database is not public
    		boolean fAuthentifiedUser = authentication != null && authentication.getAuthorities() != null && !"anonymousUser".equals(authentication.getPrincipal());
    		boolean fAdminUser = fAuthentifiedUser && authentication.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
            if (fAdminUser || (fAuthentifiedUser && (userDao.getCustomRolesByModuleAndEntityType(authentication.getAuthorities()).get(module) != null || userDao.getManagedEntitiesByModuleAndType(authentication.getAuthorities()).get(module) != null)))
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
    	if (authentication == null)
    		authentication = SecurityContextHolder.getContext().getAuthentication();
    	boolean fResult = canUserWriteToDB(authentication, module);
    	if (fResult)
    		updateToken(token, System.currentTimeMillis());
        return fResult;
    }
    
    public boolean canUserWriteToDB(Authentication authentication, String module) {

        boolean hasAccess = false;
		boolean fAuthentifiedUser = authentication != null && authentication.getAuthorities() != null && !"anonymousUser".equals(authentication.getPrincipal());
		boolean fAdminUser = fAuthentifiedUser && authentication.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
		Collection<String> writableEntityTypes = userDao.getWritableEntityTypesByModule(authentication.getAuthorities()).get(module);
        if (fAdminUser || (fAuthentifiedUser && ((writableEntityTypes != null && writableEntityTypes.contains(ENTITY_PROJECT)) || userDao.getManagedEntitiesByModuleAndType(authentication.getAuthorities()).get(module) != null)))
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
    	if (authentication == null)
    		authentication = SecurityContextHolder.getContext().getAuthentication();
    	boolean fResult = canUserCreateProjectInDB(authentication, module);
    	if (fResult)
    		updateToken(token, System.currentTimeMillis());
        return fResult;
    }
    
    public boolean canUserCreateProjectInDB(Authentication authentication, String module) 
    {
    	if (authentication == null)
    		return false;

		boolean fAuthentifiedUser = authentication != null && authentication.getAuthorities() != null && !"anonymousUser".equals(authentication.getPrincipal());
		boolean fAdminUser = fAuthentifiedUser && authentication.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
		Collection<String> writableEntityTypes = userDao.getWritableEntityTypesByModule(authentication.getAuthorities()).get(module);
        if (fAdminUser || (fAuthentifiedUser && ((writableEntityTypes != null && writableEntityTypes.contains(ENTITY_PROJECT)))))
            return true;
        return false;
    }

    /**
     * return readable modules a given Authentication instance
     *
     * @return List<String> readable modules
     */
    public Collection<String> listReadableDBs(Authentication authentication)
    {
    	Map<String, Map<String, Map<String, Collection<Comparable>>>> customRolesByModuleAndEntityType = userDao.getCustomRolesByModuleAndEntityType(authentication.getAuthorities());
    	Map<String, Map<String, Collection<Comparable>>> managedEntitiesByModuleAndType = userDao.getManagedEntitiesByModuleAndType(authentication.getAuthorities());
		Collection<String> modules = MongoTemplateManager.getAvailableModules(), authorizedModules = new ArrayList<String>();
		for (String module : modules)
		{
			boolean fHiddenModule = MongoTemplateManager.isModuleHidden(module);
			boolean fPublicModule = MongoTemplateManager.isModulePublic(module);
			boolean fAuthentifiedUser = authentication != null && authentication.getAuthorities() != null && !"anonymousUser".equals(authentication.getPrincipal());
			boolean fAdminUser = fAuthentifiedUser && authentication.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
			boolean fAuthorizedUser = fAuthentifiedUser && (customRolesByModuleAndEntityType.get(module) != null || managedEntitiesByModuleAndType.get(module) != null);
			if (fAdminUser || (!fHiddenModule && (fAuthorizedUser || fPublicModule)))
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
    	if (authentication == null)
    		authentication = SecurityContextHolder.getContext().getAuthentication();
    	Collection<String> authorizedModules = listReadableDBs(authentication);
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
    	if (authentication == null)
    		authentication = SecurityContextHolder.getContext().getAuthentication();
    	Collection<String> authorizedModules = listWritableDBs(authentication);
		if (authorizedModules.size() > 0)
			updateToken(token, System.currentTimeMillis());
    	return authorizedModules;
    }
    
    /**
     * return writable modules for user
     *
     * @return List<String> writable modules
     */
    public Collection<String> listWritableDBs(Authentication authentication) {
		Collection<String> modules = MongoTemplateManager.getAvailableModules(), authorizedModules = new ArrayList<String>();
		Map<String, Collection<String>> writableEntityTypesByModule = userDao.getWritableEntityTypesByModule(authentication.getAuthorities());
		Map<String, Map<String, Collection<Comparable>>> managedEntitiesByModuleAndType = userDao.getManagedEntitiesByModuleAndType(authentication.getAuthorities());
		for (String module : modules)
		{
//			boolean fHiddenModule = MongoTemplateManager.isModuleHidden(module);
			boolean fAuthentifiedUser = authentication != null && authentication.getAuthorities() != null && !"anonymousUser".equals(authentication.getPrincipal());
			boolean fAdminUser = fAuthentifiedUser && authentication.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
			Collection<String> writableEntityTypes = writableEntityTypesByModule.get(module);
			boolean fAuthorizedUser = fAuthentifiedUser && ((writableEntityTypes != null && writableEntityTypes.contains(ENTITY_PROJECT)) || managedEntitiesByModuleAndType.get(module) != null);
			if (fAdminUser || (/*!fHiddenModule && */fAuthorizedUser))
				authorizedModules.add(module);
		}
        return authorizedModules;
    }
    
	public boolean canUserWriteToProject(String token, String sModule, int projectId)
	{
    	Authentication authentication = getAuthenticationFromToken(token);
    	if (authentication == null)
    		authentication = SecurityContextHolder.getContext().getAuthentication();
    	boolean fResult = canUserWriteToProject(authentication, sModule, projectId);
    	if (fResult)
    		updateToken(token, System.currentTimeMillis());
        return fResult;
	}
    
	public boolean canUserWriteToProject(Authentication authentication, String sModule, int projectId)
	{
		boolean fAuthentifiedUser = authentication != null && authentication.getAuthorities() != null && !"anonymousUser".equals(authentication.getPrincipal());
		if (fAuthentifiedUser && authentication.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN)))
			return true;
		
		if ("anonymousUser".equals(authentication.getPrincipal()))
			return false;
		
		Map<String, Collection<Comparable>> managedEntitesByType = userDao.getManagedEntitiesByModuleAndType(authentication.getAuthorities()).get(sModule);
		if (managedEntitesByType != null)
		{
			Collection<Comparable> managedProjects = managedEntitesByType.get(ENTITY_PROJECT);
			if (managedProjects != null && managedProjects.contains(projectId))
				return true;

		}
		return false;
	}
    
	@Override
    public boolean canUserReadProject(String token, String module, int projectId)
    {
    	Authentication authentication = getAuthenticationFromToken(token);
    	if (authentication == null)
    		authentication = SecurityContextHolder.getContext().getAuthentication();
    	boolean fResult = canUserReadProject(authentication, module, projectId);
    	if (fResult)
    		updateToken(token, System.currentTimeMillis());
        return fResult;
    }
    
	@Override
	public boolean canUserReadProject(Authentication authentication, String sModule, int projectId)
	{
		boolean fAuthentifiedUser = authentication != null && authentication.getAuthorities() != null && !"anonymousUser".equals(authentication.getPrincipal());
		if (fAuthentifiedUser && authentication.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN)))
			return true;

		if (MongoTemplateManager.isModulePublic(sModule))
			return true;
		
		if ("anonymousUser".equals(authentication.getPrincipal()))
			return false;	// it's not public

		Map<String, Map<String, Collection<Comparable>>> customRolesByEntityType = userDao.getCustomRolesByModuleAndEntityType(authentication.getAuthorities()).get(sModule);
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
		
		Map<String, Collection<Comparable>> managedEntitesByType = userDao.getManagedEntitiesByModuleAndType(authentication.getAuthorities()).get(sModule);
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
     * @throws ParseException
     */
	@Override
    public void cleanupTokenMap() throws ParseException {

        List<String> expiredTokens = new ArrayList<>();
        for (String token : tokenLastUseTimes.keySet()) {
        	Long time = tokenLastUseTimes.get(token);            
            if (System.currentTimeMillis() - time > sessionTimeoutInSeconds * 1000)
                expiredTokens.add(token);	// token has expired
        }
        for (String expiredToken : expiredTokens) {
            MongoTemplateManager.dropAllTempColls(expiredToken);
            removeToken(expiredToken);
        }
        if (expiredTokens.size() > 0)
        	LOG.debug("cleanupTokenMap removed " + expiredTokens.size() + " token(s)");
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
	
    @Override
    public String createAndAttachToken(String username, String password) throws IllegalArgumentException, UnsupportedEncodingException
    {
    	LOG.debug("createAndAttachToken called");
    	boolean fLoginAttempt = username != null && username.length() > 0;
        
		Authentication authentication = null;
		if (fLoginAttempt)
		{
			try
			{
				SecurityContextHolder.getContext().setAuthentication(authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password)));
			}
			catch (BadCredentialsException ignored)
			{	// log him out
				SecurityContextHolder.getContext().setAuthentication(null);
			}
		}

		String token = null;
		authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null && fLoginAttempt)
			LOG.info("Authentication failed for user " + username);
		else
		{	// either login succeeded or anonymous user without login attempt
		    token = generateToken(authentication);    	
			if (!"anonymousUser".equals(authentication.getName()))
				LOG.info("User " + authentication.getName() + " was provided with token " + token);
			else// if (fLoginAttempt)
				LOG.info("Anonymous user was provided with token " + token);
		}
    	return token;
    }

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
