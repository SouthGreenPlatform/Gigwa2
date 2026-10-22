package fr.cirad.web.filter;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;

import org.springframework.web.context.support.WebApplicationContextUtils;

import fr.cirad.tools.InstanceTracker;

/**
 * Lets the instance tracker learn the public base-URL from incoming requests when enforcedWebapRootUrl is not set.
 * Becomes a no-op once the URL is known.
 */
public class InstanceTrackerFilter implements Filter {

	private InstanceTracker instanceTracker;

	@Override
	public void init(FilterConfig filterConfig) throws ServletException {
		// the root application context (which scans fr.cirad.tools) is started by ContextLoaderListener, i.e. before filters get initialized
		instanceTracker = WebApplicationContextUtils.getRequiredWebApplicationContext(filterConfig.getServletContext()).getBean(InstanceTracker.class);
	}

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
		if (request instanceof HttpServletRequest)
			instanceTracker.noteRequest((HttpServletRequest) request);
		chain.doFilter(request, response);
	}

	@Override
	public void destroy() {
	}
}
