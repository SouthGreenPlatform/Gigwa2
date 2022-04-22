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

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.brapi.v2.api.VariantsetsApiController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import com.mongodb.BasicDBObject;

import fr.cirad.manager.IModuleManager;
import fr.cirad.manager.dump.DumpMetadata;
import fr.cirad.manager.dump.DumpProcess;
import fr.cirad.manager.dump.DumpValidity;
import fr.cirad.manager.dump.IBackgroundProcess;
import fr.cirad.mgdb.model.mongo.maintypes.CachedCount;
import fr.cirad.mgdb.model.mongo.maintypes.DatabaseInformation;
import fr.cirad.mgdb.model.mongo.maintypes.GenotypingProject;
import fr.cirad.mgdb.model.mongo.maintypes.GenotypingSample;
import fr.cirad.mgdb.model.mongo.maintypes.Individual;
import fr.cirad.mgdb.model.mongo.maintypes.VariantRunData;
import fr.cirad.mgdb.model.mongo.maintypes.VariantRunData.VariantRunDataId;
import fr.cirad.mgdb.model.mongodao.MgdbDao;
import fr.cirad.mgdb.service.IGigwaService;
import fr.cirad.tools.mongo.MongoTemplateManager;
import fr.cirad.tools.security.TokenManager;
import fr.cirad.tools.security.base.AbstractTokenManager;

@Component
public class GigwaModuleManager implements IModuleManager {

    private static final Logger LOG = Logger.getLogger(GigwaModuleManager.class);

    private static final String defaultDumpFolder = DumpProcess.dumpManagementPath + "/dumps";

    private String actionRequiredToEnableDumps = null;

    @Autowired
    AppConfig appConfig;
    @Autowired
    ApplicationContext appContext;
    @Autowired
    TokenManager tokenManager;
    @Autowired
    ServletContext servletContext;

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
    public Map<String, Map<Comparable, String>> getEntitiesByModule(String entityType, Boolean fTrueIfPublicFalseIfPrivateNullIfAny, Collection<String> modules) throws Exception {
        Map<String, Map<Comparable, String>> entitiesByModule = new LinkedHashMap<String, Map<Comparable, String>>();
        if (AbstractTokenManager.ENTITY_PROJECT.equals(entityType)) {
            Query q = new Query();
            q.with(Sort.by(Arrays.asList(new Sort.Order(Sort.Direction.ASC, "_id"))));
            q.fields().include(GenotypingProject.FIELDNAME_NAME);

            for (String sModule : modules != null ? modules : MongoTemplateManager.getAvailableModules())
                if (fTrueIfPublicFalseIfPrivateNullIfAny == null || (MongoTemplateManager.isModulePublic(sModule) == fTrueIfPublicFalseIfPrivateNullIfAny)) {
                    Map<Comparable, String> moduleEntities = entitiesByModule.get(sModule);
                    if (moduleEntities == null) {
                        moduleEntities = new LinkedHashMap<Comparable, String>();
                        entitiesByModule.put(sModule, moduleEntities);
                    }

                    for (GenotypingProject project : MongoTemplateManager.get(sModule).find(q, GenotypingProject.class))
                        moduleEntities.put(project.getId(), project.getName());
                }
        }
        else
            throw new Exception("Not managing entities of type " + entityType);

        return entitiesByModule;
    }

    @Override
    public boolean isModuleHidden(String sModule) {
        return MongoTemplateManager.isModuleHidden(sModule);
    }

