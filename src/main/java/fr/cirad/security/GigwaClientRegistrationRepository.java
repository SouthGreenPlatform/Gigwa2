package fr.cirad.security;

import fr.cirad.tools.AppConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.ClientRegistrations;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import javax.annotation.PostConstruct;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;

@Component
public class GigwaClientRegistrationRepository implements ClientRegistrationRepository, Iterable<ClientRegistration> {
    @Autowired
    private AppConfig appConfig;

    private InMemoryClientRegistrationRepository delegate;

    @PostConstruct
    public void init() throws RestClientException, URISyntaxException {
        HashMap<String, ClientRegistration> registrations = new HashMap<>();

        for (String discoveryEntry : appConfig.getPrefixed("oauth2config_").values()) {
            String[] parts = discoveryEntry.split(";");
            //name;issuerUri;clientId;secret
            String clientSecret = null;
            if (parts.length==4) {
                clientSecret = parts[3];
            }
            ClientRegistration cr = createOAuth2ClientRegistration(parts[0].toLowerCase(), parts[1], parts[2], clientSecret);

            if (cr != null)
                registrations.put(parts[0].toLowerCase(), cr);
            System.out.println("OAuth2 registrations: " + registrations.keySet());
        }

        if (!registrations.isEmpty())
            delegate = new InMemoryClientRegistrationRepository(registrations);
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
                                                              String clientId, String clientSecret)
            throws RestClientException {

        if ("github".equalsIgnoreCase(registrationId)) {
            return CommonOAuth2Provider.GITHUB
                    .getBuilder(registrationId)
                    .clientId(clientId)
                    .clientSecret(clientSecret)
                    .scope("read:user", "user:email")
                    .userNameAttributeName("login")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build();
        }

        return ClientRegistrations
                .fromOidcIssuerLocation(issuerUri)
                .registrationId(registrationId)
                .clientId(clientId)
                .clientSecret(clientSecret)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .scope("openid", "profile", "email")
                .userNameAttributeName("preferred_username")
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .build();
    }
}