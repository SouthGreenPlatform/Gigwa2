package fr.cirad.security;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

import fr.cirad.tools.AppConfig;

/**
 * Surfaces the error returned by the OAuth2/OIDC authorization service (e.g. "invalid_scope")
 * on the login page instead of a generic authentication failure.
 */
public class GigwaOAuth2AuthenticationFailureHandler implements AuthenticationFailureHandler {

	private static final Logger LOG = Logger.getLogger(GigwaOAuth2AuthenticationFailureHandler.class);

	@Autowired
	private AppConfig appConfig;

	@Override
	public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
			throws IOException, ServletException {
		String message = resolveMessage(exception);
		LOG.warn("OAuth2 authentication failed: " + message);
		GigwaAuthenticationSuccessHandler.redirectToLogin(request, response, appConfig, message);
	}

	/**
	 * Builds a readable message from the OAuth2 error, e.g.:
	 * "Authentication failed: invalid_scope (The requested scope is invalid)".
	 */
	private static String resolveMessage(AuthenticationException exception) {
		if (exception instanceof OAuth2AuthenticationException oauth2Exception) {
			OAuth2Error error = oauth2Exception.getError();
			String code = error.getErrorCode();
			String description = error.getDescription();

			StringBuilder message = new StringBuilder("Authentication failed");
			if (code != null && !code.isBlank())
				message.append(": ").append(code);
			if (description != null && !description.isBlank())
				message.append(" (").append(description).append(")");
			return message.toString();
		}

		String message = exception.getMessage();
		return message == null || message.isBlank() ? "Authentication failed." : message;
	}
}
