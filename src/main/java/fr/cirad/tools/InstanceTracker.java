package fr.cirad.tools;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import fr.cirad.security.ReloadableInMemoryDaoImpl;

@Configuration
@EnableScheduling
public class InstanceTracker {
	private static final Logger LOG = Logger.getLogger(GigwaModuleManager.class);
	
	@Autowired private ReloadableInMemoryDaoImpl userDao;

	/**
     * runs every 5 seconds ( for test purpose )
     */
//	@Scheduled(fixedRate = 1000 * 5)
	
    /**
     * runs every 7 days
     */
	@Scheduled(fixedRate = 1000 * 60 * 60 * 24 * 7)
	public void track() {
		int users = userDao.getUserMap().getUserCount();
//		LOG.info("TRACKER users:" + users);
		try {
			URL url = new URL("http://localhost/test?instance=eclipse&country=FR&users=" + users + "&databases=1");
//			LOG.info(url);
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			con.setRequestMethod("GET");
			con.connect();
			con.getResponseCode();con.getResponseMessage();
			con.disconnect();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	
	}
}
