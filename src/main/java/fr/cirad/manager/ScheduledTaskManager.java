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
import fr.cirad.mgdb.service.GigwaGa4ghServiceImpl;
import fr.cirad.tools.AppConfig;
import fr.cirad.tools.GigwaModuleManager;
import fr.cirad.tools.mongo.MongoTemplateManager;
import fr.cirad.tools.security.TokenManager;

import javax.annotation.PostConstruct;
import javax.servlet.ServletContext;

import org.brapi.v2.api.VariantsetsApiController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.context.ServletContextAware;

/**
 * class for methods that run periodically or upon server startup
 *
 * @author petel, sempere
 */
@Configuration
@EnableScheduling
public class ScheduledTaskManager implements ServletContextAware {

    static private final org.apache.log4j.Logger LOG = org.apache.log4j.Logger.getLogger(ScheduledTaskManager.class);
    
    @Autowired private AppConfig appConfig;
    @Autowired private TokenManager tokenManager;
    @Autowired private GigwaModuleManager moduleManager;

	private ServletContext servletContext;
    
	@Override
	public void setServletContext(ServletContext servletContext) {
		this.servletContext = servletContext;
	}
    
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
    
	/**
	 * Cleanup old finished import processes periodically
	 */
	@Scheduled(fixedRate = 1000*60*60*24 /* 1 day */)
	public void cleanupCompleteImportProcesses() {
		moduleManager.cleanupCompleteImportProcesses();
	}
	
	/**
	 * Cleanup old finished processes regularly
	 */
	@Scheduled(fixedRate = 1000*60*60 /* 1 hour */)
	public void cleanupExpiredExportFiles() {
        new Thread() {
        	public void run() {
	            try {
	            	GigwaGa4ghServiceImpl.cleanupExpiredExportData(servletContext);
	                VariantsetsApiController.cleanupOldExportData(servletContext);
	            } catch (Exception e) {
	                LOG.error("Unable to cleanup expired export files", e);
	            }
	        }
	    }.start();
	}
}
