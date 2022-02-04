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
package fr.cirad.tools;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.servlet.ServletContext;

import org.apache.commons.collections.CollectionUtils;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import fr.cirad.manager.dump.DumpMetadata;
import fr.cirad.manager.dump.DumpValidity;
import fr.cirad.manager.dump.IBackgroundProcess;
import fr.cirad.mgdb.importing.base.AbstractGenotypeImport;
import fr.cirad.mgdb.model.mongo.maintypes.CachedCount;
import fr.cirad.mgdb.model.mongo.maintypes.DatabaseInformation;
import fr.cirad.mgdb.model.mongo.maintypes.GenotypingProject;
import fr.cirad.mgdb.model.mongo.maintypes.GenotypingSample;
import fr.cirad.mgdb.model.mongo.maintypes.Individual;
import fr.cirad.mgdb.model.mongo.maintypes.VariantRunData;
import fr.cirad.mgdb.model.mongo.maintypes.VariantRunData.VariantRunDataId;
import fr.cirad.mgdb.model.mongodao.MgdbDao;
import fr.cirad.security.base.IModuleManager;
import fr.cirad.tools.mongo.MongoTemplateManager;
import fr.cirad.tools.security.TokenManager;
import fr.cirad.tools.security.base.AbstractTokenManager;

// FIXME
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import com.mongodb.BasicDBObject;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

@Component
public class GigwaModuleManager implements IModuleManager {

	private static final Logger LOG = Logger.getLogger(GigwaModuleManager.class);

	private static final String defaultDumpFolder = GigwaDumpProcess.dumpManagementPath + "/dumps";

	private String actionRequiredToEnableDumps = null;

	@Autowired AppConfig appConfig;
	@Autowired ApplicationContext appContext;
    @Autowired TokenManager tokenManager;
    @Autowired ServletContext servletContext;

    @Override
    public String getModuleHost(String sModule) {
        return MongoTemplateManager.getModuleHost(sModule);
    }

	@Override
	public Collection<String> getModules(Boolean fTrueForPublicFalseForPrivateNullForBoth) {
		if (fTrueForPublicFalseForPrivateNullForBoth == null)
			return MongoTemplateManager.getAvailableModules();
		if (Boolean.TRUE.equals(fTrueForPublicFalseForPrivateNullForBoth))
			return MongoTemplateManager.getPublicDatabases();
		return CollectionUtils.disjunction(MongoTemplateManager.getAvailableModules(), MongoTemplateManager.getPublicDatabases());
	}

	@Override
	public Map<String, Map<Comparable, String>> getEntitiesByModule(String entityType, Boolean fTrueIfPublicFalseIfPrivateNullIfAny)
	{
		Map<String, Map<Comparable, String>> entitiesByModule = new LinkedHashMap<String, Map<Comparable, String>>();
		if ("project".equals(entityType))
			for (String sModule : MongoTemplateManager.getAvailableModules())
				if (fTrueIfPublicFalseIfPrivateNullIfAny == null || (MongoTemplateManager.isModulePublic(sModule) == fTrueIfPublicFalseIfPrivateNullIfAny))
				{
					Map<Comparable, String> moduleEntities = entitiesByModule.get(sModule);
					if (moduleEntities == null)
					{
						moduleEntities = new LinkedHashMap<Comparable, String>();
						entitiesByModule.put(sModule, moduleEntities);
					}

					Query q = new Query();
					q.with(Sort.by(Arrays.asList(new Sort.Order(Sort.Direction.ASC, "_id"))));
					q.fields().include(GenotypingProject.FIELDNAME_NAME);
					for (GenotypingProject project : MongoTemplateManager.get(sModule).find(q, GenotypingProject.class))
						moduleEntities.put(project.getId(), project.getName());
				}
		return entitiesByModule;
	}

	@Override
	public boolean isModuleHidden(String sModule) {
		return MongoTemplateManager.isModuleHidden(sModule);
	}

	@Override
	public boolean removeDataSource(String sModule, boolean fAlsoDropDatabase) {
		return MongoTemplateManager.removeDataSource(sModule, fAlsoDropDatabase);
	}

