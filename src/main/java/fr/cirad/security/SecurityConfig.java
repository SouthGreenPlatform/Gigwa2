package fr.cirad.security;

import fr.cirad.tools.security.CustomCorsConfigurationSource;
import org.apereo.cas.client.session.SingleSignOutFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.cas.web.CasAuthenticationFilter;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.security.web.session.HttpSessionEventPublisher;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;

import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // replaces global-method-security
public class SecurityConfig {

    @Autowired private CustomCorsConfigurationSource corsSource;
    @Autowired private AuthenticationEntryPoint gigwaAuthenticationEntryPoint;
    @Autowired private GigwaAuthenticationSuccessHandler authenticationSuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            CasAuthenticationFilter casFilter,
            SingleSignOutFilter singleLogoutFilter,
            LogoutFilter requestSingleLogoutFilter
            //ModuleAccessFilter moduleAccessFilter
    ) throws Exception {
        http
                // can disable csrf because the API is token based
                .csrf(csrf -> csrf.disable())

                // Headers
                .headers(headers -> headers
                        .frameOptions(frame -> frame.disable())
                        .contentSecurityPolicy(csp -> csp.policyDirectives("frame-ancestors *"))
                )

                .sessionManagement(session -> session
                        .sessionConcurrency(concurrency -> concurrency
                                .maximumSessions(1)
                                .expiredUrl("/index.jsp")
                                .sessionRegistry(sessionRegistry())
                        )
                )

                // Authorizations
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/private/*.do_*").fullyAuthenticated()
                        .requestMatchers(new RegexRequestMatcher("^/private/.+\\.do_.*$", null)).fullyAuthenticated()
                        .requestMatchers("/permissionManagement.jsp*").permitAll()
//                        .requestMatchers("/login.do*").permitAll()
//                        .requestMatchers("/index.jsp*").permitAll()
                        .requestMatchers("/", "/assets/**", "/img/**", "/*.js", "/*.css", "/*.ico", "/index.html", "/").permitAll()
                        .requestMatchers("/rest/**").permitAll()
                        .anyRequest().permitAll()
                )

                // Form login
//                .formLogin(form -> form
//                        .loginPage("/login.do")
//                        .failureUrl("/login.do?auth=failure")
//                        .defaultSuccessUrl("/index.jsp", true)
//                        .successHandler(authenticationSuccessHandler)
//                )

                // Access denied
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(gigwaAuthenticationEntryPoint)
                        .accessDeniedPage("/WEB-INF/jsp/error/403.jsp")
                )

                // Logout
                .logout(logout -> logout
                        .logoutSuccessHandler(logoutDispatchHandler())
                        .invalidateHttpSession(true)
                )

                // CAS filters
                .addFilterAt(casFilter, CasAuthenticationFilter.class)
                .addFilterBefore(requestSingleLogoutFilter, LogoutFilter.class)
                .addFilterBefore(singleLogoutFilter, CasAuthenticationFilter.class)

                //module access
                //.addFilterAfter(moduleAccessFilter, AuthorizationFilter.class)

                // CORS
                .cors(cors -> cors.configurationSource(corsSource));

        return http.build();
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring()
                .requestMatchers(
                        new RegexRequestMatcher("^.*/css/.*$", null),
                        new RegexRequestMatcher("^.*/img/.*$", null),
                        new RegexRequestMatcher("^.*/js/.*$", null),
                        new RegexRequestMatcher("^.*\\/.*filt\\/tmpOutput\\/.*\\.zip.*$", null)
                );
    }

    @Bean
    public GigwaLogoutDispatchHandler logoutDispatchHandler() {
        Map<String, String> methodRedirects = new LinkedHashMap<>();
        methodRedirects.put("", "index.jsp");
        methodRedirects.put("CAS", "cas-logout.jsp");
        return new GigwaLogoutDispatchHandler("index.jsp", methodRedirects);
    }
    @Bean
    public SingleSignOutFilter singleLogoutFilter() {
        return new SingleSignOutFilter();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SessionRegistry sessionRegistry() {
        return new SessionRegistryImpl();
    }

    @Bean
    public HttpSessionEventPublisher httpSessionEventPublisher() {
        return new HttpSessionEventPublisher();
    }

}