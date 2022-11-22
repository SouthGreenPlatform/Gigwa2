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
package fr.cirad.manager;

import fr.cirad.mgdb.importing.OntologyImport;
import fr.cirad.tools.AppConfig;
import fr.cirad.tools.mongo.MongoTemplateManager;
import fr.cirad.tools.security.TokenManager;

import java.text.ParseException;
import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * class for methods that run periodically or upon server startup
 *
 * @author petel, sempere
 */
@Configuration
@EnableScheduling
public class ScheduledTaskManager {

    static private final org.apache.log4j.Logger LOG = org.apache.log4j.Logger.getLogger(ScheduledTaskManager.class);
    
    @Autowired private AppConfig appConfig;
    @Autowired TokenManager tokenManager;

    /**
     * remove old tokens and drop associated temporary collections, executed every 6 hours
     */
    @Scheduled(fixedRate = 21600000)
    public void cleanProcessMap() {
    	LOG.debug("Scheduled cleanProcessMap launched");
        tokenManager.cleanupTokenMap();
    }
    
    /**
     * remove expired temporary databases, executed every hour
     */
    @Scheduled(fixedRate = 3600000)
    public void clearExpiredDatabases() {
    	MongoTemplateManager.clearExpiredDatabases();
    }

    /**
     * launched once at startup
     */
    @PostConstruct
    public void onStartup() {
        try {	// load ontology terms from .obo file
            String url = new ClassPathResource("/res/so-xp-simple.obo").getFile().getAbsolutePath();
            OntologyImport.main(new String[]{url});
        } catch (Exception ex) {
            LOG.debug("error while parsing ontology file in /resources/res", ex);
        }
        
        // check if CAS configuration looks complete
        String casServerURL = appConfig.get("casServerURL");
        if (casServerURL != null && !casServerURL.trim().isEmpty()) {
        	String enforcedWebapRootUrl = appConfig.get("enforcedWebapRootUrl");
        	if (enforcedWebapRootUrl == null || enforcedWebapRootUrl.trim().isEmpty())
        		LOG.warn("CAS authentication disabled because no enforcedWebapRootUrl property was provided!");
        	else
        		LOG.info("CAS authentication enabled with " + casServerURL);
        }
    }
}
