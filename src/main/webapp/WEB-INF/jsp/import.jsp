<%--
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
--%>
<!DOCTYPE html>
<%@ page language="java" contentType="text/html; charset=utf-8" import="fr.cirad.web.controller.ga4gh.Ga4ghRestController,fr.cirad.security.base.IRoleDefinition,fr.cirad.web.controller.gigwa.GigwaRestController,fr.cirad.io.brapi.BrapiService,org.brapi.v2.api.ServerinfoApi,org.brapi.v2.api.SamplesApi" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<%
	java.util.Properties prop = new java.util.Properties();
	prop.load(getServletContext().getResourceAsStream("/META-INF/MANIFEST.MF"));
	String appVersion = prop.getProperty("Implementation-version");
	String[] splittedAppVersion = appVersion == null ? new String[] {""} : appVersion.split("-");
%>
<c:set var="appVersionNumber" value='<%= splittedAppVersion[0] %>' />
<c:set var="appVersionType" value='<%= splittedAppVersion.length > 1 ? splittedAppVersion[1] : "" %>' />
<c:set var="supervisorRoleSuffix" value='<%= "$" + IRoleDefinition.ROLE_DB_SUPERVISOR %>' />
<sec:authorize access="hasRole('ROLE_ADMIN')" var="isAdmin"/>
<sec:authorize access="hasRole('ROLE_ANONYMOUS')" var="isAnonymous"/>

