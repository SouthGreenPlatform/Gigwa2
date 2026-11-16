package fr.cirad.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Component;

import fr.cirad.security.base.IRoleDefinition;
import fr.cirad.tools.AppConfig;

@Component
public class GigwaAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

	private RequestCache requestCache = new HttpSessionRequestCache();

	private static final Logger LOG = Logger.getLogger(GigwaAuthenticationSuccessHandler.class);

	private static final String LOGIN_PAGE = "/login.do";

	public static final String LOGIN_ERROR_SESSION_KEY = GigwaAuthenticationSuccessHandler.class.getName() + ".loginError";

	private ReloadableInMemoryDaoImpl userDetailsService;

	public void setUserDetailsService(ReloadableInMemoryDaoImpl userDetailsService) {
		this.userDetailsService = userDetailsService;
	}

	public GigwaAuthenticationSuccessHandler() {

	}

	public GigwaAuthenticationSuccessHandler(String defaultTargetUrl) {
		super(defaultTargetUrl);
	}

	@Autowired
	private AppConfig appConfig;

	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
		request.getSession().removeAttribute(LOGIN_ERROR_SESSION_KEY);
		if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
			String registrationId = oauthToken.getAuthorizedClientRegistrationId();
			OAuth2User oauth2User = oauthToken.getPrincipal();

			// Namespaced auth method persisted on the account, e.g. "oidc:google". Keeps OIDC providers
			// distinct from CAS even if one is registered under the name "cas".
			String authMethod = UserWithMethod.METHOD_OIDC_PREFIX + registrationId.toLowerCase();

			// Stable provider-side identifier: OIDC 'sub', or the provider-specific handle for
			// OAuth2-only services (GitHub 'login', BMS 'username').
			String subject = resolveSubject(registrationId, oauth2User);

			String username;
			try {
				username = resolveUsername(registrationId, oauth2User);
			} catch (Exception e) {
				redirectToLogin(request, response, e.getMessage());
				return;
			}

			if (username == null || username.isBlank()) {
				LOG.warn("OAuth2 login via '" + registrationId + "' produced no usable username (attributes: " + oauth2User.getAttributes().keySet() + ")");
				redirectToLogin(request, response, "Your identity provider did not return a usable username. Please contact the administrator.");
				return;
			}

			// e-mail claim, when the provider supplies one (OIDC "email" scope); stored on the account
			// just like CAS-provisioned users.
			String email = oauth2User.getAttribute("email");
			if (email != null)
				email = email.trim().isEmpty() ? null : email.trim();
            try {
                enforceEmailDomainAllowlist(email);
            } catch (AccessDeniedException e) {
				redirectToLogin(request, response, e.getMessage());
				return;
            }

            // The stable identity of an OAuth2/OIDC account is (method, subject).
			// The provider may change the username or e-mail, but the subject remains the same.
			UserWithMethod subjectOwner = null;
			if (subject != null) {
				try {
					subjectOwner = userDetailsService.getUserWithMethodByMethodAndSubject(authMethod, subject);
				} catch (IllegalArgumentException ex) {
					LOG.warn("Several accounts match method '" + authMethod + "' and subject '" + subject + "': " + ex.getMessage());
					redirectToLogin(request, response, ex.getMessage());
					return;
				}
			}

			if (subjectOwner != null) {
				// The provider username or email may have changed.
				if (!subjectOwner.getUsername().equalsIgnoreCase(username)) {
					LOG.warn("OAuth2 subject '" + subject + "' belongs to account '" + subjectOwner.getUsername() + "'; resolved username '" + username + "' will be set to " + username);
				}
				boolean emailChanged = email != null && !email.equalsIgnoreCase(subjectOwner.getEmail());
				boolean usernameChanged = !username.equalsIgnoreCase(subjectOwner.getUsername());

				if (usernameChanged || emailChanged) {
					//update email or username
					try {
						userDetailsService.saveOrUpdateUser(username, "", subjectOwner.getAuthorities(), subjectOwner.isEnabled(), authMethod, email, subject);
					} catch (Exception ex) {
						LOG.warn("Could not sync OAuth2 metadata for existing user '" + username + "': " + ex.getMessage());
						redirectToLogin(request, response, ex.getMessage());
						return;
					}
				}

			} else {
				// No account matches (method, subject): create a new one.
				//TODO add GrantedAuthorities from OAuth2User
				try {
					userDetailsService.saveOrUpdateUser(username, "", new String[]{IRoleDefinition.DUMMY_EMPTY_ROLE},
							true, authMethod, email, subject);
				} catch (Exception ex) {
					LOG.warn("Could not create OAuth2 user for sub " + subject + " and registry " + registrationId + ": " + ex.getMessage());
					redirectToLogin(request, response, ex.getMessage());
					return;
				}

			}

			String userId = subjectOwner != null ? subjectOwner.getUserId() : UserWithMethod.buildUserId(username, authMethod, subject);
			UserDetails userDetails = userDetailsService.loadUserByUserId(userId);
			Authentication newAuth = new UsernamePasswordAuthenticationToken(
					userDetails,
					null,
					userDetails.getAuthorities()
			);
			SecurityContextHolder.getContext().setAuthentication(newAuth);

			// Honour a page the user was trying to reach before being bounced to login, else go home.
			SavedRequest savedRequest = requestCache.getRequest(request, response);
			String enforcedRoot = appConfig.get("enforcedWebapRootUrl");
			String defaultUrl = enforcedRoot != null ? enforcedRoot + "/index.jsp" : "/index.jsp";
			String target = savedRequest != null ? savedRequest.getRedirectUrl() : defaultUrl;
			response.sendRedirect(target);
			return;
		}

		SavedRequest savedRequest = requestCache.getRequest(request, response);
		if (savedRequest != null) {
			response.sendRedirect(savedRequest.getRedirectUrl());
		} else {
			super.onAuthenticationSuccess(request, response, authentication);
		}
    }

	private void redirectToLogin(HttpServletRequest request, HttpServletResponse response, String message) throws IOException {
		redirectToLogin(request, response, appConfig, message);
	}

	/**
	 * Stores the error in the session (read back by the login page) and redirects to the login page.
	 * Static so that OAuth2 authentication failures can reuse the same logic.
	 */
	public static void redirectToLogin(HttpServletRequest request, HttpServletResponse response, AppConfig appConfig, String message) throws IOException {
		request.getSession().setAttribute(LOGIN_ERROR_SESSION_KEY,
				message == null || message.isBlank() ? "Authentication failed." : message);

		String enforcedRoot = appConfig.get("enforcedWebapRootUrl");
		String base = enforcedRoot != null && !enforcedRoot.isBlank() && !enforcedRoot.startsWith("??")
				? enforcedRoot.replaceAll("/+$", "")
				: request.getContextPath();
		response.sendRedirect(base + LOGIN_PAGE);
	}

	/**
	 * Returns the provider-side identifier that identifies this account independently of the
	 * username shown in Gigwa: OIDC 'sub' is always present, whereas OAuth2-only services expose
	 * their own handle (GitHub 'login', BMS 'username').
	 */
	private String resolveSubject(String registrationId, OAuth2User oauth2User) {
		if (oauth2User instanceof OidcUser oidcUser)
			return oidcUser.getSubject();

		if ("github".equals(registrationId))
			return oauth2User.getAttribute("login");

		if ("bms".equals(registrationId))
			return oauth2User.getAttribute("username");

		return oauth2User.getAttribute("sub");
	}

	/**
	 * Maps an authenticated OAuth2/OIDC principal to a Gigwa username, applying any provider-specific
	 * access gate (Keycloak realm role, e-mail domain allowlist).
	 *
	 * By default (no userNameAttribute in the provider config) the username is the e-mail address.
	 * When a userNameAttribute is configured, the username is the value of that claim, i.e.
	 * {@link OAuth2User#getName()}.
	 */
	@SuppressWarnings("unchecked")
	private String resolveUsername(String registrationId, OAuth2User oauth2User) throws AccessDeniedException {
//		if ("keycloak".equals(registrationId)) {
//			OidcUser oidcUser = (OidcUser) oauth2User;
//			// Retrieve realm roles from the auth server and require 'gigwa_access'
//			Map<String, Object> realmAccess = (Map<String, Object>) oidcUser.getIdToken().getClaims().get("realm_access");
//			List<String> roles = realmAccess != null ? (List<String>) realmAccess.get("roles") : null;
//			if (roles == null || !roles.contains("gigwa_access"))
//				throw new AccessDeniedException("access_denied");
//			return firstNonBlank(oidcUser.getPreferredUsername(), oauth2User.getAttribute("email"), oidcUser.getSubject());
//		}

		if ("github".equals(registrationId)) {
			// GitHub is not OIDC: 'login' is the only always-present handle
			return oauth2User.getAttribute("login");
		}

		if ("bms".equals(registrationId)) {
			// BMS is not OIDC either: 'username' is its account handle
			return oauth2User.getAttribute("username");
		}

		// Generic OIDC providers (Google, Cognito, Keycloak...):
		return oauth2User.getName();
	}


	/**
	 * When the config property {@code oidcAllowedEmailDomains} is set (CSV list of domains),
	 * rejects logins whose e-mail domain is not listed. Empty / absent property = allow all.
	 * The former key {@code oauth2_allowedEmailDomains} is still honoured as a fallback.
	 */
	private void enforceEmailDomainAllowlist(String email) throws AccessDeniedException {
		String raw = appConfig.get("oidcAllowedEmailDomains");
		if (raw == null || raw.isBlank()) {
			String legacy = appConfig.get("oauth2_allowedEmailDomains");
			if (legacy != null && !legacy.isBlank()) {
				LOG.warn("config.properties key 'oauth2_allowedEmailDomains' is deprecated; rename it to 'oidcAllowedEmailDomains'.");
				raw = legacy;
			}
		}
		if (raw == null || raw.isBlank())
			return;

		Set<String> allowed = Arrays.stream(raw.split(","))
				.map(String::trim)
				.map(String::toLowerCase)
				.filter(s -> !s.isEmpty())
				.collect(Collectors.toSet());
		if (allowed.isEmpty())
			return;

		String domain = email != null && email.contains("@")
				? email.substring(email.indexOf('@') + 1).toLowerCase()
				: null;
		if (domain == null || !allowed.contains(domain)) {
			LOG.warn("Rejecting OIDC login for e-mail '" + email + "': domain not in oidcAllowedEmailDomains (" + allowed + ")");
			throw new AccessDeniedException("email_domain_not_allowed");
		}
	}

	/** Internal signal that the OAuth2 principal is authenticated but not authorized to use Gigwa. */
	private static class AccessDeniedException extends Exception {
		AccessDeniedException(String messageCode) {
			super(messageCode);
		}
	}

	public RequestCache getRequestCache() {
		return requestCache;
	}

}
