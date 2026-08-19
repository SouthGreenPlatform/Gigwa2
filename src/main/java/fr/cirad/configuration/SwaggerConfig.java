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

import jakarta.servlet.ServletContext;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.info.BuildProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.ServletContextAware;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import fr.cirad.web.controller.gigwa.GigwaRestController;

/**
 * Swagger configuration
 *
 * @author petel, sempere
 */


@Configuration
public class SwaggerConfig implements WebMvcConfigurer, ServletContextAware {

	private static final Logger LOG = LoggerFactory.getLogger(SwaggerConfig.class);
	static private ServletContext servletContext;
	static private String gigwaVersion = "1";

	@Autowired(required = false)
	private BuildProperties buildProperties;

	//private ApiKey apiKey = new ApiKey("AuthorizationToken", "Authorization", "header");
//	private DefaultPathProvider pathProvider = new DefaultPathProvider() {
//		@Override
//		public String getOperationPath(String operationPath) {
//			return operationPath.startsWith(servletContext.getContextPath()) ? operationPath.substring(servletContext.getContextPath().length()) : operationPath; // remove context path
//		}
//	};

	@Bean
	public GroupedOpenApi brapiV2Api() {
		return GroupedOpenApi.builder()
				.group("Breeding API v2")
				.packagesToScan("org.brapi.v2")
				.build();
	}

	@Bean
	public GroupedOpenApi brapiV1Api() {
		return GroupedOpenApi.builder()
				.group("Breeding API v1")
				.packagesToScan("fr.cirad.web.controller.rest")
				.build();
	}

	@Bean
	public GroupedOpenApi ga4ghApi() {
		return GroupedOpenApi.builder()
				.group("GA4GH API v0.6.0a5")
				.packagesToScan("fr.cirad.web.controller.ga4gh")
				.build();
	}

	@Bean
	public GroupedOpenApi gigwaApi() {
		return GroupedOpenApi.builder()
				.group("Gigwa API " + gigwaVersion)
				.packagesToScan("fr.cirad.web.controller.gigwa")
				.build();
	}

//	private SecurityContext securityContext() {
//		return SecurityContext.builder().securityReferences(defaultAuth()).forPaths(PathSelectors.regex("/")).build();
//	}
//
//	List<SecurityReference> defaultAuth() {
//		AuthorizationScope authorizationScope = new AuthorizationScope("global", "accessEverything");
//		return Arrays.asList(new SecurityReference("Authorization", new AuthorizationScope[] {authorizationScope}));
//	}

	@Bean
	public OpenAPI customOpenAPI() {
		String rootPath = servletContext != null
				? servletContext.getContextPath() + GigwaRestController.REST_PATH
				: "";

		return new OpenAPI()
				.info(new Info()
						.title("REST-APIs implemented in this version of Gigwa")
						.summary("# Gigwa " + gigwaVersion)
						.version(gigwaVersion)
						.contact(new Contact().name("Guilhem Sempéré").email("gigwa@cirad.fr"))
						.description("REST-APIs implemented in this version of Gigwa" + "\n" +
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
								+ "| sample | - | sample | sample |\n"
								+ "| callSet | - | markerprofile | callSet |\n")
				)

				.addSecurityItem(new SecurityRequirement().addList("AuthorizationToken"))
				.components(new Components()
						.addSecuritySchemes("AuthorizationToken",
								new SecurityScheme()
										.name("Authorization")
										.type(SecurityScheme.Type.APIKEY)
										.in(SecurityScheme.In.HEADER)));
	}

	@Override
	public void setServletContext(ServletContext sc) {
		if (servletContext != null)
			return;

		servletContext = sc;
		gigwaVersion = buildProperties != null ? "v" + buildProperties.getVersion() : "unknown";
	}

	static public String getGigwaVersion() {
		return gigwaVersion;
	}

	@Bean
	public OpenApiCustomizer avroCustomizer() {
		return openApi -> {
			if (openApi.getComponents() == null ||
					openApi.getComponents().getSchemas() == null) return;

			openApi.getComponents().getSchemas().forEach((name, schema) -> {
				if (schema.getProperties() != null) {
					schema.getProperties().remove("schema");
					schema.getProperties().remove("specificData");
				}
			});
		};
	}

}
