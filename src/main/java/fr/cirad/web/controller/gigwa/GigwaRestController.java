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
package fr.cirad.web.controller.gigwa;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.Serializable;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Modifier;
import java.net.HttpURLConnection;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLDecoder;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.Timer;
import java.util.TimerTask;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import javax.ejb.ObjectNotFoundException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.fileupload.disk.DiskFileItem;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.exception.ExceptionUtils;
import org.apache.log4j.Logger;
import org.bson.Document;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.node.ObjectNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AssignableTypeFilter;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.commons.CommonsMultipartFile;
import org.springframework.web.multipart.commons.CommonsMultipartResolver;
import org.springframework.web.servlet.ModelAndView;

import com.mongodb.BasicDBList;
import com.mongodb.client.DistinctIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.result.DeleteResult;

import fr.cirad.io.brapi.BrapiService;
import fr.cirad.manager.IModuleManager;
import fr.cirad.mgdb.exporting.AbstractExportWritingThread;
import fr.cirad.mgdb.exporting.tools.ExportManager;
import fr.cirad.mgdb.importing.BrapiImport;
import fr.cirad.mgdb.importing.FlapjackImport;
import fr.cirad.mgdb.importing.HapMapImport;
import fr.cirad.mgdb.importing.IndividualMetadataImport;
import fr.cirad.mgdb.importing.IntertekImport;
import fr.cirad.mgdb.importing.PlinkImport;
import fr.cirad.mgdb.importing.SequenceImport;
import fr.cirad.mgdb.importing.VcfImport;
import fr.cirad.mgdb.importing.base.AbstractGenotypeImport;
import fr.cirad.mgdb.model.mongo.maintypes.BookmarkedQuery;
import fr.cirad.mgdb.model.mongo.maintypes.GenotypingProject;
import fr.cirad.mgdb.model.mongo.maintypes.GenotypingSample;
import fr.cirad.mgdb.model.mongo.maintypes.Individual;
import fr.cirad.mgdb.model.mongo.maintypes.VariantData;
import fr.cirad.mgdb.model.mongo.maintypes.VariantRunData;
import fr.cirad.mgdb.model.mongo.subtypes.ReferencePosition;
import fr.cirad.mgdb.model.mongo.subtypes.SampleGenotype;
import fr.cirad.mgdb.model.mongodao.MgdbDao;
import fr.cirad.mgdb.service.GigwaGa4ghServiceImpl;
import fr.cirad.mgdb.service.IGigwaService;
import fr.cirad.mgdb.service.VisualizationService;
import fr.cirad.model.GigwaDensityRequest;
import fr.cirad.model.GigwaIgvRequest;
import fr.cirad.model.GigwaSearchVariantsExportRequest;
import fr.cirad.model.GigwaSearchVariantsRequest;
import fr.cirad.model.GigwaVcfFieldPlotRequest;
import fr.cirad.model.UserInfo;
import fr.cirad.security.ReloadableInMemoryDaoImpl;
import fr.cirad.security.UserWithMethod;
import fr.cirad.security.base.IRoleDefinition;
import fr.cirad.tools.AlphaNumericComparator;
import fr.cirad.tools.AppConfig;
import fr.cirad.tools.Helper;
import fr.cirad.tools.ProgressIndicator;
import fr.cirad.tools.SessionAttributeAwareThread;
import fr.cirad.tools.mgdb.GenotypingDataQueryBuilder;
import fr.cirad.tools.mongo.MongoTemplateManager;
import fr.cirad.tools.security.TokenManager;
import fr.cirad.tools.security.base.AbstractTokenManager;
import fr.cirad.utils.Constants;
import fr.cirad.web.controller.gigwa.base.ControllerInterface;
import fr.cirad.web.controller.gigwa.base.IGigwaViewController;
import fr.cirad.web.controller.security.UserPermissionController;
import htsjdk.samtools.util.BlockCompressedInputStream;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import io.swagger.annotations.Authorization;
import springfox.documentation.annotations.ApiIgnore;

/**
 * The Class GigwaRestController.
 */
@RestController
public class GigwaRestController extends ControllerInterface {

	@Qualifier("authenticationManager")
	@Autowired AuthenticationManager authenticationManager;

	@Autowired SecurityContextRepository repository;

	@Autowired private CommonsMultipartResolver uploadResolver;

	@Autowired private TokenManager tokenManager;

	@Autowired private AppConfig appConfig;
	
	@Autowired private GigwaGa4ghServiceImpl ga4ghService;
	
	@Autowired private VisualizationService vizService;

	@Autowired private ReloadableInMemoryDaoImpl userDao;
	
	@Autowired private IModuleManager moduleManager;

	/**
	 * The Constant LOG.
	 */
	private static final Logger LOG = Logger.getLogger(GigwaRestController.class);

	/**
	 * The view controllers.
	 */
	static private TreeMap<String, String> viewControllers = null;

	public static final String REST_PATH = "/rest";
	static public final String BASE_URL = "/gigwa";

	static public final String IMPORT_PAGE_URL = "/import.do";
	static final public String genotypeImportSubmissionURL = "/genotypeImport";
	static final public String metadataImportSubmissionURL = "/metadataImport";
//	static final public String germplasmWithBrapiMappingURL = "/germplasmWithBrapiMapping";
//	static final public String samplesWithBrapiMappingURL = "/samplesWithBrapiMapping";
	static final public String metadataValidationURL = "/metadataValidation";
	static public final String GET_SESSION_TOKEN = "/generateToken";
	static public final String VARIANT_TYPES_PATH = "/variantTypes";
	static public final String NUMBER_ALLELE_PATH = "/numberOfAllele";
	static public final String SEQUENCES_PATH = "/sequences";
	static public final String EFFECT_ANNOTATION_PATH = "/effectAnnotations";
	static public final String SEARCHABLE_ANNOTATION_FIELDS_URL = "/searchableAnnotationFields";
	static public final String PROGRESS_PATH = "/progress";
	static public final String SEQUENCE_FILTER_COUNT_PATH = "/sequencesFilterCount";
	static public final String CLEAR_SELECTED_SEQUENCE_LIST_PATH = "/clearSelectedSequenceList";
	static public final String ABORT_PROCESS_PATH = "/abortProcess";
	static public final String DROP_TEMP_COL_PATH = "/dropTempCol";
	static public final String CLEAR_TOKEN_PATH = "/clearToken";
	static public final String DENSITY_DATA_PATH = "/densityData";
	static public final String FST_DATA_PATH = "/fstData";
	static public final String TAJIMAD_DATA_PATH = "/tajimaDData";
	static public final String IGV_DATA_PATH = "/igvData";
	static public final String IGV_GENOME_CONFIG_PATH = "/igvGenomeConfig";
	static public final String VCF_FIELD_PLOT_DATA_PATH = "/vcfFieldPlotData";
	static public final String DISTINCT_SEQUENCE_SELECTED_PATH = "/distinctSelectedSequences";
	static public final String EXPORT_DATA_PATH = "/exportData";
	static public final String EXPORTED_DATA_PATH = "/exportedData";
	static public final String PROJECT_RUN_PATH = "/runs";
	static public final String PLOIDY_LEVEL_PATH = "/ploidyLevel";
	static public final String GENOTYPE_PATTERNS_PATH = "/genotypePatterns";
	static public final String HOSTS_PATH = "/hosts";
	static public final String ANNOTATION_HEADERS_PATH = "/annotationHeaders";
	static public final String EXPORT_FORMAT_PATH = "/exportFormats";
	static public final String DEFAULT_GENOME_BROWSER_URL = "/defaultGenomeBrowser";
	static public final String IGV_GENOME_LIST_URL = "/igvGenomeList";
	static public final String ONLINE_OUTPUT_TOOLS_URL = "/onlineOutputTools";
	static public final String MAX_UPLOAD_SIZE_PATH = "/maxUploadSize";
	static public final String SAVE_QUERY_URL = "/saveQuery";
	static public final String LIST_SAVED_QUERIES_URL = "/listSavedQueries";
	static public final String LOAD_QUERY_URL = "/loadQuery";
	static public final String DELETE_QUERY_URL = "/deleteQuery";
    static public final String VARIANTS_BY_IDS = "/variants/byIds";
    static public final String VARIANTS_LOOKUP = "/variants/lookup";
		
