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
<%@ page language="java" contentType="text/html; charset=utf-8" import="fr.cirad.web.controller.ga4gh.Ga4ghRestController,fr.cirad.web.controller.gigwa.GigwaRestController,fr.cirad.io.brapi.BrapiService" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<%
	java.util.Properties prop = new java.util.Properties();
	prop.load(getServletContext().getResourceAsStream("/META-INF/MANIFEST.MF"));
	String appVersion = prop.getProperty("Implementation-version");
	String[] splittedAppVersion = appVersion == null ? new String[] {""} : appVersion.split("-");
%>
<c:set var="appVersionNumber" value='<%= splittedAppVersion[0] %>' />
<c:set var="appVersionType" value='<%= splittedAppVersion.length > 1 ? splittedAppVersion[1] : "" %>' />
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
        <script type="text/javascript" src="js/dropzone.js"></script>
		<script type="text/javascript" src="js/brapiV1.1_Client.js"></script>
        <script type="text/javascript">
	    	var progressUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PROGRESS_PATH%>' />";
	    	var tokenURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GET_SESSION_TOKEN%>"/>';
	    	var maxUploadSizeURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.MAX_UPLOAD_SIZE_PATH%>"/>';
            var token;
            var metadataError;
            var maxUploadSizeInMb, maxImportSizeInMb;
        	var BRAPI_V1_URL_ENDPOINT;
        	var brapiParameters;
        	var projectDescriptions = [];
   			var brapiUserName, brapiUserPassword, brapiToken, distinctBrapiMetadataURLs;
   			var extRefIdField = "<%= BrapiService.BRAPI_FIELD_germplasmExternalReferenceId %>";
   			var extRefSrcField = "<%= BrapiService.BRAPI_FIELD_germplasmExternalReferenceSource %>";

            $(function () {
                $('#moduleExistingG').on('change', function () {
                    clearFields();
                    if ($(this).val() !== '- new database -' && $(this).val() !== null) {
                        loadProjects($(this).val());
                        $('#newModuleDiv').hide();
                        $('#taxonDiv').hide();
                        $('#hostGrp').hide();
                    } else {
                        $('#projectExisting').html('<option>- new project -</option>').selectpicker('refresh');
                        $('#runExisting').html('<option>- new run -</option>').selectpicker('refresh');
                        $('#newModuleDiv').show();
                        $('#taxonDiv').show();
                        $('#projectToImport').removeClass('hidden');
                        $('#runToImport').removeClass('hidden');
                        $('#hostGrp').show();
                    }
                    $('#projectExisting').change();
                });
                $('#projectExisting').on('change', function () {
                	$('#emptyBeforeImportDiv').toggle();
                	var projDesc = projectDescriptions[$(this).val()];
                	$("textarea#projectDesc").val(projDesc == null ? "" : projDesc);
                    if ($(this).val() !== '- new project -') {
                        loadRuns();
                        $('#projectToImport').addClass('hidden');
                        $('#emptyBeforeImportDiv').show(100);
                        $('#projectDescDiv').show(100);
                    } else {
                        $('#runExisting').html('<option>- new run -</option>').selectpicker('refresh');
                        $('#projectToImport').removeClass('hidden');
                        $('#emptyBeforeImportDiv').hide(100);
                        $('#projectDescDiv').hide(100);
                    }
                	$('#runExisting').change();
                });

                $('#runExisting').on('change', function () {
                    if ($(this).val() !== '- new run -') {
                        $('#runToImport').hide();
                    	$('#overwriteRunWarning').show();
                    } else {
                        $('#runToImport').show();
                    	$('#overwriteRunWarning').hide();
                    }
                });
                // check if entered char is valid 
                $(".text-input").on("keypress", function (event) {
                    if (!isValidKeyForNewName(event))
                    {
                    	event.preventDefault();
                    	event.stopPropagation();
                    }
                });
                $(".text-input").on("change", function (event) {
                    if (!isValidNewName($(this).val()))
                    	$(this).val("");
                });
                $('#progress').on('hidden.bs.modal', function () {
                    if (!$('#progress').data('error')) {
                        $('.importFormDiv input').prop('disabled', true);
                        $('.importFormDiv button').prop('disabled', true);
                        $('.importFormDiv textarea').prop('disabled', true);
                        if ($('#metadataTab').hasClass("active")) {
                            var link = "<c:url value='/' />?module=" + $('#moduleExistingMD').val(); 
                            $('#progressContents').html('<p class="bold panel" style="padding:10px;">Import complete.<br/>Amended data is now <a href="' + link + '">available here</a></p>');
                            $('#progress').modal('show');
                            new Dropzone("#importDropzoneMD").destroy();
                        } else {
                            var link1 = "<c:url value='/' />?module=" + $("#moduleToImport").val() + "&project=" + $("#projectToImport").val(), link2 = "<c:url value='<%=GigwaRestController.IMPORT_PAGE_URL%>' />?module=" + $("#moduleToImport").val() + "&type=metadata";
                            $('#progressContents').html('<p class="bold panel" style="padding:10px;">Import complete.<br/>Data is now <a style="cursor:pointer;" href="' + link1 + '">available here</a></p><p class="bold panel" style="padding:10px;">You may upload metadata to individuals <a style="cursor:pointer;" href="' + link2 + '">via this link</a></p>');
                            $('#progress').modal('show');
                            new Dropzone("#importDropzoneG").destroy();
                        }
                    }
                    else	// re-add files to the queue if an error occured
                        $.each(new Dropzone($('#metadataTab').hasClass("active") ? "#importDropzoneMD" : "#importDropzoneG").files, function(i, file) {
                            file.status = Dropzone.QUEUED
                        });
                });
                $('#brapiPwdDialog').on('hidden.bs.modal', function () {
                	brapiUserPassword = $('#brapiPassword').val();
                	if (brapiUserPassword .length == 0)
                		$('div#brapiDataSelectionDiv').remove();
                	else
                	{
    					BRAPI_V1_URL_ENDPOINT = $("input[name=dataFile1]").val().trim();
        				if (!checkEndPoint())
        					return failAndHideBrapiDataSelectionDiv();
                		submitBrapiForm();
                	}
                });
                
                $('#brapiPwdDialog').on('shown.bs.modal', function () {
                	$('#brapiPassword').focus();
                });
                
                $('#moduleExistingMD').on('change', function () {
            	    $.ajax({
            	        url: '<c:url value="<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.VARIANTSETS_SEARCH%>"/>',
            	        async: false,
            	        type: "POST",
            	        dataType: "json",
            	        contentType: "application/json;charset=utf-8",
            	        headers: {
            	            "Authorization": "Bearer " + token
            	        },
            	        data: JSON.stringify({
            	            "datasetId": $('#moduleExistingMD').val()//,
            	        }),
            	        success: function(jsonResult) {
            	        	distinctBrapiMetadataURLs = new Set();
            	        	for (var vs in jsonResult.variantSets) {
                        	    $.ajax({
                        	        url: '<c:url value="<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.CALLSETS_SEARCH%>" />',
                        	        type: "POST",
                        	        dataType: "json",
                        	        async:false,
                        	        contentType: "application/json;charset=utf-8",
                        	        headers: {
                        	            "Authorization": "Bearer " + token
                        	        },
                        	        data: JSON.stringify({
                        	            "variantSetId": jsonResult.variantSets[vs].id
                        	        }),
                        	        success: function(individualsResult) {
                        	        	var urlRegexp = new RegExp(/^https?:\/\/.*\/brapi\/?/i);
                        	        	for (var cs in individualsResult.callSets) {
                        	        		var ai = individualsResult.callSets[cs].info;
                        	        		if (ai[extRefIdField] != null && urlRegexp.test(ai[extRefSrcField].toString()))
                        	        			distinctBrapiMetadataURLs.add(ai[extRefSrcField].toString());
                        	        	}
                        	        	updateBrapiNotice();
                        	        },
                        	        error: function(xhr, ajaxOptions, thrownError) {
                        	            handleError(xhr, thrownError);
                        	        }
                        	    });
            	        	}
            	        },
            	        error: function(xhr, ajaxOptions, thrownError) {
            	            $('#searchPanel').hide();
            	            handleError(xhr, thrownError);
            	            $('#module').val("");
            	            $('#grpProj').hide();
            	            return false;
            	        }
            	    });
                });
            });

            $(document).ready(function () {    	   
            	updateBrapiNotice();
    	        $('#moduleProjectNavbar').hide();
                $('[data-toggle="tooltip"]').tooltip({delay: {"show": 300, "hide": 100}});
           		getToken();
                loadModules();
                loadHost();
                $('#runExisting').html('<option>- new run -</option>').selectpicker('refresh');
                
    	        $.ajax({
    	            url: maxUploadSizeURL + "?capped=true",
    	            async: false,
    	            type: "GET",
    	            contentType: "application/json;charset=utf-8",
              	  	headers: {
              	  		"Authorization": "Bearer " + token
              	  	},
    	            success: function(maxUploadSize) {
    	            	maxUploadSizeInMb = parseInt(maxUploadSize);
    	            	$("span#maxUploadSize").html(maxUploadSizeInMb);
    	    	        $.ajax({
    	    	            url: maxUploadSizeURL + "?capped=false",
    	    	            async: false,
    	    	            type: "GET",
    	    	            contentType: "application/json;charset=utf-8",
    	              	  	headers: {
    	              	  		"Authorization": "Bearer " + token
    	              	  	},
    	    	            success: function(maxImportSize) {
    	    	            	if (maxImportSize != null && maxImportSize != "" && maxImportSize != maxUploadSize) {
    	    	            		maxImportSizeInMb = parseInt(maxImportSize);
    	    	            		$("span#maxImportSizeSpan").html("Your local or http import volume is limited to <b>" + maxImportSizeInMb + "</b> Mb.");
    	    	            	}
    	    	            },
    	    	            error: function(xhr, thrownError) {
    	    	                handleError(xhr, thrownError);
    	    	            }
    	    	        });
    	            },
    	            error: function(xhr, thrownError) {
    	                handleError(xhr, thrownError);
    	            }
    	        });
                
                $(function(){
              	  Dropzone.options.importDropzoneG = {
              		maxFiles: 2,
              		previewsContainer: "#dropZonePreviewsG",
              	    dictResponseError: 'Error importing data',
              	    acceptedFiles: ".vcf,.vcf.gz,.bcf,.bcf.gz,.hapmap,.txt,.map,.ped",
              	  	headers: {
              	  		"Authorization": "Bearer " + token
              	  	},
              	  previewTemplate: "<div class=\"dz-preview dz-file-preview\">\n <div class=\"dz-details\">\n  <div class=\"dz-filename\"><span data-dz-name></span></div>\n  <div class=\"dz-size\"><span data-dz-size></span></div>\n  <a style=\"float:right;\" class=\"dz-remove\" href=\"javascript:undefined;\" data-dz-remove>Remove file</a>\n  </div>\n  <div class=\"dz-progress\"><span class=\"dz-upload\" data-dz-uploadprogress></span></div>\n  <div class=\"dz-error-message\"><span data-dz-errormessage></span></div>\n  <div class=\"dz-success-mark\">\n  <svg width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:sketch=\"http://www.bohemiancoding.com/sketch/ns\">\n   <title>Check</title>\n   <defs></defs>\n   <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\" sketch:type=\"MSPage\">\n    <path d=\"M23.5,31.8431458 L17.5852419,25.9283877 C16.0248253,24.3679711 13.4910294,24.366835 11.9289322,25.9289322 C10.3700136,27.4878508 10.3665912,30.0234455 11.9283877,31.5852419 L20.4147581,40.0716123 C20.5133999,40.1702541 20.6159315,40.2626649 20.7218615,40.3488435 C22.2835669,41.8725651 24.794234,41.8626202 26.3461564,40.3106978 L43.3106978,23.3461564 C44.8771021,21.7797521 44.8758057,19.2483887 43.3137085,17.6862915 C41.7547899,16.1273729 39.2176035,16.1255422 37.6538436,17.6893022 L23.5,31.8431458 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\" id=\"Oval-2\" stroke-opacity=\"0.198794158\" stroke=\"#747474\" fill-opacity=\"0.816519475\" fill=\"#FFFFFF\" sketch:type=\"MSShapeGroup\"></path>\n   </g>\n  </svg>\n  </div>\n  <div class=\"dz-error-mark\">\n  <svg width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:sketch=\"http://www.bohemiancoding.com/sketch/ns\">\n   <title>Error</title>\n   <defs></defs>\n   <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\" sketch:type=\"MSPage\">\n    <g id=\"Check-+-Oval-2\" sketch:type=\"MSLayerGroup\" stroke=\"#747474\" stroke-opacity=\"0.198794158\" fill=\"#ff9999\" fill-opacity=\"0.816519475\">\n     <path d=\"M32.6568542,29 L38.3106978,23.3461564 C39.8771021,21.7797521 39.8758057,19.2483887 38.3137085,17.6862915 C36.7547899,16.1273729 34.2176035,16.1255422 32.6538436,17.6893022 L27,23.3431458 L21.3461564,17.6893022 C19.7823965,16.1255422 17.2452101,16.1273729 15.6862915,17.6862915 C14.1241943,19.2483887 14.1228979,21.7797521 15.6893022,23.3461564 L21.3431458,29 L15.6893022,34.6538436 C14.1228979,36.2202479 14.1241943,38.7516113 15.6862915,40.3137085 C17.2452101,41.8726271 19.7823965,41.8744578 21.3461564,40.3106978 L27,34.6568542 L32.6538436,40.3106978 C34.2176035,41.8744578 36.7547899,41.8726271 38.3137085,40.3137085 C39.8758057,38.7516113 39.8771021,36.2202479 38.3106978,34.6538436 L32.6568542,29 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\" id=\"Oval-2\" sketch:type=\"MSShapeGroup\"></path>\n    </g>\n   </g>\n  </svg>\n </div>\n</div>",
              	    init:function(){
              	      var self = this;
              	      self.options.maxFilesize = maxUploadSizeInMb;
              	   	  self.options.autoProcessQueue = false;
              	   	  self.options.uploadMultiple = true;
              	      self.on("sending", function (file) {
              	        $('.meter').show();
              	      });
              	    }
              	  };
              	  
              	  Dropzone.options.importDropzoneMD = {
                    		maxFiles: 1,
                    		previewsContainer: "#dropZonePreviewsMD",
                    	    dictResponseError: 'Error importing data',
                    	    acceptedFiles: ".tsv,.csv",
                    	  	headers: {
                    	  		"Authorization": "Bearer " + token
                    	  	},
                    	  previewTemplate: "<div class=\"dz-preview dz-file-preview\">\n <div class=\"dz-details\">\n  <div class=\"dz-filename\"><span data-dz-name></span></div>\n  <div class=\"dz-size\"><span data-dz-size></span></div>\n  <a style=\"float:right;\" class=\"dz-remove\" href=\"javascript:undefined;\" data-dz-remove>Remove file</a>\n  </div>\n  <div class=\"dz-progress\"><span class=\"dz-upload\" data-dz-uploadprogress></span></div>\n  <div class=\"dz-error-message\"><span data-dz-errormessage></span></div>\n  <div class=\"dz-success-mark\">\n  <svg width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:sketch=\"http://www.bohemiancoding.com/sketch/ns\">\n   <title>Check</title>\n   <defs></defs>\n   <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\" sketch:type=\"MSPage\">\n    <path d=\"M23.5,31.8431458 L17.5852419,25.9283877 C16.0248253,24.3679711 13.4910294,24.366835 11.9289322,25.9289322 C10.3700136,27.4878508 10.3665912,30.0234455 11.9283877,31.5852419 L20.4147581,40.0716123 C20.5133999,40.1702541 20.6159315,40.2626649 20.7218615,40.3488435 C22.2835669,41.8725651 24.794234,41.8626202 26.3461564,40.3106978 L43.3106978,23.3461564 C44.8771021,21.7797521 44.8758057,19.2483887 43.3137085,17.6862915 C41.7547899,16.1273729 39.2176035,16.1255422 37.6538436,17.6893022 L23.5,31.8431458 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\" id=\"Oval-2\" stroke-opacity=\"0.198794158\" stroke=\"#747474\" fill-opacity=\"0.816519475\" fill=\"#FFFFFF\" sketch:type=\"MSShapeGroup\"></path>\n   </g>\n  </svg>\n  </div>\n  <div class=\"dz-error-mark\">\n  <svg width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:sketch=\"http://www.bohemiancoding.com/sketch/ns\">\n   <title>Error</title>\n   <defs></defs>\n   <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\" sketch:type=\"MSPage\">\n    <g id=\"Check-+-Oval-2\" sketch:type=\"MSLayerGroup\" stroke=\"#747474\" stroke-opacity=\"0.198794158\" fill=\"#ff9999\" fill-opacity=\"0.816519475\">\n     <path d=\"M32.6568542,29 L38.3106978,23.3461564 C39.8771021,21.7797521 39.8758057,19.2483887 38.3137085,17.6862915 C36.7547899,16.1273729 34.2176035,16.1255422 32.6538436,17.6893022 L27,23.3431458 L21.3461564,17.6893022 C19.7823965,16.1255422 17.2452101,16.1273729 15.6862915,17.6862915 C14.1241943,19.2483887 14.1228979,21.7797521 15.6893022,23.3461564 L21.3431458,29 L15.6893022,34.6538436 C14.1228979,36.2202479 14.1241943,38.7516113 15.6862915,40.3137085 C17.2452101,41.8726271 19.7823965,41.8744578 21.3461564,40.3106978 L27,34.6568542 L32.6538436,40.3106978 C34.2176035,41.8744578 36.7547899,41.8726271 38.3137085,40.3137085 C39.8758057,38.7516113 39.8771021,36.2202479 38.3106978,34.6538436 L32.6568542,29 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\" id=\"Oval-2\" sketch:type=\"MSShapeGroup\"></path>\n    </g>\n   </g>\n  </svg>\n </div>\n</div>",
                    	    init:function(){
                    	      var self = this;
                    	      self.options.maxFilesize = 5;
                    	   	  self.options.autoProcessQueue = false;
                    	   	  self.options.uploadMultiple = true;
                    	      self.on("sending", function (file) {
                    	        $('.meter').show();
                    	      });
                    	    }
                    	  };
              	})
              	
                $('button#importGenotypesButton').on("click", function() {importGenotypes()});
                $('button#importMetadataButton').on("click", function() {importMetadata()});
            });
            
            function updateBrapiNotice() {
            	if (distinctBrapiMetadataURLs != null && distinctBrapiMetadataURLs.size > 0)
	        		$('div#brapiMetadataNotice').html("<span style='color:#008800;'>This database contains individuals that are linked to BrAPI germplasm records. You may directly click on SUBMIT to import their metadata</span>");
	        	else
	        		$('div#brapiMetadataNotice').html("<span style='color:#ee8800;'>Pulling via BrAPI v1's germplasm-search call is supported in a two-step procedure: (1) Importing metadata fields named <b>" + extRefIdField + "</b> and <b>" + extRefSrcField + "</b> containing respectively <b>germplasmDbId</b> and <b>BrAPI base-URLs</b>; (2) Coming back to this form and submitting<span style='color:#;'>");
            }
            
            function submitBrapiForm() {
    			if ($("div#brapiDataSelectionDiv").length == 0)
    			{
            		var dataFile1Input = $("input[name=dataFile1]");

					if (brapiUserName == "")
						brapiToken == null;
					else
					{
	    				$("#importButton").attr('disabled', 'disabled');
						$("<div id='brapiDataSelectionDiv'><img src='images/progress.gif' /> BrAPI authentication...</div>").insertBefore(dataFile1Input);
						brapiToken = authenticateUser();
						if (brapiToken == null)
							return failAndHideBrapiDataSelectionDiv();
    				}

    				$("#importButton").attr('disabled', 'disabled');
					$("<div id='brapiDataSelectionDiv'><img src='images/progress.gif' /> Querying BrAPI service...</div>").insertBefore(dataFile1Input);
					brapiParameters = null;

    				setTimeout(function() {
        				var mapList = readMapList();
        				var studyList = readStudyList("genotype");
        				$("#importButton").removeAttr('disabled');
        				if (mapList == null || studyList == null)
        					return failAndHideBrapiDataSelectionDiv();
        				if (mapList.length == 0)
        					return failAndHideBrapiDataSelectionDiv("No genome maps found!");
        				if (studyList.length == 0)
        					return failAndHideBrapiDataSelectionDiv("No genotyping studies found!");
        				
        				var mapListSelect = "Select a map <select id='brapiMapList' style='margin-bottom:5px;'>";
        				for (var i=0; i<mapList.length; i++)
        					mapListSelect += "<option value=\"" + mapList[i]['mapDbId'] + "\">" + (mapList[i]['name'] == null ? mapList[i]['mapDbId'] : mapList[i]['name']) + " [" + mapList[i]['markerCount'] + " markers]" + "</option>";
        				mapListSelect += "</select>";
        				var studyListSelect = "Select a study <select id='brapiStudyList'>";
        				for (var i=0; i<studyList.length; i++)
        					studyListSelect += "<option value=\"" + studyList[i]['studyDbId'] + "\">" + studyList[i]['name'] + " [" + readMarkerProfiles(studyList[i]['studyDbId']).length + " samples]" + "</option>";
        				studyListSelect += "</select>";
        				$("div#brapiDataSelectionDiv").html("<div style='float:right; color:#ffffff; font-weight:bold;'><a href='#' title='Close' style='font-weight:bold; float:right; color:#ff0000;' onclick=\"$('div#brapiDataSelectionDiv').remove(); BRAPI_V1_URL_ENDPOINT = null;\">X</a><div style='margin-top:20px;'>Select map and study<br/>then submit again</div></div>" + mapListSelect + "<br/>" + studyListSelect);
    				}, 1);
    				return;
    			}
    			
    			brapiParameters = {studyDbId:$("select#brapiStudyList").val(), mapDbId:$("select#brapiMapList").val()};
            }
            
            function importGenotypes() {
                var host = $("#host").val();
                if ($("#moduleExistingG").val() != '- new database -')
               		$("#moduleToImport").val($("#moduleExistingG").val());
                if ($("#projectExisting").val() != null && $("#projectExisting").val() != '- new project -')
               		$("#projectToImport").val($("#projectExisting").val());
                if ($("#runExisting").val() != '- new run -')
               		$("#runToImport").val($("#runExisting").val());
                var dataFile1 = $("#dataFile1").val().trim();
                var dataFile2 = $("#dataFile2").val().trim();

                if (!isValidNewName($("#moduleToImport").val()) || !isValidNewName($("#projectToImport").val()) || !isValidNewName($("#runToImport").val())) {
                    alert("Database, project and run names must only consist in digits, accentless letters, dashes and hyphens!");
                    $('#progress').modal('hide');
                    return;
                }
                <c:if test="${!isAdmin}">
                if ($("#moduleToImport").val() == "")
                	$("#moduleToImport").val(hashCode(token).toString(16) + "O" + hashCode(Date.now()).toString(16));
                </c:if>
                                
                var importDropzoneG = new Dropzone("#importDropzoneG");                 
                if (importDropzoneG.getRejectedFiles().length > 0) {
                    alert("Please remove any rejected files before submitting!");
                    $('#progress').modal('hide');
                    return;
                }

                if (maxImportSizeInMb != null) {
	                var totalDataSize = 0, compressedFileWarning = "";
	                for (var i=0; i<importDropzoneG.getAcceptedFiles().length; i++)
	                {
	                	var decompressionFactor = importDropzoneG.getAcceptedFiles()[i].name.toLowerCase().endsWith(".gz") ? 20 : 1;
	                	if (decompressionFactor != 1)
	                		compressedFileWarning = "\nNote that bgzipped files are considered to have 20x compression.";
	               		totalDataSize += decompressionFactor * importDropzoneG.getAcceptedFiles()[i].size;
	                }
	                if (totalDataSize > maxImportSizeInMb * 1024 * 1024)
	                {
	                    alert("Import size limit (" + maxImportSizeInMb + " Mb) exceeded!" + compressedFileWarning);
	                    $('#progress').modal('hide');
	                    return;
	                }
                }

                var totalDataSourceCount = importDropzoneG.getAcceptedFiles().length + (dataFile1 != "" ? 1 : 0) + (dataFile2 != "" ? 1 : 0);
                if (totalDataSourceCount > 2) {
                    alert("You may not provide more than 2 data-source entries!");
                    $('#progress').modal('hide');
                    return;
                }
                
                var moduleOrProjectMissing = $("#moduleToImport").val() == "" || $("#projectToImport").val() == "";
				if (moduleOrProjectMissing)
            	{
                   	alert("You must specify a " + ($("#moduleToImport").val() == "" ? "database!" : "project!"));
                    $('#progress').modal('hide');
                    return;
            	}
				
                if (totalDataSourceCount < 1)
                {
               		var projectDescInInterface = $("textarea#projectDesc").val();
                	if (projectDescInInterface == "")
                		projectDescInInterface = null;
                	var descHasChanged = projectDescInInterface != projectDescriptions[$("#projectToImport").val()];
					if (!descHasChanged || !confirm("Only project description has been specified. Please confirm this is all you want to update."))
                	{
						if (!descHasChanged)
	                    	alert("You must provide some data to import or a project description!");
	                    $('#progress').modal('hide');
	                    return;
                	}
                }
                else if ($("#runToImport").val() == "")
                {
                   	alert("You must specify a run!");
                    $('#progress').modal('hide');
                    return;
                }

        		var dataFile1Input = $("input[name=dataFile1]");
        		var dataFile1 = dataFile1Input.val().trim(), dataFile2 = $("input[name=dataFile2]").val().trim();
        		if (dataFile2.length > 0 && dataFile1.length == 0)
                {
                   	alert("You may only use the second field along with the first!");
                    $('#progress').modal('hide');
                    return;
                }

        		var source1Uri = dataFile1.toLowerCase();
        		if (source1Uri.startsWith("http") && source1Uri.toLowerCase().indexOf("brapi") != -1)
        		{
        			if (source1Uri.indexOf("/brapi/v1") > -1 && !(source1Uri.endsWith("/brapi/v1") || source1Uri.endsWith("/brapi/v1/")))
        			{
        				alert("BrAPI base-url should end with /brapi/v1");
        				return;
        			}
        			
    				BRAPI_V1_URL_ENDPOINT = dataFile1Input.val().trim();
    				if (!checkEndPoint())
    					return failAndHideBrapiDataSelectionDiv();
    				var brapiUserNameMatches = source1Uri.match(/https?:\/\/(.*)@.*/);
        			brapiUserName = brapiUserNameMatches == null ? "" : brapiUserNameMatches[brapiUserNameMatches.length - 1];
         			if (brapiToken == null && brapiUserName.length > 0) {
    					if (!supportsAuthentication)
    					{
    						alert("This BrAPI service does not support authentication!");
    						return failAndHideBrapiDataSelectionDiv();
    					}
    					
        				$('#brapiPwdDialog').modal({backdrop: 'static', keyboard: false, show: true});
        				return;
         			}
         			else
         			{
         				submitBrapiForm();
         				if (typeof brapiParameters == 'undefined' || brapiParameters == null)
         					return;		// just displayed the selection div
         			}
        		}

        		if (typeof brapiParameters != 'undefined' && brapiParameters != null)
        		{
        			$('#brapiParameter_mapDbId').val(brapiParameters['mapDbId']);
        			$('#brapiParameter_studyDbId').val(brapiParameters['studyDbId']);
        		}

                $('#progress').modal({backdrop: 'static', keyboard: false, show: true});

                $('#progress').data('error', false);
                var taxonDetailsFieldContents = new Array();
                if ($("#ncbiTaxon").attr('title') != "")
                {
                	taxonDetailsFieldContents.push($("#ncbiTaxon").attr('title'));
	                taxonDetailsFieldContents.push($("#ncbiTaxon").val() == $("#ncbiTaxon").attr('species') ? "" : $("#ncbiTaxon").val());
	                taxonDetailsFieldContents.push($("#ncbiTaxon").attr('species'));
                }
                
				$("#ncbiTaxonIdNameAndSpecies").val(taxonDetailsFieldContents.join(":"));
                if (importDropzoneG.getQueuedFiles().length > 0)
                	importDropzoneG.processQueue();
                else
                {
                    var blob = new Blob();
                    blob.upload = { name:"nofiles" };
                    importDropzoneG.uploadFile(blob);
                }

                displayProcessProgress(5, token);
       		}

            function importMetadata() {
                var importDropzoneMD = new Dropzone("#importDropzoneMD");                 
                if (importDropzoneMD.getRejectedFiles().length > 0) {
                    alert("Please remove any rejected files before submitting!");
                    $('#progress').modal('hide');
                    return;
                }
                
                if ($('#moduleExistingMD').val() == "") {
                	alert("Please select a database!");
                	return;
                }
                
                var dataFile1 = $("#metadataFilePath1").val().trim();
<%--  		        var dataFile2 = $("#metadataFilePath2").val().trim(); --%>

				var providedFileCount = importDropzoneMD.getAcceptedFiles().length + (dataFile1 != "" ? 1 : 0) <%--+ (dataFile2 != "" ? 1 : 0)--%>;
				if (providedFileCount > 1) {
				    alert("You may not provide more than 1 metadata source!");
				    $('#progress').modal('hide');
				    return;
				}

				if (dataFile1 == "" && importDropzoneMD.getAcceptedFiles().length == 0 && distinctBrapiMetadataURLs.size > 0) {
					$('#brapiURLs').val("");
					$('#brapiTokens').val("");
        			distinctBrapiMetadataURLs.forEach(function(brapiUrl) {
	        			var brapiToken = prompt("Please enter token for\n" + brapiUrl + "\n(leave blank if unneeded, cancel to skip BrAPI source)");
	        			if (brapiToken == null)
	        				return;
						var fFirstEntry = $('#brapiURLs').val() == "";
        				$('#brapiURLs').val($('#brapiURLs').val() + (fFirstEntry ? "" : " ; ") + brapiUrl);
        				$('#brapiTokens').val($('#brapiTokens').val() + (fFirstEntry ? "" : " ; ") + brapiToken);
        			});
        		}

                if (providedFileCount + ($('#brapiURLs').val() == "" ? 0 : 1) < 1) {
                	if (distinctBrapiMetadataURLs.size == 0)
                    	alert("You must provide a metadata file!");
                    $('#progress').modal('hide');
                    return;
                }

                $('#progress').data('error', false);
                $('#progress').modal({backdrop: 'static', keyboard: false, show: true});
                if (importDropzoneMD.getQueuedFiles().length > 0)
                	importDropzoneMD.processQueue();
                else
                {
                    var blob = new Blob();
                    blob.upload = { name:"nofiles" };
                    importDropzoneMD.uploadFile(blob);
                }

                displayProcessProgress(5, token);
            }
            
        	function isValidKeyForNewName(evt) {
                 return isValidCharForNewName((evt.which) ? evt.which : evt.keyCode);
        	}

            function isValidCharForNewName(charCode) {
                return ((charCode >= 48 && charCode <= 57) || (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122) || charCode == 8 || charCode == 9 || charCode == 35 || charCode == 36 || charCode == 37 || charCode == 39 || charCode == 45 || charCode == 46 || charCode == 95);
            }

            function isValidNewName(newName) {
                for (var i = 0; i < newName.length; i++)
                    if (!isValidCharForNewName(newName.charCodeAt(i)))
                        return false;
                return true;
            }

            function loadHost() {
                $.ajax({
                    url: "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.HOSTS_PATH%>' />",
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    headers: {
                        "Authorization": "Bearer " + token
                    },
                    success: function (jsonResult) {
                        var option = '';
                        for (var host in jsonResult.host) {
                            option += '<option>' + jsonResult.host[host] + '</option>';
                        }
                        $('#host').html(option).selectpicker('refresh');
                        $('#host').val(0).selectpicker('refresh');
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        handleError(xhr, thrownError);
                    }
                });
            }

            function loadModules() {
                $.ajax({
                    url: "<c:url value='<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.REFERENCESETS_SEARCH%>' />",
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Writable": true
                    },
                    data: JSON.stringify({
                        "assemblyId": null,
                        "md5checksum": null,
                        "accession": null,
                        "pageSize": null,
                        "pageToken": null
                    }),
                    success: function (jsonResult) {
                        $('#moduleExistingG').html("<option>- new database -</option>").selectpicker('refresh');

                        var options = "";
                        for (var set in jsonResult.referenceSets)
                            options += '<option>' + jsonResult.referenceSets[set].name + '</option>';

                        $('#moduleExistingG').append(options).selectpicker('refresh');
                        <c:if test="${!(empty param.module)}">
	                        $('#moduleExistingG').val('${param.module}').selectpicker('refresh');
	                        $('#moduleExistingG').change();
                        </c:if>
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        handleError(xhr, thrownError);
                    }
                });
                
                $.ajax({
                    url: "<c:url value='<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.REFERENCESETS_SEARCH%>' />",
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    headers: {
                        "Authorization": "Bearer " + token
                    },
                    data: JSON.stringify({
                        "assemblyId": null,
                        "md5checksum": null,
                        "accession": null,
                        "pageSize": null,
                        "pageToken": null
                    }),
                    success: function (jsonResult) {
                        var options = "";
                        for (var set in jsonResult.referenceSets)
                            options += '<option>' + jsonResult.referenceSets[set].name + '</option>';
                            
//         	        		$('#module').append('<option>' + passedModule + '</option>').selectpicker('refresh');
//         	        		$('#module').val(passedModule);

                        $('#moduleExistingMD').append(options).selectpicker('refresh');

    	        		var passedModule = $_GET("module");
    	        		if (passedModule != null)
    	        			passedModule = passedModule.replace(new RegExp('#([^\\s]*)', 'g'), '');
//     	        		console.log($('#moduleExistingMD option').map((index, option) => option.value));
                        <c:if test="${!(empty param.module)}">
    	        			if (!arrayContains($('#moduleExistingMD option').map((index, option) => option.value), passedModule)) {
    	    	        		$('#moduleExistingMD').append('<option>' + passedModule + '</option>').selectpicker('refresh');
    	    	        		$('#moduleExistingMD').val(passedModule);
//     	    	        		referenceset = passedModule;
//     	    	        		if (passedModule.length >= 15 && passedModule.length <= 17)
//     	    	        		{
//     	    	        			var splitModule = passedModule.split("O");
//     	    	        			if (splitModule.length == 2 && isHex(splitModule[0]) && isHex(splitModule[1]))
//     	    	        				alert("This data will be accessible only via the current URL. It will be erased 24h after its creation.");
//     	    	        		}
    	        			}
                        </c:if>

                        <c:if test="${!(empty param.module)}">
	                        $('#moduleExistingMD').val('${param.module}').selectpicker('refresh');
	                        $('#moduleExistingMD').change();
                  		</c:if>
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        handleError(xhr, thrownError);
                    }
                });
            }

            function loadProjects(module) {
                $.ajax({
                    url: "<c:url value='<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.VARIANTSETS_SEARCH%>' />",
                    async: false,
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Writable": true
                    },
                    data: JSON.stringify({
                        "datasetId": module,
                        "pageSize": null,
                        "pageToken": null
                    }),
                    success: function (jsonResult) {
                        var option = "";
                        for (var set in jsonResult.variantSets) {
                        	var project = jsonResult.variantSets[set];
                        	for (var mdObjKey in project.metadata)
                        		if ("description" == project.metadata[mdObjKey].key)
                        		{
                        			projectDescriptions[project.name] = project.metadata[mdObjKey].value;
                        			break;
                        		}
                        	var isNewProject = Object.keys(project).length == 0; 
                            option += '<option data-id="' + (isNewProject ? "" : project.id) + '">' + (isNewProject ? "- new project -" : project.name) + '</option>';
                        }
                        $('#projectExisting').html(option).selectpicker('refresh');
                        $('#projectExisting').val(0).selectpicker('refresh');
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        handleError(xhr, thrownError);
                    }
                });
            }

            function loadRuns() {
                $.ajax({
                    url: "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PROJECT_RUN_PATH%>' />/" + encodeURIComponent($('#projectExisting :selected').data("id")),
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    headers: {
                        "Authorization": "Bearer " + token
                    },
                    success: function (jsonResult) {
                        var option = "<option>- new run -</option>";
                        for (var run in jsonResult.runs) {
                            option += '<option>' + jsonResult.runs[run] + '</option>';
                        }
                        $('#runExisting').html(option).selectpicker('refresh');
                        $('#runExisting').val(0).selectpicker('refresh');
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        handleError(xhr, thrownError);
                    }
                });
            }

            function clearFields() {
                $('#module').val("");
                $('#project').val("");
                $('#run').val("");
                $('#vcfImportSuccessText').html("");
            }
        </script>
    </head>
    <body>
        <%@include file="../../../navbar.jsp" %>
        <div class="container margin-top-md">
            <ul class="nav nav-tabs" style="border-bottom:0;">
                <li id="vcfTab" class="<c:if test='${param.type ne "metadata"}'> active</c:if>"><a class="nav-link active" href="#tab1" data-toggle="tab" id="genotypeImportNavLink">Genotype import</a></li>
                <li id="metadataTab" class="<c:if test='${param.type eq "metadata"}'> active</c:if>"><a class="nav-link" href="#tab2" data-toggle="tab" id="metadataImportNavLink">Metadata import</a></li>
            </ul>
            <div class="tab-content">
                <div class="tab-pane<c:if test='${param.type ne "metadata"}'> active</c:if>" id="tab1">
            	<form autocomplete="off" class="dropzone" id="importDropzoneG" action="<c:url value='<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.genotypeImportSubmissionURL%>' />" method="post">
	            	<input type="hidden" name="brapiParameter_mapDbId" id="brapiParameter_mapDbId"/>
	            	<input type="hidden" name="brapiParameter_studyDbId" id="brapiParameter_studyDbId"/>
                    <div class="panel panel-default importFormDiv">
                        <div class="panel-body panel-grey">
                            <div class="form text-center">
                                <div class ="row">
                                    <div class="col-md-1" style="text-align:right;"></div>
                                    <div class="col-md-10">
                                        <h4>Importing genotyping data in VCF / HapMap / PLINK / BrAPI format</h4>
											<p class="margin-top-md text-red">Properties followed by * are required</p>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-1" style="text-align:right;"></div>
                                    <div class="col-md-10">
                                        <div class="form-group margin-top-md text-left"<c:if test="${limitToTempData}"> hidden</c:if>>
                                            <div class="row" id="rowModuleExisting">
	                                        	<div class="col-md-2" style="text-align:right;">
		                                            <label for="moduleExistingG">Database <span class="text-red">*</span></label>
	                                            </div>
                                                <div class="col-md-3">
                                                    <select class="selectpicker" id="moduleExistingG" class="moduleExisting" name="moduleExistingG" data-actions-box="true" data-width="100%" data-live-search="true"></select>
                                                </div>
                                                <div class="col-md-4" id="taxonDiv" align="center">
                                                	<div style="float:left;">
		                                                <label for="ncbiTaxon">Taxon</label>
		                                                <a href="https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi" target="_blank"><img id="igvTooltip" style="cursor:pointer; cursor:hand;" src="images/magnifier.gif" title="Click to find out taxon id. Specifying an id is preferred because it avoids typos."/></a>
	                                                </div>
	                                                <input type="hidden" id="ncbiTaxonIdNameAndSpecies" name="ncbiTaxonIdNameAndSpecies" />
	                                                <input id="ncbiTaxon" name="ncbiTaxon" 
		                                                onblur="grabNcbiTaxon($(this));"
		                                                onfocus="if (isNaN($(this).attr('title'))) return; $(this).val($(this).attr('title')); $(this).removeAttr('title'); $(this).removeAttr('species');"
		                                                class="form-control text-input input-sm" style="min-width:100px; max-width:62%;" type="text" placeholder="Taxon id / name">
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
	                                                <div class="col-md-3 text-red" style="font-size:11px;">
                                                		<span class="glyphicon glyphicon-warning-sign" style="font-size:14px;"></span>
                                                		You are only allowed to create temporary databases
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
                                                <div class="col-md-3" id="emptyBeforeImportDiv" style="display:none;">
                                                    <input type="checkbox" id="clearProjectData" name="clearProjectData" title="If box is ticked, all project runs will be discarded before import">&nbsp;<label class="label-checkbox" title="If box is ticked, all project runs will be discarded before import" for="clearProjectData"> Clear project before import</label>
                                                </div>
                                                <div class="col-md-3">
                                                    <input id="projectToImport" name="project" class="form-control text-input input-sm" type="text" placeholder="New project name" onchange="if ($(this).val().trim().length > 0) $('#projectDescDiv').show(50); else $('#projectDescDiv').hide(50);">
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
                                                    <input id="runToImport" name="run" class="form-control text-input input-sm" type="text" placeholder="New run name">
                                                </div>
                                                <div class="col-md-4">
                                                	<div style="width:100%; position:absolute; margin-top:-90px;" id="projectDescDiv">
                                                		<label for="projectDesc">
                                                			Project description
                                                			<img id="igvTooltip" style="margin-left:10px;" src="images/lightbulb.gif" title='TIP: Publication reference(s) may be specified at the bottom of this text, preceded by "HOW TO CITE"' />
                                                		</label>
                                                		<textarea id="projectDesc" name="projectDesc" style="resize:none; width:100%; height:140px;"></textarea>
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
	                                        <div class="col-md-3"></div>
                                        </div>
                                        <div>
	                                        <div class="row text-left">
	                                        	<div class="col-md-2 text-nowrap" style="text-align:right;">
		                                             <label for="dataFile1">Data source <span class="text-red">*</span></label>
		                                        </div>
	                                        	<div class="col-md-10">
	                                        		<small class="text-info">Text fields may be used to pass an http URL, a <a title="Breeding API, what's this?" href="https://brapi.org/" target="_blank">BrAPI</a> v1.1 endpoint
													<img src="images/lightbulb.gif" title="If you need to authenticate on the BrAPI server please specify username@ before domain name or IP to be prompted for a password"/>,
	                                        		or an absolute path on webserver filesystem.</small>
	                                        		<div class="text-red">You may upload up to <span id="maxUploadSize" class="text-bold"></span> Mb. <span id="maxImportSizeSpan"></span></div>
		                                        </div>
	                                        </div>
	                                        <div class="row text-left" style="margin-bottom:5px;">
	                                        	<div class="col-md-2"></div>
	                                        	<div style="text-align:right; position:absolute; width:110px;">
	                                        		<small class="text-info">Only one file may be submitted at once, except for the PLINK format where .ped and .map are expected.</small>
	                                        	</div>
	                                            <div class="col-md-5">
		                                            <input id="dataFile1" class="form-control input-sm" type="text" name="dataFile1" placeholder="First file or BrAPI endpoint">
		                                        </div>
	                                            <div class="col-md-5">
		                                            <input id="dataFile2" class="form-control input-sm" type="text" name="dataFile2" placeholder="Second file for PLINK (ped + map)">
		                                        </div>
	                                        </div>
			                                <div class ="row">
			                                	<div class="col-md-2"></div>
			                                    <div class="col-md-5" id="dropZonePreviewsG"></div>
			                                    <div class="col-md-4" style="padding-right:0;">
													<div class="dz-default dz-message" style="background-color:#e8e8e8;">
				       									<h5>... or drop files here or click to upload <div style='font-style:italic; display:inline'></div></h5>
				       									<div>
				       										<b>Accepted extensions:</b>
				       										<br/>.vcf
				       										<br/>.hapmap or .txt
															<br/>.ped + .map
				       									</div>
			       									</div>
			                                    </div>
			                                    <div class="col-md-1">
				                                    <button class="btn btn-primary btn-sm" style='margin-top:50px;' id="importGenotypesButton" type="button">Submit</button>
			                                    </div>
			                                </div>
	                                	</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
	                </form>
                </div>
                
                <div class="tab-pane<c:if test='${param.type eq "metadata"}'> active</c:if>" id="tab2">
                   	<form autocomplete="off" class="dropzone" id="importDropzoneMD" action="<c:url value='<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.metadataImportSubmissionURL%>' />" method="post">                
                    <input type="hidden" name="brapiURLs" id="brapiURLs"/>
                    <input type="hidden" name="brapiTokens" id="brapiTokens"/>
                    <div class="panel panel-default importFormDiv">
                        <div class="panel-body panel-grey text-center">
                            <h4>Adding metadata to existing database</h4>
                            <div class="row">
                            	<div class="col-md-1"></div>
                                <div class="col-md-4">
                                	<div style="position:absolute; margin-top:-5px; padding:12px; text-align:left; font-style:italic;">
                                		<p>Providing metadata for individuals will enable users to select them by filtering on that metadata.</p>
                                		<p>The expected format is <b>tab separated values</b> (.tsv or .csv extension).</p>
                                		<p>The first row in the file (header) must contain field labels, one of them must be named "individual".</p>
                                		<p>Other rows must contain field values, with an exact match for individual names in the above column.</p>
                                		<p class="bold">The following BrAPI fields are supported for export via the germplasm-search call:</p>
										accessionNumber, acquisitionDate, biologicalStatusOfAccessionCode, commonCropName, countryOfOriginCode, defaultDisplayName, genus, germplasmDbId, germplasmPUI, instituteCode, instituteName, pedigree, seedSource, species, speciesAuthority, subtaxa, subtaxaAuthority, typeOfGermplasmStorageCode, 
                                	</div>
                                </div>
                                <div class="col-md-3">                     
                                    <div class="form-group margin-top text-left">
                                        <label for="moduleExistingMD">Database</label>
                                        <select class="selectpicker" id="moduleExistingMD" class="moduleExisting" name="moduleExistingMD" data-actions-box="true" data-width="100%" data-live-search="true"><option></option></select>
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
                                        <label for="metadataFilePath1">F<%--irst f--%>ile path or URL</label><br /><small class="text-info">Text field may be used to pass an http URL or an absolute path on webserver filesystem.<br>File upload is supported up to the specified size limit.</small>
                                        <input id="metadataFilePath1" class="form-control input-sm" type="text" name="metadataFilePath1">
                                    </div>
<%--
                                    <div class="form-group text-left">
                                        <label for="metadataFilePath2">Second file path or URL</label> <small class="text-muted">Local to webserver or remote (http / ftp)</small>
                                        <input id="metadataFilePath2" class="form-control input-sm" type="text" name="metadataFilePath2">
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
    										<br/>.tsv or .csv
    										<br/>(tab-separated only)
    									</div>
   									</div>
                                </div>
                                <div class="col-md-4 align-text-bottom" id="dropZonePreviewsMD">
                                	<div style='height:100px;'>
			                        	<div id="brapiMetadataNotice"></div>
			                        </div>
									<button class="btn btn-primary btn-sm" id="importMetadataButton" type="button">Submit</button><br/>
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
                        <button class="btn btn-info btn-sm" type="button" onclick="window.open('ProgressWatch.jsp?token=' + token + '&successURL=' + escape('<c:url value='/' />?' + 'module=' + $('#moduleToImport').val() + '&project=' + $('#projectToImport').val()));" title="This will open a separate page allowing to watch import progress at any time. Leaving the current page will not abort the import process.">Open async progress watch page</button>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>