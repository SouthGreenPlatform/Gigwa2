package fr.cirad.security;

import java.io.IOException;

import org.apache.log4j.Logger;
import org.springframework.dao.DataAccessException;
import org.springframework.security.cas.authentication.CasAssertionAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.AuthenticationUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import fr.cirad.security.base.IRoleDefinition;

public class GigwaUserDetailsWrapper<T extends Authentication> implements AuthenticationUserDetailsService<T> {
	private static final Logger LOG = Logger.getLogger(GigwaUserDetailsWrapper.class);
	
	public static final String METHOD_CAS = "CAS";
	
	private ReloadableInMemoryDaoImpl service;
	
	public GigwaUserDetailsWrapper(ReloadableInMemoryDaoImpl service) {
		this.service = service;
	}
	
	public void setUserDetailsService(ReloadableInMemoryDaoImpl service) {
		this.service = service;
	}
	
	public UserDetails loadUserDetails(T authentication) throws DataAccessException {
		if (authentication instanceof CasAssertionAuthenticationToken) {  // CAS authentication
			try {
				return service.loadUserByUsernameAndMethod(authentication.getName(), METHOD_CAS);
			} catch (UsernameNotFoundException exc) {
				// New CAS user : create account
				// TODO : Config option to create account automatically or only manually
				String[] authorities = {IRoleDefinition.DUMMY_EMPTY_ROLE};
				try {
					service.saveOrUpdateUser(authentication.getName(), "", authorities, true, METHOD_CAS);
				} catch (IOException e) {
					LOG.error(e);
					throw new ExternalUserCreationFailureException("Error while creating the new CAS user", e);
				}
				UserDetails user = service.loadUserByUsernameAndMethod(authentication.getName(), METHOD_CAS);
				return user;
			}
		} else {  // Traditional authentication
			return service.loadUserByUsername(authentication.getName());
		}
	}
}
