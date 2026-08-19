package fr.cirad.security;

import org.apereo.cas.client.validation.Cas20ServiceTicketValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.cas.ServiceProperties;
import org.springframework.security.cas.authentication.CasAuthenticationProvider;
import org.springframework.security.cas.web.CasAuthenticationEntryPoint;
import org.springframework.security.cas.web.CasAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;

@Configuration
public class CasConfig {

    @Value("${casServerURL:}")
    private String casServerURL;

    @Value("${enforcedWebapRootUrl:}")
    private String enforcedWebapRootUrl;

    @Autowired
    private ReloadableInMemoryDaoImpl userDetailsService;

    @Bean
    public CasAuthenticationFilter casFilter(AuthenticationManager authenticationManager) {
        CasAuthenticationFilter filter = new CasAuthenticationFilter();
        filter.setAuthenticationManager(authenticationManager);
        filter.setServiceProperties(casServiceProperties());
        return filter;
    }

    @Bean
    public CasAuthenticationProvider casAuthenticationProvider() {
        CasAuthenticationProvider provider = new CasAuthenticationProvider();
        provider.setAuthenticationUserDetailsService(
                new GigwaUserDetailsWrapper(userDetailsService));
        provider.setTicketValidator(
                new Cas20ServiceTicketValidator(casServerURL));
        provider.setServiceProperties(casServiceProperties());
        provider.setKey("CAS_PROVIDER");
        return provider;
    }

    @Bean
    public ServiceProperties casServiceProperties() {
        ServiceProperties props = new ServiceProperties();
        props.setService(enforcedWebapRootUrl + "/login/cas");
        props.setSendRenew(false);
        return props;
    }

    @Bean
    public CasAuthenticationEntryPoint casEntryPoint() {
        CasAuthenticationEntryPoint ep = new CasAuthenticationEntryPoint();
        ep.setLoginUrl(casServerURL + "/login");
        ep.setServiceProperties(casServiceProperties());
        return ep;
    }

    @Bean
    public LogoutFilter requestSingleLogoutFilter() {
        LogoutFilter filter = new LogoutFilter(
                casServerURL + "/logout",
                new SecurityContextLogoutHandler()
        );
        filter.setFilterProcessesUrl("/logout/cas");
        return filter;
    }
}