package fr.cirad.security;

import fr.cirad.tools.AppConfig;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.ClientRegistrations;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import javax.annotation.PostConstruct;
import java.net.URISyntaxException;
import java.util.*;

@Component
public class GigwaClientRegistrationRepository implements ClientRegistrationRepository, Iterable<ClientRegistration> {
    @Autowired
    private AppConfig appConfig;

    private InMemoryClientRegistrationRepository delegate;

    // OIDC always exposes 'sub';
    private static final String DEFAULT_USER_NAME_ATTRIBUTE = "email";

    private static final List<String> DEFAULT_OIDC_SCOPES = List.of("openid", "email");
    private static final List<String> DEFAULT_GITHUB_SCOPES = List.of("read:user","user:email");
    private static final String DEFAULT_BMS_SCOPES = "read";

    private static final Logger LOG = Logger.getLogger(GigwaClientRegistrationRepository.class);

    /** config.properties key prefix for an OIDC provider definition. */
    private static final String PROVIDER_PREFIX = "oidcProvider_";
    /** Former prefix, still honoured (with a deprecation warning) for existing config.properties files. */
    private static final String LEGACY_PROVIDER_PREFIX = "oauth2config_";

    @PostConstruct
    public void init() throws RestClientException, URISyntaxException {
        HashMap<String, ClientRegistration> registrations = new HashMap<>();
        Map<String, String> providerEntries = new LinkedHashMap<>(appConfig.getPrefixed(PROVIDER_PREFIX));
        Map<String, String> legacyEntries = appConfig.getPrefixed(LEGACY_PROVIDER_PREFIX);
        if (!legacyEntries.isEmpty()) {
            LOG.warn("config.properties keys " + LEGACY_PROVIDER_PREFIX + " are deprecated; rename them to " + PROVIDER_PREFIX);
            legacyEntries.forEach(providerEntries::putIfAbsent);
        }

        for (String discoveryEntry : providerEntries.values()) {
            // name;issuerUri;clientId;secret[;userNameAttribute[;displayName]]
            String[] parts = discoveryEntry.split(";", -1);
            if (parts.length < 3) {
                LOG.warn("Ignoring malformed" + PROVIDER_PREFIX + "entry (expected name;issuerUri;clientId[;secret[;userNameAttribute[;displayName]]]): " + discoveryEntry);
                continue;
            }

            // The registration id (map key + OAuth2 callback path segment + stored auth method) must
            // be a stable lowercase token. The name as typed is kept only for display.
            String providerName = parts[0].trim();
            String registrationId = providerName.toLowerCase();
            String issuerUri = parts[1].trim();
            String clientId = parts[2].trim();
            String clientSecret = parts.length >= 4 && !parts[3].isBlank() ? parts[3].trim() : null;
            String userNameAttribute = parts.length >= 5 && !parts[4].isBlank() ? parts[4].trim() : null;
            String displayName = parts.length >= 6 && !parts[5].isBlank() ? parts[5].trim() : providerName;

            try {
                ClientRegistration cr = createOAuth2ClientRegistration(registrationId, issuerUri, clientId, clientSecret, userNameAttribute, displayName);
                registrations.put(registrationId, cr);
                LOG.info(String.format(
                        "Registered OIDC provider '%s' (display '%s', issuer: %s, userNameAttribute: %s, scopes: %s)",
                        registrationId, displayName, issuerUri, userNameAttribute, String.join(",", cr.getScopes())));
            } catch (RuntimeException e) {
                // Isolate a single misconfigured / unreachable provider so it does not abort application startup
                LOG.error(String.format("Failed to register OIDC provider '%s' from issuer '%s': %s",
                        registrationId, issuerUri, e.getMessage()), e);
            }
            System.out.println("OAuth2 registrations: " + registrations.keySet());
        }

        if (!registrations.isEmpty())
            delegate = new InMemoryClientRegistrationRepository(registrations);
        else
            LOG.info("No OIDC login provider registered - no usable  "+ PROVIDER_PREFIX);
    }

    @Override
    public ClientRegistration findByRegistrationId(String registrationId) {
        return delegate != null ? delegate.findByRegistrationId(registrationId) : null;
    }

    @Override
    public Iterator<ClientRegistration> iterator() {
        return delegate != null ? delegate.iterator() : Collections.emptyIterator();
    }

    private ClientRegistration createOAuth2ClientRegistration(String registrationId, String issuerUri,
                                                              String clientId, String clientSecret, String userNameAttribute,
                                                              String displayName)
            throws RestClientException {

        if ("github".equalsIgnoreCase(registrationId)) {
            return CommonOAuth2Provider.GITHUB
                    .getBuilder(registrationId)
                    .clientId(clientId)
                    .clientSecret(clientSecret)
                    .scope(DEFAULT_GITHUB_SCOPES)
                    .userNameAttributeName("login")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build();
        }

        if ("bms".equalsIgnoreCase(registrationId)) {
            String baseIssuer = issuerUri.replaceAll("/+$", "");
            return ClientRegistration.withRegistrationId(registrationId)
                    .clientId(clientId)
                    .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .scope(DEFAULT_BMS_SCOPES)
                    .authorizationUri(baseIssuer + "/ibpworkbench/login")
                    .tokenUri(baseIssuer + "/bmsapi/oauth/token")
                    .userInfoUri(baseIssuer + "/bmsapi/account")
                    .userNameAttributeName("username")
                    .clientName("BMS")
                    .build();
        }

        List<String> oidcScopes = new ArrayList<>(DEFAULT_OIDC_SCOPES);
        // preferred_username (or any other non-'sub' userNameAttribute) requires the 'profile' scope
        if (userNameAttribute != null)
            oidcScopes.add("profile");

        return ClientRegistrations
                .fromOidcIssuerLocation(issuerUri)
                .registrationId(registrationId)
                .clientName(displayName)
                .clientId(clientId)
                .clientSecret(clientSecret)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .scope(oidcScopes)
                .userNameAttributeName(userNameAttribute != null ? userNameAttribute : DEFAULT_USER_NAME_ATTRIBUTE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .build();
    }
}
