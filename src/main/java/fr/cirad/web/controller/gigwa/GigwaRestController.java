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
import java.text.ParseException;
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
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import javax.ejb.ObjectNotFoundException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

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
import org.ga4gh.methods.SearchCallSetsRequest;
import org.ga4gh.models.CallSet;
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
import com.mongodb.client.MongoCollection;
import com.mongodb.client.result.DeleteResult;

import fr.cirad.io.brapi.BrapiService;
import fr.cirad.mgdb.exporting.AbstractExportWritingThread;
import fr.cirad.mgdb.exporting.tools.ExportManager;
import fr.cirad.mgdb.importing.BrapiImport;
import fr.cirad.mgdb.importing.FlapjackImport;
import fr.cirad.mgdb.importing.FlapjackPhenotypeImport;
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
import fr.cirad.mgdb.model.mongo.maintypes.VariantData;
import fr.cirad.mgdb.model.mongo.maintypes.VariantRunData;
import fr.cirad.mgdb.model.mongo.maintypes.VariantRunData.VariantRunDataId;
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
import fr.cirad.tools.mgdb.GenotypingDataQueryBuilder;
import fr.cirad.tools.mongo.MongoTemplateManager;
import fr.cirad.tools.security.TokenManager;
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
                try {
                    tokenManager.cleanupTokenMap();
                } catch (ParseException e) {
                    LOG.warn("Error executing cleanupTokenMap", e);
                }
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
	@RequestMapping(value = BASE_URL + VARIANT_TYPES_PATH
			+ "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public List<String> getVariantTypes(HttpServletRequest request, HttpServletResponse resp,
			@PathVariable String variantSetId) throws IOException {
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
	@RequestMapping(value = BASE_URL + PROJECT_RUN_PATH
			+ "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Map<String, List<String>> getRunList(HttpServletRequest request, HttpServletResponse resp,
			@PathVariable String variantSetId) throws IOException {

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
	public Map<String, List<String>> getHostList(HttpServletRequest request, HttpServletResponse resp)
			throws IOException {
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
	@RequestMapping(value = BASE_URL + NUMBER_ALLELE_PATH
			+ "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Map<String, List<Integer>> getNumberOfAlleles(HttpServletRequest request, HttpServletResponse resp,
			@PathVariable String variantSetId) throws IOException {
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
	@RequestMapping(value = BASE_URL + SEQUENCES_PATH
			+ "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Map<String, List<String>> getSequences(HttpServletRequest request, HttpServletResponse resp,
			@PathVariable String variantSetId) throws IOException {
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
	@RequestMapping(value = BASE_URL + EFFECT_ANNOTATION_PATH
			+ "/{variantSetId}", method = RequestMethod.GET, produces = "application/json")
	public Map<String, TreeSet<String>> getEffectAnnotations(HttpServletRequest request, HttpServletResponse resp,
			@PathVariable String variantSetId) throws IOException {
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
	public Integer getPloidyLevel(HttpServletRequest request, HttpServletResponse resp,
			@PathVariable String variantSetId) throws IOException {
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
	public ProgressIndicator getProcessProgress(HttpServletRequest request, HttpServletResponse response) {
		String token = tokenManager.readToken(request);
		ProgressIndicator progress = ga4ghService.getProgressIndicator(token);
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
	@RequestMapping(value = BASE_URL + SEQUENCE_FILTER_COUNT_PATH
			+ "/{referenceSetId}", method = RequestMethod.GET, produces = "application/json")
	public Map<String, Integer> getSequencesFilterCount(HttpServletRequest request, HttpServletResponse resp,
			@PathVariable String referenceSetId) throws IOException {

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
	public Map<String, Boolean> clearSelectedSequenceList(HttpServletRequest request, HttpServletResponse resp,
			@PathVariable String referenceSetId) throws IOException {

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
	public Map<String, Boolean> abortProcess(HttpServletRequest request) {
		String token = tokenManager.readToken(request);
		Map<String, Boolean> response = new HashMap<>();
		response.put(Constants.PROCESS_ABORTED, ga4ghService.abortProcess(token));
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

	
/**
     * import reference sequence from a fasta file in a specific module
     *
     * @param sModule
     * @param dataFile1
     * @param dataFile2
     * @param fClearProjectSeqData, currently ignored since FASTA upload is
     * disabled in the interface
     * @param uploadedFile1
     * @param uploadedFile2
     * @param brapiURLs
     * @param brapiTokens
     * @return
     * @throws Exception
     */
    @ApiIgnore
    @RequestMapping(value = BASE_URL + metadataImportSubmissionURL, method = RequestMethod.POST)
    public @ResponseBody
    String importMetaData(HttpServletRequest request, @RequestParam("moduleExistingMD") final String sModule,
            @RequestParam("metadataFilePath1") final String dataUri1, @RequestParam(value = "metadataFilePath2", required = false) final String dataUri2,
            @RequestParam(value = "clearProjectSequences", required = false) final Boolean fClearProjectSeqData,
            @RequestParam(value = "file[0]", required = false) MultipartFile uploadedFile1,
            @RequestParam(value = "file[1]", required = false) MultipartFile uploadedFile2,
            @RequestParam(value = "brapiURLs", required = false) final String brapiURLs,
            @RequestParam(value = "brapiTokens", required = false) final String brapiTokens) throws Exception {
        final String token = tokenManager.readToken(request);
        final ProgressIndicator progress = new ProgressIndicator(token, new String[]{"Checking submitted data"});
        ProgressIndicator.registerProgressIndicator(progress);

        HashMap<String, String> filesByExtension = new HashMap<>();
        final ArrayList<File> uploadedFiles = new ArrayList<>();
        for (MultipartFile mpf : Arrays.asList(uploadedFile1, uploadedFile2)) {
            if (mpf != null && !mpf.isEmpty()) {
                String fileExtension = FilenameUtils.getExtension(mpf.getOriginalFilename()).toLowerCase();
                if (filesByExtension.containsKey(fileExtension)) {
                    progress.setError("Each provided file must have a different extension!");
                } else {
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
                    uploadedFiles.add(file);
                    filesByExtension.put(fileExtension, file.getAbsolutePath());
                }
            }
        }

        String username = null;
        if (!tokenManager.canUserWriteToDB(token, sModule)) {
            Authentication authentication = tokenManager.getAuthenticationFromToken(token);
            if (authentication != null) {
                username = authentication.getName();
            } else {
                progress.setError("You need to be logged in");
                return null;
            }
        }

        List<String> brapiUrlList = Helper.split(brapiURLs, " ; "), brapiTokenArray = Helper.split(brapiTokens, " ; ");
        if (brapiUrlList.size() != brapiTokenArray.size()) {
            progress.setError("You must provide the same number of BrAPI URLs and tokens (empty tokens mean no token required)");
            return null;
        }

        if (progress.getError() == null) {
            for (String uri : Arrays.asList(dataUri1, dataUri2)) {
                if (uri != null && uri.trim().length() > 0) {
                    String fileExtension = FilenameUtils.getExtension(new URI(uri).getPath()).toString().toLowerCase();
                    if (filesByExtension.containsKey(fileExtension)) {
                        progress.setError("Each provided file must have a different extension!");
                    } else if (brapiUrlList.size() == 0) {
                        filesByExtension.put(fileExtension, uri);
                    }
                }
            }
        }

        if (progress.getError() != null) {
            for (File fileToDelete : uploadedFiles) {
                fileToDelete.delete();
            }
        } else {
            try {
                int nModifiedRecords = -1;
                String fastaFile = null, gzFile = filesByExtension.get("gz");
                if (gzFile != null) {
                    String extensionBeforeZip = FilenameUtils.getExtension(gzFile.substring(0, gzFile.length() - 3));
                    if ("fasta".equals(extensionBeforeZip) || "fa".equals(extensionBeforeZip)) {
                        fastaFile = gzFile;
                    }
                }
                if (fastaFile == null) {
                    fastaFile = filesByExtension.get("fasta");
                }
                if (fastaFile == null) {
                    fastaFile = filesByExtension.get("fa");
                }
                if (fastaFile != null) {
                    progress.addStep("Importing sequence data");
                    progress.moveToNextStep();
                    SequenceImport.main(new String[]{sModule, fastaFile, Boolean.TRUE.equals(fClearProjectSeqData) ? "2" : "0"});
                    filesByExtension.remove(FilenameUtils.getExtension(fastaFile).toLowerCase());
                }

                String metadataFile = filesByExtension.containsKey("tsv") ? filesByExtension.get("tsv") : null;
                boolean fIsFlapjackPhenotype = false;
                if (metadataFile == null && filesByExtension.containsKey("csv"))
                    metadataFile = filesByExtension.get("csv");
                if (metadataFile == null && filesByExtension.containsKey("phenotype")) {
                	metadataFile = filesByExtension.get("phenotype");
                	fIsFlapjackPhenotype = true;
                }
                
                if (metadataFile != null) {    // deal with individuals' metadata
                    boolean fIsFtp = metadataFile.startsWith("ftp://");
                    boolean fIsRemote = fIsFtp || metadataFile.startsWith("http://") || metadataFile.startsWith("https://");
                    try {
                        URL url = fIsRemote ? new URL(metadataFile) : new File(metadataFile).toURI().toURL();
                        if (fIsRemote && !fIsFtp) {
                            int respCode = ((HttpURLConnection) url.openConnection()).getResponseCode();
                            if (HttpURLConnection.HTTP_OK != respCode) {
                                throw new IOException("Response code " + respCode);
                            }
                        }
                        progress.addStep("Importing metadata for individuals");
                        progress.moveToNextStep();
                        if (fIsFlapjackPhenotype)
                        	nModifiedRecords = FlapjackPhenotypeImport.importIndividualMetadata(sModule, request.getSession(), url, null, username);
                        else
                        	nModifiedRecords = IndividualMetadataImport.importIndividualMetadata(sModule, request.getSession(), url, "individual", null, username);
                    } catch (IOException ioe) {
                        if (ioe instanceof FileNotFoundException) {
                            progress.setError("File not found: " + metadataFile);
                        } else {
                            progress.setError(metadataFile + " - " + ioe.getClass().getSimpleName() + ": " + ioe.getMessage());
                        }
                        metadataFile = null;
                    }
                } else if (brapiUrlList.size() > 0) {    // we've got BrAPI endpoints to pull metadata from
                    HashMap<String /*BrAPI url*/, HashMap<String /*sourceType*/, HashMap<String /*remote germplasmDbId*/, String /*individual*/>>> brapiUrlToIndividualsMap = new HashMap<>();
                    MongoTemplate mongoTemplate = MongoTemplateManager.get(sModule);
                    for (int projId : mongoTemplate.getCollection(MongoTemplateManager.getMongoCollectionName(GenotypingProject.class)).distinct("_id", Integer.class)) {    // invoke searchCallSets for each project to treat all individuals in the DB
                        SearchCallSetsRequest scsr = new SearchCallSetsRequest();
                        scsr.setVariantSetId(sModule + IGigwaService.ID_SEPARATOR + projId);
                        for (CallSet ga4ghCallSet : ga4ghService.searchCallSets(scsr).getCallSets()) {
                            List<String> extRefIdValues = ga4ghCallSet.getInfo().get(BrapiService.BRAPI_FIELD_germplasmExternalReferenceId);
                            List<String> extRefSrcValues = ga4ghCallSet.getInfo().get(BrapiService.BRAPI_FIELD_germplasmExternalReferenceSource);
                            List<String> extRefTypesValues = ga4ghCallSet.getInfo().get(BrapiService.BRAPI_FIELD_germplasmExternalReferenceType);
                            if (extRefSrcValues == null || extRefSrcValues.isEmpty() || extRefIdValues == null || extRefIdValues.isEmpty() || extRefTypesValues == null || extRefTypesValues.isEmpty()) {
                                continue;
                            }

                            if (extRefIdValues.size() != 1) {
                                LOG.warn("Only one " + BrapiService.BRAPI_FIELD_germplasmExternalReferenceId + " expected for individual " + ga4ghCallSet.getId());
                            }
                            if (extRefSrcValues.size() != 1) {
                                LOG.warn("Only one " + BrapiService.BRAPI_FIELD_germplasmExternalReferenceSource + " expected for individual " + ga4ghCallSet.getId());
                            }
                            if (extRefTypesValues.size() != 1) {
                                LOG.warn("Only one " + BrapiService.BRAPI_FIELD_germplasmExternalReferenceType + " expected for individual " + ga4ghCallSet.getId());
                            }

                            String[] splitId = ga4ghCallSet.getId().split(IGigwaService.ID_SEPARATOR);

                            String endPointUrl = extRefSrcValues.get(0);
                            if (!endPointUrl.endsWith("/")) {
                                endPointUrl = endPointUrl + "/";
                            }

                            if (brapiUrlToIndividualsMap.get(endPointUrl) == null) {
                                brapiUrlToIndividualsMap.put(endPointUrl, new HashMap<>());
                            }

                            HashMap<String, String> individualsCurrentEndpointHasDataFor = brapiUrlToIndividualsMap.get(endPointUrl).get(extRefTypesValues.get(0));
                            if (individualsCurrentEndpointHasDataFor == null) {
                                individualsCurrentEndpointHasDataFor = new HashMap<>();
                                brapiUrlToIndividualsMap.get(endPointUrl).put(extRefTypesValues.get(0), individualsCurrentEndpointHasDataFor);
                            }

                            individualsCurrentEndpointHasDataFor.put(extRefIdValues.get(0), splitId[splitId.length - 1]);
                        }
                    }

                    nModifiedRecords = 0;
                    for (String sBrapiUrl : brapiUrlToIndividualsMap.keySet()) {
                        int tokenIndex = brapiUrlList.indexOf(sBrapiUrl);
                        if (tokenIndex == -1) {
                            LOG.debug("User chose to skip BrAPI source " + sBrapiUrl);
                        } else
                            try {
                            String sToken = brapiTokenArray.get(tokenIndex);
                            nModifiedRecords += IndividualMetadataImport.importBrapiMetadata(sModule, request.getSession(), sBrapiUrl, brapiUrlToIndividualsMap.get(sBrapiUrl), username, "".equals(sToken) ? null : sToken, progress);
                        } catch (Throwable err) {
                            progress.setError(err.getMessage() + " - " + sBrapiUrl);
                            LOG.error("Error importing metadata", err);
                        }
                    }
                }

                if (progress.getError() == null) {
                    if (nModifiedRecords <= 0) {    // no changes applied
                        if (brapiUrlList.size() == 0 && nModifiedRecords == -1) {
                            progress.setError("Unsupported file format or extension: " + filesByExtension.values().toArray(new String[1])[0]);
                        } else {
                            progress.setError("Provided data did not lead to any changes!");
                        }
                    } else {
                    	MongoTemplateManager.updateDatabaseLastModification(sModule);
                        progress.markAsComplete();
                    }
                }
            } catch (Throwable e) {
                progress.setError(e.getMessage());
                LOG.error("Error importing metadata", e);
            } finally {
                for (File fileToDelete : uploadedFiles) {
                    fileToDelete.delete();
                }
            }
        }
        return token;
    }



	/**
	 * Import genotyping data.
	 *
	 * @param request the request
	 * @param request the response
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
	 * @param dataUri1 data file 1
	 * @param dataUri2 data file 2
	 * @param sBrapiMapDbId BrAPI map id for the server to pull genotypes from
	 * @param sBrapiStudyDbId BrAPI study id for the server to pull genotypes from
	 * @param sBrapiToken BrAPI token for the server to pull genotypes from
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
			@RequestParam(value = "dataFile1", required = false) final String dataUri1, @RequestParam(value = "dataFile2", required = false) final String dataUri2,
			@RequestParam(value = "brapiParameter_mapDbId", required = false) final String sBrapiMapDbId, @RequestParam(value = "brapiParameter_studyDbId", required = false) final String sBrapiStudyDbId,
			@RequestParam(value = "brapiParameter_token", required = false) final String sBrapiToken,
			@RequestParam(value = "file[0]", required = false) MultipartFile uploadedFile1,
			@RequestParam(value = "file[1]", required = false) MultipartFile uploadedFile2) throws Exception
	{
        final String token = tokenManager.readToken(request);
        final ProgressIndicator progress = new ProgressIndicator(token, new String[] { "Checking submitted data" });
        ProgressIndicator.registerProgressIndicator(progress);

		Authentication auth = tokenManager.getAuthenticationFromToken(token);
		if (auth == null) {
		    build401Response(response);
		    progress.setError("You must pass a valid token to be allowed to import.");
            return token;
		}

		final String sNormalizedModule = Normalizer.normalize(sModule, Normalizer.Form.NFD) .replaceAll("[^\\p{ASCII}]", "").replaceAll(" ", "_");
		if (!MongoTemplateManager.isModuleAvailableForWriting(sNormalizedModule))
			progress.setError("This database is currently locked for writing. Please try again later.");

		HashMap<String, Serializable> filesByExtension = new HashMap<>();
		Long nTotalUploadSize = 0l, nTotalImportSize = 0l, maxUploadSize = maxUploadSize(request, true), maxImportSize = maxUploadSize(request, false);

		final ArrayList<File> uploadedFiles = new ArrayList<>();
		if (uploadedFile1 != null || uploadedFile2 != null) {
			for (MultipartFile mpf : Arrays.asList(uploadedFile1, uploadedFile2))
				if (mpf != null && !mpf.isEmpty()) {
					String fileExtension = FilenameUtils.getExtension(mpf.getOriginalFilename()).toLowerCase();
					if (filesByExtension.containsKey(fileExtension))
						progress.setError("Each provided file must have a different extension!");
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
						nTotalUploadSize += file.length();
						nTotalImportSize += file.length() * (fileExtension.toLowerCase().equals("gz") ? 20 : 1);
						uploadedFiles.add(file);
						filesByExtension.put(fileExtension, file);
					}
				}
			if (nTotalUploadSize > maxUploadSize*1024*1024)
				progress.setError("Uploaded data is larger than your allowed maximum (" + maxUploadSize + " Mb).");
		}

		boolean fAdminImporter = auth.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN));

		if (progress.getError() == null) {
			for (String uri : Arrays.asList(dataUri1, dataUri2))
			{
				uri = uri == null ? null : uri.trim();
				if (uri != null && uri.trim().length() > 0)
					try {
						String fileExtension = FilenameUtils.getExtension(new URI(uri).getPath()).toString().toLowerCase();
						if (filesByExtension.containsKey(fileExtension))
							progress.setError("Each provided file must have a different extension!");
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
	
										if (!fAdminImporter)
										{
											Integer fileSize = null;
											try
											{
												fileSize = Integer.parseInt(httpConn.getHeaderField("Content-Length"));
											}
											catch (Exception ignored)
											{}
											if (fileSize == null)
												progress.setError("Only administrators may upload files with unspecified Content-Length");
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
			filesByExtension.clear();	// shall not be treated as a submitted flat-file
		boolean fGotDataToImport = filesByExtension.size() > 0 || fBrapiImport;
		if (!fGotDataToImport)
		{
			boolean fProjectDescRemainsEmpty = !fGotProjectDesc && (project == null || project.getDescription() == null || project.getDescription().trim().length() == 0);
			boolean fProjectDescExistsAndUnchanged = fGotProjectDesc && (project != null && project.getDescription() != null && sProjectDescription.trim().equals(project.getDescription().trim()));
			if ((fProjectDescRemainsEmpty || fProjectDescExistsAndUnchanged) && progress.getError() == null)
				progress.setError("Found no data to import!");
		}

		if (progress.getError() != null)
			for (File fileToDelete : uploadedFiles)
				fileToDelete.delete();
		else if (fGotDataToImport)
		{
			if (filesByExtension.size() == 2) {
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
			
			String referer = request.getHeader("referer");
			String remoteAddr = referer != null ? new URI(referer).getHost() // we give priority to the referer 
				: request.getHeader("X-Forwarded-Server"); // in case the app is running behind a proxy
			if (remoteAddr == null || remoteAddr.equals("localhost") || remoteAddr.equals("127.0.0.1"))
				remoteAddr = request.getRemoteAddr();

			String serversAllowedToImport = appConfig.get("serversAllowedToImport");
			boolean fRemoteMachineMayImport = remoteAddr.equals(request.getLocalAddr()) || (serversAllowedToImport != null && Helper.split(serversAllowedToImport, ",").contains(remoteAddr));
			String sReferer = request.getHeader("referer");
			boolean fIsCalledFromInterface = sReferer != null && sReferer.contains(request.getContextPath());
			boolean fAnonymousImporter = auth == null || "anonymousUser".equals(auth.getName());
			boolean fMayOnlyWriteTmpData = !fAdminImporter && (fAnonymousImporter || tokenManager.listWritableDBs(token).size() == 0);
			final boolean fDatasourceAlreadyExisted = fDatasourceExists;

			if (progress.getError() != null)
			{
				for (File fileToDelete : uploadedFiles)
					fileToDelete.delete();
				
				if (!fIsCalledFromInterface || fMayOnlyWriteTmpData)
				{ // only allow writing to a new, temporary, hidden database
					if (fDatasourceExists)
						progress.setError("Datasource " + sNormalizedModule + " already exists!");
					else if (!fIsCalledFromInterface && !fRemoteMachineMayImport)
						progress.setError("You are not allowed to create a datasource!");
					if (progress.getError() != null)
						LOG.warn("Attempt to create database " + sNormalizedModule + " was refused (" + (fDatasourceExists ? "already existed" : "no permission")  + ") - request.getRemoteAddr: "
							+ request.getRemoteAddr() + ", request.getLocalAddr: " + request.getLocalAddr() + ", X-Forwarded-Server: " + request.getHeader("X-Forwarded-Server") + ", referer: "
							+ request.getHeader("referer") + ", fAnonymousImporter:" + fMayOnlyWriteTmpData + ", fIsCalledFromInterface:" + fIsCalledFromInterface);
				}
				return null;
			}

			Long expiryDate = null;
			boolean fPublicAndHidden = !fIsCalledFromInterface || fMayOnlyWriteTmpData; // remote users (invoking import directly via a URL) and anonymous users are only allowed to create public-and-hidden databases (i.e. for their own use)
			if (!fDatasourceExists) {
				progress.addStep("Creating datasource");
				progress.moveToNextStep();
				try { // create it
					if (sHost == null || sHost.trim().length() == 0)
					{
						if (!fIsCalledFromInterface)
						{	// find a host
							String tempDbHost = appConfig.get("tempDbHost");
							for (String sAHost : MongoTemplateManager.getHostNames())
								if (tempDbHost == null || tempDbHost.equals(sAHost))
								{
									sHost = sAHost;
									LOG.debug("Module " + sModule + " will be created on host " + sHost);
									break;
								}
						}
						if (sHost == null || sHost.trim().length() == 0)
							throw new Exception("No host was specified!");
					}

					if (!fIsCalledFromInterface || !fAdminImporter)
						expiryDate = System.currentTimeMillis() + 1000 * 60 * 60 * 24 /* 1 day */;
//					 	expiryDate = System.currentTimeMillis() + 1000*60*5 /* 5 mn */;

					if (MongoTemplateManager.saveOrUpdateDataSource(MongoTemplateManager.ModuleAction.CREATE, sNormalizedModule, fPublicAndHidden, fPublicAndHidden, sHost, ncbiTaxonIdNameAndSpecies, expiryDate)) {
						LOG.info("Importing database " + sNormalizedModule + " into host " + sHost);
						fDatasourceExists = true;
					} 
					else
						throw new Exception("Unable to add " + sNormalizedModule + " entry to datasources");
				} catch (Exception e) {
					LOG.error("Error creating datasource " + sNormalizedModule, e);
					progress.setError(e.getMessage());
				}
			}

			if (fDatasourceExists) {
				final MongoTemplate finalMongoTemplate = MongoTemplateManager.get(sNormalizedModule);
				if (project != null) {
				    if (!tokenManager.canUserWriteToProject(token, sNormalizedModule, project.getId())) {
				        progress.setError("You are not allowed to write to this project!");
				        return null;
				    }
				}
				else if (expiryDate == null && !tokenManager.canUserCreateProjectInDB(token, sModule)) // if it's a temp db then don't check for permissions
				{
					progress.setError("You are not allowed to create a project in database '" + sModule + "'!");
					if (!fDatasourceAlreadyExisted) {
						if (MongoTemplateManager.removeDataSource(sNormalizedModule, true))
							LOG.debug("Removed datasource " + sNormalizedModule + " subsequently to previous import error");
					}
					for (File fileToDelete : uploadedFiles)
						fileToDelete.delete();
					return null;
				}

				final AtomicInteger createdProjectId = new AtomicInteger(-1);
				final SecurityContext securityContext = SecurityContextHolder.getContext();
				new Thread() {
					public void run() {
						Scanner scanner = null;
						try {
							Integer newProjId = null;
							if (fBrapiImport)
								newProjId = new BrapiImport(token).importToMongo(sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, dataUri1.trim(), sBrapiStudyDbId, sBrapiMapDbId, sBrapiToken, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
							else {
								if (!filesByExtension.containsKey("gz")) {
									if (filesByExtension.containsKey("ped") && filesByExtension.containsKey("map")) {
										Serializable mapFile = filesByExtension.get("map");
										boolean fIsLocalFile = mapFile instanceof File;
										newProjId = new PlinkImport(token).importToMongo(sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, fIsLocalFile ? ((File) mapFile).toURI().toURL() : (URL) mapFile, (File) filesByExtension.get("ped"), fSkipMonomorphic, false, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
									}
									else if (filesByExtension.containsKey("vcf") || filesByExtension.containsKey("bcf")) {
										Serializable s = filesByExtension.containsKey("bcf") ? filesByExtension.get("bcf") : filesByExtension.get("vcf");
										boolean fIsLocalFile = s instanceof File;
										newProjId = new VcfImport(token).importToMongo(filesByExtension.get("bcf") != null, sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, fIsLocalFile ? ((File) s).toURI().toURL() : (URL) s, fSkipMonomorphic, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
									}
                                    else if (filesByExtension.containsKey("intertek")) {
                                        Serializable s = filesByExtension.get("intertek");                                                                               
                                        boolean fIsLocalFile = s instanceof File;
                                        newProjId = new IntertekImport(token).importToMongo(sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, fIsLocalFile ? ((File) s).toURI().toURL() : (URL) s, fSkipMonomorphic, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
                                    }
									else if (filesByExtension.containsKey("genotype") && filesByExtension.containsKey("map")) {
										Serializable mapFile = filesByExtension.get("map");
										boolean fIsLocalFile = mapFile instanceof File;
										newProjId = new FlapjackImport(token).importToMongo(sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, nPloidy, fIsLocalFile ? ((File) mapFile).toURI().toURL() : (URL) mapFile, (File) filesByExtension.get("genotype"), fSkipMonomorphic, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);

									}
									else {
										Serializable s = filesByExtension.values().iterator().next();                                                                                
										boolean fIsLocalFile = s instanceof File;
										scanner = fIsLocalFile ? new Scanner((File) s) : new Scanner(((URL) s).openStream());
										if (scanner.hasNext() && scanner.next().toLowerCase().startsWith("rs#"))
											newProjId = new HapMapImport(token).importToMongo(sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, nPloidy, fIsLocalFile ? ((File) s).toURI().toURL() : (URL) s, fSkipMonomorphic, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
										else
											throw new Exception("Unsupported file format or extension: " + s);
									}
								}
								else { // looks like a compressed file
									Serializable s = filesByExtension.get("gz");
									boolean fIsLocalFile = s instanceof File;
									if (fIsLocalFile)
										BlockCompressedInputStream.assertNonDefectiveFile((File) s);
									else
										LOG.info("Could not invoke assertNonDefectiveFile on remote file: " + s);
									newProjId = new VcfImport(token).importToMongo((fIsLocalFile ? ((File) s).getName() : ((URL) s).toString()).toLowerCase().endsWith(".bcf.gz"), sNormalizedModule, sProject, sRun, sTechnology == null ? "" : sTechnology, fIsLocalFile ? ((File) s).toURI().toURL() : (URL) s, fSkipMonomorphic, Boolean.TRUE.equals(fClearProjectData) ? 1 : 0);
								}
							}
							
							if (newProjId != null) {
								createdProjectId.set(newProjId);
								MongoTemplateManager.updateDatabaseLastModification(sNormalizedModule);
							}
							
							if (fGotProjectDesc)
								finalMongoTemplate.updateFirst(new Query(Criteria.where(GenotypingProject.FIELDNAME_NAME).is(sProject)), new Update().set(GenotypingProject.FIELDNAME_DESCRIPTION, fGotProjectDesc ? sProjectDescription : null), GenotypingProject.class);
						}
						catch (Exception e) {
							String fileExtensions = StringUtils.join(filesByExtension.keySet(), " + ");
							LOG.error("Error importing data from " + fileExtensions + (e instanceof SocketTimeoutException ? " (server-side needs maxParameterCount set to -1 in server.xml)" : ""), e);
							progress.setError("Error importing from " + fileExtensions + ": " + ExceptionUtils.getStackTrace(e));
							if (!fDatasourceAlreadyExisted && MongoTemplateManager.removeDataSource(sNormalizedModule, true))
								LOG.debug("Removed datasource " + sNormalizedModule + " subsequently to previous import error");
							else
							{	// attempt finer cleanup
								if (project == null && mongoTemplate.findOne(new Query(), GenotypingProject.class) == null) {
									mongoTemplate.dropCollection(VariantRunData.class);
									LOG.debug("Dropped VariantRunData collection subsequently to previous import error");
								}
								else {
									Query cleanupQuery = new Query(Criteria.where("_id." + VariantRunDataId.FIELDNAME_PROJECT_ID).is(project.getId()).andOperator(Criteria.where("_id." + VariantRunDataId.FIELDNAME_RUNNAME).is(sRun)));
									DeleteResult dr = mongoTemplate.remove(cleanupQuery, VariantRunData.class);
									if (dr.getDeletedCount() > 0)
										LOG.debug("Removed " + dr.getDeletedCount() + " records from VariantRunData subsequently to previous import error");
								}
				                if (mongoTemplate.findOne(new Query(), VariantRunData.class) == null && AbstractGenotypeImport.doesDatabaseSupportImportingUnknownVariants(sModule))
				                {	// if there is no genotyping data left and we are not working on a fixed list of variants then any other data is irrelevant
				                    mongoTemplate.getDb().drop();
				                }
							}
						}
						finally {
							if (!fDatasourceAlreadyExisted && !fAnonymousImporter && !fAdminImporter) { // a new temporary database was created so we give this user supervisor role on it
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
		else
		{
			mongoTemplate.updateFirst(new Query(Criteria.where(GenotypingProject.FIELDNAME_NAME).is(sProject)), new Update().set(GenotypingProject.FIELDNAME_DESCRIPTION, fGotProjectDesc ? sProjectDescription : null), GenotypingProject.class);
			progress.markAsComplete();
		}

		return token;
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

	public void build400Response(HttpServletResponse resp, String message) throws IOException {
		resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		if (message != null)
		resp.getWriter().write(message);
	}
	
    public void build401Response(HttpServletResponse resp) throws IOException {
        resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        resp.getWriter().write("This action requires authentication");
    }
    
	public void build403Response(HttpServletResponse resp) throws IOException {
		resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
		resp.getWriter().write("You are not allowed to access this resource");
	}

	public void build404Response(HttpServletResponse resp) throws IOException {
		resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
		resp.getWriter().write("This resource does not exist");
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