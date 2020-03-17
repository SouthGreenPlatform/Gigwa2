/*******************************************************************************
 * GIGWA - Genotype Investigator for Genome Wide Analyses
 * Copyright (C) 2016 - 2019, <CIRAD> <IRD>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License, version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * See <http://www.gnu.org/licenses/agpl.html> for details about GNU General
 * Public License V3.
 *******************************************************************************/
package fr.cirad.configuration;

import static com.google.common.collect.Lists.newArrayList;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletContext;

import org.mortbay.log.Log;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.ServletContextAware;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import com.google.common.collect.Lists;

import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.ApiKey;
import springfox.documentation.service.AuthorizationScope;
import springfox.documentation.service.Contact;
import springfox.documentation.service.SecurityReference;
import springfox.documentation.service.VendorExtension;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spi.service.contexts.SecurityContext;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger.web.ApiKeyVehicle;
import springfox.documentation.swagger.web.SecurityConfiguration;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

/**
 * Swagger configuration
 *
 * @author petel
 */
@Configuration
@EnableSwagger2
@EnableWebMvc
public class SwaggerConfig implements ServletContextAware {

    /**
     * The servlet context.
     */
    static private ServletContext servletContext;
	private String gigwaVersion = "";
    
    @Bean
    public Docket brapiV2Api() throws IOException {

        return new Docket(DocumentationType.SWAGGER_2)
                .select()
                .apis(RequestHandlerSelectors.basePackage("org.brapi.v2"))
                .paths(PathSelectors.regex("^((?!.do).)*$"))
                .build()
                .pathMapping("/")
                .groupName("Breeding API v2 - under development")
                .apiInfo(apiInfo())
                .useDefaultResponseMessages(false) // don't use generic response code 
                .securitySchemes(Lists.newArrayList(apiKey()))
                .securityContexts(newArrayList(securityContext()))
                .ignoredParameterTypes(org.apache.avro.Schema.class); // remove schema from model 
    }
    
    @Bean
    public Docket brapiV1Api() throws IOException {
        return new Docket(DocumentationType.SWAGGER_2)
                .select()
                .apis(RequestHandlerSelectors.basePackage("fr.cirad.web.controller.rest"))
                .paths(PathSelectors.regex("^((?!.do).)*$"))
                .build()
                .pathMapping("/")
                .groupName("Breeding API v1")
                .apiInfo(apiInfo())
                .useDefaultResponseMessages(false) // don't use generic response code 
                .securitySchemes(Lists.newArrayList(apiKey()))
                .securityContexts(newArrayList(securityContext()))
                .ignoredParameterTypes(org.apache.avro.Schema.class); // remove schema from model 
    }
    
    @Bean
    public Docket ga4ghApi() throws IOException {
        return new Docket(DocumentationType.SWAGGER_2)
                .select()
                .apis(RequestHandlerSelectors.basePackage("fr.cirad.web.controller.ga4gh"))
                .paths(PathSelectors.regex("^((?!.do).)*$"))
                .build()
                .pathMapping("/")
                .groupName("GA4GH API v0.6.0a5")
                .apiInfo(apiInfo())
                .useDefaultResponseMessages(false) // don't use generic response code 
                .securitySchemes(Lists.newArrayList(apiKey()))
                .securityContexts(newArrayList(securityContext()))
                .ignoredParameterTypes(org.apache.avro.Schema.class); // remove schema from model 
    }
    
    @Bean
    public Docket gigwaApi() throws IOException {
        return new Docket(DocumentationType.SWAGGER_2)
                .select()
                .apis(RequestHandlerSelectors.basePackage("fr.cirad.web.controller.gigwa"))
                .paths(PathSelectors.regex("^((?!.do).)*$"))
                .build()
                .pathMapping("/")
                .groupName("Gigwa API " + gigwaVersion)
                .apiInfo(apiInfo())
                .useDefaultResponseMessages(false) // don't use generic response code 
                .securitySchemes(Lists.newArrayList(apiKey()))
                .securityContexts(newArrayList(securityContext()))
                .ignoredParameterTypes(org.apache.avro.Schema.class); // remove schema from model 
    }

    private ApiKey apiKey() {
    	return new ApiKey("Authorization", "api_key", "header");
    }

    private SecurityContext securityContext() {
        return SecurityContext.builder()
                .securityReferences(defaultAuth())
                .forPaths(PathSelectors.regex("/"))
                .build();
    }

    List<SecurityReference> defaultAuth() {
        AuthorizationScope authorizationScope = new AuthorizationScope("global", "accessEverything");
        AuthorizationScope[] authorizationScopes = new AuthorizationScope[1];
        authorizationScopes[0] = authorizationScope;
        return newArrayList(
                new SecurityReference("Authorization", authorizationScopes));
    }

