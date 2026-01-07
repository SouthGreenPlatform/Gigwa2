package fr.cirad.web.controller.annotation;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.GZIPInputStream;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import fr.cirad.mgdb.annotation.SnpEffAnnotationService;
import fr.cirad.mgdb.model.mongo.maintypes.GenotypingProject;
import fr.cirad.tools.AppConfig;
import fr.cirad.tools.ProgressIndicator;
import fr.cirad.tools.mongo.MongoTemplateManager;
import fr.cirad.tools.security.TokenManager;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import io.swagger.annotations.Authorization;
import springfox.documentation.annotations.ApiIgnore;

@Controller
public class SnpEffAnnotationController implements fr.cirad.mgdb.annotation.AnnotationControllerInterface {

	private static final Logger LOG = Logger.getLogger(SnpEffAnnotationController.class);

	@Autowired private TokenManager tokenManager;
	@Autowired private AppConfig appConfig;

	static public final String BASE_URL = "/variantAnnotation";

	static public final String SNPEFF_ANNOTATION_PATH = "/snpEff/annotate";
    static public final String SNPEFF_GENOME_LIST = "/snpEff/genomes";
    static public final String SNPEFF_INSTALL_GENOME = "/snpEff/install";
    
	private String configFile;
	private String dataPath;

	@ApiIgnore
    @ApiOperation(authorizations = {@Authorization(value = "AuthorizationToken")}, value = SNPEFF_ANNOTATION_PATH, notes = "Annotates variants with snpEff")
	@ApiResponses(value = {@ApiResponse(code = 200, message = "Success")})
	@Override
    @RequestMapping(value = BASE_URL + SNPEFF_ANNOTATION_PATH, method = RequestMethod.POST)
    public void annotateRun(HttpServletRequest request, HttpServletResponse response,
    		@RequestParam("module") final String sModule,
			@RequestParam("project") final String sProject,
			@RequestParam("run") final String sRun,
			@RequestParam("genome") final String genomeName) throws Exception {
    	String token = tokenManager.readToken(request);
    	if (token.length() == 0)
    		return;

    	if (!isValid())
    		throw new Exception("SnpEff online annotation is not configured properly. You must set the snpEffConfigFile and snpEffDataRepository parameters");

		ProgressIndicator progress = new ProgressIndicator(token, new String[] { "Checking input" });
		ProgressIndicator.registerProgressIndicator(progress);
//		progress.setPercentageEnabled(false);

		if (!SnpEffAnnotationService.getAvailableGenomes(dataPath).contains(genomeName)) {
			progress.setError("Unknown genome, you must install it first");
			return;
		}

		MongoTemplate mongoTemplate = MongoTemplateManager.get(sModule);
		final GenotypingProject project = mongoTemplate.findOne(new Query(Criteria.where(GenotypingProject.FIELDNAME_NAME).is(sProject)), GenotypingProject.class);
		if (tokenManager.canUserWriteToProject(token, sModule, project.getId())) 
			try {
				SnpEffAnnotationService.annotateRun(configFile, dataPath, sModule, project.getId(), sRun, genomeName, progress);
				progress.markAsComplete();
			}
			catch (Exception e) {
				progress.setError("Error annotating dataset: " + e.getMessage());
				LOG.error("Error annotating dataset", e);
			}
		else {
			LOG.error("NOT AUTHENTICATED");
		}
    	return;
    }

	@ApiIgnore
	@Override
	@RequestMapping(value = BASE_URL + SNPEFF_GENOME_LIST, method = RequestMethod.GET, produces = "application/json")
	public @ResponseBody Map<String, Object> genomeAnnotationList(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HashMap<String, Object> result = new HashMap<>();
	
    	if (!isValid())
    		throw new Exception("SnpEff online annotation is not configured properly. You must set the snpEffConfigFile and snpEffDataRepository parameters");
	
		result.put("availableGenomes", SnpEffAnnotationService.getAvailableGenomes(dataPath));
		result.put("downloadableGenomes", SnpEffAnnotationService.getDownloadableGenomes(configFile, dataPath));
	
		return result;
	}

