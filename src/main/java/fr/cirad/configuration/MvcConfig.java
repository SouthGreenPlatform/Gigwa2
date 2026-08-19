package fr.cirad.configuration;

import java.util.Arrays;import java.util.Properties;

import fr.cirad.web.controller.security.RoleManagerRestController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.bind.annotation.RequestMapping;import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.handler.SimpleMappingExceptionResolver;
import org.springframework.web.servlet.view.InternalResourceViewResolver;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        registry.addResourceHandler("/img/**")
//                .addResourceLocations("classpath:/static/img/");
//        registry.addResourceHandler("/assets/**")
//                .addResourceLocations("classpath:/static/assets/");
//        registry.addResourceHandler("/*.js", "/*.css", "/*.ico")
//                .addResourceLocations("classpath:/static/");
    }

    @Bean
    public SimpleMappingExceptionResolver exceptionResolver() {
        SimpleMappingExceptionResolver resolver = new SimpleMappingExceptionResolver();
        resolver.setExceptionMappings(new Properties());
        resolver.setOrder(Integer.MAX_VALUE);
        return resolver;
    }

    // prefix with /rest all web services except role_manager
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.addPathPrefix("/rest", c ->
            c.isAnnotationPresent(RestController.class) && c != RoleManagerRestController.class);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addRedirectViewController("/roleManager/", "/roleManager/index.html");
        registry.addRedirectViewController("/roleManager", "/roleManager/index.html");
    }
}