    @Bean
    SecurityConfiguration security() {
        return new SecurityConfiguration(
                "test-app-client-id",
                "test-app-client-secret",
                "test-app-realm",
                "test-app",
                "",
                ApiKeyVehicle.HEADER,
                "Authorization",
                "," /*scope separator*/);
    }

    @SuppressWarnings("deprecation")
	public ApiInfo apiInfo() {
    	String rootPath = servletContext.getContextPath() + "/rest";
        return new ApiInfo("REST-APIs implemented in this version of Gigwa",
             		"# Gigwa " + gigwaVersion + "\n"
				+	"  You can find out more about Gigwa at <a href=\"http://www.southgreen.fr/content/Gigwa\" target=\"_blank\">http://www.southgreen.fr/content/gigwa</a></br></br>Source code is available on github at at <a href=\"https://github.com/SouthGreenPlatform/Gigwa2/\" target=\"_blank\">https://github.com/SouthGreenPlatform/Gigwa2</a>\n"
				+	"# BrAPI v1 and v2\n"
				+	"  You can find out more about BrAPI at <a href=\"https://www.brapi.org/\" target=\"_blank\">https://www.brapi.org/</a>\n"
				+	"# GA4GH v0.6.0a5\n"
				+	"  You can find out more about GA4GH at <a href=\"http://ga4gh.org/\" target=\"_blank\">http://ga4gh.org/</a>\n"
				+	"# Workflow\n"
				+	" In order to use the REST APIs on private databases, you want to get a token at first. This Bearer token will be used by the system to identifiy you as a user so it can apply your privileges when searching for data. A token can be obtained using <pre>" + rootPath + "/gigwa/generateToken or " + rootPath + "/{database}/brapi/v1/token</pre> This token then needs to be passed in each request header via the 'Authorization' parameter, its value always being preceded by the Bearer keyword. To use a token via the API, you will need to enter it in the appropriate field at the top.\n\n"
				+	" Concerning BrAPI, there is a different base-url for each database. You may find a list of available databases using the GA4GH call <pre>" + rootPath + "/ga4gh/referencesets/search</pre> <font color='red'>NB: a referenceSet in GA4GH or BrAPI v2 is equivalent to a database in Gigwa or BrAPI v1, as detailed below</font>\n"
				+	"# Terminology correspondence table\n"
				+	" <table style='border:1px #404040 dashed; margin-bottom:10px;'>"
				+	" <tr><td><b>&nbsp;Gigwa entity</b></td><td bgcolor='#f0f0f0'>database or module</td><td>project</td><td bgcolor='#f0f0f0'>sequence</td><td>variant</td><td bgcolor='#f0f0f0'>individual</td><td>sample</td></tr>"
				+	" <tr><td><b>&nbsp;GA4GH entity</b></td><td bgcolor='#f0f0f0'>referenceSet or dataset</td><td>variantSet</td><td bgcolor='#f0f0f0'>reference</td><td>variant</td><td bgcolor='#f0f0f0'>callSet</td><td>-</td></tr>"
				+	" <tr><td><b>&nbsp;BrAPI v1 entity</b></td><td bgcolor='#f0f0f0'>database or map</td><td>genotyping study</td><td bgcolor='#f0f0f0'>linkageGroup</td><td>marker</td><td bgcolor='#f0f0f0'>germplasm</td><td>sample or markerprofile</td></tr>"
				+	" <tr><td><b>&nbsp;BrAPI v2 entity</b><br/><span style='color:red; font-style:italic;'>(under development)</span></td><td bgcolor='#f0f0f0'>database or map or referenceSet or dataset</td><td>variantSet</td><td bgcolor='#f0f0f0'>reference</td><td>variant</td><td bgcolor='#f0f0f0'>callSet</td><td>sample</td></tr>"
				+	" </table>",
                "",
                "",
                new Contact("Guilhem Sempéré", "", "gigwa@cirad.fr"),
                "License : GNU Affero GPL v3",
                "http://www.gnu.org/licenses/agpl.html",
                new ArrayList<VendorExtension>()
        	);
    }

	@Override
	public void setServletContext(ServletContext sc) {
    	if (servletContext != null)
    		return;	// already initialized
    	
    	servletContext = sc;
    	java.util.Properties prop = new java.util.Properties();
    	try {
			prop.load(servletContext.getResourceAsStream("/META-INF/MANIFEST.MF"));
	    	gigwaVersion = "v" + prop.getProperty("Implementation-version");
		} catch (IOException e) {
			Log.warn("Unable to determine Gigwa version for Swagger");
		}
	}
}
