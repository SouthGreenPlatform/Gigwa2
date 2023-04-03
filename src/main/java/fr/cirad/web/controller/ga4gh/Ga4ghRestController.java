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
package fr.cirad.web.controller.ga4gh;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.ejb.ObjectNotFoundException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.avro.AvroRemoteException;
import org.ga4gh.methods.ListReferenceBasesRequest;
import org.ga4gh.methods.ListReferenceBasesResponse;
import org.ga4gh.methods.SearchCallSetsResponse;
import org.ga4gh.methods.SearchReferenceSetsRequest;
import org.ga4gh.methods.SearchReferenceSetsResponse;
import org.ga4gh.methods.SearchReferencesResponse;
import org.ga4gh.methods.SearchVariantSetsRequest;
import org.ga4gh.methods.SearchVariantSetsResponse;
import org.ga4gh.models.CallSet;
import org.ga4gh.models.Reference;
import org.ga4gh.models.ReferenceSet;
import org.ga4gh.models.Variant;
import org.ga4gh.models.VariantAnnotation;
import org.ga4gh.models.VariantSet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import fr.cirad.mgdb.service.GigwaGa4ghServiceImpl;
import fr.cirad.model.GigwaSearchCallSetsRequest;
import fr.cirad.model.GigwaSearchReferencesRequest;
import fr.cirad.model.GigwaSearchVariantsRequest;
import fr.cirad.model.GigwaSearchVariantsResponse;
import fr.cirad.security.base.IRoleDefinition;
import fr.cirad.tools.AlphaNumericComparator;
import fr.cirad.tools.Helper;
import fr.cirad.tools.security.TokenManager;
import fr.cirad.web.controller.gigwa.base.ControllerInterface;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import io.swagger.annotations.Authorization;

/**
 *
 * @author petel, sempere
 *
 * Implementation of GA4GH-compliant calls, with little additional Gigwa-specific functionality. Methods only used by the Javascript interface are ignored by Swagger
 */
@RestController
public class Ga4ghRestController extends ControllerInterface {

    @Autowired TokenManager tokenManager;
    /**
     * instance of Service to manage all interaction with database
     */
    @Autowired private GigwaGa4ghServiceImpl service;
    
    /**
     * logger
     */
    @SuppressWarnings("unused")
    static private final org.apache.log4j.Logger LOG = org.apache.log4j.Logger.getLogger(Ga4ghRestController.class);

    static public final String BASE_URL = "/ga4gh";
    static public final String CALLSETS = "/callsets";
    static public final String VARIANTSETS = "/variantsets";
    static public final String VARIANTS = "/variants";
    static public final String REFERENCES = "/references";
    static public final String REFERENCESETS = "/referencesets";
    static public final String VARIANT_ANNOTATION = "/variantAnnotations";
    static public final String CALLSETS_SEARCH = "/callsets/search";
    static public final String VARIANTSETS_SEARCH = "/variantsets/search";
    static public final String VARIANTS_SEARCH = "/variants/search";
    static public final String REFERENCES_SEARCH = "/references/search";
    static public final String REFERENCESETS_SEARCH = "/referencesets/search";
    
    static public final String BASES = "/bases";

