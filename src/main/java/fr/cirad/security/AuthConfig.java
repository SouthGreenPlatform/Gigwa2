package fr.cirad.security;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.cas.authentication.CasAuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;

@Configuration
public class AuthConfig {

    @Bean
    public AuthenticationManager authenticationManager(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder,
            CasAuthenticationProvider casAuthenticationProvider) throws Exception {

        DaoAuthenticationProvider daoProvider =
                new DaoAuthenticationProvider(userDetailsService);
        daoProvider.setPasswordEncoder(passwordEncoder);

        return new ProviderManager(Arrays.asList(daoProvider, casAuthenticationProvider));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new CustomBCryptPasswordEncoder();
    }

    @Bean
    public ReloadableInMemoryDaoImpl userDetailsService() throws Exception {
        return new ReloadableInMemoryDaoImpl();
    }

}