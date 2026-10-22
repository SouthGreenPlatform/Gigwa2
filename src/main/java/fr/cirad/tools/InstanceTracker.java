package fr.cirad.tools;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Properties;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Pattern;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import fr.cirad.security.ReloadableInMemoryDaoImpl;
import fr.cirad.tools.mongo.MongoTemplateManager;

@Configuration
@EnableScheduling
public class InstanceTracker {
	private static final Logger LOG = Logger.getLogger(InstanceTracker.class);

	@Autowired private ReloadableInMemoryDaoImpl userDao;
	@Autowired private AppConfig appConfig;

	private static final String defaultTrackerUrl = "https://gigwa.southgreen.fr/GigwaInstanceTracker/";	// trailing slash avoids a redirect

	/* hosts we don't report: unreachable from outside, and they would only expose the site's internal network */
	private static final Pattern nonPublicHost = Pattern.compile("(?i)^(localhost|.*\\.localhost|\\[?::1\\]?|\\[?(fe80|fc|fd)[0-9a-f]*:.*|127\\..*|10\\..*|192\\.168\\..*|172\\.(1[6-9]|2[0-9]|3[01])\\..*|169\\.254\\..*|0\\.0\\.0\\.0)$");

	/** base-URL deduced from incoming requests, only used when enforcedWebapRootUrl is not set */
	private volatile String learnedBaseUrl;

	@PostConstruct
	public void onInstanceTrackerCreation() throws IOException { // tracker-config fix (should be removed at some point)
        String sTrackerUrl = appConfig.get("trackerUrl");
        if (sTrackerUrl != null && !sTrackerUrl.isBlank() /* blank means tracking was disabled on purpose */ && !sTrackerUrl.contains("/GigwaInstanceTrackerDev")) {
        	HashMap<String, String> propsToSet = new HashMap<>();
        	propsToSet.put("trackerUrl", null);	// clearing it will make Gigwa use the default value
    		String sInstanceID = appConfig.getInstanceUUID();
    		if ("devInstance".equals(sInstanceID))
    			propsToSet.put("instanceUUID", null);	// clearing it will make Gigwa generate a new one
    		appConfig.saveProperties(propsToSet);
        }
	}

    /**
     * runs at startup, then every 28 days
     */
	@Scheduled(fixedRate = 1000l * 60 * 60 * 24 * 28)
	public void track() {
		String trackerUrl = appConfig.get("trackerUrl");
		if (trackerUrl != null && trackerUrl.isBlank()) {
			LOG.debug("Instance tracking disabled (trackerUrl is blank)");
			return;
		}

		int users = userDao.getUserCount();
		int databases = MongoTemplateManager.getAvailableModules().size();
		String country = Locale.getDefault().getCountry();
		String language = Locale.getDefault().getLanguage();

		String locale = "";
		if (!country.isEmpty()) {
			locale = "&country=" + country;
		}
		if (!language.isEmpty()) {
			locale = locale + "&language=" + language;
		}

		String baseUrl = getBaseUrl();
		String version = getGigwaVersion();
		URL url = null;
		try {
			url = new URL((trackerUrl == null ? defaultTrackerUrl : trackerUrl) + "?instance=" + appConfig.getInstanceUUID() + locale + "&users=" + users + "&databases=" + databases
					+ (baseUrl == null ? "" : "&baseUrl=" + URLEncoder.encode(baseUrl, StandardCharsets.UTF_8))
					+ (version == null ? "" : "&version=" + URLEncoder.encode(version, StandardCharsets.UTF_8)));
			LOG.debug("Invoking instance tracker with URL: " + url);
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			con.setRequestMethod("GET");
			con.setConnectTimeout(10000);
			con.setReadTimeout(10000);
			con.connect();
			LOG.info("Instance tracker returned HTTP code " + con.getResponseCode());
			con.disconnect();
		} catch (IOException e) {
			LOG.error("Unable to reach instance tracker at " + url, e);
		}
	}