	/**
	 * get a unique processID
	 *
	 * @param request
	 * @param userInfo
	 * @return processID in a JSON object.
	 * @throws UnsupportedEncodingException
	 * @throws IllegalArgumentException
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = GET_SESSION_TOKEN, notes = "Generate a token. The obtained token then needs to be passed along with every request.")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success") })
	@RequestMapping(value = BASE_URL + GET_SESSION_TOKEN, method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
	public Map<String, String> generateToken(HttpServletRequest request, HttpServletResponse response, @RequestBody(required = false) UserInfo userInfo) throws IllegalArgumentException, UnsupportedEncodingException {
        if (userInfo != null && (userInfo.getUsername() == null || userInfo.getUsername().isEmpty() ||  userInfo.getPassword() == null || userInfo.getPassword().isEmpty())) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return null;
        }

        int maxInactiveIntervalInSeconds = request.getSession().getMaxInactiveInterval();
        if (maxInactiveIntervalInSeconds > 0)
            tokenManager.setSessionTimeoutInSeconds(maxInactiveIntervalInSeconds);

        try
        {
            Map<String, String> result = new HashMap<>();
            Authentication authentication;
            if (userInfo == null) {
                authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN)) && "nimda".equals(authentication.getCredentials()))
                    result.put(Constants.MESSAGE, "You are using the default administrator password. Please change it by selecting Manage data / Administer existing data and user permissions from the main menu.");
                LOG.info("Returning token for current session user " + authentication.getName());
            }
            else {
                authentication = authenticationManager.authenticate((new UsernamePasswordAuthenticationToken(userInfo.getUsername(), userInfo.getPassword())));
                LOG.info("Successful authentication for user " + userInfo.getUsername());
            }
            response.setStatus(HttpServletResponse.SC_CREATED);
            result.put(Constants.TOKEN, tokenManager.generateToken(authentication));
            return result;
        
        }
        catch (BadCredentialsException ignored)
        {
            LOG.info("Authentication failed for user " + userInfo.getUsername());
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return null;
        }
        finally {
            if (userInfo != null)   // we don't want to do the cleanup too often
            	tokenManager.cleanupTokenMap();
        }
	}

	/**
	 * get available variant type for a specific project and module
	 *
	 * @param request
	 * @param variantSetId
	 * @return Map<String, List<String>> containing
	 *         htsjdk.variant.variantcontext.Type
	 * @throws IOException
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getVariantTypes", notes = "get availables variant types in a referenceSet and variantSet. ")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + VARIANT_TYPES_PATH + "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public List<String> getVariantTypes(HttpServletRequest request, HttpServletResponse resp, @PathVariable String variantSetId) throws IOException {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				return ga4ghService.listVariantTypesSorted(info[0], Integer.parseInt(info[1]));
			} else {
				build403Response(resp);
				return null;
			}
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
	}

	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getRunList", notes = "get availables runs in a project. ")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + PROJECT_RUN_PATH + "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Map<String, List<String>> getRunList(HttpServletRequest request, HttpServletResponse resp, @PathVariable String variantSetId) throws IOException {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		Map<String, List<String>> response = new HashMap<>();
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				response.put(Constants.RUNS, ga4ghService.getRunList(info[0], Integer.parseInt(info[1])));
			} else {
				build403Response(resp);
			}
			return response;
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
	}

	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getHostList", notes = "get availables hosts.")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 401, message = "Unauthorized resource") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + HOSTS_PATH, method = RequestMethod.GET, produces = "application/json")
	public Map<String, List<String>> getHostList(HttpServletRequest request, HttpServletResponse resp) throws IOException {
		Authentication auth = tokenManager.getAuthenticationFromToken(tokenManager.readToken(request));
		if (auth != null && auth.isAuthenticated()) {
			String tempDbHost = appConfig.get("tempDbHost");
			Map<String, List<String>> response = new HashMap<>();
			List<String> hosts = new ArrayList<>();
			for (String sHost : MongoTemplateManager.getHostNames())
				if (auth.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN)) || tempDbHost == null || tempDbHost.equals(sHost))
					hosts.add(sHost);
			response.put(Constants.HOSTS, hosts);
			return response;
		} else {
			build403Response(resp);
			return null;
		}
	}

	/**
	 *
	 * @param request
	 * @param variantSetId
	 * @return Map<String, List<Integer>> containing distinct number of alleles
	 *         inb JSON format
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getNumberOfAlleles", notes = "get availables alleles count in a referenceSet and variantSet. ")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + NUMBER_ALLELE_PATH + "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Map<String, List<Integer>> getNumberOfAlleles(HttpServletRequest request, HttpServletResponse resp, @PathVariable String variantSetId) throws IOException {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		Map<String, List<Integer>> response = new HashMap<>();
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				List<Integer> result = new ArrayList<Integer>(ga4ghService.getDistinctAlleleCounts(info[0], Integer.parseInt(info[1])));
				Collections.sort(result);
				response.put(Constants.NUMBER_OF_ALLELE, result);
			} else {
				build403Response(resp);
			}
			return response;
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
	}

	/**
	 * get sequence list for the project
	 *
	 * @param request
	 * @param variantSetId
	 * @return Map<String, List<String>> containing the sequences in JSON format
	 */
	@Deprecated
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getSequences", notes = "get availables sequences in a referenceSet and variantSet. ")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + SEQUENCES_PATH + "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Map<String, List<String>> getSequences(HttpServletRequest request, HttpServletResponse resp, @PathVariable String variantSetId) throws IOException {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		Map<String, List<String>> response = new HashMap<>();
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				response.put(Constants.SEQUENCES, ga4ghService.listSequences(request, info[0], Integer.parseInt(info[1])));
			} else {
				build403Response(resp);
			}
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
		return response;
	}

	/**
	 * get the Annoations effect for the project
	 *
	 * @param request
	 * @param variantSetId
	 * @return Map<String, TreeSet<String>> containing the annotation effect in
	 *         JSON format
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getEffectAnnotations", notes = "get availables effect annotations in a referenceSet and variantSet. ")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + EFFECT_ANNOTATION_PATH + "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Map<String, TreeSet<String>> getEffectAnnotations(HttpServletRequest request, HttpServletResponse resp, @PathVariable String variantSetId) throws IOException {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		Map<String, TreeSet<String>> response = new HashMap<>();
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				response.put(Constants.EFFECT_ANNOTATIONS,
						ga4ghService.getProjectEffectAnnotations(info[0], Integer.parseInt(info[1])));
			} else {
				build403Response(resp);
			}
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
		return response;
	}

	/**
	 * list searchable annotation fields
	 *
	 * @param request
	 * @param variantSetId
	 * @return List<String> field IDs
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "listSearchableAnnotationFields", notes = "Lists searchable annotation fields in a referenceSet's variantSet")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + SEARCHABLE_ANNOTATION_FIELDS_URL
			+ "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Collection<String> listSearchableAnnotationFields(HttpServletRequest request, HttpServletResponse resp,
			@PathVariable String variantSetId) throws IOException {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				return ga4ghService.searchableAnnotationFields(info[0], Integer.parseInt(info[1]));
			} else {
				build403Response(resp);
				return null;
			}
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
	}

	/**
	 * get the project ploidy level
	 *
	 * @param request
	 * @param variantSetId
	 * @return Map<String, Integer> containing ploidy level in JSON format
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getPloidyLevel", notes = "return the ploidy level in a referenceSet and variantSet. ")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"), @ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + PLOIDY_LEVEL_PATH + "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Integer getPloidyLevel(HttpServletRequest request, HttpServletResponse resp, @PathVariable String variantSetId) throws IOException {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				return ga4ghService.getProjectPloidyLevel(info[0], Integer.parseInt(info[1]));
			} else {
				build403Response(resp);
				return null;
			}
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
	}

	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getGenotypePatternsAndDescriptions", notes = "get the list of genotype patterns")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"), })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + GENOTYPE_PATTERNS_PATH, method = RequestMethod.GET, produces = "application/json")
	public HashMap<String, String> getGenotypePatternsAndDescriptions() {
		return GenotypingDataQueryBuilder.getGenotypePatternToDescriptionMap();
	}

	/**
	 * get the progress indicator
	 *
	 * @param request
	 * @return Map<String, ProgressIndicator>
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = PROGRESS_PATH, notes = "Get the progress status of a process from its token. If no current process is associated with this token, returns null")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"), 
							@ApiResponse(code = 204, message = "No progress indicator") })
	@RequestMapping(value = BASE_URL + PROGRESS_PATH, method = RequestMethod.GET, produces = "application/json")
	public ProgressIndicator getProcessProgress(HttpServletRequest request, HttpServletResponse response, @RequestParam(value = "progressToken", required = false) final String progressToken) {
		String processId = progressToken != null ? progressToken : tokenManager.readToken(request);
		ProgressIndicator progress = ga4ghService.getProgressIndicator(processId);
		// LOG.debug("returning " + (progress == null ? null :
		// progress.hashCode()));
		if (progress == null)
			response.setStatus(HttpServletResponse.SC_NO_CONTENT);
		return progress;
	}

	/**
	 * get sequence filter count
	 *
	 * @param request
	 * @param referenceSetId
	 * @return ap<String, Integer> containing filter count in JSON format
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = SEQUENCE_FILTER_COUNT_PATH, notes = "get sequence filter count in a referenceSet and variantSet. ")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 400, message = "wrong parameters"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + SEQUENCE_FILTER_COUNT_PATH + "/{referenceSetId}", method = RequestMethod.GET, produces = "application/json")
	public Map<String, Integer> getSequencesFilterCount(HttpServletRequest request, HttpServletResponse resp, @PathVariable String referenceSetId) throws IOException {
		String token = tokenManager.readToken(request);
		Map<String, Integer> response = new HashMap<>();
		try {
			if (tokenManager.canUserReadDB(token, referenceSetId)) {
				response.put(Constants.SEQUENCE_FILTER_COUNT, ga4ghService.getSequenceFilterCount(request, referenceSetId));
			} else
				build403Response(resp);
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
		return response;
	}

	/**
	 * clear the result list. No need to display it in swagger as it is used
	 * only from gigwa interface
	 *
	 * @param request
	 * @param referenceSetId
	 * @return Map<String, Boolean> true id could clear selection
	 */
	@ApiIgnore
	@RequestMapping(value = BASE_URL + CLEAR_SELECTED_SEQUENCE_LIST_PATH + "/{referenceSetId}", method = RequestMethod.DELETE, produces = "application/json")
	public Map<String, Boolean> clearSelectedSequenceList(HttpServletRequest request, HttpServletResponse resp, @PathVariable String referenceSetId) throws IOException {
		Map<String, Boolean> response = new HashMap<>();
		String token = tokenManager.readToken(request);
		boolean success = false;
		try {
			if (tokenManager.canUserReadDB(token, referenceSetId)) {
				ga4ghService.clearSequenceFilterFile(request, referenceSetId);
				success = true;
			} else
				build403Response(resp);
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
		response.put(Constants.SUCCESS, success);
		return response;
	}

	/**
	 * abort process with a specific Id
	 *
	 * @param request
	 * @return Map<String, Boolean> true if aborted successfully
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = ABORT_PROCESS_PATH, notes = "abort a process from its ID. If there is a process with this id running, and if the process aborted successfully, will return true. ")
	@ApiResponses(value = { @ApiResponse(code = 204, message = "Success") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + ABORT_PROCESS_PATH, method = RequestMethod.DELETE, produces = "application/json")
	public Map<String, Boolean> abortProcess(HttpServletRequest request, @RequestParam(value = "progressToken", required = false) final String progressToken) {
		String processId = progressToken != null ? progressToken : tokenManager.readToken(request);
		Map<String, Boolean> response = new HashMap<>();
		response.put(Constants.PROCESS_ABORTED, ga4ghService.abortProcess(processId));
		return response;
	}

	/**
	 * clear token
	 *
	 * @param request
	 */
	@ApiIgnore
	@RequestMapping(value = BASE_URL + CLEAR_TOKEN_PATH, method = RequestMethod.DELETE)
	public void clearToken(HttpServletRequest request, HttpServletResponse resp) {
		String token = tokenManager.readToken(request);
		if (token != null && !tokenManager.removeToken(token))
			LOG.debug("Could not find token to delete: " + token);
		else
			LOG.debug("Deleted token: " + token);
		tokenManager.removeToken(token);
		resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
	}

	/**
	 * drop temporary collection
	 *
	 * @param request
	 * @param referenceSetId
	 * @return Map<String, Boolean> true if could drop temporary collection
	 */
	@ApiIgnore
	@RequestMapping(value = BASE_URL + DROP_TEMP_COL_PATH + "/{referenceSetId}", method = RequestMethod.DELETE, produces = "application/json")
	public Map<String, Boolean> dropTempCollection(HttpServletRequest request, HttpServletResponse resp, @PathVariable String referenceSetId) throws IOException {
		Map<String, Boolean> response = new HashMap<>();
		boolean success = false;
		String token = tokenManager.readToken(request);
		try {
			if (tokenManager.canUserReadDB(token, referenceSetId)) {
				ga4ghService.onInterfaceUnload(referenceSetId, token);
				if (Boolean.parseBoolean(request.getParameter("clearToken")))
				    clearToken(request, resp);
				success = true;
			} else
				build403Response(resp);
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
		response.put(Constants.SUCCESS, success);
		return response;
	}

	/**
	 * get density data
	 *
	 * @param request
	 * @param resp
	 * @param gdr
	 * @param variantSetId
	 * @return Map<Long, Long> containing density data in JSON
	 *         format
	 * @throws Exception
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = DENSITY_DATA_PATH, notes = "get density data from selected variants")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 400, message = "wrong parameters"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + DENSITY_DATA_PATH + "/{variantSetId}", method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
	public Map<Long, Long> getDensityData(HttpServletRequest request, HttpServletResponse resp,
			@RequestBody GigwaDensityRequest gdr, @PathVariable String variantSetId) throws Exception {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				gdr.setRequest(request);
				return vizService.selectionDensity(gdr);
			} else {
				build403Response(resp);
				return null;
			}
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
	}
	
	/**
	 * get Fst data
	 *
	 * @param request
	 * @param resp
	 * @param gdr
	 * @param variantSetId
	 * @return Map<Long, Long> containing density data in JSON
	 *         format
	 * @throws Exception
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = FST_DATA_PATH, notes = "get Fst data from selected variants")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 400, message = "wrong parameters"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + FST_DATA_PATH + "/{variantSetId}", method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
	public Map<Long, Double> getFstData(HttpServletRequest request, HttpServletResponse resp,
			@RequestBody GigwaDensityRequest gdr, @PathVariable String variantSetId) throws Exception {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				gdr.setRequest(request);
				return vizService.selectionFst(gdr);
			} else {
				build403Response(resp);
				return null;
			}
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
	}
	
	/**
	 * get Tajima's D data
	 *
	 * @param request
	 * @param resp
	 * @param gdr
	 * @param variantSetId
	 * @return Map<Long, Long> containing density data in JSON
	 *         format
	 * @throws Exception
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = TAJIMAD_DATA_PATH, notes = "get Tajima's D data from selected variants")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 400, message = "wrong parameters"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + TAJIMAD_DATA_PATH + "/{variantSetId}", method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
	public List<Map<Long, Double>> getTajimaDData(HttpServletRequest request, HttpServletResponse resp,
			@RequestBody GigwaDensityRequest gdr, @PathVariable String variantSetId) throws Exception {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				gdr.setRequest(request);
				return vizService.selectionTajimaD(gdr);
			} else {
				build403Response(resp);
				return null;
			}
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
	}

	/**
	 * get IGV data
	 *
	 * @param request
	 * @param resp
	 * @param gir
	 * @throws Exception
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = IGV_DATA_PATH, notes = "get IGV data from selected variants")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 400, message = "wrong parameters"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + IGV_DATA_PATH, method = RequestMethod.POST, consumes = "application/json")
    public void getSelectionIgvData(HttpServletRequest request, HttpServletResponse resp, @RequestBody GigwaIgvRequest gir) throws Exception {
		long before = System.currentTimeMillis();

		String token = tokenManager.readToken(request);
        String info[] = GigwaSearchVariantsRequest.getInfoFromId(gir.getVariantSetId(), 2);
        if (!tokenManager.canUserReadDB(token, info[0])) {
			build404Response(resp);
			return;
        }
        
        if (gir.getDisplayedSequence() == null) {
        	build400Response(resp, "Missing parameter: displayedSequence");
        	return;
        }
        
        String processId = "igvViz_" + token;
		final ProgressIndicator progress = new ProgressIndicator(processId, new String[] {"Preparing data for visualization"});
		ProgressIndicator.registerProgressIndicator(progress);
        
		Collection<GenotypingSample> samples = MgdbDao.getSamplesForProject(info[0], Integer.parseInt(info[1]), gir.getCallSetIds().stream().map(csi -> csi.substring(1 + csi.lastIndexOf(GigwaGa4ghServiceImpl.ID_SEPARATOR))).collect(Collectors.toList()));
		
		Map<String, Integer> individualPositions = new LinkedHashMap<>();
		for (String ind : samples.stream().map(gs -> gs.getIndividual()).distinct().sorted(new AlphaNumericComparator<String>()).collect(Collectors.toList()))
			individualPositions.put(ind, individualPositions.size());
		
		MongoTemplate mongoTemplate = MongoTemplateManager.get(info[0]);
        MongoCollection<Document> tempVarColl = ga4ghService.getTemporaryVariantCollection(info[0], token, false);
        boolean fWorkingOnTempColl = tempVarColl.countDocuments() > 0;
        Collection<BasicDBList> variantQueryDBListColl = ga4ghService.buildVariantDataQuery(gir, ga4ghService.getSequenceIDsBeingFilteredOn(request.getSession(), info[0]), true);
        BasicDBList variantQueryDBList = variantQueryDBListColl.iterator().next();

		MongoCollection<Document> collWithPojoCodec = mongoTemplate.getDb().withCodecRegistry(ExportManager.pojoCodecRegistry).getCollection(fWorkingOnTempColl ? tempVarColl.getNamespace().getCollectionName() : mongoTemplate.getCollectionName(VariantRunData.class));

		resp.setContentType("text/tsv;charset=UTF-8");
		String header = "variant\talleles\tchrom\tpos";
        resp.getWriter().append(header);
        for (String individual : individualPositions.keySet())
            resp.getWriter().write(("\t" + individual));
        resp.getWriter().write("\n");

		final Map<Integer, String> sampleIdToIndividualMap = new HashMap<>();
		for (GenotypingSample gs : samples)
			sampleIdToIndividualMap.put(gs.getId(), gs.getIndividual());

		AbstractExportWritingThread writingThread = new AbstractExportWritingThread() {
			public void run() {				
                HashMap<Object, Integer> genotypeCounts = new HashMap<Object, Integer>();	// will help us to keep track of missing genotypes
                markerRunsToWrite.forEach(runsToWrite -> {
                    if (progress.isAborted() || progress.getError() != null || runsToWrite == null || runsToWrite.isEmpty())
                        return;

					VariantRunData vrd = runsToWrite.iterator().next();
					String idOfVarToWrite = vrd.getVariantId();
					StringBuffer sb = new StringBuffer();
					try
					{
		                ReferencePosition rp = vrd.getReferencePosition();
		                sb.append(idOfVarToWrite + "\t" + StringUtils.join(vrd.getKnownAlleles(), "/") + "\t" + (rp == null ? 0 : rp.getSequence()) + "\t" + (rp == null ? 0 : rp.getStartSite()));
	
		                LinkedHashSet<String>[] individualGenotypes = new LinkedHashSet[individualPositions.size()];

		                runsToWrite.forEach( run -> {
	                    	for (Integer sampleId : run.getSampleGenotypes().keySet()) {
                                String individualId = sampleIdToIndividualMap.get(sampleId);
                                Integer individualIndex = individualPositions.get(individualId);
                                if (individualIndex == null)
                                    continue;   // unwanted sample
                                
								SampleGenotype sampleGenotype = run.getSampleGenotypes().get(sampleId);
	                            String gtCode = sampleGenotype.getCode();
	                            if (gtCode == null)
                                    continue;   // skip genotype

	                            if (!gir.getAnnotationFieldThresholds().isEmpty() || !gir.getAnnotationFieldThresholds2().isEmpty()) {
    	                            List<String> indList1 = gir.getCallSetIds() == null ? new ArrayList<>() : gir.getCallSetIds().stream().map(csi -> csi.substring(1 + csi.lastIndexOf(GigwaGa4ghServiceImpl.ID_SEPARATOR))).collect(Collectors.toList());
    	                            List<String> indList2 = gir.getCallSetIds2() == null ? new ArrayList<>() : gir.getCallSetIds2().stream().map(csi -> csi.substring(1 + csi.lastIndexOf(GigwaGa4ghServiceImpl.ID_SEPARATOR))).collect(Collectors.toList());
    								if (!VariantData.gtPassesVcfAnnotationFilters(individualId, sampleGenotype, indList1, gir.getAnnotationFieldThresholds(), indList2, gir.getAnnotationFieldThresholds2()))
    									continue;	// skip genotype
	                            }

								if (individualGenotypes[individualIndex] == null)
									individualGenotypes[individualIndex] = new LinkedHashSet<String>();
								individualGenotypes[individualIndex].add(gtCode);
	                        }
	                    });

		                int writtenGenotypeCount = 0;
		                
		                String missingGenotype = "";
						for (String individual : individualPositions.keySet() /* we use this list because it has the proper ordering */) {
		                    int individualIndex = individualPositions.get(individual);
		                    while (writtenGenotypeCount < individualIndex) {
		                        sb.append(missingGenotype);
		                        writtenGenotypeCount++;
		                    }

		                    genotypeCounts.clear();
		                    int highestGenotypeCount = 0;
		                    String mostFrequentGenotype = null;
		                    if (individualGenotypes[individualIndex] != null) {
		                        for (String genotype : individualGenotypes[individualIndex]) {
		                            if (genotype == null)
		                                continue;	/* skip missing genotypes */
	
		                            int gtCount = 1 + Helper.getCountForKey(genotypeCounts, genotype);
		                            if (gtCount > highestGenotypeCount) {
		                                highestGenotypeCount = gtCount;
		                                mostFrequentGenotype = genotype;
		                            }
		                            genotypeCounts.put(genotype, gtCount);
		                        }
		                    }

		                    sb.append("\t" + (mostFrequentGenotype == null ? missingGenotype : mostFrequentGenotype));
		                    writtenGenotypeCount++;
	
		                    if (genotypeCounts.size() > 1) {
		                        List<Integer> reverseSortedGtCounts = genotypeCounts.values().stream().sorted(Comparator.reverseOrder()).collect(Collectors.toList());
		                        if (reverseSortedGtCounts.get(0) == reverseSortedGtCounts.get(1))
		                            mostFrequentGenotype = null;
		                        LOG.info("Dissimilar genotypes found for variant " + idOfVarToWrite + ", individual " + individual + ". " + (mostFrequentGenotype == null ? "Exporting as missing data" : "Exporting most frequent: " + mostFrequentGenotype) + "\n");
                            }
		                }
	
		                while (writtenGenotypeCount < individualPositions.size()) {
		                    sb.append(missingGenotype);
		                    writtenGenotypeCount++;
		                }
		                sb.append("\n");
			            resp.getWriter().write(sb.toString());
	                }
					catch (Exception e)
					{
						if (progress.getError() == null)	// only log this once
							LOG.error("Unable to export " + idOfVarToWrite, e);
						progress.setError("Unable to export " + idOfVarToWrite + ": " + e.getMessage());
					}
				});
			}
		};

		ExportManager exportManager = new ExportManager(mongoTemplate, collWithPojoCodec, VariantRunData.class, !variantQueryDBList.isEmpty() ? new Document("$and", variantQueryDBList) : new Document(), samples, true, 100, writingThread, null, null, progress);
		exportManager.readAndWrite();
		progress.markAsComplete();
		
		LOG.debug("getSelectionIgvData processed range " + gir.getDisplayedSequence() + ":" + gir.getDisplayedRangeMin() + "-" + gir.getDisplayedRangeMax() + " for " + individualPositions.size() + " individuals in " + (System.currentTimeMillis() - before) / 1000f + "s");
	}

	/**
	 * Get the genome configs for the IGV.js browser
	 */
	@ApiIgnore
	@RequestMapping(value = BASE_URL + IGV_GENOME_CONFIG_PATH, method = RequestMethod.GET, produces = "application/json")
	public List<HashMap<String, String>> getIGVGenomeConfig() {
		List<HashMap<String, String>> configs = new ArrayList<>();
		for (int i=1; ; i++) {
			String configInfo = appConfig.get("igvGenomeConfig_" + i);
			if (configInfo == null)
				break;
			
			String[] splitConfigInfo = configInfo.split(";");
			if (splitConfigInfo.length >= 2 && splitConfigInfo[0].trim().length() > 0 && splitConfigInfo[1].trim().length() > 0) {
				HashMap<String, String> config = new HashMap<>();
				config.put("name", splitConfigInfo[0]);
				config.put("url", splitConfigInfo[1]);
				configs.add(config);
			}
		}
		return configs;
	}

	/**
	 * get VCF field plot data
	 *
	 * @param request
	 * @param gdr
	 * @param variantSetId
	 * @return Map<String, Map<Long, Long>> containing plot data in JSON format
	 * @throws Exception
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = VCF_FIELD_PLOT_DATA_PATH, notes = "get plot data from selected variants, using numeric values for a vcf info field")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
			@ApiResponse(code = 400, message = "wrong parameters"),
			@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + VCF_FIELD_PLOT_DATA_PATH + "/{variantSetId}", method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
	public Map<Long, Integer> geVcfFieldPlotData(HttpServletRequest request, HttpServletResponse resp, @RequestBody GigwaVcfFieldPlotRequest gvfpr, @PathVariable String variantSetId) throws Exception {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				gvfpr.setRequest(request);
				return vizService.selectionVcfFieldPlotData(gvfpr);
			} else {
				build403Response(resp);
				return null;
			}
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
	}

	/**
	 * get distinct selected sequences
	 *
	 * @param request
	 * @param variantSetId
	 * @return Map<String, Collection<String>> @throws Exception
	 */
	@ApiIgnore
	@RequestMapping(value = BASE_URL + DISTINCT_SEQUENCE_SELECTED_PATH + "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Collection<String> getDistinctSequencesSelected(HttpServletRequest request, HttpServletResponse resp,
			@PathVariable String variantSetId) throws IOException {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				return ga4ghService.distinctSequencesInSelection(request, info[0], Integer.parseInt(info[1]), token);
			} else {
				build403Response(resp);
				return null;
			}
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
	}

	/**
	 * Get recent history of files exported by the specified user
	 *
	 * @param request
	 * @param username
	 * @return Map<Long, String> containing the list of datasets recently exported by this user, along with corresponding timestamps
	 * @throws IOException
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = EXPORTED_DATA_PATH + "/{username}", notes = "Get recent history of files exported by the specified user")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
	@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + EXPORTED_DATA_PATH + "/{username}", produces = "application/json")
	public Map<Long, String> getExportedData(HttpServletRequest request, HttpServletResponse resp, @PathVariable String username) throws IOException {
		String token = tokenManager.readToken(request);
		Authentication authentication = token != null && !token.isEmpty() ? tokenManager.getAuthenticationFromToken(token) : SecurityContextHolder.getContext().getAuthentication();
		boolean fAllowed = authentication != null && (authentication.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN)) || (!"anonymousUser".equals(authentication.getName()) && username.equals(authentication.getName())));
		Map<Long, String> result = null;
		if (fAllowed) {
			result = new TreeMap<>();
            String relativeOutputFolder = GigwaGa4ghServiceImpl.FRONTEND_URL + File.separator + GigwaGa4ghServiceImpl.TMP_OUTPUT_FOLDER + File.separator + username;
            File outputLocation = new File(request.getSession().getServletContext().getRealPath(File.separator + relativeOutputFolder));
            if (outputLocation.exists() && outputLocation.isDirectory())
	            for (File anExportFolder : outputLocation.listFiles())
	            {
	            	File[] exportFolderContents = anExportFolder.listFiles();
	            	for (File anExportFile : exportFolderContents)
	            		result.put(anExportFile.lastModified(), request.getContextPath() + "/" + relativeOutputFolder.replace(File.separator, "/") + File.separator + anExportFolder.getName() + File.separator + anExportFile.getName());
	            }
		}
		else
			build403Response(resp);

		return result;
	}

	/**
	 * get vcf header description for each field
	 *
	 * @param request
	 * @param variantSetId
	 * @return Map<String, Map<String, String>> containing the list of annotation headers in a referenceSet and variantSet
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = ANNOTATION_HEADERS_PATH + "/{variantSetId}", notes = "get annotation headers in a referenceSet and variantSet.")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success"),
	@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + ANNOTATION_HEADERS_PATH + "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Map<String, Map<String, String>> getHeaderDescription(HttpServletRequest request, HttpServletResponse resp, @PathVariable String variantSetId) throws IOException {
		String[] info = variantSetId.split(IGigwaService.ID_SEPARATOR);
		String token = tokenManager.readToken(request);
		Map<String, Map<String, String>> response = new HashMap<>();
		try {
			if (tokenManager.canUserReadDB(token, info[0])) {
				response.put(Constants.ANN_HEADERS, ga4ghService.getAnnotationHeaders(info[0], Integer.parseInt(info[1])));
			} else
				build403Response(resp);
			return response;
		} catch (ObjectNotFoundException e) {
			build404Response(resp);
			return null;
		}
	}

	/**
	 *
	 * @param request
	 * @param variantSetId
	 * @return
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getExportFormat", notes = "get available exports formats and descriptions")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + EXPORT_FORMAT_PATH, method = RequestMethod.GET, produces = "application/json")
	public TreeMap<String, HashMap<String, String>> getExportFormats(HttpServletRequest request, HttpServletResponse resp) throws IOException {
		return ga4ghService.getExportFormats();
	}

	/**
	 * export results in a specific format as a .zip file
	 *
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = EXPORT_DATA_PATH, notes = "export selected variant data. ")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success", response = HashMap.class),
	@ApiResponse(code = 400, message = "wrong parameters"),
	@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
	@ApiIgnore
	@RequestMapping(value = BASE_URL + EXPORT_DATA_PATH, method = RequestMethod.POST, consumes =  "application/json")
    public void exportData(HttpServletRequest request, HttpServletResponse resp, @RequestBody GigwaSearchVariantsExportRequest gsver) throws IOException, Exception {
        String token = tokenManager.readToken(request);
        String id = gsver.getVariantSetId();
        if (id == null) {
            build400Response(resp, "Parameter variantSetId is required");
        }
        if (gsver.getCallSetIds() == null) {
            build400Response(resp, "Parameter callSetIds is required");
        }
        try
        {
            if (tokenManager.canUserReadDB(token, id.split(GigwaGa4ghServiceImpl.ID_SEPARATOR)[0])) {
                gsver.setRequest(request);		
                Authentication authentication = tokenManager.getAuthenticationFromToken(token);
                gsver.setApplyMatrixSizeLimit(!"BED".equals(gsver.getExportFormat()) && (authentication == null || !authentication.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN))));
                ga4ghService.exportVariants(gsver, token, resp);
            } else {
                build403Response(resp);
            }
        }
        catch (ObjectNotFoundException e)
        {
            build404Response(resp);
        }
    }


	/**
	 * Gets the view controllers.
	 *
	 * @return the view controllers
	 * @throws ClassNotFoundException
	 *             the class not found exception
	 * @throws InstantiationException
	 *             the instantiation exception
	 * @throws IllegalAccessException
	 *             the illegal access exception
	 * @throws IllegalArgumentException
	 *             the illegal argument exception
	 * @throws InvocationTargetException
	 *             the invocation target exception
	 * @throws NoSuchMethodException
	 *             the no such method exception
	 * @throws SecurityException
	 *             the security exception
	 */
	public static TreeMap<String, String> getViewControllers()
			throws ClassNotFoundException, InstantiationException, IllegalAccessException, IllegalArgumentException,
			InvocationTargetException, NoSuchMethodException, SecurityException {
		if (viewControllers == null) {
			viewControllers = new TreeMap<String, String>();
			ClassPathScanningCandidateComponentProvider provider = new ClassPathScanningCandidateComponentProvider(false);
			provider.addIncludeFilter(new AssignableTypeFilter(IGigwaViewController.class));
			try {
				for (BeanDefinition component : provider.findCandidateComponents("fr.cirad")) {
					Class<?> cls = Class.forName(component.getBeanClassName());
					if (!Modifier.isAbstract(cls.getModifiers())) {
						IGigwaViewController viewController = (IGigwaViewController) cls.getConstructor().newInstance();
						viewControllers.put(viewController.getViewDescription(), viewController.getViewURL());
					}
				}
			} catch (Exception e) {
				LOG.warn("Error scanning view controllers", e);
			}
		}
		return viewControllers;
	}
	
	@ApiIgnore
	@RequestMapping(value = IMPORT_PAGE_URL)
	public ModelAndView setupImportPage()
	{
		ModelAndView mav = new ModelAndView();
//		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//		Map<String, Map<String, Collection<Comparable>>> managedEntitiesByModuleAndType = userDao.getManagedEntitiesByModuleAndType(authentication.getAuthorities());
//		if (userDao.getWritableEntityTypesByModule(authentication.getAuthorities()).size() == 0 && managedEntitiesByModuleAndType.size() == 0 && !authentication.getAuthorities().contains(new GrantedAuthorityImpl(IRoleDefinition.ROLE_ADMIN)))
//			mav.addObject("limitToTempData", true);
		return mav;
	}

	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = metadataValidationURL, notes = "Import metadata for individuals.")
    @RequestMapping(value = BASE_URL + metadataValidationURL, method = RequestMethod.POST)
    public @ResponseBody Collection<String> checkMetaDataAndReturnBrapiEndpoints(HttpServletRequest request, HttpServletResponse response,
    		@RequestParam("moduleExistingMD") final String sModule,
            @RequestParam(value = "metadataFile1", required = false) final String dataUri1,
            @RequestParam(value = "metadataFile2", required = false) final String dataUri2,
            @RequestParam(value = "file[0]", required = false) MultipartFile uploadedFile1,
            @RequestParam(value = "file[1]", required = false) MultipartFile uploadedFile2,
            @RequestParam(value = "metadataType", required = false) final String metadataType) throws Exception {
        final String authToken = tokenManager.readToken(request);
 		Authentication auth = tokenManager.getAuthenticationFromToken(authToken);
		if (auth == null) {
		    build401Response(response);
            return null;
		}
		
		Map<Object, String> endpointByIndividualOrSample = null;
		if (MongoTemplateManager.get(sModule) != null) { // Start with what we've currently got in the database
			endpointByIndividualOrSample = "sample".equals(metadataType) ? 
					MgdbDao.getInstance().loadSamplesWithAllMetadata(sModule, AbstractTokenManager.getUserNameFromAuthentication(tokenManager.getAuthenticationFromToken(tokenManager.readToken(request))), null, null)
			    		.entrySet().stream()
			    		.filter(e -> e.getValue().getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceSource) != null && e.getValue().getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceId) != null)
			    		.collect(Collectors.toMap(e -> e.getValue().getSampleName(), e -> ((String) e.getValue().getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceSource)).trim().replaceAll("/+$", "")))
		    		: 
		    		MgdbDao.getInstance().loadIndividualsWithAllMetadata(sModule, AbstractTokenManager.getUserNameFromAuthentication(tokenManager.getAuthenticationFromToken(tokenManager.readToken(request))), null, null)
			    		.entrySet().stream()
			    		.filter(e -> e.getValue().getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceSource) != null && e.getValue().getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceId) != null)
			    		.collect(Collectors.toMap(Map.Entry::getKey, e -> ((String) e.getValue().getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceSource)).trim().replaceAll("/+$", "")));
		}
		else
			endpointByIndividualOrSample = new HashMap<>();	// working on a new database

		// Simulate what this would turn into after import
		String metadataFile = null;
        Scanner scanner = null;
        HashMap<String, String> filesByExtension = null;
        try {
        	filesByExtension = getImportFilesByExtension(Arrays.asList(uploadedFile1, uploadedFile2), Arrays.asList(dataUri1, dataUri2));
			String extensionLessFile = filesByExtension.get("");
			if (extensionLessFile != null)
				throw new Exception("File has no extension: " + extensionLessFile);

			metadataFile = filesByExtension.containsKey("tsv") ? filesByExtension.get("tsv") : (filesByExtension.containsKey("csv") ? filesByExtension.get("csv") : (filesByExtension.containsKey("phenotype") ? filesByExtension.get("phenotype") : null));
	        if (metadataFile != null) {    // deal with individuals' metadata
	            boolean fIsFtp = metadataFile.startsWith("ftp://");
	            boolean fIsRemote = fIsFtp || metadataFile.startsWith("http://") || metadataFile.startsWith("https://");

                URL url = fIsRemote ? new URL(metadataFile) : new File(metadataFile).toURI().toURL();
                if (fIsRemote && !fIsFtp) {
                	HttpURLConnection connection = ((HttpURLConnection) url.openConnection());
                	connection.setConnectTimeout(2000);
                    int respCode = connection.getResponseCode();
                    if (respCode >= HttpURLConnection.HTTP_MULT_CHOICE) {
            			buildResponse(response, respCode, metadataFile + " - " + (connection.getResponseMessage() != null ? connection.getResponseMessage() : ""));
            			return null;
            	    }
                }

                scanner = new Scanner(url.openStream());
                boolean fFlapjackFormat = false;
                HashMap<Integer, String> columnLabels = null;
                Integer extRefSrcColumn = null, idColumn = null;
                while (scanner.hasNextLine()) {
                    String sLine = scanner.nextLine();
                    if (sLine.isEmpty() || sLine.replaceAll("\\s+", "").equals("#fjFile=PHENOTYPE")) {
                    	if (!sLine.isEmpty())
                    		fFlapjackFormat = true;
                    	continue;
                    }

                    if (columnLabels == null) {
		                columnLabels = IndividualMetadataImport.readMetadataFileHeader(sLine, null);
		                
		                idColumn = columnLabels.entrySet().stream().filter(e -> e.getValue().equals(metadataType)).map(Map.Entry::getKey).findFirst().orElse(null);
		                if (idColumn == null) {
		                	if (!fFlapjackFormat || columnLabels.containsKey(0))
		                        throw new Exception(columnLabels.size() <= 1 ? "Provided file does not seem to be tab-delimited!" : "Unable to find column named \"" + metadataType + "\" in metadata file header!");
		
		                	idColumn = 0;	// FJ phenotype file's field-name line starts with an empty string
		                }

		                extRefSrcColumn = columnLabels.entrySet().stream().filter(e -> e.getValue().equals(BrapiService.BRAPI_FIELD_externalReferenceSource)).map(Map.Entry::getKey).findFirst().orElse(null);
		                if (extRefSrcColumn == null)
		                	break;	// There is no extRefSrc column in the metadata file

		                continue;
                    }

                    List<String> cells = Helper.split(sLine, "\t");
                    String entityId = cells.size() > idColumn ? cells.get(idColumn) : null;
                    if (entityId == null)
                    	continue;	// Should not happen...

                    String extRefSrc = cells.size() > extRefSrcColumn ? cells.get(extRefSrcColumn) : null;
                    if (extRefSrc != null)
                    	endpointByIndividualOrSample.put(entityId, extRefSrc.trim().replaceAll("/+$", ""));
                    else
                    	endpointByIndividualOrSample.remove(entityId);
                }
	        }
		}
		catch (Exception e) {
			build400Response(response, metadataFile + " - " + e.getMessage());
			return null;
	    }
        finally {
        	if (scanner != null)
        		scanner.close();
        	if (filesByExtension != null) {
	        	for (String uri : Arrays.asList(dataUri1, dataUri2))
	        		if (uri != null && !uri.trim().isEmpty())
	        			filesByExtension.remove(FilenameUtils.getExtension(uri));
	        	for (String uri : filesByExtension.values())
	        		new File(uri).delete();
        	}
        }

		return new HashSet<>(endpointByIndividualOrSample.values());
	}