<html>
    <head>
        <meta charset="utf-8">
		<title>Gigwa <%= appVersion == null ? "" : ("v" + appVersion)%></title>
        <link rel="shortcut icon" href="images/favicon.png" type="image/x-icon" /> 
        <link type="text/css" rel="stylesheet" href="css/bootstrap-select.min.css "> 
		<link type="text/css" rel="stylesheet" href="css/bootstrap.min.css">
        <link type="text/css" rel="stylesheet" href="css/dropzone.css">
        <link type="text/css" rel="stylesheet" href="css/main.css">
        <script type="text/javascript" src="js/jquery-1.12.4.min.js"></script>
        <script type="text/javascript" src="js/bootstrap-select.min.js"></script>
        <script type="text/javascript" src="js/bootstrap.min.js"></script>
        <script type="text/javascript" src="js/main.js"></script>
        <script type="text/javascript" src="js/import.js"></script>
        <script type="text/javascript" src="js/dropzone.js"></script>
		<script type="text/javascript" src="js/brapiV1.1_Client.js"></script>
        <script type="text/javascript">
	    	var progressUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PROGRESS_PATH%>' />";
	    	var tokenURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GET_SESSION_TOKEN%>"/>';
	    	var clearTokenURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.CLEAR_TOKEN_PATH%>" />';
	    	var maxUploadSizeURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.MAX_UPLOAD_SIZE_PATH%>"/>';
	    	var abortUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.ABORT_PROCESS_PATH%>' />";
	    	var hostListUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.HOSTS_PATH%>' />";
	    	var referenceSetsSearchUrl = "<c:url value='<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.REFERENCESETS_SEARCH%>' />";
	    	var variantSetsSearchUrl = "<c:url value='<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.VARIANTSETS_SEARCH%>' />";
	    	var projectRunUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PROJECT_RUN_PATH%>' />/";
	    	var callSetsSearchUrl = '<c:url value="<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.CALLSETS_SEARCH%>" />';
	    	var importPageUrl = "<c:url value='<%=GigwaRestController.IMPORT_PAGE_URL%>' />";
	    	var searchSamplesUrl = '<c:url value="<%=GigwaRestController.REST_PATH + ServerinfoApi.URL_BASE_PREFIX + \"/\" + SamplesApi.searchSamplesPost_url %>" />';
	    	var metadataValidationURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.metadataValidationURL %>" />';
			var metadataImportURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.metadataImportSubmissionURL %>" />';
	    	var webappUrl = "<c:url value='/' />";
            var token;
            var processAborted = false;
            var importFinalMessage = null;
            var metadataError;
            var maxUploadSizeInMb, maxImportSizeInMb;
        	var BRAPI_V1_URL_ENDPOINT;
        	var brapiParameters;
        	var projectDescriptions = [];
   			var brapiGenotypesToken, distinctBrapiMetadataURLs;
   			var extRefIdField = "<%= BrapiService.BRAPI_FIELD_externalReferenceId %>";
   			var extRefSrcField = "<%= BrapiService.BRAPI_FIELD_externalReferenceSource %>";
   			var isAnonymous = ${isAnonymous}, isAdmin = ${isAdmin};
   			var supervisedModules = [];
   			<c:if test="${!isAnonymous}">
   				<sec:authentication property="principal.authorities" var="authorities" />
   				<c:forEach items="${authorities}" var="authority"><c:if test='${fn:endsWith(authority.authority, supervisorRoleSuffix)}'>supervisedModules.push("${authority.authority.split('\\$')[0]}");</c:if></c:forEach>
   			</c:if>
        </script>
    </head>
    <body>
        <%@include file="../../../navbar.jsp" %>
        <div class="container margin-top-md">
        	<div style="position:absolute; left:45%; margin-top:-20px;"><button class="btn btn-primary btn-sm" style='margin-top:20px;' id="importButton" type="button">Submit</button></div>
            <ul class="nav nav-tabs" style="border-bottom:0;">
                <li id="genotypesTab" class="text-nowrap<c:if test='${param.type ne "metadata"}'> active</c:if>">
	                <a class="nav-link active" href="#gtTab" data-toggle="tab" id="genotypeImportNavLink" style="width:140px;">
		                Genotype import&nbsp;
		                <span class="glyphicon glyphicon-ok" style="display:none;" id="gtFormValid"></span>
		                <span class="glyphicon glyphicon-remove" style="display:none;" id="gtFormInvalid"></span>
	                </a>
	            </li>
                <li id="metadataTab" class="text-nowrap<c:if test='${param.type eq "metadata"}'> active</c:if>">
	                <a class="nav-link" href="#mdTab" data-toggle="tab" id="metadataImportNavLink" style="width:140px;">
		                Metadata import&nbsp;
		                <span class="glyphicon glyphicon-ok" style="display:none;" id="mdFormValid"></span>
		                <span class="glyphicon glyphicon-remove" style="display:none;" id="mdFormInvalid"></span>
	                </a>
                </li>
            </ul>
            <div class="tab-content">
                <div class="tab-pane<c:if test='${param.type ne "metadata"}'> active</c:if>" id="gtTab">
            	<form autocomplete="off" class="dropzone" id="importDropzoneG" action="<c:url value='<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.genotypeImportSubmissionURL %>' />" method="post">
	            	<input type="hidden" name="brapiParameter_mapDbId" id="brapiParameter_mapDbId"/>
	            	<input type="hidden" name="brapiParameter_studyDbId" id="brapiParameter_studyDbId"/>
	            	<input type="hidden" name="brapiParameter_token" id="brapiParameter_token"/>
                    <div class="panel panel-default importFormDiv">
                        <div class="panel-body panel-grey">
                            <div class="form text-center">
                                <div class ="row" style='margin:0 50px 0 25px;'>
	                                <h4>Importing genotyping data in VCF / HapMap / PLINK / Intertek / Flapjack / BrAPI format</h4>
									<p style="transform: rotate(-90deg); position:absolute; left:-60px; margin-top:80px;" class="margin-top-md text-red">Properties followed by * are required</p>
                                </div>
                                <div class ="row" style='margin:0 50px 0 25px;'>
                                    <div class="form-group margin-top-md text-left"<c:if test="${limitToTempData}"> hidden</c:if>>
                                        <div class="row">
                                     	<div class="col-md-2" style="text-align:right;">
                                          <label for="moduleExistingG">Database <span class="text-red">*</span></label>
                                         </div>
                                            <div class="col-md-3">
                                                <select class="selectpicker" id="moduleExistingG" name="moduleExistingG" data-actions-box="true" data-width="100%" data-live-search="true"></select>
                                            </div>
                                            <div class="col-md-3" id="taxonDiv" align="center">
                                            	<div style="float:left;">
                                              <label for="ncbiTaxon">Taxon</label>
                                              <a href="https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi" target="_blank"><img id="igvTooltip" style="cursor:pointer; cursor:hand;" src="images/magnifier.gif" title="Click to find out taxon id. Specifying an id is preferred because it avoids typos."/></a>
                                             </div>
                                             <input type="hidden" id="ncbiTaxonIdNameAndSpecies" name="ncbiTaxonIdNameAndSpecies" />
                                             <input id="ncbiTaxon" name="ncbiTaxon" onblur="grabNcbiTaxon($(this));" onfocus="if (isNaN($(this).attr('title'))) return; $(this).val($(this).attr('title')); $(this).removeAttr('title'); $(this).removeAttr('species');"
                                              class="form-control text-input input-sm" style="min-width:100px; max-width:62%;" type="text" placeholder="Taxon id / name">
											</div>
                                            <div class="col-md-1" style="padding-right:0px;">
                                            	<input id="ploidy" name="ploidy" class="form-control text-input input-sm" type='number' step="1" min="1" placeholder="ploidy" title="Specifying ploidy is recommended for HapMap and Flapjack formats (if left blank, guessing will be attempted and import will take longer)">
                                            </div>
                                            <div class="col-md-3" id="newModuleDiv">
                                                <input id="moduleToImport" name="module" class="form-control text-input input-sm" type='<c:choose><c:when test="${isAdmin}">text</c:when><c:otherwise>hidden</c:otherwise></c:choose>' placeholder="New database name">                                                    
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-group text-left" id="hostGrp">
                                        <div class="row">
                                     	<div class="col-md-2" style="text-align:right;">
                                         	<label for="host">Host</label>
                                         </div>
                                            <div class="col-md-3" id="hostDiv">
                                                <select class="selectpicker" id="host" name="host" data-actions-box="true" data-width="100%" data-live-search="true"></select>
                                            </div>
                                            <c:if test="${!isAdmin}">
                                       			<div class="col-md-3 text-red row">
                                            		<div class="col-md-1 glyphicon glyphicon-warning-sign" style="font-size:20px;"></div>
                                            		<div class="col-md-10" style="font-size:10px; margin-top:-1px;">You may only create temporary databases</div>
                                            	</div>
                                            </c:if>
                                        </div>
                                    </div>
                                    <div class="form-group text-left">
                                        <div class="row">
                                     	<div class="col-md-2" style="text-align:right;">
                                         	<label for="projectExisting">Project <span class="text-red">*</span></label>
                                         </div>
                                            <div class="col-md-3">
                                                <select class="selectpicker" id="projectExisting" name="projectExisting" data-actions-box="true" data-width="100%" data-live-search="true"></select>
                                            </div>
                                            <div class="col-md-4" id="emptyBeforeImportDiv" style="display:none;">
                                                <input type="checkbox" id="clearProjectData" name="clearProjectData" title="If box is ticked, all project runs will be discarded before import">&nbsp;<label class="label-checkbox" title="If box is ticked, all project runs will be discarded before import" for="clearProjectData"> Clear project before import</label>
                                            </div>
                                            <div class="col-md-3">
                                                <input id="projectToImport" name="project" class="form-control text-input input-sm mandatoryGtField" type="text" placeholder="New project name" onchange="if ($(this).val().trim().length > 0) $('#projectDescDiv').show(50); else $('#projectDescDiv').hide(50);">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-group text-left">
                                        <div class="row">
                                     	<div class="col-md-2" style="text-align:right;">
                                          <label for="runExisting">Run <span class="text-red">*</span></label>
                                      </div>
                                            <div class="col-md-3">
                                                <select class="selectpicker" id="runExisting" name="runExisting" data-actions-box="true" data-width="100%" data-live-search="true"></select>
                                            </div>
                                            <div class="col-md-3 text-red" id="overwriteRunWarning" style="display:none; font-size:11px;">
                                                <span class="glyphicon glyphicon-warning-sign" style="font-size:13px;"></span>
                                                Existing run data will be erased!
                                            </div>
                                            <div class="col-md-3">
                                                <input id="runToImport" name="run" class="form-control text-input input-sm mandatoryGtField" type="text" placeholder="New run name">
                                            </div>
                                            <div class="col-md-4">
                                            	<div style="width:100%; position:absolute; margin-top:-90px;" id="projectDescDiv">
                                            		<label for="projectDesc">
                                            			Project description
                                            			<img id="igvTooltip" style="margin-left:10px;" src="images/lightbulb.gif" title='TIP: Publication reference(s) may be specified at the bottom of this text, preceded by "HOW TO CITE"' />
                                            		</label>
                                            		<textarea id="projectDesc" name="projectDesc" style="resize:none; width:100%; height:140px;" class="mandatoryGtField"></textarea>
                                            	</div>
											</div>
                                        </div>
                                    </div>
                                    <div class="row text-left form-group">
                                    	<div class="col-md-2" style="text-align:right;">
                                          <label for="technology">Technology</label>
                                     </div>
                                        <div class="col-md-3">
                                         <input id="technology" name="technology" placeholder="Name of genotyping technology" class="form-control text-input input-sm" type="text">
                                     </div>
                                     <div class="col-md-4"><input type='checkbox' checked sftyle="margin-top:3px;" id="skipMonomorphic" name="skipMonomorphic" /> <label class="bold text-left" for="skipMonomorphic">Skip monomorphic variants</label></div>
                                    </div>
                                    <div>
                                     <div class="row text-left">
                                     	<div class="col-md-2 text-nowrap" style="text-align:right;">
                                           <label for="dataFile1">Data source <span class="text-red">*</span></label>
                                      </div>
                                     	<div class="col-md-10">
                                            <small class="text-info">Text fields may be used to pass an http URL, a <a title="Breeding API, what's this?" href="https://brapi.org/" target="_blank">BrAPI</a> v1.1 endpoint, or an absolute path on webserver filesystem.</small>
                                     		<div class="text-red" style='float:right;'>You may upload up to <span id="maxUploadSize" class="text-bold"></span> Mb. <span id="maxImportSizeSpan"></span></div>
                                      </div>
                                     </div>
 
		                             <div class="row text-left margin-top-md" style="margin-bottom:5px;">
		                             	<div class="col-md-2"></div>
		                             	<div class="col-md-5">
	                                      <div style="text-align:right; position:absolute; width:110px; left:-120px;">
	                                     	<small class="text-info">Only one file may be submitted at once, except for the PLINK format where .ped and .map are expected.</small>
	                                      </div>
                                          <input id="dataFile1" class="form-control input-sm mandatoryGtField" type="text" name="dataFile1" placeholder="First file or BrAPI endpoint">
                                          <input id="dataFile2" class="form-control input-sm margin-top-md mandatoryGtField" type="text" name="dataFile2" placeholder="Second file for PLINK or Flapjack">
                                          <input id="dataFile3" class="form-control input-sm margin-top-md mandatoryGtField" type="text" name="dataFile3" placeholder="Third file (sample / individual mapping)">
                                          <div class='text-red margin-top-md' style='margin-left:-140px; font-size:11px; '><u>NB:</u> If your genotyping data contains sample IDs rather than individual IDs you may supply a tab-delimited file (.tsv or .csv) providing a mapping based on columns named 'individual' and 'sample' (not supported for BrAPI imports)</div>
                                        </div>
                                        <div class="col-md-5">
										   <div class="dz-default dz-message">
		       									<h5 style="margin-top:5px; text-align:center;">... or drop files here or click to upload</h5>
		       									<div class="row">
		       										<div class="col-md-4 text-bold" style="padding:25px;">Accepted extensions:</div>
		       										<div class="col-md-8">
			       										<div><u>VCF format:</u> .vcf</div>
			       										<div><u>Hapmap format:</u> .hapmap or .txt</div>
														<div><u>PLINK format:</u> .ped + .map</div>
			                                            <div><u>Intertek format:</u> .intertek</div>
														<div><u>Flapjack format:</u> .genotype + .map</div>
														<div><u>Sample file:</u> .tsv or .csv (tab-separated)</div>
													</div>
		       									</div>
		      									</div>
		                                   </div>
		                                </div>
		                                <div class="row">
	                                        <div class="col-md-12">
			                                   <div id="dropZonePreviewsG" style="height:55px;"></div>
	                                        </div>
                                     </div>
		                             
								   </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <input type="hidden" id="mixedImport_metadataFile1" name="metadataFile1" />
                    <input type="hidden" id="mixedImport_metadataType" name="metadataType" />
                    <input type="hidden" name="brapiURLs" id="mixedImport_brapiURLs"/>
                    <input type="hidden" name="brapiTokens" id="mixedImport_brapiTokens"/>
	                </form>
                </div>
                
                <div class="tab-pane<c:if test='${param.type eq "metadata"}'> active</c:if>" id="mdTab">
                   	<form autocomplete="off" class="dropzone" id="importDropzoneMD" action="<c:url value='<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.metadataImportSubmissionURL %>' />" method="post">                
                    <input type="hidden" name="brapiURLs" id="brapiURLs"/>
                    <input type="hidden" name="brapiTokens" id="brapiTokens"/>
                    <div class="panel panel-default importFormDiv">
                        <div class="panel-body panel-grey text-center">
                            <h4>Adding metadata to a database's individuals or samples</h4>
                            <div class="row">
                            	<div class="col-md-1"></div>
                                <div class="col-md-4">
                                	<div style="position:absolute;">
                                	<div style="margin-top:-5px; padding:12px; text-align:left; font-style:italic;">
                                		<p>Providing metadata for <span class='mdTypeDisabled'>individual</span>s will enable users to select them by filtering on that metadata.</p>
                                		<p>The expected format is <b>tab separated values</b> (.tsv or .csv extension), or Flapjack's .phenotype file.</p>
                                		<p>The first row in TSV file (header) must contain field labels, one of them must be named "<span class='mdType'></span>".</p>
                                		<p>Other rows must contain field values, with an exact match for <span class='mdType'></span> names in the above column.</p>
                                		<p>Flapjack .phenotype files provide no way of specifying the target entity type, so the selection made in the UI is taken for granted.</p>
                                	</div>
                               		<p></p>
                               		<p style="color:#bb4444;" class='bold' id="metadataScopeDesc"></p>
                               		</div>
                                </div>
                                <div class="col-md-3" id="mdModuleZone">                     
                                    <div class="form-group margin-top text-left">
                                        <label for="moduleExistingMD">Database</label>
                                        <select class="selectpicker mandatoryMdField" id="moduleExistingMD" name="moduleExistingMD" data-actions-box="true" data-width="100%" data-live-search="true"><option></option></select>
                                    </div>                  
                                </div>
                                <div class="col-md-3">                     
                                    <div class="form-group margin-top text-left">
                                        <label>Import metadata on</label>
                                        <select class="selectpicker mandatoryMdField" id="metadataType" name="metadataType" data-actions-box="true" data-width="100%">
                                            <option value="individual">Individuals</option>
                                            <option value="sample">Samples</option>
                                        </select>
                                    </div>                  
                                </div>
                                <div class="col-md-3"></div>
                            </div>
                            <br/>
                            <div class="row">
                            	<div class="col-md-1"></div>
                                <div class="col-md-4"></div>
                                <div class="col-md-6">
                                    <div class="form-group text-left">
                                        <label for="metadataFile1">F<%--irst f--%>ile path or URL</label><br /><small class="text-info">Text field may be used to pass an http URL or an absolute path on webserver filesystem.<br>File upload is supported up to the specified size limit.</small>
                                        <input id="metadataFile1" class="form-control input-sm mandatoryMdField" type="text" name="metadataFile1">
                                    </div>
