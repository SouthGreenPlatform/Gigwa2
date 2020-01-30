package fr.cirad.tools;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;

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
	
	private static final String defaultTrackerUrl = "https://webtools.southgreen.fr/GigwaInstanceTracker";

	/**
     * runs every 5 seconds ( for test purpose )
     */
	@Scheduled(fixedRate = 1000 * 5)
	
    /**
     * runs every 7 days
     */
//	@Scheduled(fixedRate = 1000 * 60 * 60 * 24 * 7)
	public void track() {
		int users = userDao.getUserMap().getUserCount();
//		LOG.info("TRACKER users:" + users);
		long databases = MongoTemplateManager.getPublicDatabases().stream().count();
//		LOG.info("TRACKER databases:" + databases);
		String country = Locale.getDefault().getCountry();
//		LOG.info("TRACKER country:" + country);
		String language = Locale.getDefault().getLanguage();
//		LOG.info("TRACKER language:" + language);
		
		
		String locale = "";
		if(!country.isEmpty()) {
			locale = "&country=" + country;
		}
		if(!language.isEmpty()) {
			locale = locale + "&language=" + language;
		}
		
		String trackerUrl = appConfig.get("trackerUrl");
		URL url = null;

		try {
			url = new URL((trackerUrl == null ? defaultTrackerUrl : trackerUrl) + "?instance=" + appConfig.getInstanceUUID() + locale + "&users=" + users + "&databases=" + databases);
//			LOG.info(url);
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			con.setRequestMethod("GET");
			con.connect();
			LOG.info("Instance tracked returned HTTP code " + con.getResponseCode());
//			con.getResponseMessage();
			con.disconnect();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			LOG.error("Unable to reach instance tracker at " + url, e);
		}
	
	}
}