//	@ApiIgnore
//	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = germplasmWithBrapiMappingURL, notes = "Lists IDs of germplasm with external reference source & ID")
//	@GetMapping(value = BASE_URL + germplasmWithBrapiMappingURL)
//	public @ResponseBody Collection<String> germplasmWithBrapiMappingURL(HttpServletRequest request, @RequestParam("module") final String sModule) {
//        return MgdbDao.getInstance().loadIndividualsWithAllMetadata(sModule, AbstractTokenManager.getUserNameFromAuthentication(tokenManager.getAuthenticationFromToken(tokenManager.readToken(request))), null, null)
//    		.values().stream()
//    		.filter(ind -> ind.getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceSource) != null && ind.getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceId) != null)
//    		.map(ind -> sModule + IGigwaService.ID_SEPARATOR + ind.getId()).toList();
//	}
//	
//	@ApiIgnore
//	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = samplesWithBrapiMappingURL, notes = "Lists IDs of samples with external reference source & ID")
//	@GetMapping(value = BASE_URL + samplesWithBrapiMappingURL)
//	public @ResponseBody Collection<String> samplesWithBrapiMappingURL(HttpServletRequest request, @RequestParam("module") final String sModule) {
//        return MgdbDao.getInstance().loadSamplesWithAllMetadata(sModule, AbstractTokenManager.getUserNameFromAuthentication(tokenManager.getAuthenticationFromToken(tokenManager.readToken(request))), null, null)
//    		.values().stream()
//    		.filter(sp -> sp.getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceSource) != null && sp.getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceId) != null)
//    		.map(sp -> sModule + IGigwaService.ID_SEPARATOR + sp.getId()).toList();
//	}
//	
	private HashMap<String, String> getImportFilesByExtension(Collection<MultipartFile> importFiles, Collection<String> filesSpecifiedByURI) throws Exception{
        HashMap<String, String> filesByExtension = new HashMap<>();
        HashMap<String, String> synonymExtensions = new HashMap() {{ put("csv", "tsv"); put("phenotype", "tsv"); }};	// .phenotype is only synonym with tsv
        for (MultipartFile mpf : importFiles) {
            if (mpf != null && !mpf.isEmpty()) {
                String fileExtension = FilenameUtils.getExtension(mpf.getOriginalFilename()).toLowerCase();
                if (synonymExtensions.containsKey(fileExtension))
                	fileExtension = synonymExtensions.get(fileExtension);
                if (filesByExtension.containsKey(fileExtension))
                    throw new Exception("Each provided datasource entry must be of a different kind!");
                else {
                    File file = null;
                    if (CommonsMultipartFile.class.isAssignableFrom(mpf.getClass()) && DiskFileItem.class.isAssignableFrom(((CommonsMultipartFile) mpf).getFileItem().getClass())) {
                        // make sure we transfer it to a file in the same location so it is a move rather than a copy!
                        File uploadedFile = ((DiskFileItem) ((CommonsMultipartFile) mpf).getFileItem()).getStoreLocation();
                        if (uploadedFile != null)
                            file = new File(uploadedFile.getAbsolutePath() + "." + fileExtension);
                    }
                    if (file == null) {
                        file = File.createTempFile("importByUpload_", "_" + mpf.getOriginalFilename());
                        LOG.debug("Had to transfer MultipartFile to tmp directory for " + mpf.getOriginalFilename());
                    }
                    mpf.transferTo(file);
                    filesByExtension.put(fileExtension, file.getAbsolutePath());
                }
            }
        }

        for (String uri : filesSpecifiedByURI) {
            if (uri != null && uri.trim().length() > 0) {
                String fileExtension = FilenameUtils.getExtension(new URI(uri.trim()).getPath()).toString().toLowerCase();
                if (synonymExtensions.containsKey(fileExtension))
                	fileExtension = synonymExtensions.get(fileExtension);
                if (filesByExtension.containsKey(fileExtension))
                	throw new Exception("Each provided datasource entry must be of a different kind!");
                else /*if (brapiUrlList.size() == 0)*/ // TODO: check why we had this if statement !!!!!!!! 
                    filesByExtension.put(fileExtension, uri);
            }
        }
        return filesByExtension;
	}
	
	
    /**
     * Import metadata for individuals
     * 
     * @param session
     * @param request
     * @param response
     * @param sModule
     * @param dataUri1
     * @param dataUri2
     * @param fClearProjectSeqData
     * @param uploadedFile1
     * @param uploadedFile2
     * @param metadataType
     * @param brapiURLs
     * @param brapiTokens
     * @return
     * @throws Exception
     */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = metadataImportSubmissionURL, notes = "Import metadata for individuals.")
    @RequestMapping(value = BASE_URL + metadataImportSubmissionURL, method = RequestMethod.POST)
    public @ResponseBody String importMetaData(HttpSession session, HttpServletRequest request, HttpServletResponse response,
    		@RequestParam("moduleExistingMD") final String sModule,
            @RequestParam(value = "metadataFile1", required = false) final String dataUri1,
            @RequestParam(value = "metadataFile2", required = false) final String dataUri2,
            @RequestParam(value = "clearProjectSequences", required = false) final Boolean fClearProjectSeqData,
            @RequestParam(value = "file[0]", required = false) MultipartFile uploadedFile1,
            @RequestParam(value = "file[1]", required = false) MultipartFile uploadedFile2,
            @RequestParam(value = "metadataType", required = false) final String metadataType,
            @RequestParam(value = "brapiURLs", required = false) final String brapiURLs,
            @RequestParam(value = "brapiTokens", required = false) final String brapiTokens) throws Exception {
        final String authToken = request == null ? null /* when request is null we consider we have admin role (used when importing into a new DB to which no permissions have been assigned yet) */: tokenManager.readToken(request);
        Authentication auth = request == null ? null : tokenManager.getAuthenticationFromToken(authToken);
		if (auth == null && request != null) {
		    build401Response(response);
//		    progress.setError("You must pass a valid token to be allowed to import.");
            return null;
		}

		final String processId = (request == null ? IRoleDefinition.ROLE_ADMIN : auth.getName()) + "::" + UUID.randomUUID().toString().replaceAll("-", "");
        final ProgressIndicator progress = new ProgressIndicator(processId, new String[]{"Checking submitted data"});
        ProgressIndicator.registerProgressIndicator(progress);

        String username = null;
        if (request != null && !tokenManager.canUserWriteToDB(authToken, sModule)) {
            if (auth != null)
                username = auth.getName();
            else {
                progress.setError("You need to be logged in");
                return processId;
            }
        }

        List<String> brapiUrlList = brapiURLs.trim().isEmpty() ? new ArrayList<>() : Helper.split(brapiURLs, " ; ");
        List<String> brapiTokenArray = brapiTokens.trim().isEmpty() ? (brapiUrlList.size() == 1 ? Arrays.asList("") : new ArrayList<>()) : Helper.split(brapiTokens, " ; ");
        if (brapiUrlList.size() != brapiTokenArray.size()) {
            progress.setError("You must provide the same number of BrAPI URLs and tokens (empty tokens mean no token required)");
            return processId;
        }

        String sFinalUsername = MongoTemplateManager.isModuleTemporary(sModule) ? null : username;	// any metadata is considered global for temp DBs
        new SessionAttributeAwareThread(session) {
			public void run() {
		        HashMap<String, String> filesByExtension = null;
		        try {
		        	filesByExtension = getImportFilesByExtension(Arrays.asList(uploadedFile1, uploadedFile2), Arrays.asList(dataUri1, dataUri2));
		        	if (progress.getError() == null) {
		                AtomicInteger nModifiedRecords = new AtomicInteger(-1);
		                String fastaFile = null, gzFile = filesByExtension.get("gz");
		                if (gzFile != null) {
		                    String extensionBeforeZip = FilenameUtils.getExtension(gzFile.substring(0, gzFile.length() - 3));
		                    if ("fasta".equals(extensionBeforeZip) || "fa".equals(extensionBeforeZip))
		                        fastaFile = gzFile;
		                }
		                if (fastaFile == null)
		                    fastaFile = filesByExtension.get("fasta");
		                if (fastaFile == null)
		                    fastaFile = filesByExtension.get("fa");
		                if (fastaFile != null) {
		                    progress.addStep("Importing sequence data");
		                    progress.moveToNextStep();
		                    SequenceImport.main(new String[]{sModule, fastaFile, Boolean.TRUE.equals(fClearProjectSeqData) ? "2" : "0"});
		//                    filesByExtension.remove(FilenameUtils.getExtension(fastaFile).toLowerCase());
		                }
		
		                String metadataFile = filesByExtension.containsKey("tsv") ? filesByExtension.get("tsv") : (filesByExtension.containsKey("csv") ? filesByExtension.get("csv") : (filesByExtension.containsKey("phenotype") ? filesByExtension.get("phenotype") : null));
		                if (metadataFile != null) {    // deal with individuals' metadata
		                    boolean fIsFtp = metadataFile.startsWith("ftp://");
		                    boolean fIsRemote = fIsFtp || metadataFile.startsWith("http://") || metadataFile.startsWith("https://");
		                    try {
		                        URL url = fIsRemote ? new URL(metadataFile) : new File(metadataFile).toURI().toURL();
		                        if (fIsRemote && !fIsFtp) {
		                            int respCode = ((HttpURLConnection) url.openConnection()).getResponseCode();
		                            if (HttpURLConnection.HTTP_OK != respCode)
		                                throw new IOException("Response code " + respCode);
		                        }
		                        progress.addStep("Importing metadata for " + metadataType + "s");
		                        progress.moveToNextStep();
		                        nModifiedRecords.set(IndividualMetadataImport.importIndividualOrSampleMetadata(sModule, session, url, metadataType, null, sFinalUsername));
		                    } catch (Exception ioe) {
		                        if (ioe instanceof FileNotFoundException)
		                            progress.setError("File not found: " + metadataFile);
		                        else
		                            progress.setError(metadataFile + " - " + ioe.getClass().getSimpleName() + ": " + ioe.getMessage());
		           
		                        metadataFile = null;
		                    }
		                }

		                if (brapiUrlList.size() > 0) {    // we've got BrAPI endpoints to pull metadata from
		                	storeSessionAttributes(session);	// in case external source info was just added
		                    HashMap<String /*BrAPI url*/, HashMap<String /*remote germplasmDbId*/, String /*individual*/>> brapiUrlToIndividualsMap = new HashMap<>();
	                        if (metadataType.equals("individual")) {
	                        	Collection<Individual> individuals = MgdbDao.getInstance().loadIndividualsWithAllMetadata(sModule, sFinalUsername, null, null).values();
	                            for (Individual individual : individuals)
	                                if (individual.getAdditionalInfo() != null) {
		                                String extRefIdValue = (String) individual.getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceId);
		                                String extRefSrcValue = (String) individual.getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceSource);

		                                if (extRefSrcValue == null || extRefSrcValue.isEmpty() || extRefIdValue == null || extRefIdValue.isEmpty())
		                                    continue;

		                                String endPointUrl = extRefSrcValue;
		                                if (endPointUrl.endsWith("/"))
		                                    endPointUrl = endPointUrl.substring(0, endPointUrl.length() - 1);
		
		                                if (brapiUrlToIndividualsMap.get(endPointUrl) == null)
		                                    brapiUrlToIndividualsMap.put(endPointUrl, new HashMap<>());
		
		                                HashMap<String, String> individualsCurrentEndpointHasDataFor = brapiUrlToIndividualsMap.get(endPointUrl);
		                                if (individualsCurrentEndpointHasDataFor == null) {
		                                    individualsCurrentEndpointHasDataFor = new HashMap<>();
		                                    brapiUrlToIndividualsMap.put(endPointUrl, individualsCurrentEndpointHasDataFor);
		                                }
		
		                                individualsCurrentEndpointHasDataFor.put(extRefIdValue, individual.getId());
		                            }
	                        }
	                        else {
	                        	Collection<GenotypingSample> genotypingSamples = MgdbDao.getInstance().loadSamplesWithAllMetadata(sModule, sFinalUsername, null, null).values();
	                            for (GenotypingSample sample : genotypingSamples)
	                                if (sample.getAdditionalInfo() != null) {
	                                	String extRefIdValue = (String) sample.getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceId);
	                                	String extRefSrcValue = (String) sample.getAdditionalInfo().get(BrapiService.BRAPI_FIELD_externalReferenceSource);
	                                    
	                                    if (extRefSrcValue == null || extRefIdValue == null)
	                                        continue;
	
	                                    String endPointUrl = extRefSrcValue;
	                                    if (endPointUrl.endsWith("/"))
		                                    endPointUrl = endPointUrl.substring(0, endPointUrl.length() - 1);
	
	                                    if (brapiUrlToIndividualsMap.get(endPointUrl) == null)
	                                        brapiUrlToIndividualsMap.put(endPointUrl, new HashMap<>());
	
	                                    HashMap<String, String> individualsCurrentEndpointHasDataFor = brapiUrlToIndividualsMap.get(endPointUrl);
	                                    if (individualsCurrentEndpointHasDataFor == null) {
	                                        individualsCurrentEndpointHasDataFor = new HashMap<>();
	                                        brapiUrlToIndividualsMap.put(endPointUrl, individualsCurrentEndpointHasDataFor);
	                                    }
	
	                                    individualsCurrentEndpointHasDataFor.put(extRefIdValue, sample.getSampleName());
	                                }
	                        }
		
		                    nModifiedRecords.set(0);
		                    for (String sBrapiUrl : brapiUrlToIndividualsMap.keySet()) {
		                        int tokenIndex = brapiUrlList.indexOf(sBrapiUrl);
		                        if (tokenIndex == -1) {
		                            LOG.debug("User chose to skip BrAPI source " + sBrapiUrl);
		                        } else
		                            try {
			                            String sToken = brapiTokenArray.get(tokenIndex);
			                            nModifiedRecords.addAndGet(IndividualMetadataImport.importBrapiMetadata(sModule, session, sBrapiUrl, brapiUrlToIndividualsMap.get(sBrapiUrl), sFinalUsername, "".equals(sToken) ? null : sToken, progress, metadataType));
			                        } catch (Throwable err) {
			                            progress.setError("Error importing BrAPI metadata from " + sBrapiUrl + " - " + err.getMessage());
			                            LOG.error("Error importing BrAPI metadata", err);
			                        }
		                    }
		                }
		
		                if (progress.getError() == null) {
		                    if (nModifiedRecords.get() <= 0) {    // no changes applied
		                        if (brapiUrlList.size() == 0 && nModifiedRecords.get() == -1)
		                            progress.setError("Unsupported file format or extension: " + filesByExtension.values().toArray(new String[1])[0]);
		                        else
		                            progress.setError("Pulling metadata using BrAPI did not lead to any changes!");
		                    } else {
		                    	MongoTemplateManager.updateDatabaseLastModification(sModule);
		                        progress.markAsComplete();
		                    }
		                }
		        	}
		        } catch (Throwable e) {
		            progress.setError(e.getMessage());
		            LOG.error("Error importing metadata", e);
		        } finally {
		        	if (filesByExtension != null)
			        	for (String uri : Arrays.asList(dataUri1, dataUri2))
			        		if (uri != null && !uri.trim().isEmpty())
			        			filesByExtension.remove(FilenameUtils.getExtension(uri));
		        	for (String uri : filesByExtension.values())
		        		new File(uri).delete();
		        }
			}
		}.start();

        return processId;
    }

	/**
	 * Import genotyping data.
	 *
	 * @param request the request
	 * @param response the response
	 * @param sHost the host
	 * @param sModule the module
	 * @param ncbiTaxonIdNameAndSpecies the ncbi TaxonId, Taxon Name and Species Name
	 * @param nPloidy the ploidy level
	 * @param sProject the project
	 * @param sRun the run
	 * @param sProjectDescription the project description
	 * @param sTechnology the technology
	 * @param fClearProjectData whether or not to clear project data
	 * @param skipMonomorphic whether or not to skip variants for which no polymorphism is found in the imported data
	 * @param dataUri1 URI-provided data file 1
	 * @param dataUri2 URI-provided data file 2
	 * @param dataUri3 URI-provided data file 3
	 * @param sBrapiMapDbId BrAPI map id for the server to pull genotypes from
	 * @param sBrapiStudyDbId BrAPI study id for the server to pull genotypes from
	 * @param sBrapiToken BrAPI token for the server to pull genotypes from
	 * @param uploadedFile1 upload-provided data file 1
	 * @param uploadedFile2 upload-provided data file 2
	 * @param uploadedFile3 upload-provided data file 3
	 * @return the token to use for checking progress
	 * @throws Exception the exception
	 */
	@ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = genotypeImportSubmissionURL, notes = "Import genotyping data.")
	@RequestMapping(value = BASE_URL + genotypeImportSubmissionURL, method = RequestMethod.POST)
	public @ResponseBody String importGenotypingData(HttpServletRequest request, HttpServletResponse response,
			@RequestParam(value = "host", required = false) String sHost, @RequestParam(value = "module", required = false) final String sModule,
			@RequestParam(value = "ncbiTaxonIdNameAndSpecies", required = false) final String ncbiTaxonIdNameAndSpecies,
			@RequestParam(value = "ploidy", required = false) final Integer nPloidy,
			@RequestParam("project") final String sProject, @RequestParam("run") final String sRun, @RequestParam(value="projectDesc", required = false) final String sProjectDescription,
			@RequestParam(value = "technology", required = false) final String sTechnology,
			@RequestParam(value = "clearProjectData", required = false) final Boolean fClearProjectData,
			@RequestParam(value = "skipMonomorphic", required = false) final boolean fSkipMonomorphic,
			@RequestParam(value = "dataFile1", required = false) final String dataUri1, @RequestParam(value = "dataFile2", required = false) final String dataUri2, @RequestParam(value = "dataFile3", required = false) final String dataUri3,
			@RequestParam(value = "brapiParameter_mapDbId", required = false) final String sBrapiMapDbId, @RequestParam(value = "brapiParameter_studyDbId", required = false) final String sBrapiStudyDbId,
			@RequestParam(value = "brapiParameter_token", required = false) final String sBrapiToken,
			@RequestParam(value = "file[0]", required = false) MultipartFile uploadedFile1,
			@RequestParam(value = "file[1]", required = false) MultipartFile uploadedFile2,
			@RequestParam(value = "file[2]", required = false) MultipartFile uploadedFile3,
			@RequestParam(value = "file[3]", required = false) MultipartFile uploadedFile4,
            @RequestParam(value = "metadataFile1", required = false) final String metadataUri1,
            @RequestParam(value = "metadataType", required = false) final String metadataType,
            @RequestParam(value = "brapiURLs", required = false) final String brapiURLs,
            @RequestParam(value = "brapiTokens", required = false) final String brapiTokens
		) throws Exception
	{
        final String authToken = tokenManager.readToken(request);
 		Authentication auth = tokenManager.getAuthenticationFromToken(authToken);
		if (auth == null) {
		    build401Response(response);
//		    progress.setError("You must pass a valid token to be allowed to import.");
            return null;
		}
		
		Object metadataFile = metadataUri1 != null && !metadataUri1.isEmpty() ? new URL(metadataUri1) : null;
		AtomicReference<String> metadataImportProcessId = new AtomicReference<>();

		final String processId = auth.getName() + "::" + UUID.randomUUID().toString().replaceAll("-", "");
		final ProgressIndicator progress = new ProgressIndicator(processId, new String[] { "Checking submitted data" });
        ProgressIndicator.registerProgressIndicator(progress);

		final String sNormalizedModule = Normalizer.normalize(sModule, Normalizer.Form.NFD) .replaceAll("[^\\p{ASCII}]", "").replaceAll(" ", "_");
		if (!MongoTemplateManager.isModuleAvailableForWriting(sNormalizedModule))
			progress.setError("This database is currently locked for writing. Please try again later.");

		HashMap<String, Serializable> filesByExtension = new HashMap<>();
		Long nTotalUploadSize = 0l, nTotalImportSize = 0l, maxUploadSize = maxUploadSize(request, true), maxImportSize = maxUploadSize(request, false);

		final ArrayList<File> uploadedFiles = new ArrayList<>();
		for (MultipartFile mpf : Arrays.asList(uploadedFile1, uploadedFile2, uploadedFile3, uploadedFile4))
			if (mpf != null && !mpf.isEmpty()) {
				String fileExtension = FilenameUtils.getExtension(mpf.getOriginalFilename()).toLowerCase();
				boolean fIsMetadataFile = "phenotype".equals(fileExtension);
				if (fIsMetadataFile && metadataFile != null)
					progress.setError("Only one metadata file may be provided at a time!");
				else if (filesByExtension.containsKey(fileExtension))
					progress.setError("Each provided datasource entry must be of a different kind!");
				else {
					if (fIsMetadataFile) {	// this one will be passed on to the metadata import procedure
						metadataFile = mpf;
						continue;
					}

					File file = null;
					if (CommonsMultipartFile.class.isAssignableFrom(mpf.getClass()) && DiskFileItem.class.isAssignableFrom(((CommonsMultipartFile) mpf).getFileItem().getClass())) {
						// make sure we transfer it to a file in the same location so it is a move rather than a copy!
						File uploadedFile = ((DiskFileItem) ((CommonsMultipartFile) mpf).getFileItem()).getStoreLocation();
						if (uploadedFile != null)
						    file = new File(uploadedFile.getAbsolutePath() + "." + fileExtension);
					}
					if (file == null) {
                        file = File.createTempFile("importByUpload_", "_" + mpf.getOriginalFilename());
                        LOG.debug("Had to transfer MultipartFile to tmp directory for " + mpf.getOriginalFilename());
					}
					mpf.transferTo(file);
					nTotalUploadSize += file.length();
					nTotalImportSize += file.length() * (fileExtension.toLowerCase().equals("gz") ? 20 : 1);
					filesByExtension.put(fileExtension, file);
					uploadedFiles.add(file);
				}
			}

		if (nTotalUploadSize > maxUploadSize*1024*1024)
			progress.setError("Uploaded data is larger than your allowed maximum (" + maxUploadSize + " Mb).");

		boolean fAdminImporter = auth.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));
		boolean fAnonymousImporter = auth == null || "anonymousUser".equals(auth.getName());
		if (progress.getError() == null) {
			for (String uri : Arrays.asList(dataUri1, dataUri2, dataUri3))
			{
				uri = uri == null ? null : uri.trim();
				if (uri != null && uri.trim().length() > 0)
					try {
						String fileExtension = FilenameUtils.getExtension(new URI(uri).getPath()).toString().toLowerCase();
						if (filesByExtension.containsKey(fileExtension))
							progress.setError("Each provided datasource entry must be of a different kind!");
						else {
							String lcURI = uri.toLowerCase();
							boolean fIsFtp = lcURI.startsWith("ftp://");
							if (lcURI.startsWith("http://") || lcURI.startsWith("https://") || fIsFtp)
							{
								URL url = new URL(uri);
								boolean fValidURL = false;
								if (fIsFtp)
								{	// FTP is disabled for now (too slow for some unknown reason)
	//									try
	//									{
	//										url.openStream();
	//										fValidURL = true;
	//									}
	//									catch (FileNotFoundException fnfe)
	//									{
	//										progress.setError("Invalid FTP URL " + url);
	//								    }
									progress.setError("FTP protocol not supported");
								}
								else
									try
									{
										HttpURLConnection httpConn = ((HttpURLConnection) url.openConnection());
										httpConn.setInstanceFollowRedirects(true);
										fValidURL = Arrays.asList(HttpURLConnection.HTTP_OK, HttpURLConnection.HTTP_MOVED_PERM, HttpURLConnection.HTTP_MOVED_TEMP).contains(httpConn.getResponseCode());
										if (fValidURL && HttpURLConnection.HTTP_OK != httpConn.getResponseCode())
										{	// there's a redirection: try and handle it
											String sNewUrl = httpConn.getHeaderField("Location");
											if (sNewUrl == null || !sNewUrl.toLowerCase().startsWith("http"))
											{
												fValidURL = false;
												progress.setError("Unable to handle redirected URL (http code " + httpConn.getResponseCode() + ")");
											}
											else
												url = new URL(sNewUrl);
										}
	
										if (!fAdminImporter && !auth.getAuthorities().contains(new SimpleGrantedAuthority(sModule + UserPermissionController.ROLE_STRING_SEPARATOR + IRoleDefinition.ROLE_DB_SUPERVISOR)))
										{
											Integer fileSize = null;
											try
											{
												fileSize = Integer.parseInt(httpConn.getHeaderField("Content-Length"));
											}
											catch (Exception ignored)
											{}
											if (fileSize == null)
												progress.setError("Only instance administrators and DB supervisors may import files with unspecified Content-Length");
											else
												nTotalImportSize += fileSize * (fileExtension.toLowerCase().equals("gz") ? 20 : 1);
										}
											
									}
									catch (Exception e)
									{
										progress.setError("Unable to connect to " + url + " - " + e.getMessage());
									}
								if (fValidURL)
								{
									if (!"ped".equals(fileExtension))
										filesByExtension.put(fileExtension, url);
									else
										try
										{
								            progress.addStep("Downloading PED file");
								            progress.moveToNextStep();
											File localPedCopy = File.createTempFile("tmp_", "_" + FilenameUtils.getName(uri));
											InputStream urlStream = url.openStream();
											FileUtils.copyInputStreamToFile(urlStream, localPedCopy);
											uploadedFiles.add(localPedCopy);
											filesByExtension.put(fileExtension, localPedCopy);
											urlStream.close();
										}
										catch (FileNotFoundException fnfe)
										{
											LOG.error("Error downloading ped file: " + uri, fnfe);
										}
								}
							}
							else
							{
								File f = new File(uri);
								if (f.exists() && !f.isDirectory() && f.length() > 0) {
									nTotalImportSize += f.length() * (fileExtension.toLowerCase().equals("gz") ? 20 : 1);									
									filesByExtension.put(fileExtension, f);
								}
								else
									progress.setError("Found no data to import from " + uri);
							}
						}
					}
				catch (URISyntaxException use) {
					progress.setError("Error parsing URI: " + use.getMessage());
				}
			}
		}

		if (maxImportSize != null && nTotalImportSize > maxImportSize*1024*1024)
			progress.setError("Provided import data is larger than your allowed maximum (" + maxImportSize + " Mb)." + (filesByExtension.containsKey("gz") ? " Note that bgzipped files are considered to have 20x compression." : ""));

		MongoTemplate mongoTemplate = MongoTemplateManager.get(sNormalizedModule);
		boolean fDatasourceExists = mongoTemplate != null;
		final GenotypingProject project = !fDatasourceExists ? null : mongoTemplate.findOne(new Query(Criteria.where(GenotypingProject.FIELDNAME_NAME).is(sProject)), GenotypingProject.class);
		boolean fGotProjectDesc = sProjectDescription != null && sProjectDescription.trim().length() > 0;
		boolean fBrapiImport = sBrapiMapDbId != null && sBrapiMapDbId.length() > 0 && sBrapiStudyDbId != null && sBrapiStudyDbId.length() > 0 && dataUri1.trim().toLowerCase().startsWith("http");
		if (fBrapiImport)
			filesByExtension.remove("");	// shall not be treated as a submitted flat-file
		boolean fGotDataToImport = filesByExtension.size() > 0 || fBrapiImport;
		if (!fGotDataToImport)
		{
			boolean fProjectDescRemainsEmpty = !fGotProjectDesc && (project == null || project.getDescription() == null || project.getDescription().trim().length() == 0);
			boolean fProjectDescExistsAndUnchanged = fGotProjectDesc && (project != null && project.getDescription() != null && sProjectDescription.trim().equals(project.getDescription().trim()));
			if ((fProjectDescRemainsEmpty || fProjectDescExistsAndUnchanged) && progress.getError() == null)
				progress.setError("Found no data to import!");
		}

		int nSampleMappingFileCount = 0 + (filesByExtension.containsKey("tsv") ? 1 : 0) + (filesByExtension.containsKey("csv") ? 1 : 0);
		if (nSampleMappingFileCount > 1)
			progress.setError("You may only provide a single sample-mappping file per import!");

		final AtomicReference<String> metadataImportError = new AtomicReference<>();
		AtomicBoolean fDatasourceAlreadyExisted = new AtomicBoolean();
		if (progress.getError() != null)
			for (File fileToDelete : uploadedFiles)
				fileToDelete.delete();		
		else {
			AtomicReference<AbstractGenotypeImport> genotypeImporter = new AtomicReference<>();
			final Object finalMetadataFile = metadataFile;
			if (!fGotDataToImport)	{	// we're only updating a project description
				mongoTemplate.updateFirst(new Query(Criteria.where(GenotypingProject.FIELDNAME_NAME).is(sProject)), new Update().set(GenotypingProject.FIELDNAME_DESCRIPTION, fGotProjectDesc ? sProjectDescription : null), GenotypingProject.class);
				MongoTemplateManager.updateDatabaseLastModification(sNormalizedModule);
				progress.markAsComplete();
			}
			else {
				if (filesByExtension.size() - nSampleMappingFileCount == 2) {
					if (!filesByExtension.containsKey("map") || (!filesByExtension.containsKey("ped") && !filesByExtension.containsKey("genotype")))
						progress.setError("Dual-file import must be PLINK (map + ped) or Flapjack (map + genotype)");
					else if (filesByExtension.containsKey("ped") && !filesByExtension.containsKey("map"))
						progress.setError("For PLINK format import, the PED file must be associated with a map file");
					else if (filesByExtension.containsKey("genotype") && !filesByExtension.containsKey("map"))
						progress.setError("For Flapjack format import, the genotype file must be associated with a map file");
				} 
				// Only one file when supposed to be dual-file
				else if (filesByExtension.containsKey("map")) {
					progress.setError("A map file must be associated with a data file");
				} else if (filesByExtension.containsKey("genotype")) {
					progress.setError("For Flapjack format import, both files (map + genotype) must be supplied");
				} else if (filesByExtension.containsKey("ped")) {
					progress.setError("For PLINK format import, both files (map + ped) must be supplied");
				}

				if (progress.getError() == null) {	// check if client is allowed to import
					String referer = request.getHeader("referer");					
					String remoteAddr = referer != null ? new URI(referer).getHost() /* we give priority to the referer */ : request.getHeader("X-Forwarded-Server") /* in case the app is running behind a proxy */;
					if (remoteAddr == null || remoteAddr.equals("localhost") || remoteAddr.equals("127.0.0.1"))
						remoteAddr = request.getRemoteAddr();
					
					boolean fIsCalledFromInterface = referer != null && referer.contains(remoteAddr + request.getContextPath());
					if (!fIsCalledFromInterface) {	// not being called from default UI: see if we should allow import
						String serversAllowedToImport = appConfig.get("serversAllowedToImport");
						if (!remoteAddr.equals(request.getLocalAddr()) && (serversAllowedToImport == null || !Helper.split(serversAllowedToImport, ",").contains(remoteAddr)))
							progress.setError("Remote client not allowed to import: " + remoteAddr);
					}
	
					Collection<String> writableDBs = tokenManager.listWritableDBs(authToken);
					boolean fMayOnlyWriteTmpData = !fAdminImporter && (fAnonymousImporter || writableDBs.size() == 0);
					if (progress.getError() == null && fDatasourceExists) {
						if (fMayOnlyWriteTmpData)
							progress.setError("You may only write to temporary databases");
						else if (!writableDBs.contains(sNormalizedModule))
							progress.setError("You may now write to database " + sNormalizedModule);
					}

					if (progress.getError() != null)
						LOG.warn("Attempt to create database " + sNormalizedModule + " was refused (" + (fDatasourceExists ? "already existed" : "no permission")  + ") - request.getRemoteAddr: "
							+ request.getRemoteAddr() + ", request.getLocalAddr: " + request.getLocalAddr() + ", X-Forwarded-Server: " + request.getHeader("X-Forwarded-Server") + ", referer: "
							+ request.getHeader("referer") + ", fMayOnlyWriteTmpData:" + fMayOnlyWriteTmpData + ", user: " + auth.getName() + ", fIsCalledFromInterface:" + fIsCalledFromInterface);
				}
			
				if (progress.getError() != null) {
					for (File fileToDelete : uploadedFiles)
						fileToDelete.delete();
					return processId;
				}
	
				Long expiryDate = null;
				fDatasourceAlreadyExisted.set(fDatasourceExists);
				if (!fDatasourceExists) {
					progress.addStep("Creating datasource");
					progress.moveToNextStep();
	
					try { // create it
						if (!fAdminImporter) {	// only administrators may create permanent databases
							expiryDate = System.currentTimeMillis() + 1000 * 60 * 60 * 24 /* 1 day */;
	//					 	expiryDate = System.currentTimeMillis() + 1000*60*5 /* 5 mn */;
							
							if (sHost == null || sHost.trim().length() == 0) {	// no host specified in the request
								String tempDbHost = appConfig.get("tempDbHost");
								for (String sAHost : MongoTemplateManager.getHostNames())
									if (tempDbHost == null || tempDbHost.equals(sAHost)) {	// no host specified for temp DBs in configuration properties: use the first host we find
										sHost = sAHost;
										break;
									}
							}
						}
						else if (sHost == null || sHost.trim().length() == 0 && !MongoTemplateManager.getHostNames().isEmpty())
							sHost = MongoTemplateManager.getHostNames().iterator().next();
	
						if (sHost == null || sHost.trim().length() == 0)
							throw new Exception("No host was specified!");
	
						if (MongoTemplateManager.saveOrUpdateDataSource(MongoTemplateManager.ModuleAction.CREATE, sNormalizedModule, !fAdminImporter, !fAdminImporter, sHost, ncbiTaxonIdNameAndSpecies, expiryDate)) {
							LOG.info("Adding database " + sNormalizedModule + " to host " + sHost);
							fDatasourceExists = true;
						} 
						else
							throw new Exception("Unable to add " + sNormalizedModule + " entry to datasources of host " + sHost);
					} catch (Exception e) {
						LOG.error("Error creating datasource " + sNormalizedModule, e);
						progress.setError(e.getMessage());
						for (File fileToDelete : uploadedFiles)
							fileToDelete.delete();
						return processId;
					}
				}
	

				
				try {
					if (fDatasourceExists) {
						final MongoTemplate finalMongoTemplate = MongoTemplateManager.get(sNormalizedModule);
						if (project != null) {
						    if (!tokenManager.canUserWriteToProject(authToken, sNormalizedModule, project.getId())) {
						        progress.setError("You are not allowed to write to this project!");
						        return processId;
						    }
						}
						else if (expiryDate == null && !tokenManager.canUserCreateProjectInDB(authToken, sModule)) // if it's a temp db then don't check for permissions
						{
							progress.setError("You are not allowed to create a project in database '" + sModule + "'!");
							return processId;
						}
						
						Serializable sampleMappingFile = filesByExtension.containsKey("tsv") ? filesByExtension.get("tsv") : filesByExtension.get("csv");
						boolean fIsSampleMappingFileLocal = sampleMappingFile != null && sampleMappingFile instanceof File;
						if (sampleMappingFile != null) {
							if (filesByExtension.size() == 1) {
						        progress.setError("You must provide some genotyping data with your sample-mapping file!");
						        return processId;
						    }
							
							if (fBrapiImport) {
						        progress.setError("Sample-mapping file is not supported for BrAPI imports (sample names are already provided as markerprofiles in this case)!");
						        return processId;
						    }
		
							Scanner sampleMappingScanner = fIsSampleMappingFileLocal ? new Scanner((File) sampleMappingFile) : new Scanner(((URL) sampleMappingFile).openStream());
				        	if (!sampleMappingScanner.hasNextLine()) {
						        progress.setError("Sample-mapping file is empty!");
						        return processId;
						    }
				        	else {
				        		List<String> splitLine = Helper.split(sampleMappingScanner.nextLine(), "\t");
				        		if (splitLine.size() != 2) {
							        progress.setError("Sample-mapping file has a wrong structure (2 columns expected)!");
							        return processId;
							    }
				        		if (!splitLine.contains("individual") || !splitLine.contains("sample")) {
							        progress.setError("Sample-mapping header must contain 2 columns named sample and individual!");
							        return processId;
							    }
				        	}
							sampleMappingScanner.close();
							filesByExtension.remove(FilenameUtils.getExtension(sampleMappingFile.toString()));
						}
		
						final AtomicInteger createdProjectId = new AtomicInteger(-1);
						final SecurityContext securityContext = SecurityContextHolder.getContext();
						new Thread() {
							public void run() {
								Scanner scanner = null;
								try {
									Integer newProjId = null;
									if (fBrapiImport) {
										genotypeImporter.set(new BrapiImport(processId));
										newProjId = ((BrapiImport) genotypeImporter.get()).importToMongo(sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, dataUri1.trim(), sBrapiStudyDbId, sBrapiMapDbId, sBrapiToken,  Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
									}
									else {
										HashMap<String, String> sampleToIndividualMapping = AbstractGenotypeImport.readSampleMappingFile(fIsSampleMappingFileLocal ? ((File) sampleMappingFile).toURI().toURL() : (URL) sampleMappingFile);
										if (sampleToIndividualMapping != null && mongoTemplate != null) { // make sure provided sample names do not conflict with existing ones
											Criteria crit = Criteria.where(GenotypingSample.FIELDNAME_NAME).in(sampleToIndividualMapping.keySet());
											if (Boolean.TRUE.equals(fClearProjectData))
												crit.andOperator(Criteria.where(GenotypingSample.FIELDNAME_PROJECT_ID).ne(project.getId()));
											if (mongoTemplate.count(new Query(crit), GenotypingSample.class) > 0) {
										        progress.setError("Some of the sample IDs provided in the mapping file already exist in this database!");
										        return;
											}
									    }
		
										if (!filesByExtension.containsKey("gz")) {
											if (filesByExtension.containsKey("ped") && filesByExtension.containsKey("map")) {
												Serializable mapFile = filesByExtension.get("map");
												boolean fIsGenotypingFileLocal = mapFile instanceof File;
												genotypeImporter.set(new PlinkImport(processId));
												newProjId = ((PlinkImport) genotypeImporter.get()).importToMongo(sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, fIsGenotypingFileLocal ? ((File) mapFile).toURI().toURL() : (URL) mapFile, (File) filesByExtension.get("ped"), sampleToIndividualMapping, fSkipMonomorphic, false, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
											}
											else if (filesByExtension.containsKey("vcf") || filesByExtension.containsKey("bcf")) {
												Serializable s = filesByExtension.containsKey("bcf") ? filesByExtension.get("bcf") : filesByExtension.get("vcf");
												boolean fIsGenotypingFileLocal = s instanceof File;
												genotypeImporter.set(new VcfImport(processId));
												newProjId = ((VcfImport) genotypeImporter.get()).importToMongo(filesByExtension.get("bcf") != null, sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, fIsGenotypingFileLocal ? ((File) s).toURI().toURL() : (URL) s, sampleToIndividualMapping, fSkipMonomorphic, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
											}
		                                    else if (filesByExtension.containsKey("intertek")) {
		                                        Serializable s = filesByExtension.get("intertek");                                                                               
		                                        boolean fIsGenotypingFileLocal = s instanceof File;
		                                        genotypeImporter.set(new IntertekImport(processId));
		                                        newProjId = ((IntertekImport) genotypeImporter.get()).importToMongo(sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, fIsGenotypingFileLocal ? ((File) s).toURI().toURL() : (URL) s, sampleToIndividualMapping, fSkipMonomorphic, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
		                                    }
											else if (filesByExtension.containsKey("genotype") && filesByExtension.containsKey("map")) {
												Serializable mapFile = filesByExtension.get("map");
												boolean fIsGenotypingFileLocal = mapFile instanceof File;
												genotypeImporter.set(new FlapjackImport(processId));
												newProjId = ((FlapjackImport) genotypeImporter.get()).importToMongo(sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, nPloidy, fIsGenotypingFileLocal ? ((File) mapFile).toURI().toURL() : (URL) mapFile, (File) filesByExtension.get("genotype"), sampleToIndividualMapping, fSkipMonomorphic, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
		
											}
											else {
												Serializable s = filesByExtension.values().iterator().next();                                                                                
												boolean fIsGenotypingFileLocal = s instanceof File;
												scanner = fIsGenotypingFileLocal ? new Scanner((File) s) : new Scanner(((URL) s).openStream());
												if (scanner.hasNext() && scanner.next().toLowerCase().startsWith("rs#")) {
													genotypeImporter.set(new HapMapImport(processId));
													newProjId = ((HapMapImport) genotypeImporter.get()).importToMongo(sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, nPloidy, fIsGenotypingFileLocal ? ((File) s).toURI().toURL() : (URL) s, sampleToIndividualMapping, fSkipMonomorphic, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
												}
												else
													throw new Exception("Unsupported format or extension for genotyping data file: " + s);
											}
										}
										else { // looks like a compressed file
											Serializable s = filesByExtension.get("gz");
											boolean fIsGenotypingFileLocal = s instanceof File;
											if (fIsGenotypingFileLocal)
												BlockCompressedInputStream.assertNonDefectiveFile((File) s);
											else
												LOG.info("Could not invoke assertNonDefectiveFile on remote file: " + s);
											
											genotypeImporter.set(new VcfImport(processId));
											newProjId = ((VcfImport) genotypeImporter.get()).importToMongo((fIsGenotypingFileLocal ? ((File) s).getName() : ((URL) s).toString()).toLowerCase().endsWith(".bcf.gz"), sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, fIsGenotypingFileLocal ? ((File) s).toURI().toURL() : (URL) s, sampleToIndividualMapping, fSkipMonomorphic, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
										}
									}

									if (progress.getError() == null && !progress.isAborted()) {	// looks like a successful import
										createdProjectId.set(newProjId != null ? newProjId : -1);
										
										if (fGotProjectDesc)
											finalMongoTemplate.updateFirst(new Query(Criteria.where(GenotypingProject.FIELDNAME_NAME).is(sProject)), new Update().set(GenotypingProject.FIELDNAME_DESCRIPTION, fGotProjectDesc ? sProjectDescription : null), GenotypingProject.class);
			
										if (newProjId != null)
											MongoTemplateManager.updateDatabaseLastModification(sNormalizedModule);

										while (finalMetadataFile != null && metadataImportProcessId.get() == null)
											sleep(2000);
										
										String sCompletionMessage = null;
										if (metadataImportProcessId.get() != null) {
											sCompletionMessage = "NB: Metadata imported successfully";
											ProgressIndicator mdImportProgress = ProgressIndicator.get(metadataImportProcessId.get());
											if (mdImportProgress == null) { // already finished
												if (metadataImportError.get() != null)
													sCompletionMessage = "Error importing metadata: " + metadataImportError.get();
											}
											else {
												long delay = 1000 * 60, parallelProcessWaitStart = System.currentTimeMillis();											
												while (!mdImportProgress.isComplete() && !mdImportProgress.isAborted() && mdImportProgress.getError() == null && System.currentTimeMillis() - parallelProcessWaitStart < delay) {
													Thread.sleep(1000);
													progress.setProgressDescription("Waiting for metadata import to complete: " + mdImportProgress.getProgressDescription());
												}
												
												if (System.currentTimeMillis() - parallelProcessWaitStart > delay) {
													sCompletionMessage = "WARNING: metadata import may have failed (not terminated 1 minute after genotype import ended)";
													LOG.error("Gave up waiting for metadata import thread to complete");
												}
												else if (mdImportProgress != null && mdImportProgress.getError() != null)
													sCompletionMessage = "Error importing metadata: " + mdImportProgress.getError();
											}
										}
										progress.markAsComplete(sCompletionMessage);
									}
								}
								catch (Exception e) {
									String fileExtensions = StringUtils.join(filesByExtension.keySet(), " + ");
									LOG.error("Error importing data from " + fileExtensions + (e instanceof SocketTimeoutException ? " (server-side needs maxParameterCount set to -1 in server.xml)" : ""), e);
									progress.setError("Error importing from " + fileExtensions + ": " + ExceptionUtils.getStackTrace(e));
								}
								finally {
									if (progress.getError() != null || progress.isAborted()) {	// failed or aborted: do some cleanup
										String sCleanupReason = !progress.isAborted() ? "error: " + progress.getError() : "user abort";
										if (fDatasourceAlreadyExisted.get()) {
											if (mongoTemplate.count(new Query(), GenotypingProject.class) > 0)
												try {
													moduleManager.removeManagedEntity(sModule, AbstractTokenManager.ENTITY_RUN, Arrays.<Comparable>asList(project == null ? createdProjectId.get() : project.getId(), sRun));	// remove run
												} catch (Exception e1) {
													LOG.error("Error cleaning up run data subsequently to " + sCleanupReason, e1);
												}
												moduleManager.cleanupDb(sModule);
										}
										else if (MongoTemplateManager.removeDataSource(sNormalizedModule, true))
											LOG.debug("Removed datasource " + sNormalizedModule + " subsequently to " + sCleanupReason);
									}
									else if (!fDatasourceAlreadyExisted.get() && !fAnonymousImporter && !fAdminImporter) // a new permanent database was created so we give this user supervisor role on it
										try {
									        UserWithMethod owner = (UserWithMethod) userDao.loadUserByUsernameAndMethod(auth.getName(), null);
									        if (owner.getAuthorities() != null && (owner.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN))))
									            return; // no need to grant any role to administrators
		
									        SimpleGrantedAuthority role = new SimpleGrantedAuthority(sModule + UserPermissionController.ROLE_STRING_SEPARATOR + IRoleDefinition.ROLE_DB_SUPERVISOR);
									        if (!owner.getAuthorities().contains(role)) {
									            HashSet<GrantedAuthority> authoritiesToSave = new HashSet<>();
									            authoritiesToSave.add(role);
									            for (GrantedAuthority authority : owner.getAuthorities())
									                authoritiesToSave.add(authority);
									            userDao.saveOrUpdateUser(auth.getName(), owner.getPassword(), authoritiesToSave, owner.isEnabled(), owner.getMethod());
									        }
		
											tokenManager.reloadUserPermissions(securityContext);
										}
										catch (IOException e) {
											LOG.error("Unable to give manager role to importer of project " + createdProjectId + " in database " + sModule);
										}
		
									if (scanner != null)
										scanner.close();
		
									for (File fileToDelete : uploadedFiles)
										fileToDelete.delete();
								}
							}
						}.start();
					}
				}
				finally {
					if (progress.getError() != null) {	// An error was emitted before starting the import thread
						if (!fDatasourceAlreadyExisted.get()) {
							if (MongoTemplateManager.removeDataSource(sNormalizedModule, true))
								LOG.debug("Removed datasource " + sNormalizedModule + " subsequently to failed or unauthorized import attempt");
						}
						for (File fileToDelete : uploadedFiles)
							fileToDelete.delete();
					}
				}
			}
			
			if (metadataFile != null) {
				while (progress.getError() == null && !progress.isAborted() && !progress.isComplete() && (genotypeImporter.get() == null || !genotypeImporter.get().haveSamplesBeenPersisted()))
					Thread.sleep(2000);	// wait for samples to be stored in the DB so we can attach metadata to them

				if (genotypeImporter.get() != null && genotypeImporter.get().haveSamplesBeenPersisted()) {
					metadataImportProcessId.set(importMetaData(request.getSession(), fDatasourceAlreadyExisted.get() ? request : null /* if it's new then we want imported metadata to be official */, response, sModule, metadataFile instanceof URL ? ((URL) metadataFile).toString() : null, null, false, metadataFile instanceof URL ? null : (MultipartFile) metadataFile, null, metadataType, brapiURLs, brapiTokens));
					
					// watch metadata import progress so we are aware of errors if any
					Timer timer = new Timer();
					timer.schedule(new TimerTask() {
					    public void run() {
							ProgressIndicator mdImportProgress = ProgressIndicator.get(metadataImportProcessId.get());
							if (mdImportProgress == null)
								return;
							
							if (mdImportProgress.isComplete() || !mdImportProgress.isAborted() || mdImportProgress.getError() != null) {
								if (mdImportProgress.getError() != null)
									metadataImportError.set(mdImportProgress.getError());
								cancel();
								timer.cancel();
							}
							else
								progress.setProgressDescription("Waiting for metadata import to complete: " + mdImportProgress.getProgressDescription());

					    }
					}, 0, 1000); 
				}
				else if (progress.getError() == null && !progress.isAborted())
					LOG.warn("Unable to process metadata during mixed import!");
			}
		}

		return processId;
	}

	/* This is a proxy method so we can call this URL insecurely even when Gigwa runs in https mode */
	@ApiIgnore
	@RequestMapping(value = BASE_URL + IGV_GENOME_LIST_URL, method = RequestMethod.GET, produces = "application/text")
	public String getIgvGenomeListURL() {
		String url = appConfig.get("igvGenomeListUrl");
		try
		{
			if (url == null)
				return "";
			
			String result = IOUtils.toString(new URL(url));
			return !result.toLowerCase().startsWith("<server-side genome list>") ? "" : result;
		}
		catch (Exception e) 
		{
			return "";
		}
	}
	
	@ApiIgnore
	@RequestMapping(value = BASE_URL + DEFAULT_GENOME_BROWSER_URL, method = RequestMethod.GET, produces = "application/text")
	public String getDefaultGenomeBrowserURL(@RequestParam("module") String sModule) {
		String url = appConfig.get("genomeBrowser-" + sModule);
		return url == null ? "" : url;
	}
	
	@ApiIgnore
	@RequestMapping(value = BASE_URL + ONLINE_OUTPUT_TOOLS_URL, method = RequestMethod.GET, produces = "application/json")
	public HashMap<String, HashMap<String, String>> getOnlineOutputToolURLs() {
		HashMap<String, HashMap<String, String>> results = new LinkedHashMap<>();
		for (int i=1; ; i++)
		{
			String toolInfo = appConfig.get("onlineOutputTool_" + i);
			if (toolInfo == null)
				break;

			String[] splitToolInfo = toolInfo.split(";");
			if (splitToolInfo.length >= 2 && splitToolInfo[1].trim().length() > 0 && splitToolInfo[0].trim().length() > 0)
			{
				HashMap<String, String> aResult = new HashMap<>();
				aResult.put("url", splitToolInfo[1].trim());
				if (splitToolInfo.length >= 3 && splitToolInfo[2].trim().length() > 0)
					aResult.put("formats", splitToolInfo[2].trim());
				results.put(splitToolInfo[0].trim(), aResult);
			}
		}
		return results;
	}

	@ApiIgnore
	@RequestMapping(value = BASE_URL + MAX_UPLOAD_SIZE_PATH, method = RequestMethod.GET)
	public Long maxUploadSize(HttpServletRequest request, @RequestParam(required=false) Boolean capped) {
		String maxSize = null;
		
		Authentication auth = tokenManager.getAuthenticationFromToken(tokenManager.readToken(request));
		boolean fIsAdmin = auth != null && auth.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN)); // limit only applies when capped for administrators
		if (!fIsAdmin) {
			maxSize = appConfig.get("maxImportSize_" + (auth == null ? "anonymousUser" : auth.getName()));
			if (maxSize == null || !StringUtils.isNumeric(maxSize))
				maxSize = appConfig.get("maxImportSize");
		}
		Long nMaxSizeMb = fIsAdmin ? null : (maxSize == null ? 500 /* absolute default */ : Long.parseLong(maxSize));

		if (!Boolean.TRUE.equals(capped))
			return nMaxSizeMb;
		
		return Math.min(uploadResolver.getFileUpload().getSizeMax() / (1024 * 1024), fIsAdmin ? Integer.MAX_VALUE : nMaxSizeMb);
	}
	
	public void buildResponse(HttpServletResponse resp, int httpCode, String message) throws IOException {
		resp.setStatus(httpCode);
		if (message != null)
			resp.getWriter().write(message);
	}

	public void build400Response(HttpServletResponse resp, String message) throws IOException {
		buildResponse(resp, HttpServletResponse.SC_BAD_REQUEST, message);
	}
	
    public void build401Response(HttpServletResponse resp) throws IOException {
    	buildResponse(resp, HttpServletResponse.SC_UNAUTHORIZED, "This action requires authentication");
    }
    
	public void build403Response(HttpServletResponse resp) throws IOException {
		buildResponse(resp, HttpServletResponse.SC_FORBIDDEN, "You are not allowed to access this resource");
	}

	public void build404Response(HttpServletResponse resp) throws IOException {
		buildResponse(resp, HttpServletResponse.SC_NOT_FOUND, "This resource does not exist");
	}
	
	@ApiIgnore
	@RequestMapping(value = BASE_URL + SAVE_QUERY_URL, method = RequestMethod.POST, consumes = "application/json")
    public void bookmarkQuery(HttpServletRequest request, HttpServletResponse response) throws IOException {
		String body = IOUtils.toString(request.getReader());
		
		ObjectMapper mapper = new ObjectMapper();
		ObjectNode jsonNode = (ObjectNode) mapper.readTree(body);
		GigwaSearchVariantsRequest gsvr = mapper.readValue(jsonNode, GigwaSearchVariantsRequest.class);

        String token = tokenManager.readToken(request);
    	Authentication authentication = tokenManager.getAuthenticationFromToken(token);
    	if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
    		build403Response(response);
    		return;
    	}
    	String sQueryLabel = jsonNode.get("queryLabel").asText();
    	if (sQueryLabel == null || sQueryLabel.trim().length() == 0) {
    		response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
    		response.getWriter().write("You must specify a header parameter named 'label'");
    		return;
    	}

    	String info[] = GigwaSearchVariantsRequest.getInfoFromId(gsvr.getVariantSetId(), 2);
        String sModule = info[0];
        MongoTemplate mongoTemplate = MongoTemplateManager.get(sModule);        

        String queryKey = ga4ghService.getQueryKey(gsvr);
        
        BookmarkedQuery existingQueryWithThisName = mongoTemplate.findOne(new Query(Criteria.where(BookmarkedQuery.FIELDNAME_LABELS_FOR_USERS + "." + authentication.getName()).is(sQueryLabel.trim())), BookmarkedQuery.class);
        if (existingQueryWithThisName != null && !existingQueryWithThisName.getId().equals(queryKey)) {
    		response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
    		response.getWriter().write("A different query already exists with this name");
    		return;
    	}

        // remove fields unrelated to the filters so we only save what's relevant
		jsonNode.remove("searchMode");
		jsonNode.remove("getGT");
		jsonNode.remove("pageSize");
		jsonNode.remove("pageToken");
		jsonNode.remove("sortBy");
		jsonNode.remove("sortDir");
		jsonNode.remove("queryLabel");

        BookmarkedQuery cachedQuery = new BookmarkedQuery(queryKey);
        cachedQuery.getLabelsForUsers().put(authentication.getName(), sQueryLabel.trim());  	
    	cachedQuery.setSavedFilters(mapper.readValue(jsonNode, HashMap.class));
    	mongoTemplate.save(cachedQuery);

    	response.setStatus(HttpServletResponse.SC_CREATED);
    }

	@ApiIgnore
	@RequestMapping(value = BASE_URL + LIST_SAVED_QUERIES_URL, method = RequestMethod.GET, produces = "application/json")
    public HashMap<String, String> listBookmarkedQueries(HttpServletRequest request, HttpServletResponse response, @RequestParam("module") String sModule) throws IOException {
        String token = tokenManager.readToken(request);
    	Authentication authentication = tokenManager.getAuthenticationFromToken(token);
    	if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
    		build403Response(response);
    		return null;
    	}

        MongoTemplate mongoTemplate = MongoTemplateManager.get(sModule);
        HashMap<String, String> result = new HashMap<>();

        List<BookmarkedQuery> cachedQueries = mongoTemplate.find(new Query(Criteria.where(BookmarkedQuery.FIELDNAME_LABELS_FOR_USERS + "." + authentication.getName().replaceAll("\\.", MongoTemplateManager.DOT_REPLACEMENT_STRING)).exists(true)), BookmarkedQuery.class);
        for (BookmarkedQuery cq : cachedQueries)
        	result.put(cq.getId(), cq.getLabelsForUsers().get(authentication.getName()));

        return result;
    }
	
	@ApiIgnore
	@RequestMapping(value = BASE_URL + LOAD_QUERY_URL, method = RequestMethod.GET, produces = "application/json")
    public HashMap<String, Object> loadBookmarkedQuery(HttpServletRequest request, HttpServletResponse response, @RequestParam("module") String sModule, @RequestParam String queryId) throws IOException {
        String token = tokenManager.readToken(request);
    	Authentication authentication = tokenManager.getAuthenticationFromToken(token);
    	if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
    		build403Response(response);
    		return null;
    	}
    	
        MongoTemplate mongoTemplate = MongoTemplateManager.get(sModule);
        BookmarkedQuery cachedQuery = mongoTemplate.findById(queryId, BookmarkedQuery.class);
        if (cachedQuery == null) {
        	build404Response(response);
        	return null;
        }
        
        if (!cachedQuery.getLabelsForUsers().containsKey(authentication.getName())) {
    		build403Response(response);
    		return null;
    	}

        return cachedQuery.getSavedFilters();
    }

	@ApiIgnore
	@RequestMapping(value = BASE_URL + DELETE_QUERY_URL, method = RequestMethod.DELETE, produces = "application/json")
    public void deleteBookmarkedQuery(HttpServletRequest request, HttpServletResponse response, @RequestParam("module") String sModule, @RequestParam String queryId) throws IOException {
        String token = tokenManager.readToken(request);
    	Authentication authentication = tokenManager.getAuthenticationFromToken(token);
    	if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
    		build403Response(response);
    		return;
    	}
    	
        MongoTemplate mongoTemplate = MongoTemplateManager.get(sModule);
        DeleteResult dr = mongoTemplate.remove(new Query(Criteria.where("_id").is(queryId)), BookmarkedQuery.class);
        if (dr.getDeletedCount() == 0) {
        	build404Response(response);
        	return;
        }
        
        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }
        
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = VARIANTS_LOOKUP, notes = "Get variants IDs ")
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Success", response = List.class),
	@ApiResponse(code = 400, message = "wrong parameters"),
	@ApiResponse(code = 401, message = "you don't have rights on this database, please log in") })
    @RequestMapping(value = BASE_URL + VARIANTS_LOOKUP, method = RequestMethod.GET, produces = "application/json")
    public List<Comparable> searchableVariantsLookup(
            HttpServletRequest request, HttpServletResponse resp,
            @RequestParam("projectId") String projectId,
            @RequestParam("q") String lookupText) throws Exception {
        
        String token = tokenManager.readToken(request);

        try {
            String[] info = URLDecoder.decode(projectId, "UTF-8").split(IGigwaService.ID_SEPARATOR);
            int project = Integer.parseInt(info[1]);
            if (tokenManager.canUserReadDB(token, info[0])) {            
                return ga4ghService.searchVariantsLookup(info[0], project, lookupText);
            }
                
        } catch (UnsupportedEncodingException ex) {
            LOG.debug("Error decoding projectId: " + projectId, ex);
        }
        
        return null;
    }
    
}
