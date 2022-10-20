package fr.cirad.tools.security;

import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import fr.cirad.tools.AppConfig;

public class CustomCorsConfigurationSource extends UrlBasedCorsConfigurationSource {

    public static final String ALLOWED_ORIGINS_PROPERTY_PREFIX = "allowedOrigins_";

    public CustomCorsConfigurationSource(AppConfig appConfig) {
        super();
            
        Map<String /*endpoint URL*/, Collection<String /*allowed origin*/>> customConfigs = new HashMap<>();
        Map<String, String> corsConfigEntries = appConfig.getPrefixed(ALLOWED_ORIGINS_PROPERTY_PREFIX);
        for (String key : corsConfigEntries.keySet())
            if (key.startsWith(ALLOWED_ORIGINS_PROPERTY_PREFIX))
                customConfigs.put(key.substring(ALLOWED_ORIGINS_PROPERTY_PREFIX.length()).replaceFirst(".*/rest/", "/"), Arrays.stream(corsConfigEntries.get(key).split(",")).map(String :: trim).collect(Collectors.toList()));
        
        for (String endpoint : customConfigs.keySet()) {
            CorsConfiguration configuration = new CorsConfiguration();
            for (String allowedOrigin : customConfigs.get(endpoint))
                configuration.addAllowedOrigin(allowedOrigin);

            configuration.setAllowedHeaders(Arrays.asList("*"));
            configuration.setAllowedMethods(Arrays.asList("*"));
//	        configuration.addAllowedMethod("POST");
//	        configuration.setAllowCredentials(false);
//	        configuration.setMaxAge(Long.MAX_VALUE);
            registerCorsConfiguration(endpoint, configuration);

//          System.err.println(configuration);
        }
    }
}