	@Override
	public boolean updateDataSource(String sModule, boolean fPublic, boolean fHidden, String ncbiTaxonIdNameAndSpecies) throws Exception {
		return MongoTemplateManager.saveOrUpdateDataSource(MongoTemplateManager.ModuleAction.UPDATE_STATUS, sModule, fPublic, fHidden, null, ncbiTaxonIdNameAndSpecies, null);
	}

	@Override
	public boolean createDataSource(String sModule, String sHost, String sSpeciesName, Long expiryDate) throws Exception {
		return MongoTemplateManager.saveOrUpdateDataSource(MongoTemplateManager.ModuleAction.CREATE, sModule, false, false, sHost, sSpeciesName, expiryDate);
	}

	@Override
	public Collection<String> getHosts() {
		return MongoTemplateManager.getHostNames();
	}

	@Override
	public boolean removeManagedEntity(String sModule, String sEntityType, Comparable entityId) throws Exception {
		if (AbstractTokenManager.ENTITY_PROJECT.equals(sEntityType))
		{
			final int nProjectIdToRemove = Integer.parseInt(entityId.toString());
			if (!tokenManager.canUserWriteToProject(SecurityContextHolder.getContext().getAuthentication(), sModule, nProjectIdToRemove))
				throw new Exception("You are not allowed to remove this project");

			MongoTemplate mongoTemplate = MongoTemplateManager.get(sModule);
			Query query = new Query();
			query.fields().include("_id");
			Collection<String> individualsInThisProject = null, individualsInOtherProjects = new ArrayList<>();
			int nProjCount = 0;
			for (GenotypingProject proj : mongoTemplate.find(query, GenotypingProject.class))
			{
				nProjCount++;
				if (proj.getId() == nProjectIdToRemove)
					individualsInThisProject = MgdbDao.getProjectIndividuals(sModule, proj.getId());
				else
					individualsInOtherProjects.addAll(MgdbDao.getProjectIndividuals(sModule, proj.getId()));
			}
			if (nProjCount == 1 && !individualsInThisProject.isEmpty())
			{
				mongoTemplate.getDb().drop();
				LOG.debug("Dropped database for module " + sModule + " instead of removing its only project");
				return true;
			}

			long nRemovedSampleCount = mongoTemplate.remove(new Query(Criteria.where(GenotypingSample.FIELDNAME_PROJECT_ID).is(nProjectIdToRemove)), GenotypingSample.class).getDeletedCount();
			LOG.debug("Removed " + nRemovedSampleCount + " samples for project " + nProjectIdToRemove);

			Collection<String> individualsToRemove = CollectionUtils.disjunction(individualsInThisProject, CollectionUtils.intersection(individualsInThisProject, individualsInOtherProjects));
			long nRemovedIndCount = mongoTemplate.remove(new Query(Criteria.where("_id").in(individualsToRemove)), Individual.class).getDeletedCount();
			LOG.debug("Removed " + nRemovedIndCount + " individuals out of " + individualsInThisProject.size());

			if (mongoTemplate.remove(new Query(Criteria.where("_id").is(nProjectIdToRemove)), GenotypingProject.class).getDeletedCount() > 0)
				LOG.debug("Removed project " + nProjectIdToRemove + " from module " + sModule);

			new Thread() {
				public void run() {
					long nRemovedVrdCount = mongoTemplate.remove(new Query(Criteria.where("_id." + VariantRunDataId.FIELDNAME_PROJECT_ID).is(nProjectIdToRemove)), VariantRunData.class).getDeletedCount();
					LOG.debug("Removed " + nRemovedVrdCount + " VRD records for project " + nProjectIdToRemove + " of module " + sModule);
				}
			}.start();
			LOG.debug("Launched async VRD cleanup for project " + nProjectIdToRemove + " of module " + sModule);

            mongoTemplate.getCollection(mongoTemplate.getCollectionName(CachedCount.class)).drop();
			return true;
		}
		else
			throw new Exception("Not managing entities of type " + sEntityType);
	}

	@Override
	public boolean doesEntityExistInModule(String sModule, String sEntityType, Comparable entityId) {
		if (AbstractTokenManager.ENTITY_PROJECT.equals(sEntityType))
		{
			final int nProjectId = Integer.parseInt(entityId.toString());
			return MongoTemplateManager.get(sModule).count(new Query(Criteria.where("_id").is(nProjectId)), GenotypingProject.class) == 1;
		}
		else
		{
			LOG.error("Not managing entities of type " + sEntityType);
			return false;
		}
	}