    @Override
    public boolean removeDataSource(String sModule, boolean fAlsoDropDatabase, boolean fRemoveDumps) {
        if (fRemoveDumps)
            try {
                FileUtils.deleteDirectory(new File(getDumpPath(sModule)));
            } catch (IOException e) {
                LOG.warn("Error removing dumps while deleting database " + sModule, e);
            }

        File brapiV2ExportFolder = new File(servletContext.getRealPath(File.separator + VariantsetsApiController.TMP_OUTPUT_FOLDER));
        if (brapiV2ExportFolder.exists() && brapiV2ExportFolder.isDirectory())
        	for (File exportFile : brapiV2ExportFolder.listFiles(f -> f.getName().startsWith(VariantsetsApiController.brapiV2ExportFilePrefix + sModule + IGigwaService.ID_SEPARATOR)))
        		if (exportFile.delete())
        			LOG.debug("Deleted BrAPI v2 VariantSet export file: " + exportFile);

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
        if (AbstractTokenManager.ENTITY_PROJECT.equals(sEntityType)) {
            final int nProjectIdToRemove = Integer.parseInt(entityId.toString());
            MongoTemplate mongoTemplate = MongoTemplateManager.get(sModule);
            Query query = new Query();
            query.fields().include("_id");
            Collection<String> individualsInThisProject = null, individualsInOtherProjects = new ArrayList<>();
            int nProjCount = 0;
            for (GenotypingProject proj : mongoTemplate.find(query, GenotypingProject.class)) {
                nProjCount++;
                if (proj.getId() == nProjectIdToRemove)
                    individualsInThisProject = MgdbDao.getProjectIndividuals(sModule, proj.getId());
                else
                    individualsInOtherProjects.addAll(MgdbDao.getProjectIndividuals(sModule, proj.getId()));
            }
            if (nProjCount == 1 && !individualsInThisProject.isEmpty()) {
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

            File brapiV2ExportFolder = new File(servletContext.getRealPath(File.separator + VariantsetsApiController.TMP_OUTPUT_FOLDER));
            if (brapiV2ExportFolder.exists() && brapiV2ExportFolder.isDirectory())
            	for (File exportFile : brapiV2ExportFolder.listFiles(f -> f.getName().startsWith(VariantsetsApiController.brapiV2ExportFilePrefix + sModule + IGigwaService.ID_SEPARATOR + entityId + IGigwaService.ID_SEPARATOR)))
            		if (exportFile.delete())
            			LOG.debug("Deleted BrAPI v2 VariantSet export file: " + exportFile);
            
            mongoTemplate.getCollection(mongoTemplate.getCollectionName(CachedCount.class)).drop();
            MongoTemplateManager.updateDatabaseLastModification(sModule);
            return true;
        } else
            throw new Exception("Not managing entities of type " + sEntityType);
    }

    @Override
    public boolean doesEntityExistInModule(String sModule, String sEntityType, Comparable entityId) {
        if (AbstractTokenManager.ENTITY_PROJECT.equals(sEntityType)) {
            final int nProjectId = Integer.parseInt(entityId.toString());
            return MongoTemplateManager.get(sModule).count(new Query(Criteria.where("_id").is(nProjectId)),
                    GenotypingProject.class) == 1;
        } else {
            LOG.error("Not managing entities of type " + sEntityType);
            return false;
        }
    }

    @Override
    public boolean doesEntityTypeSupportVisibility(String sModule, String sEntityType) {
        return false;
    }

    @Override
    public boolean setManagedEntityVisibility(String sModule, String sEntityType, Comparable entityId, boolean fPublic)
            throws Exception {
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
                    String commandPrefix = System.getProperty("os.name").toLowerCase().startsWith("win") ? "cmd.exe /c " : "";

                    Process p = Runtime.getRuntime().exec(commandPrefix + "mongodump --help"); // will throw an exception if command is not on the path if running Linux (but not if running Windows)
                    Charset defaultCharset = java.nio.charset.Charset.defaultCharset();
                    IOUtils.toString(p.getInputStream(), defaultCharset); // necessary otherwise the Thread hangs...
                    String stdErr = IOUtils.toString(p.getErrorStream(), defaultCharset);
                    if (!stdErr.isEmpty())
                        throw new IOException(stdErr);

                    p = Runtime.getRuntime().exec(commandPrefix + "mongorestore --help"); // will throw an exception if command is not on the path if running Linux (but not if running Windows)
                    IOUtils.toString(p.getInputStream(), defaultCharset); // necessary otherwise the Thread hangs...
                    stdErr = IOUtils.toString(p.getErrorStream(), defaultCharset);
                    if (!stdErr.isEmpty())
                        throw new IOException(stdErr);

                    actionRequiredToEnableDumps = ""; // all seems OK
                } catch (IOException ioe) {
                    LOG.error("error checking for mongodump presence", ioe);
                    actionRequiredToEnableDumps = "install MongoDB Command Line Database Tools (then restart application-server)";
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
                    String extensionLessFilename = filename.substring(0, filename.lastIndexOf('.'));
                    if (!extensionLessFilename.contains("__")) {
                        if (withDescription)
                            LOG.warn("Ignoring archive " + file.getName() + " found in dump folder for database " + sModule + " (wrong naming structure)");
                        continue;
                    }

                    Date creationDate;
                    long fileSizeMb;
                    try {
                        BasicFileAttributes fileAttr = Files.readAttributes(file.toPath(), BasicFileAttributes.class);
                        creationDate = Date.from(fileAttr.creationTime().toInstant());
                        fileSizeMb = fileAttr.size();
                    } catch (IOException e) {
                        LOG.error("Creation date unreadable for dump file " + filename, e);
                        continue;
                    }

                    String description = null;
                    if (withDescription) {
                        try {
                            description = FileUtils.readFileToString(new File(dumpPath + "/" + extensionLessFilename + "__description.txt"));
                        } catch (IOException ignored) {}
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

                    result.add(new DumpMetadata(extensionLessFilename, extensionLessFilename.split("__")[1], creationDate, fileSizeMb, description == null ? "" : description, validity));
                }
            }
            return result;
        } else { // The database dump directory does not exist
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
    public IBackgroundProcess startDump(String sModule, String dumpName, String sDescription) {
        String sHost = this.getModuleHost(sModule);
        String credentials = this.getHostCredentials(sHost);
        String databaseName = MongoTemplateManager.getDatabaseName(sModule);
        String outPath = this.getDumpPath(sModule);

        new File(outPath).mkdirs();

        DumpProcess process = new DumpProcess(this, sModule, databaseName, MongoTemplateManager.getServerHosts(sHost), servletContext.getRealPath(""), outPath);

        String fileName = databaseName + "__" + dumpName;
        process.startDump(fileName, credentials);

        if (sDescription != null && !sDescription.trim().isEmpty())
            try {
                FileWriter descriptionWriter = new FileWriter(outPath + File.separator + fileName + "__description.txt");
                descriptionWriter.write(sDescription);
                descriptionWriter.close();
            } catch (IOException e) {
                LOG.error("Error creating description file", e);
            }
        return process;
    }

    @Override
    public IBackgroundProcess startRestore(String sModule, String dumpId, boolean drop) {
        String sHost = this.getModuleHost(sModule);
        String credentials = this.getHostCredentials(sHost);
        String dumpFile = this.getDumpPath(sModule) + File.separator + dumpId + ".gz";
        DumpProcess process = new DumpProcess(this, sModule, MongoTemplateManager.getDatabaseName(sModule), MongoTemplateManager.getServerHosts(sHost), servletContext.getRealPath(""), appConfig.get("dumpFolder"));

        process.startRestore(dumpFile, drop, credentials);
        return process;
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

    String getDumpPath(String sModule) {
        String dumpBase = appConfig.get("dumpFolder");
        if (dumpBase == null)
            dumpBase = servletContext.getRealPath("") + defaultDumpFolder;

        String dumpPath = dumpBase + File.separator + sModule;
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
                    } else
                        return accountForEnvVariables(credentialString);
                }
            }
            return null;
        } catch (ParserConfigurationException | IOException | SAXException e) {
            LOG.error("Error parsing host credentials", e);
            return null;
        }
    }

    static public String accountForEnvVariables(String stringContainingEnvVariables) {
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("#\\{systemEnvironment\\[(.*?)\\]\\}").matcher(stringContainingEnvVariables);
        StringBuffer output = new StringBuffer();
        while (matcher.find()) {
            String matchingString = matcher.group(1), replacementString = System.getenv(matchingString.replaceAll("'|\"", ""));
            if (replacementString == null)
                matcher.appendReplacement(output, "#{systemEnvironment['" + matchingString + "']}"); // replacement failed (no such env variable)
            else
                matcher.appendReplacement(output, replacementString);
        }
        matcher.appendTail(output);
        return output.toString();
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

    @Override
    public InputStream getDumpInputStream(String sModule, String sDumpName) throws FileNotFoundException {
        return new BufferedInputStream(new FileInputStream(new File(getDumpPath(sModule) + File.separator + sDumpName + ".gz")));
    }

    @Override
    public InputStream getDumpLogInputStream(String sModule, String sDumpName) throws IOException {
        return DumpProcess.getLogInputStream(getDumpPath(sModule) + File.separator + sDumpName + "__dump.log");
    }

	@Override
	public void updateDatabaseLastModification(String sModule, Date lastModification, boolean restored) {
		MongoTemplateManager.updateDatabaseLastModification(sModule, lastModification, restored);
	}
	
	public boolean isModuleAvailableForWriting(String sModule) {
		return MongoTemplateManager.isModuleAvailableForWriting(sModule);
	}

	public void lockProjectForWriting(String sModule, String sProject) {
		MongoTemplateManager.lockProjectForWriting(sModule, sProject);
	}

	public void unlockProjectForWriting(String sModule, String sProject) {
		MongoTemplateManager.unlockProjectForWriting(sModule, sProject);
	}

	public void lockModuleForWriting(String sModule) {
		MongoTemplateManager.lockModuleForWriting(sModule);
	}

	public void unlockModuleForWriting(String sModule) {
		MongoTemplateManager.unlockModuleForWriting(sModule);
	}

    public boolean isModuleAvailableForDump(String sModule) {
        return isModuleAvailableForWriting(sModule);
    }
}