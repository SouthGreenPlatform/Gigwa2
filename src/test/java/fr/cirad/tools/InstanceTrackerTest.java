package fr.cirad.tools;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.junit.Test;

public class InstanceTrackerTest {

	private static HttpServletRequest request(String scheme, String serverName, int port, String contextPath, String... headerNamesAndValues) {
		Map<String, String> headers = new HashMap<>();
		for (int i = 0; i < headerNamesAndValues.length; i += 2)
			headers.put(headerNamesAndValues[i], headerNamesAndValues[i + 1]);
		return (HttpServletRequest) Proxy.newProxyInstance(InstanceTrackerTest.class.getClassLoader(), new Class<?>[] {HttpServletRequest.class}, (proxy, method, args) -> {
			switch (method.getName()) {
				case "getScheme": return scheme;
				case "getServerName": return serverName;
				case "getServerPort": return port;
				case "getContextPath": return contextPath;
				case "getHeader": return headers.get((String) args[0]);
				default: throw new UnsupportedOperationException(method.getName());
			}
		});
	}

	@Test
	public void directAccess() {
		assertEquals("http://gigwa.example.org:59395/gigwa/", InstanceTracker.computeBaseUrl(request("http", "gigwa.example.org", 59395, "/gigwa")));
		assertEquals("https://gigwa.example.org/", InstanceTracker.computeBaseUrl(request("https", "gigwa.example.org", 443, "")));
		assertEquals("http://8.8.4.4/gigwa/", InstanceTracker.computeBaseUrl(request("http", "8.8.4.4", 80, "/gigwa/")));
		assertEquals("http://8.8.4.4/gigwa/", InstanceTracker.computeBaseUrl(request("http", "8.8.4.4", 80, "/gigwa")));
	}

	@Test
	public void behindProxy() {
		assertEquals("https://gigwa.example.org/gigwa/", InstanceTracker.computeBaseUrl(request("http", "127.0.0.1", 8080, "/gigwa",
				"X-Forwarded-Proto", "https", "X-Forwarded-Host", "gigwa.example.org, internal.proxy")));
		assertEquals("https://gigwa.example.org:8443/gigwa/", InstanceTracker.computeBaseUrl(request("http", "127.0.0.1", 8080, "/gigwa",
				"X-Forwarded-Host", "gigwa.example.org:8443", "X-Forwarded-Proto", "https")));
		assertEquals("http://gigwa.example.org:8000/gigwa/", InstanceTracker.computeBaseUrl(request("http", "127.0.0.1", 8080, "/gigwa",
				"X-Forwarded-Server", "gigwa.example.org", "X-Forwarded-Port", "8000")));
	}

	@Test
	public void nonPublicHostsAreIgnored() {
		for (String host : new String[] {"localhost", "127.0.0.1", "10.1.2.3", "192.168.0.12", "172.20.0.5", "169.254.1.1", "[::1]", "[fd12:3456::1]", "gigwa"})
			assertNull(host, InstanceTracker.computeBaseUrl(request("http", host, 8080, "/gigwa")));
		assertNull(InstanceTracker.computeBaseUrl(request("http", "gigwa.example.org", 80, "/gigwa", "X-Forwarded-Host", "bad host\"<script>")));
	}
}
