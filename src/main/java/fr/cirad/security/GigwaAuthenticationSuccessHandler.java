package fr.cirad.security;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import fr.cirad.security.base.IRoleDefinition;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;


public class GigwaAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
	private RequestCache requestCache = new HttpSessionRequestCache();

	private ReloadableInMemoryDaoImpl userDetailsService;

	public void setUserDetailsService(ReloadableInMemoryDaoImpl userDetailsService) {
		this.userDetailsService = userDetailsService;
	}

	public GigwaAuthenticationSuccessHandler() {

	}

	public GigwaAuthenticationSuccessHandler(String defaultTargetUrl) {
		super(defaultTargetUrl);
	}

	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
		if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
			String registrationId = oauthToken.getAuthorizedClientRegistrationId();
			OAuth2User oauth2User = oauthToken.getPrincipal();

			String username;

			//TODO adapt depending the registry
			if (registrationId.equals("keycloak")) {
				OidcUser oidcUser = (OidcUser) oauthToken.getPrincipal();
				username = oidcUser.getPreferredUsername();
				//Retrieving user roles from auth server
				Map<String, Object> realmAccess = (Map<String, Object>) oidcUser.getIdToken().getClaims().get("realm_access");
				List<String> roles = (List<String>) realmAccess.get("roles");
				if (roles == null || !roles.contains("gigwa_access")) {
					response.sendRedirect("/gigwa/login.do?error=access_denied");
					return;
				}
			} else if ("github".equals(registrationId)) {
				username = oauth2User.getAttribute("login");
			} else {
				// other provider
				username = oauth2User.getAttribute("preferred_username");
			}

			try {
				userDetailsService.loadUserByUsername(username);
			} catch (UsernameNotFoundException e) {
				try {
					userDetailsService.saveOrUpdateUser(username, "",
							new String[]{IRoleDefinition.DUMMY_EMPTY_ROLE}, true, registrationId, null);
				} catch (IOException ex) {
					throw new ServletException("Error creating OAuth2 user", ex);
				}
			}

		}

		SavedRequest savedRequest = requestCache.getRequest(request, response);
		if (savedRequest != null) {
			String targetUrl = savedRequest.getRedirectUrl();
			response.sendRedirect(targetUrl);
			//requestCache.removeRequest(request, response);
		} else {
			super.onAuthenticationSuccess(request, response, authentication);
		}
    }

	public RequestCache getRequestCache() {
		return requestCache;
	}

}