<%--
                                    <div class="form-group text-left">
                                        <label for="metadataFile2">Second file path or URL</label> <small class="text-muted">Local to webserver or remote (http / ftp)</small>
                                        <input id="metadataFile2" class="form-control input-sm" type="text" name="metadataFile2">
                                    </div>
                                    <div class="row margin-bottom">
                                        <label class="label-checkbox">Clear existing project sequence data before importing <input type="checkbox" name="clearProjectSequences" class="input-checkbox"></label>
                                    </div>
--%>
                                </div>
                            </div>
                            <div class ="row">
                            	<div class="col-md-1"></div>
                                <div class="col-md-4"></div>
                                <div class="col-md-3">
									<div class="dz-default dz-message" style="background-color:#e8e8e8;">
    									<h5>... or drop file here or click to upload<br/><i>(max size: 5 Mb)</i></h5>
    									<div>
    										<b>Accepted extensions:</b>
    										<br/>.tsv or .csv (tab-separated only)
    										<br/>.phenotype
    									</div>
   									</div>
                                </div>
                                <div class="col-md-3 align-text-bottom" id="brapiMetadataNotice" style="padding:0;">
                                </div>
                       		</div>
                            <div class ="row">
                                <div class="col-md-4"></div>
                                <div class="col-md-7 align-text-bottom" id="dropZonePreviewsMD" style="padding:0; text-align:right;">
                                </div>
                            </div>
                        </div>
                    </div>
                    </form>
                </div>
            </div>
        </div>
        <!-- modal which prompts BrAPI user password -->
		<div class="modal fade" tabindex="-1" role="dialog" id="brapiPwdDialog" aria-hidden="true">
			<div class="modal-dialog modal-lg">
				<div class="modal-content">
					<div class="modal-header">
						<form onsubmit="return false;">
							<span class="bold text-info">Please enter password for BrAPI user</span>
							<br/>
							<input type="password" id="brapiPassword" size="25" style="margin:8px;" onkeyup="$('#brapiPasswordApplyButton').attr('disabled', $(this).val().trim().length == 0);" />
							<br/>
							<input class="btn btn-sm btn-default" disabled type="submit" value="Apply" id="brapiPasswordApplyButton" onclick="$('#brapiPwdDialog').modal('hide');" />
							<input style="margin-left:100px;" class="btn btn-sm btn-default" type="button" value="Cancel" onclick="$('#brapiPassword').val(''); $('#brapiPassword').keyup(); $('#brapiPwdDialog').modal('hide');" />
						</form>
					</div>
				</div>
			</div>
		</div>
		<!-- progress modal -->
        <div class="modal fade" tabindex="-1" role="dialog" id="progress" aria-hidden="true">
            <div class="modal-dialog modal-sm margin-top-lg">
                <div class="modal-content modal-progress">
                    <div class="loading text-center" id="progressContents">
<!--                         <div> -->
<!--                             <div class="c1"></div> -->
<!--                             <div class="c2"></div> -->
<!--                             <div class="c3"></div> -->
<!--                             <div class="c4"></div> -->
<!--                         </div> -->
                        <h3 id="progressText" class="loading-message">Please wait...</h3>
                        <button style="display:inline; margin-right:10px;" class="btn btn-danger btn-sm" type="button" name="abort" id='abort' onclick="if (confirm('Are you sure?')) abort($(this).attr('rel'));">Abort</button>
                        <button class="btn btn-info btn-sm" type="button" id="asyncWatch" title="This will open a separate page allowing to watch import progress at any time. Leaving the current page will not abort the import process.">Open async progress watch page</button>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>