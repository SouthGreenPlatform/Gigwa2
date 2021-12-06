package fr.cirad.security;

import java.io.IOException;

import org.springframework.dao.DataAccessException;
import org.springframework.security.cas.authentication.CasAssertionAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.AuthenticationUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

public class GigwaUserDetailsWrapper<T extends Authentication> implements AuthenticationUserDetailsService<T> {
	private ReloadableInMemoryDaoImpl service;
	
	public GigwaUserDetailsWrapper(ReloadableInMemoryDaoImpl service) {
		this.service = service;
	}
	
	public void setUserDetailsService(ReloadableInMemoryDaoImpl service) {
		this.service = service;
	}
	
	public UserDetails loadUserDetails(T authentication) throws DataAccessException {
		try {
			return service.loadUserByUsername(authentication.getName());
		} catch (UsernameNotFoundException exc) {
			// New CAS user : create account
			// TODO : Config option to create account automatically or only manually
			System.out.println(authentication.getClass().getName());
			if (authentication instanceof CasAssertionAuthenticationToken) {
				System.out.println("New user");
				String[] authorities = {"ROLE_USER"};
				try {
					service.saveOrUpdateUser(authentication.getName(), null, authorities, true);
				} catch (IOException e) {
					e.printStackTrace();
					throw new ExternalUserCreationFailureException("Error while creating the new CAS user", e);
				}
				return service.loadUserByUsername(authentication.getName());
			} else {
				throw exc;
			}
		}
	}
}