	@Override
	public boolean doesEntityTypeSupportVisibility(String sModule, String sEntityType) {
		return false;
	}


	@Override
	public boolean setManagedEntityVisibility(String sModule, String sEntityType, Comparable entityId, boolean fPublic) throws Exception {
		return false;
	}


	@Override
	public String getActionRequiredToEnableDumps() {
	    if (actionRequiredToEnableDumps == null) {
    		String dumpFolder = appConfig.get("dumpFolder");
    		if (dumpFolder == null)
    		    actionRequiredToEnableDumps = "specify a value for dumpFolder in config.properties (webapp should reload automatically)";
    		else if (Files.isDirectory(Paths.get(dumpFolder))) {
    		    try {
    		        Runtime.getRuntime().exec("mongodump --help");
    		        Runtime.getRuntime().exec("mongorestore --help");
                    actionRequiredToEnableDumps = "";
    		    }
    		    catch (IOException ioe) {
                    actionRequiredToEnableDumps = "install MongoDB Command Line Database Tools (then reload webapp)";
    		    }
    		}
    		else
    		    actionRequiredToEnableDumps = new File(dumpFolder).mkdirs() ? "" : "grant app-server write permissions on folder " + dumpFolder + " (then reload webapp)";
	    }
        return actionRequiredToEnableDumps;
	}

	@Override
	public List<DumpMetadata> getDumps(String sModule) {
		return getDumps(sModule, true);
	}

	public List<DumpMetadata> getDumps(String sModule, boolean withDescription) {
		DatabaseInformation dbInfo = MongoTemplateManager.getDatabaseInformation(sModule);
		String dumpPath = this.getDumpPath(sModule);

		// List files in the database's dump directory, filter out subdirectories and logs
		File[] fileList = new File(dumpPath).listFiles();
		if (fileList != null) {
			ArrayList<DumpMetadata> result = new ArrayList<DumpMetadata>();
			for (File file : fileList) {
				String filename = file.getName();
				if (filename.endsWith(".gz") && !filename.endsWith(".log.gz")) {
					String prefix = filename.substring(0, filename.lastIndexOf('.'));
					String[] splitName = prefix.split("__");
					String module = splitName[0];
					String name = splitName[1];

					Date creationDate;
					long fileSizeMb;
					try {
					    BasicFileAttributes fileAttr = Files.readAttributes(file.toPath(), BasicFileAttributes.class);
						creationDate = Date.from(fileAttr.creationTime().toInstant());
						fileSizeMb = fileAttr.size();
					} catch (IOException e) {
						LOG.error("Creation date unreadable for dump file " + filename);
						e.printStackTrace();
						continue;
					}

					String description = null;
					if (withDescription) {
						File descriptionFile = new File(dumpPath + "/" + prefix + "description.txt");
						try {
							description = new String(Files.readAllBytes(descriptionFile.toPath()));
						} catch (IOException e) {
							e.printStackTrace();
						}
					}

					DumpValidity validity;

					// No last modification date set : default to valid ?
					if (dbInfo == null) {
						validity = DumpValidity.VALID;
					// creationDate < lastModification : outdated
					} else if (creationDate.compareTo(dbInfo.getLastModification()) < 0) {
						validity = DumpValidity.OUTDATED;
					// The last modification was a dump restore, and this dump is more recent than the restored dump
					} else if (creationDate.compareTo(dbInfo.getLastModification()) > 0 && dbInfo.getRestoreDate() != null && creationDate.compareTo(dbInfo.getRestoreDate()) < 0) {
						validity = DumpValidity.DIVERGED;
					} else {
						validity = DumpValidity.VALID;
					}

					result.add(new DumpMetadata(prefix, module, name, creationDate, fileSizeMb, description, validity));
				}
			}
			return result;
		} else {  // The database dump directory does not exist
			return new ArrayList<DumpMetadata>();
		}
	}

	@Override
	public DumpValidity getDumpStatus(String sModule) {
		if (!isModuleAvailableForDump(sModule))
			return DumpValidity.BUSY;

		DumpValidity result = DumpValidity.NONE;
		for (DumpMetadata metadata : getDumps(sModule, false)) {
			if (metadata.getValidity().validity > result.validity)
				result = metadata.getValidity();
		}

		return result;
	}

