package fr.cirad.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.cas.web.CasAuthenticationEntryPoint;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

@Configuration
public class GigwaAuthenticationEntryPointConfig {

    @Bean
    public AuthenticationEntryPoint gigwaAuthenticationEntryPoint(
            CasAuthenticationEntryPoint casEntryPoint) {

        LoginUrlAuthenticationEntryPoint formEntryPoint =
                new LoginUrlAuthenticationEntryPoint("/login.do");
        formEntryPoint.setForceHttps(true);

        RequestMatcher casMatcher =
                new RegexRequestMatcher("^/login/cas\\.do.*$", null);

        return (request, response, authException) -> {
            if (casMatcher.matches(request)) {
                casEntryPoint.commence(request, response, authException);
            } else {
                formEntryPoint.commence(request, response, authException);
            }
        };
    }

    @Bean
    public LoginUrlAuthenticationEntryPoint formEntryPoint() {
        LoginUrlAuthenticationEntryPoint ep =
                new LoginUrlAuthenticationEntryPoint("/login.do");
        ep.setForceHttps(true);
        return ep;
    }
}