	/**
	 * @return the Implementation-version found in MANIFEST.MF (the same as displayed by Swagger), or null if unavailable
	 */
	private static String getGigwaVersion() {
		try (InputStream is = InstanceTracker.class.getClassLoader().getResourceAsStream("MANIFEST.MF")) {
			if (is == null)
				return null;
			Properties manifest = new Properties();
			manifest.load(is);
			String version = manifest.getProperty("Implementation-version");
			return version == null || version.isBlank() ? null : version.trim();
		} catch (IOException e) {
			return null;
		}
	}

	/**
	 * @return enforcedWebapRootUrl when configured, otherwise the base-URL learned from incoming requests (null until one has been received)
	 */
	private String getBaseUrl() {
		String enforcedWebapRootUrl = appConfig.get("enforcedWebapRootUrl");
		if (enforcedWebapRootUrl != null && !enforcedWebapRootUrl.isBlank())
			return stripTrailingSlash(enforcedWebapRootUrl.trim());
		return learnedBaseUrl;
	}

	/**
	 * Invoked for incoming requests (see InstanceTrackerFilter): when enforcedWebapRootUrl is not set, the first request revealing
	 * a public base-URL is used to determine it, and the tracker is notified right away (the startup ping could not include it).
	 */
	public void noteRequest(HttpServletRequest request) {
		if (learnedBaseUrl != null)
			return;
		String enforcedWebapRootUrl = appConfig.get("enforcedWebapRootUrl");
		if (enforcedWebapRootUrl != null && !enforcedWebapRootUrl.isBlank())
			return;

		String baseUrl = computeBaseUrl(request);
		if (baseUrl == null)
			return;

		synchronized (this) {
			if (learnedBaseUrl != null)
				return;
			learnedBaseUrl = baseUrl;
		}
		LOG.info("Instance base-URL determined from incoming request: " + baseUrl);
		CompletableFuture.runAsync(this::track);
	}

	/**
	 * Builds the base-URL as seen by the client, honouring reverse-proxy headers.
	 * @return null if the host is not publicly meaningful (localhost, private network, ...)
	 */
	static String computeBaseUrl(HttpServletRequest request) {
		String scheme = firstValue(request.getHeader("X-Forwarded-Proto"));
		if (scheme == null)
			scheme = request.getScheme();
		scheme = scheme.toLowerCase();
		if (!"http".equals(scheme) && !"https".equals(scheme))
			return null;

		String hostAndPort = firstValue(request.getHeader("X-Forwarded-Host"));
		if (hostAndPort == null)
			hostAndPort = firstValue(request.getHeader("X-Forwarded-Server"));	// also used by BackOfficeController.determinePublicHostName
		if (hostAndPort == null)
			hostAndPort = request.getServerName() + ":" + request.getServerPort();

		String host = hostAndPort.replaceFirst(":\\d+$", "");	// works for IPv6 too, since those are bracketed when followed by a port
		if (!host.matches("[\\w.\\-\\[\\]:]+") || nonPublicHost.matcher(host).matches() || !host.matches(".*[.\\[].*") /* single-label names (e.g. a docker-compose service name) are internal */)
			return null;

		String port = hostAndPort.length() > host.length() ? hostAndPort.substring(host.length() + 1) : firstValue(request.getHeader("X-Forwarded-Port"));
		if (port != null && (("http".equals(scheme) && "80".equals(port)) || ("https".equals(scheme) && "443".equals(port))))
			port = null;

		return scheme + "://" + host + (port == null ? "" : ":" + port) + stripTrailingSlash(request.getContextPath());
	}

	private static String firstValue(String headerValue) {
		if (headerValue == null)
			return null;
		String first = headerValue.split(",")[0].trim();
		return first.isEmpty() ? null : first;
	}

	private static String stripTrailingSlash(String url) {
		return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
	}
}