	@Override
	public IBackgroundProcess startDump(String sModule, String sName, String sDescription) {
		String sHost = this.getModuleHost(sModule);
		String credentials = this.getHostCredentials(sHost);
		String databaseName = MongoTemplateManager.getDatabaseName(sModule);
		GigwaDumpProcess process = new GigwaDumpProcess(sModule,
				databaseName,
				MongoTemplateManager.getServerHosts(sHost),
				servletContext.getRealPath(""),
				appConfig.get("dumpFolder"));

		String fileName = sModule + "__" + sName + "__";
		process.startDump(fileName, credentials);

		String outPath = appConfig.get("dumpFolder") + File.separator + databaseName + File.separator;
		new File(outPath).mkdirs();
		String descriptionPath = outPath + fileName + "description.txt";
		try {
			FileWriter descriptionWriter = new FileWriter(descriptionPath);
			descriptionWriter.write(sDescription);
			descriptionWriter.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		return process;
	}

	@Override
	public IBackgroundProcess startRestore(String sModule, String dumpId, boolean drop) {
		String sHost = this.getModuleHost(sModule);
		String credentials = this.getHostCredentials(sHost);
		String dumpFile = this.getDumpPath(sModule) + File.separator + dumpId + ".gz";
		GigwaDumpProcess process = new GigwaDumpProcess(sModule,
				MongoTemplateManager.getDatabaseName(sModule),
				MongoTemplateManager.getServerHosts(sHost),
				servletContext.getRealPath(""),
				appConfig.get("dumpFolder"));

		process.startRestore(dumpFile, drop, credentials);
		return process;
	}

	@Override
	public boolean isModuleAvailableForDump(String sModule) {
		return AbstractGenotypeImport.isModuleAvailableForWriting(sModule);
	}

	@Override
	public boolean deleteDump(String sModule, String sDump) {
		String dumpPath = getDumpPath(sModule);
		String basename = dumpPath + File.separator + sDump;

		File archiveFile = new File(basename + ".gz");
		boolean result = archiveFile.delete();

		for (File file : new File(dumpPath).listFiles()) {
			String filename = file.getName();
			if (filename.startsWith(sDump) && (filename.endsWith(".log") || filename.endsWith(".log.gz") || filename.endsWith(".txt")))
				file.delete();
		}

		return result;
	}

	private String getDumpPath(String sModule) {
		String dumpBase = appConfig.get("dumpFolder");
		if (dumpBase == null) {
			dumpBase = servletContext.getRealPath("") + defaultDumpFolder;
		}

		String dumpPath = dumpBase + File.separator + MongoTemplateManager.getDatabaseName(sModule);
		return dumpPath;
	}

	// FIXME
	private String getHostCredentials(String sHost) {
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		try {
			DocumentBuilder builder = factory.newDocumentBuilder();
			Document document = builder.parse(appContext.getResource("classpath:/applicationContext-data.xml").getFile());

			NodeList clients = document.getElementsByTagName("mongo:mongo-client");
			for (int i = 0; i < clients.getLength(); i++) {
				Node node = clients.item(i);
				if (node.getNodeType() == Node.ELEMENT_NODE) {
					Element client = (Element) node;
					String credentialString = client.getAttribute("credential");
					if (credentialString.length() == 0) {
						return null;
					} else {
						return credentialString;
					}
				}
			}
			return null;
		} catch (ParserConfigurationException | IOException | SAXException e) {
			LOG.error(e.getMessage());
			e.printStackTrace();
			return null;
		}
	}

//	private int compareFileCreationDates(File f1, File f2) {
//		try {
//			BasicFileAttributes attr1 = Files.readAttributes(f1.toPath(), BasicFileAttributes.class);
//			BasicFileAttributes attr2 = Files.readAttributes(f2.toPath(), BasicFileAttributes.class);
//			return attr1.creationTime().compareTo(attr2.creationTime());
//		} catch (IOException e) {
//			e.printStackTrace();
//			return f1.getName().compareTo(f2.getName());  // Default to file name ...?
//		}
//	}

    @Override
    public long getModuleSize(String module) {
        return ((Number) MongoTemplateManager.get(module).getDb().runCommand(new BasicDBObject("dbStats", 1)).get("storageSize")).longValue();
    }
}