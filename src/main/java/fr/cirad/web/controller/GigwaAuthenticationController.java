package fr.cirad.web.controller;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import fr.cirad.security.GigwaAuthenticationSuccessHandler;
import fr.cirad.tools.AppConfig;
import fr.cirad.tools.security.OpenIdConfiguration;

@Controller
public class GigwaAuthenticationController  {
	private static final Logger LOG = Logger.getLogger(GigwaAuthenticationController.class);
	
	private static final String LOGIN_CAS_URL = "/login/cas.do";
	private static final String LOGIN_FORM_URL = "/login.do";

	private InMemoryClientRegistrationRepository registrationRepository = null;
	
	@Autowired private GigwaAuthenticationSuccessHandler authenticationSuccessHandler;
	@Autowired private AppConfig appConfig;
	
    private String oauth2RedirectUri = "http://localhost:59395/Gigwa2/summaryTable.jsp";
	
    private ClientRegistration createOAuth2ClientRegistration(String registrationId, String discoveryUri, String clientId, String clientSecret) throws RestClientException, URISyntaxException {
    	if (!new URI(discoveryUri).isAbsolute()) {	// it's a local URI
        	String enforcedWebapRootUrl = appConfig.get("enforcedWebapRootUrl");
        	if (enforcedWebapRootUrl == null || enforcedWebapRootUrl.trim().isEmpty()) {
        		LOG.warn("Skipped OAuth2 server '" + registrationId + "', because it was provided with a relative discovery URI and no enforcedWebapRootUrl property was set!");
        		return null;
        	}
        	discoveryUri = enforcedWebapRootUrl + "/" + discoveryUri;
    	}
    	
        OpenIdConfiguration openIdConfiguration = new RestTemplate().getForObject(discoveryUri, OpenIdConfiguration.class);

        return ClientRegistration
            .withRegistrationId(registrationId)
            .clientId(clientId)
            .clientSecret(clientSecret)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .authorizationUri(openIdConfiguration.getAuthorization_endpoint())
            .tokenUri(openIdConfiguration.getToken_endpoint())
            .redirectUri(oauth2RedirectUri)
            .build();
    }

	@GetMapping(LOGIN_FORM_URL)
	public String loginFormPath(HttpServletRequest request, HttpServletResponse response) throws RestClientException, URISyntaxException {
		if (registrationRepository == null) {	// initialize it
	    	HashMap<String, ClientRegistration> registrations = new HashMap<>();
	    	for (String discoveryEntry : appConfig.getPrefixed("oauth2config_").values()) {
		        String[] nameUriIdSecret = discoveryEntry.split(";");
		        ClientRegistration cr = createOAuth2ClientRegistration(nameUriIdSecret[0], nameUriIdSecret[1], nameUriIdSecret[2], nameUriIdSecret[3]);
		        if (cr != null)
		        	registrations.put(nameUriIdSecret[0], cr);
	        }
	        
	    	registrationRepository = new InMemoryClientRegistrationRepository(registrations);
		}

		Iterator<ClientRegistration> oAuth2ServerIterator = registrationRepository.iterator();
		ArrayList<ClientRegistration> oauth2Providers = new ArrayList<>();
		while (oAuth2ServerIterator.hasNext())
			oauth2Providers.add(oAuth2ServerIterator.next());
		request.setAttribute("oauth2Providers", oauth2Providers);
		
		SavedRequest savedRequest = authenticationSuccessHandler.getRequestCache().getRequest(request, response);
		if (savedRequest != null) {
			String targetUrl = savedRequest.getRedirectUrl();
			try {
				String redirectUrl = URLEncoder.encode(targetUrl, StandardCharsets.UTF_8.name());
				request.setAttribute("loginOrigin", redirectUrl);
			} catch (UnsupportedEncodingException ignored) {}
			//authenticationSuccessHandler.getRequestCache().removeRequest(request, response);
		}

		return "login";
	}

	@GetMapping(LOGIN_CAS_URL)
	public String casLoginPath(@RequestParam(name="url", required=false) String redirectUrl) {
		if (redirectUrl != null && !"".equals(redirectUrl.trim())) {
			try {
				return "redirect:" + URLDecoder.decode(redirectUrl, StandardCharsets.UTF_8.name());
			} catch (UnsupportedEncodingException exc) {
				return "redirect:/index.jsp";
			}
		} else {
			return "redirect:/index.jsp";
		}
	}
}
