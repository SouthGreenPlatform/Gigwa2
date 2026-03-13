package fr.cirad.web.controller;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import fr.cirad.tools.AppConfig;

@Controller
@RequestMapping(IGVProxyController.IGV_PROXY_URL)
public class IGVProxyController {
	
	public static final String IGV_PROXY_URL = "/igvProxy";
	
	@Autowired private AppConfig appConfig;
	
    private List<String> allowedDomains = null;
    private List<String> wildcardDomains = null;
 
    @GetMapping("/**")
    public void proxyRequest(
            @RequestParam("url") String targetUrl,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
    	
    	if (allowedDomains == null) {
	    	String allowedDomainsConfig = appConfig.get("igvProxiedDomains");
	        allowedDomains = Arrays.stream(allowedDomainsConfig.split(","))
	            .map(String::trim)
	            .filter(d -> !d.startsWith("*."))
	            .collect(Collectors.toList());
	            
	        wildcardDomains = Arrays.stream(allowedDomainsConfig.split(","))
	            .map(String::trim)
	            .filter(d -> d.startsWith("*."))
	            .map(d -> d.substring(2)) // Remove '*.' prefix
	            .collect(Collectors.toList());
    	}
        
        // Validate the URL against whitelist
        if (!isUrlAllowed(targetUrl)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.getWriter().write("Domain not allowed for proxying");
            return;
        }
        
        HttpURLConnection connection = null;
        try {
            URL url = new URL(targetUrl);
            connection = (HttpURLConnection) url.openConnection();
            
            // Set method
            connection.setRequestMethod(request.getMethod());
            
            // CRITICAL: Forward the Range header if present
            String rangeHeader = request.getHeader("Range");
            if (rangeHeader != null)
                connection.setRequestProperty("Range", rangeHeader);
            
            // Forward other headers (selectively)
            String userAgent = request.getHeader("User-Agent");
            if (userAgent != null) {
                connection.setRequestProperty("User-Agent", userAgent);
            }
            
            // Connect and get response
            connection.connect();
            int responseCode = connection.getResponseCode();
            
            // CRITICAL: Set proper status for partial content
            if (responseCode == HttpURLConnection.HTTP_PARTIAL) {
                response.setStatus(HttpStatus.PARTIAL_CONTENT.value());
            } else {
                response.setStatus(responseCode);
            }
            
            // CRITICAL: Forward Content-Range header if present
            String contentRange = connection.getHeaderField("Content-Range");
            if (contentRange != null) {
                response.setHeader("Content-Range", contentRange);
            }
            
            // Forward Accept-Ranges header if present
            String acceptRanges = connection.getHeaderField("Accept-Ranges");
            if (acceptRanges != null) {
                response.setHeader("Accept-Ranges", acceptRanges);
            }
            
            // Forward Content-Length if present
            String contentLength = connection.getHeaderField("Content-Length");
            if (contentLength != null) {
                response.setHeader("Content-Length", contentLength);
            }
            
            // Forward Content-Type
            String contentType = connection.getHeaderField("Content-Type");
            if (contentType != null) {
                response.setHeader("Content-Type", contentType);
            }
            
            // Copy response body
            InputStream inputStream;
            if (responseCode >= 400)
                inputStream = connection.getErrorStream();
            else
                inputStream = connection.getInputStream();
            
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                response.getOutputStream().write(buffer, 0, bytesRead);
            }
            
            response.getOutputStream().flush();
            
        } catch (Exception e) {
            response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            response.getWriter().write("Proxy error: " + e.getMessage());
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
    
    private boolean isUrlAllowed(String url) {
        try {
            URL targetUrl = new URL(url);
            String host = targetUrl.getHost();
            
            if (allowedDomains.contains(host)) {
                return true;
            }
            
            for (String wildcardDomain : wildcardDomains) {
                if (host.endsWith("." + wildcardDomain) || host.equals(wildcardDomain)) {
                    return true;
                }
            }
            
            return false;
        } catch (MalformedURLException e) {
            return false;
        }
    }
}