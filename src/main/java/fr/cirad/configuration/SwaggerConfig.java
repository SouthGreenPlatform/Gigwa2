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

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.servlet.ServletContext;

import org.apache.log4j.Logger;
import org.mortbay.log.Log;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.ServletContextAware;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import fr.cirad.web.controller.gigwa.GigwaRestController;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.oas.annotations.EnableOpenApi;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.ApiKey;
import springfox.documentation.service.AuthorizationScope;
import springfox.documentation.service.Contact;
import springfox.documentation.service.SecurityReference;
import springfox.documentation.service.VendorExtension;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spi.service.contexts.SecurityContext;
import springfox.documentation.spring.web.paths.DefaultPathProvider;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

/**
 * Swagger configuration
 *
 * @author petel, sempere
 */

@Configuration
@EnableSwagger2
@EnableWebMvc
@EnableOpenApi
public class SwaggerConfig implements WebMvcConfigurer, ServletContextAware {

	private static final Logger LOG = Logger.getLogger(SwaggerConfig.class);
	static private ServletContext servletContext;
	private String gigwaVersion = "";
	private ApiKey apiKey = new ApiKey("AuthorizationToken", "Authorization", "header");
	private DefaultPathProvider pathProvider = new DefaultPathProvider() {
		@Override
		public String getOperationPath(String operationPath) {
			return operationPath.startsWith(servletContext.getContextPath()) ? operationPath.substring(servletContext.getContextPath().length()) : operationPath; // remove context path
		}
	};

	@Bean
	public Docket brapiV2Api() throws IOException {
		return new Docket(DocumentationType.SWAGGER_2).select()
			.apis(RequestHandlerSelectors.basePackage("org.brapi.v2")).build().pathProvider(pathProvider)
			.groupName("Breeding API v2").apiInfo(apiInfo())
			.useDefaultResponseMessages(false) // don't use generic response code
			.securitySchemes(Arrays.asList(apiKey)).securityContexts(Arrays.asList(securityContext()))
			.ignoredParameterTypes(org.apache.avro.Schema.class); // remove schema from model
	}

	@Bean
	public Docket brapiV1Api() throws IOException {
		return new Docket(DocumentationType.SWAGGER_2).select()
			.apis(RequestHandlerSelectors.basePackage("fr.cirad.web.controller.rest")).build()
			.pathProvider(pathProvider).groupName("Breeding API v1").apiInfo(apiInfo())
			.useDefaultResponseMessages(false) // don't use generic response code
			.securitySchemes(Arrays.asList(apiKey)).securityContexts(Arrays.asList(securityContext()))
			.ignoredParameterTypes(org.apache.avro.Schema.class); // remove schema from model
	}

	@Bean
	public Docket ga4ghApi() throws IOException {
		return new Docket(DocumentationType.SWAGGER_2).select()
			.apis(RequestHandlerSelectors.basePackage("fr.cirad.web.controller.ga4gh")).build()
			.pathProvider(pathProvider).groupName("GA4GH API v0.6.0a5").apiInfo(apiInfo())
			.useDefaultResponseMessages(false) // don't use generic response code
			.securitySchemes(Arrays.asList(apiKey)).securityContexts(Arrays.asList(securityContext()))
			.ignoredParameterTypes(org.apache.avro.Schema.class); // remove schema from model
	}

	@Bean
	public Docket gigwaApi() throws IOException {
		return new Docket(DocumentationType.SWAGGER_2).select()
			.apis(RequestHandlerSelectors.basePackage("fr.cirad.web.controller.gigwa")).build()
			.pathProvider(pathProvider).groupName("Gigwa API " + gigwaVersion).apiInfo(apiInfo())
			.useDefaultResponseMessages(false) // don't use generic response code
			.securitySchemes(Arrays.asList(apiKey)).securityContexts(Arrays.asList(securityContext()))
			.ignoredParameterTypes(org.apache.avro.Schema.class); // remove schema from model
	}

	private SecurityContext securityContext() {
		return SecurityContext.builder().securityReferences(defaultAuth()).forPaths(PathSelectors.regex("/")).build();
	}

	List<SecurityReference> defaultAuth() {
		AuthorizationScope authorizationScope = new AuthorizationScope("global", "accessEverything");
		return Arrays.asList(new SecurityReference("Authorization", new AuthorizationScope[] {authorizationScope}));
	}

	public ApiInfo apiInfo() {
		String rootPath = servletContext.getContextPath() + GigwaRestController.REST_PATH;
		return new ApiInfo("REST-APIs implemented in this version of Gigwa",
					"# Gigwa " + gigwaVersion + "\n"
					+ "You can find out more about Gigwa at <a href=\"http://www.southgreen.fr/content/Gigwa\" target=\"_blank\">http://www.southgreen.fr/content/gigwa</a>. Source code is available at <a href=\"https://github.com/SouthGreenPlatform/Gigwa2/\" target=\"_blank\">https://github.com/SouthGreenPlatform/Gigwa2</a>\n"
					+ "# BrAPI v1 and v2\n"
					+ "You can find out more about BrAPI at <a href=\"https://www.brapi.org/\" target=\"_blank\">https://www.brapi.org/</a>\n"
					+ "# GA4GH v0.6.0a5\n"
					+ "You can find out more about GA4GH at <a href=\"http://ga4gh.org/\" target=\"_blank\">http://ga4gh.org/</a>\n"
					+ "# Workflow\n"
					+ "In order to use the REST APIs on private databases, you want to get a token at first. This Bearer token will be used by the system to identifiy you as a user so it can apply your privileges when searching for data. A token can be obtained using one of the following calls:"
					+ "<pre>" + rootPath + "/gigwa/generateToken ; " + rootPath + "/{database}/brapi/v1/token</pre>\n\n"
					+ "This token then needs to be passed in each subsequent request header via the 'Authorization' parameter, its value always being preceded by the 'Bearer' keyword. To use a token via the API, you will need to enter it by clicking the 'Authorize' button.\n\n"
					+ "**Concerning BrAPI V1, there is a different base-url for each database.**\n\nYou may find a list of available databases using one of the following calls:"
					+ "<pre>" + rootPath + "/ga4gh/referencesets/search ; " + rootPath + "/brapi/v2/trials ; " + rootPath + "/brapi/v2/programs</pre>\n"
					+ "# Terminology correspondence table\n"
					+ "| Gigwa entity | GA4GH entity | BrAPI v1 entity | BrAPI v2 entity |\n"
					+ "| --- | --- | --- | --- |\n"
					+ "| database or module | referenceSet or dataset | database or map | program or trial |\n"
					+ "| project | variantSet | genotyping study | genotyping study |\n"
					+ "| assembly | - | - | referenceSet |\n"
					+ "| run | - | - | variantSet |\n"
					+ "| sequence | reference | linkageGroup | reference |\n"
					+ "| variant | variant | marker | variant |\n"
					+ "| individual | callSet | germplasm | germplasm |\n"
					+ "| sample | - | sample or markerprofile | sample or callSet |\n"
				, "", "", new Contact("Guilhem Sempéré", "", "gigwa@cirad.fr"), "License : GNU Affero GPL v3", "http://www.gnu.org/licenses/agpl.html",
				new ArrayList<VendorExtension>());
	}

	@Override
	public void setServletContext(ServletContext sc) {
		if (servletContext != null)
			return; // already initialized

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
