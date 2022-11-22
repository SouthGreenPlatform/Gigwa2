package fr.cirad.security;

import java.io.IOException;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

import fr.cirad.tools.security.TokenManager;


/**
 * Redirect the user to different pages based on the authentication method
 * @author mignerot, sempere
 */
public class GigwaLogoutDispatchHandler implements LogoutSuccessHandler {
	private String defaultRedirect;
	private Map<String, String> methodRedirects;
	@Autowired private TokenManager tokenManager;
	
	/**
	 * @param defaultRedirect Page to redirect to when the user was not authenticated or when no redirect was defined for their authentication method
	 * @param methodRedirects Map that associates user authentication methods with pages to redirect to
	 */
	public GigwaLogoutDispatchHandler(String defaultRedirect, Map<String, String> methodRedirects) {
		this.defaultRedirect = defaultRedirect;
		this.methodRedirects = methodRedirects;
	}

	@Override
	public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
		tokenManager.clearTokensTiedToAuthentication(authentication);	// if user opened several web-browser tabs there may be tokens to clear

		if (authentication == null || authentication.getPrincipal() == null)
			response.sendRedirect(defaultRedirect);
		else {
			UserWithMethod user = (UserWithMethod)authentication.getPrincipal();
			String redirect = methodRedirects.get(user.getMethod());
			response.sendRedirect(redirect == null ? defaultRedirect : redirect);
		}
	}

}