	@ApiIgnore
	@Override
	@RequestMapping(value = BASE_URL + SNPEFF_INSTALL_GENOME, method = RequestMethod.POST, produces = "application/json")
	public @ResponseBody Map<String, Object> installGenomeAnnotation(HttpServletRequest request, HttpServletResponse response,
			@RequestParam(value="genomeName", required=false) final String genomeName,
			@RequestParam(value="genomeURL", required=false) final URL genomeURL,
			@RequestParam(value="newGenomeID", required=false) String newGenomeID,
			@RequestParam(value="newGenomeName", required=false) String newGenomeName) throws Exception {
	
		String token = tokenManager.readToken(request);
		if (token.length() == 0)
			throw new Exception("Unable to read Authentication token");
	
    	if (!isValid())
    		throw new Exception("SnpEff online annotation is not configured properly. You must set the snpEffConfigFile and snpEffDataRepository parameters");
		
		if (!(request instanceof MultipartHttpServletRequest))
			throw new Exception("request must be a MultipartHttpServletRequest");
	
		ProgressIndicator progress = new ProgressIndicator(token, new String[] { "Checking input" });
		ProgressIndicator.registerProgressIndicator(progress);
	
		HashMap<String, Object> result = new HashMap<>();
		result.put("log", null);
		result.put("success", false);
	
		Map<String, MultipartFile> fileMap = ((MultipartHttpServletRequest) request).getFileMap();
	
		if (genomeName != null) {
			if (!SnpEffAnnotationService.getAvailableGenomes(dataPath).contains(genomeName)) {
				SnpEffAnnotationService.downloadGenome(configFile, dataPath, genomeName, progress);
				result.put("success", true);
			}
		} else if (genomeURL != null) {
			SnpEffAnnotationService.downloadGenome(configFile, dataPath, genomeURL, progress);
			result.put("success", true);
		} else if (fileMap != null && newGenomeID != null) {
			if (newGenomeName == null)
				newGenomeName = newGenomeID;
			File fastaFile = File.createTempFile("snpEffFasta-", "");
			File referenceFile = File.createTempFile("snpEffRef-", "");
			File cdsFile = File.createTempFile("snpEffCDS-", "");
			File proteinFile = File.createTempFile("snpEffProtein-", "");
			String referenceFormat = null;
			boolean fastaFound = false, cdsFound = false, proteinFound = false;
	
			for (MultipartFile file : fileMap.values()) {
				// Some browsers (or malicious users) might supply additional path components in surplus of the raw file name
				String fileName = Paths.get(file.getOriginalFilename()).getFileName().toString();
	
				boolean gzipped = false;
				int extensionPosition = fileName.lastIndexOf('.');
				String extension = fileName.substring(extensionPosition + 1).toLowerCase();
				String baseName = fileName.substring(0, extensionPosition);
	
				if (extension.equals("gz")) {
					gzipped = true;
					extensionPosition = baseName.lastIndexOf('.');
					extension = baseName.substring(extensionPosition + 1).toLowerCase();
					baseName = baseName.substring(0, extensionPosition);
				}
	
				if (extension.equals("fa") || extension.equals("fas") || extension.equals("fasta")) {
					if (baseName.toLowerCase().equals("cds")) {
						transferSnpEffImport(file, cdsFile, gzipped, progress);
						cdsFound = true;
					} else if (baseName.toLowerCase().equals("protein")) {
						transferSnpEffImport(file, proteinFile, gzipped, progress);
						proteinFound = true;
					} else {
						transferSnpEffImport(file, fastaFile, gzipped, progress);
						fastaFound = true;
					}
				} else if (extension.equals("gtf")) {
					transferSnpEffImport(file, referenceFile, gzipped, progress);
					referenceFormat = "gtf22";
				} else if (extension.equals("gff") || extension.equals("gff3")) {
					transferSnpEffImport(file, referenceFile, gzipped, progress);
					referenceFormat = "gff3";
				} else if (extension.equals("gff2")) {
					transferSnpEffImport(file, referenceFile, gzipped, progress);
					referenceFormat = "gff2";
				} else if (extension.equals("genbank") || extension.equals("gbk")) {
					transferSnpEffImport(file, referenceFile, gzipped, progress);
					referenceFormat = "genbank";
				} else if (extension.equals("refseq")) {
					transferSnpEffImport(file, referenceFile, gzipped, progress);
					referenceFormat = "refSeq";
				} else if (extension.equals("embl")) {
					transferSnpEffImport(file, referenceFile, gzipped, progress);
					referenceFormat = "embl";
				} else if (extension.equals("kg") || extension.equals("knowngenes")) {
					transferSnpEffImport(file, referenceFile, gzipped, progress);
					referenceFormat = "knowngenes";
				} else {
					progress.setError("Unsupported file type : " + fileName);
					return result;
				}
			}
	
			if (referenceFormat == null) {
				progress.setError("No reference file found");
				return result;
			} else if (!fastaFound) {
				progress.setError("No sequence file found");
				return result;
			}
	
			LOG.debug("FASTA found, reference format is " + referenceFormat);
	
			String log = SnpEffAnnotationService.importGenome(newGenomeID, newGenomeName, fastaFile, referenceFile, (cdsFound ? cdsFile : null), (proteinFound ? proteinFile : null), referenceFormat, configFile, dataPath, progress);
			result.put("log", log);
		} else {
			progress.setError("No genome specified");
			return result;
		}
		// TODO : Upload : https://pcingola.github.io/SnpEff/se_buildingdb/
	
		if (progress.getError() != null)
			return result;
	
		result.put("success", true);
		progress.markAsComplete();
		return result;
	}

	// FIXME : Is this compatible with BGZip-compressed files ?
	private void transferSnpEffImport(MultipartFile inputFile, File outputFile, boolean gzipped, ProgressIndicator progress) throws FileNotFoundException, IOException {
		String fileName = Paths.get(inputFile.getOriginalFilename()).getFileName().toString();
		if (gzipped) {
			progress.addStep("Decompressing " + fileName);
			progress.moveToNextStep();
	
	    	GZIPInputStream input = new GZIPInputStream(inputFile.getInputStream());
	    	FileOutputStream output = new FileOutputStream(outputFile);
	
	    	byte[] buffer = new byte[65536];
	    	int readLength;
	    	while ((readLength = input.read(buffer)) > 0)
	    		output.write(buffer, 0, readLength);
	
	    	input.close();
	    	output.close();
		} else {
			inputFile.transferTo(outputFile);
		}
	}

	@Override
	public String getUserInterfaceRootURL() throws MalformedURLException {
		return "annotate.jsp";
	}

	@Override
	public boolean isValid() {
		if (configFile == null)
			configFile = appConfig.get("snpEffConfigFile");
		if (dataPath == null)
			dataPath = appConfig.get("snpEffDataRepository");
    	return configFile != null && dataPath != null;
	}

	@Override
	public String getAnnotationMethod() {
		return "SnpEff";
	}
}