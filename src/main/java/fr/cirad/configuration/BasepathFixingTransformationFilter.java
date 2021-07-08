package fr.cirad.configuration;

import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponents;

import io.swagger.models.Swagger;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.swagger.common.HostNameProvider;
import springfox.documentation.swagger.common.SwaggerPluginSupport;
import springfox.documentation.swagger2.web.SwaggerTransformationContext;
import springfox.documentation.swagger2.web.WebMvcSwaggerTransformationFilter;

@Component
@Order(SwaggerPluginSupport.SWAGGER_PLUGIN_ORDER)	// make sure it runs after the default plugin (WebMvcBasePathAndHostnameTransformationFilter)
public class BasepathFixingTransformationFilter implements WebMvcSwaggerTransformationFilter {
	
	private static final Logger LOG = Logger.getLogger(BasepathFixingTransformationFilter.class);
	
	@Override
	public Swagger transform(SwaggerTransformationContext<HttpServletRequest> context) {
		Swagger swagger = context.getSpecification();
		context.request().ifPresent(servletRequest -> {
		   UriComponents uriComponents = HostNameProvider.componentsFrom(servletRequest, swagger.getBasePath());
		   String sHost = uriComponents.getHost();
		   if (uriComponents.getPort() != -1)
			   sHost += ":" + uriComponents.getPort();
		   swagger.host(sHost);
		   String basePath = uriComponents.getPath().isEmpty() ? "/" : uriComponents.getPath();
		   swagger.basePath(basePath);
		});
		return swagger;
	}

	@Override
	public boolean supports(DocumentationType delimiter) {
		return delimiter == DocumentationType.SWAGGER_2;
	}
}