    /**
     * get bases from reference sequence
     *
     * @param request
     * @param module
     * @param name
     * @param start
     * @param end
     * @return
     * @throws IOException
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getSequenceBase", notes = "Get references sequences bases from a specific location ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = ListReferenceBasesResponse.class),
        @ApiResponse(code = 401, message = "Access forbidden")
    })
	@RequestMapping(value = BASE_URL + REFERENCES + "/{id:.+}" + BASES, method = RequestMethod.POST, consumes = "application/json", produces = "application/json")
    public ListReferenceBasesResponse getReferenceBases(HttpServletRequest request, HttpServletResponse response, @PathVariable String id, @RequestBody ListReferenceBasesRequest listReferenceBasesRequest) throws IOException {

        String token = tokenManager.readToken(request);
        try
        {
        	if (tokenManager.canUserReadDB(token, id.split(Helper.ID_SEPARATOR)[0])) {
        		return service.getReferenceBases(id, listReferenceBasesRequest);
	        } else {
	            buildForbiddenAccessResponse(token, response);
	            return null;
	        }
		} catch (ObjectNotFoundException e) {
            build404Response(response);
            return null;
		}
    }

    // Issue in spring when id contains "." and is the last param ( example : moduleTest|1|GAIIx-chr21-BWA.mem)
    // to avoid that, we use {id:.+} in pathparam  
    /**
     * get a CallSet by ID. GA4GH compliant method
     *
     * @param request
     * @param id
     * @return CallSet
     * @throws IOException 
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getCallSet", notes = "get a CallSet from its ID. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = CallSet.class),
        @ApiResponse(code = 401, message = "Access forbidden"),
        @ApiResponse(code = 404, message = "no CallSet with this ID")
    })
	@RequestMapping(value = BASE_URL + CALLSETS + "/{id:.+}", method = RequestMethod.GET, produces = "application/json")
    public CallSet getCallSet(HttpServletRequest request, HttpServletResponse response, @PathVariable String id) throws IOException {

        String token = tokenManager.readToken(request);
        try
        {
	        if (tokenManager.canUserReadDB(token, id.split(Helper.ID_SEPARATOR)[0])) {
	            CallSet callSet = service.getCallSet(id);
	            if (callSet == null) {
	                build404Response(response);
	                return null;
	            } else
	                return callSet;
	        } else {
	            buildForbiddenAccessResponse(token, response);
	            return null;
	        }
		} catch (ObjectNotFoundException e) {
            build404Response(response);
            return null;
		}
    }

    /**
     * get a variantSet by ID
     *
     * @param request
     * @param id
     * @return VariantSet
     * @throws IOException 
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getVariantSet", notes = "get a VariantSet from its ID. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = VariantSet.class),
        @ApiResponse(code = 401, message = "Access forbidden"),
        @ApiResponse(code = 404, message = "no VariantSet with this ID")
    })
	@RequestMapping(value = BASE_URL + VARIANTSETS + "/{id:.+}", method = RequestMethod.GET, produces = "application/json")
    public VariantSet getVariantSet(HttpServletRequest request, HttpServletResponse response, @PathVariable String id) throws IOException {

        String token = tokenManager.readToken(request);
        try
        {
	        if (tokenManager.canUserReadDB(token, id.split(Helper.ID_SEPARATOR)[0])) {
	            VariantSet variantSet = service.getVariantSet(id);
	            if (variantSet == null) {
	                build404Response(response);
	                return null;
	            } else
	                return variantSet;
	        } else {
	            buildForbiddenAccessResponse(token, response);
	            return null;
	        }
		} catch (ObjectNotFoundException e) {
            build404Response(response);
            return null;
		}
    }

    /**
     * get a Variant by ID. GA4GH compliant method
     *
     * @param request
     * @param id
     * @return Variant
     * @throws IOException 
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getVariant", notes = "get a Variant from its ID. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = Variant.class),
        @ApiResponse(code = 401, message = "Access forbidden"),
        @ApiResponse(code = 404, message = "no Variant with this ID")
    })
	@RequestMapping(value = BASE_URL + VARIANTS + "/{id:.+}", method = RequestMethod.GET, produces = "application/json")
    public Variant getVariant(HttpServletRequest request, HttpServletResponse response, @PathVariable String id) throws IOException {
        String token = tokenManager.readToken(request);
        try
        {
        	String[] info = id.split(Helper.ID_SEPARATOR);
        	int projId = Integer.parseInt(info[1]);
	        if (tokenManager.canUserReadProject(token, info[0], projId)) {
	            String indHeader = request.getHeader("ind");
	            Variant variant = service.getVariantWithGenotypes(id, indHeader == null || indHeader.length() == 0 ? new ArrayList<String>() : Helper.split(indHeader, ";"));
	            if (variant == null) {
	                build404Response(response);
	                return null;
	            } else
	                return variant;
	        } else {
	            buildForbiddenAccessResponse(token, response);
	            return null;
	        }
		} catch (ObjectNotFoundException e) {
            build404Response(response);
            return null;
		}
    }
    
    /**
     * get a Variant by ID. POST version of a GA4GH compliant method
     *
     * @param request
     * @param id
     * @return Variant
     * @throws IOException 
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getVariantByPost", notes = "get a Variant from its ID. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = Variant.class),
        @ApiResponse(code = 401, message = "Access forbidden"),
        @ApiResponse(code = 404, message = "no Variant with this ID")
    })
    @RequestMapping(value = BASE_URL + VARIANTS + "/{id:.+}", method = RequestMethod.POST, produces = "application/json")
    public Variant getVariantByPost(HttpServletRequest request, HttpServletResponse response, @PathVariable String id, @RequestBody Map<String, Object> body) throws IOException {

        String token = tokenManager.readToken(request);
        try
        {
        	String[] info = id.split(Helper.ID_SEPARATOR);
        	int projId = Integer.parseInt(info[1]);
	        if (tokenManager.canUserReadProject(token, info[0], projId)) {
                List<String> callSetIds = ((List<String>) body.get("callSetIds"));
                Variant variant = service.getVariantWithGenotypes(id, callSetIds == null ? new ArrayList<>() : callSetIds.stream().map(csi -> csi.substring(1 + csi.lastIndexOf(Helper.ID_SEPARATOR))).collect(Collectors.toList()));
                if (variant == null) {
                    build404Response(response);
                    return null;
                } else
                    return variant;
            } else {
                buildForbiddenAccessResponse(token, response);
                return null;
            }
        } catch (ObjectNotFoundException e) {
            build404Response(response);
            return null;
        }
    }

    /**
     * Gets a Reference by ID. GA4GH compliant method
     *
     * @param request
     * @param id
     * @return Reference in JSON format
     * @throws IOException 
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getReference", notes = "get a Reference from its ID. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = Reference.class),
        @ApiResponse(code = 401, message = "Access forbidden"),
        @ApiResponse(code = 404, message = "no Reference with this ID")
    })
	@RequestMapping(value = BASE_URL + REFERENCES + "/{id:.+}", method = RequestMethod.GET, produces = "application/json")
    public Reference getReference(HttpServletRequest request, HttpServletResponse response, @PathVariable String id) throws IOException {

        String token = tokenManager.readToken(request);
        try
        {
	        if (tokenManager.canUserReadDB(token, id.split(Helper.ID_SEPARATOR)[0])) {
	            Reference reference = service.getReference(id);
	            if (reference == null) {
	                build404Response(response);
	                return null;
	            } else
	                return reference;
	        } else {
	            buildForbiddenAccessResponse(token, response);
	            return null;
	        }
		} catch (ObjectNotFoundException e) {
            build404Response(response);
            return null;
		}
    }

    /**
     * Gets a ReferenceSet by ID. GA4GH compliant method
     *
     * @param id
     * @param request
     * @return ReferenceSet in JSON format
     * @throws IOException 
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getReferenceSet", notes = "get a ReferenceSet from its ID. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = ReferenceSet.class),
        @ApiResponse(code = 401, message = "Access forbidden"),
        @ApiResponse(code = 404, message = "no ReferenceSet with this ID")
    })
	@RequestMapping(value = BASE_URL + REFERENCESETS + "/{id:.+}", method = RequestMethod.GET, produces = "application/json")
    public ReferenceSet getReferenceSet(HttpServletResponse response, @PathVariable String id, HttpServletRequest request) throws IOException {

        String token = tokenManager.readToken(request);
        try
        {
	        if (tokenManager.canUserReadDB(token, id.split(Helper.ID_SEPARATOR)[0])) {
	            ReferenceSet referenceSet = service.getReferenceSet(id);
	            if (referenceSet == null) {
	                build404Response(response);
	                return null;
	            } else {
	                return referenceSet;
	            }
	        } else {
	            buildForbiddenAccessResponse(token, response);
	            return null;
	        }
		} catch (ObjectNotFoundException e) {
            build404Response(response);
            return null;
		}
    }

    /**
     * Gets a list of CallSet matching the search criteria. GA4GH compliant method
     *
     * @param request
     * @param callSetsRequest
     * @return SearchCallSetsResponse in JSON format
     * @throws IOException 
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "searchCallSets", notes = "get a list of CallSet matching values from SearchCallSetsRequest. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = SearchCallSetsResponse.class),
        @ApiResponse(code = 401, message = "Access forbidden")
    })
	@RequestMapping(value = BASE_URL + CALLSETS_SEARCH, method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
    public SearchCallSetsResponse searchCallSets(HttpServletRequest request, HttpServletResponse response, @RequestBody GigwaSearchCallSetsRequest callSetsRequest) throws IOException {
        String token = tokenManager.readToken(request);
        String id = callSetsRequest.getVariantSetId();
        try
        {
	        if (tokenManager.canUserReadDB(token, id.split(Helper.ID_SEPARATOR)[0])) {
	        	callSetsRequest.setRequest(request);
	            return service.searchCallSets(callSetsRequest);
	        } else {
	            buildForbiddenAccessResponse(token, response);
	            return null;
	        }
		} catch (ObjectNotFoundException e) {
            build404Response(response);
            return null;
		}
    }

    /**
     * Gets a list of ReferenceSet matching the search criteria. GA4GH compliant method
     *
     * @param request
     * @param referenceSetsRequest
     * @return SearchReferenceSetsResponse in JSON format
     * @throws org.apache.avro.AvroRemoteException
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "searchReferenceSets", notes = "get a list of ReferenceSet matching values from SearchReferenceSetsRequest. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = SearchReferenceSetsResponse.class)
    })
	@RequestMapping(value = BASE_URL + REFERENCESETS_SEARCH, method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
    public SearchReferenceSetsResponse searchReferenceSets(HttpServletRequest request, @RequestBody SearchReferenceSetsRequest referenceSetsRequest) throws AvroRemoteException {

        SearchReferenceSetsResponse response = service.searchReferenceSets(referenceSetsRequest);
        String token = tokenManager.readToken(request);
        List<ReferenceSet> listRef = new ArrayList<>();
        Collection<String> allowedModules = request.getHeader("Writable") != null ? tokenManager.listWritableDBs(token) : tokenManager.listReadableDBs(token);
        for (ReferenceSet referenceSet : response.getReferenceSets())
            if (allowedModules.contains(referenceSet.getName()))
                listRef.add(referenceSet);	// only keep allowed modules
        Collections.sort(listRef, new AlphaNumericComparator<ReferenceSet>());
        response.setReferenceSets(listRef);
        return response;
    }

    /**
     * Gets a list of Reference matching the search criteria. GA4GH compliant method
     *
     * @param request
     * @param referencesRequest
     * @return SearchReferencesResponse in JSON format
     * @throws IOException 
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "searchReferences", notes = "get a list of Reference matching values from SearchReferencesRequest. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = SearchReferencesResponse.class),
        @ApiResponse(code = 401, message = "Access forbidden")
    })
	@RequestMapping(value = BASE_URL + REFERENCES_SEARCH, method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
    public SearchReferencesResponse searchReferences(HttpServletRequest request, HttpServletResponse response, @RequestBody GigwaSearchReferencesRequest referencesRequest) throws IOException {
        String token = tokenManager.readToken(request);
        String id = referencesRequest.getReferenceSetId();
        if (id == null) {
            build400Response(response, "Parameter referenceSetId is required");
            return null;
        }
        
        try
        {
	        if (tokenManager.canUserReadDB(token, id.split(Helper.ID_SEPARATOR)[0]))
	            return service.searchReferences(referencesRequest);
	        else {
	            buildForbiddenAccessResponse(token, response);
	            return null;
	        }
		} catch (ObjectNotFoundException e) {
            build404Response(response);
            return null;
		}
    }

    /**
     * Gets a list of VariantSet matching the search criteria. GA4GH compliant method
     *
     * @param request
     * @param variantSetsRequest
     * @return SearchReferencesResponse in JSON format
     * @throws IOException 
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "searchVariantSets", notes = "get a list of VariantSet matching values from SearchVariantSetsRequest. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = SearchVariantSetsResponse.class),
        @ApiResponse(code = 401, message = "Access forbidden")
    })
	@RequestMapping(value = BASE_URL + VARIANTSETS_SEARCH, method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
    public SearchVariantSetsResponse searchVariantSets(HttpServletRequest request, HttpServletResponse response, @RequestBody SearchVariantSetsRequest variantSetsRequest) throws IOException {
        String token = tokenManager.readToken(request);
        boolean fWillingToWrite = request.getHeader("Writable") != null;
        if (variantSetsRequest.getDatasetId() == null) {
            build400Response(response, "Parameter datasetId is required");
            return null;
        }
        try
        {
	        boolean fGotDBRights = fWillingToWrite ? tokenManager.canUserWriteToDB(token, variantSetsRequest.getDatasetId()) : tokenManager.canUserReadDB(token, variantSetsRequest.getDatasetId());
	        if (fGotDBRights) {
	        	SearchVariantSetsResponse variantSets = service.searchVariantSets(variantSetsRequest);
	        	List<VariantSet> forbiddenVariantSets = new ArrayList<VariantSet>();
	        	for (VariantSet variantSet : variantSets.getVariantSets())
	        	{
	        		int variantSetId = Integer.parseInt(variantSet.getId().split(Helper.ID_SEPARATOR)[1]);
	        		if ((fWillingToWrite && !tokenManager.canUserWriteToProject(token, variantSetsRequest.getDatasetId(), variantSetId)) || !tokenManager.canUserReadProject(token, variantSetsRequest.getDatasetId(), variantSetId))
	        			forbiddenVariantSets.add(variantSet);
	        	}
	        	variantSets.getVariantSets().removeAll(forbiddenVariantSets);
	        	if (fWillingToWrite && tokenManager.canUserCreateProjectInDB(token, variantSetsRequest.getDatasetId()))
	        		variantSets.getVariantSets().add(0, new VariantSet());
	            return variantSets;
	        } else {
	            buildForbiddenAccessResponse(token, response);
	            return null;
	        }
		} catch (ObjectNotFoundException e) {
            build404Response(response);
            return null;
		}
    }

    /**
     * Gets a list of Variant matching the search criteria. GA4GH compliant method
     *
     * @param request
     * @param gsvr
     * @return SearchVariantsResponse in JSON format
     * @throws IOException 
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "searchVariant", notes = "get a list of Variant matching values from GigwaSearchVariantsResponse. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = GigwaSearchVariantsResponse.class),
        @ApiResponse(code = 401, message = "Access forbidden")
    })
    @RequestMapping(value = BASE_URL + VARIANTS_SEARCH, method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
    public GigwaSearchVariantsResponse searchVariants(HttpServletRequest request, HttpServletResponse response, @RequestBody GigwaSearchVariantsRequest gsvr) throws IOException {

        String token = tokenManager.readToken(request);
        String id = gsvr.getVariantSetId();
        if (id == null) {
            build400Response(response, "Parameter variantSetId is required");
            return null;
        }
        if (gsvr.getCallSetIds() == null) {
            build400Response(response, "Parameter callSetIds is required");
            return null;
        }
        try
        {
	        if (tokenManager.canUserReadDB(token, id.split(Helper.ID_SEPARATOR)[0])) {
	            gsvr.setRequest(request);
				Authentication authentication = tokenManager.getAuthenticationFromToken(token);
				gsvr.setApplyMatrixSizeLimit(authentication == null || !authentication.getAuthorities().contains(new SimpleGrantedAuthority(IRoleDefinition.ROLE_ADMIN)));
	            return service.searchVariants(gsvr);
	        } else {
	            buildForbiddenAccessResponse(token, response);
	            return null;
	        }
		}
        catch (ObjectNotFoundException e)
        {
            build404Response(response);
            return null;
        }
    }

    /**
     * Get functional annotation of a variant from its ID, supports only VCF 4.2 annotation system (ANN)
     *
     * @param request
     * @param id of the variant
     * @return Variant Annotation
     * @throws IOException 
     */
    @ApiOperation(authorizations = { @Authorization(value = "AuthorizationToken") }, value = "getVariantAnnotationById", notes = "get a VariantAnnotation from its ID. ")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Success", response = VariantAnnotation.class),
        @ApiResponse(code = 401, message = "Access forbidden"),
        @ApiResponse(code = 404, message = "no VariantAnnotation with this ID")
    })
	@RequestMapping(value = BASE_URL + VARIANT_ANNOTATION + "/{id}", method = RequestMethod.GET, produces = "application/json")
    public VariantAnnotation getVariantAnnotationById(HttpServletRequest request, HttpServletResponse response, @PathVariable String id) throws IOException {

        String token = tokenManager.readToken(request);
        try
        {
	        if (tokenManager.canUserReadDB(token, id.split(Helper.ID_SEPARATOR)[0])) {
	            VariantAnnotation varAnn = service.getVariantAnnotation(id);
	            if (varAnn == null)
	                build404Response(response);
	            return varAnn;
	        } else {
	            buildForbiddenAccessResponse(token, response);
	            return null;
	        }
		} catch (ObjectNotFoundException e) {
            build404Response(response);
            return null;
		}
    }
    
    public void build400Response(HttpServletResponse resp, String message) throws IOException
    {
    	resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
    	resp.getWriter().write(message);
    }
      
    public void buildForbiddenAccessResponse(String token, HttpServletResponse resp) throws IOException
    {
    	if (token == null || tokenManager.getAuthenticationFromToken(token) == null)
    	{
	    	resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
	    	resp.getWriter().write("You must be authenticated to access this resource");
    	}
    	else
    	{
    	 	resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
    	  	resp.getWriter().write("You are not allowed to access this resource");
    	}
    }

    public void build404Response(HttpServletResponse resp) throws IOException
    {
    	resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
    	resp.getWriter().write("This resource does not exist");
    }
}