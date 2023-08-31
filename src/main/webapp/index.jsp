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
<%@ page language="java" session="false" contentType="text/html; charset=utf-8" pageEncoding="UTF-8" import="fr.cirad.utils.Constants,fr.cirad.mgdb.model.mongo.subtypes.AbstractVariantData,org.brapi.v2.api.ServerinfoApi,org.brapi.v2.api.ReferencesetsApi,org.brapi.v2.api.ReferencesApi,fr.cirad.web.controller.rest.BrapiRestController,fr.cirad.tools.Helper,fr.cirad.web.controller.ga4gh.Ga4ghRestController,fr.cirad.web.controller.gigwa.GigwaRestController,fr.cirad.mgdb.model.mongo.subtypes.ReferencePosition,fr.cirad.mgdb.model.mongo.maintypes.VariantData"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>

<jsp:useBean id="appConfig" class="fr.cirad.tools.AppConfig" />
<c:set var="googleAnalyticsId" value="<%= appConfig.get(\"googleAnalyticsId\") %>"></c:set>

<%
	java.util.Properties prop = new java.util.Properties();
	prop.load(getServletContext().getResourceAsStream("/META-INF/MANIFEST.MF"));
	String appVersion = prop.getProperty("Implementation-version");
	String[] splittedAppVersion = appVersion == null ? new String[] {""} : appVersion.split("-");
%>
<c:set var="appVersionNumber" value='<%= splittedAppVersion[0] %>' />
<c:set var="appVersionType" value='<%= splittedAppVersion.length > 1 ? splittedAppVersion[1] : "" %>' />
<c:set var="idSep" value='<%= Helper.ID_SEPARATOR %>' />

<html>
<head>
<meta charset="utf-8">
<meta http-equiv="cache-control" content="no-cache" />
<meta name="google" content="notranslate">

<title>Gigwa <%= appVersion == null ? "" : ("v" + appVersion)%></title>
<link rel="shortcut icon" href="images/favicon.png" type="image/x-icon" />
<link type="text/css" rel="stylesheet" href="css/bootstrap-select.min.css ">
<link type="text/css" rel="stylesheet" href="css/bootstrap.min.css">
<link type="text/css" rel="stylesheet" href="css/main.css">
<script type="text/javascript" src="js/jquery-1.12.4.min.js"></script>
<script type="text/javascript" src="js/bootstrap-select.min.js"></script>
<script type="text/javascript" src="js/bootstrap.min.js"></script>
<script type="text/javascript" src="js/jquery.flot.min.js"></script>
<script type="text/javascript" src="js/jquery.flot.selection.js" async></script>
<script type="text/javascript" src="js/multiple-select-big.js"></script>
<script type="text/javascript" src="js/main.js"></script>
<script type="text/javascript" src="js/highcharts.js"></script>
<script type="text/javascript" src="js/highcharts/exporting.js"></script>
<script type="text/javascript" src="js/highcharts/export-data.js"></script>
<script type="text/javascript" src="js/igv.min.js"></script>
<script type="text/javascript" src="js/IgvCsvSearchReader.js"></script>
<script type="text/javascript" src="js/ajax-bootstrap-select.min.js"></script>
<script type="text/javascript">
	// global variables
	var token; // identifies the current interface instance
	var referenceset = "";
	var individualSubSet;
	var count;
	var processAborted = false;
	var firstSeq;
	var firstType;
	var sortBy = "";
	var sortDesc = false;
	var seqPath = "<%= ReferencePosition.FIELDNAME_SEQUENCE %>";
	var posPath = "<%= ReferencePosition.FIELDNAME_START_SITE %>";
	var currentPageToken;
	var graph;
	var idSep ="${idSep}";
	
	// plot graph option 
	var options = {
		legend: {
			show: true
		},
		series: {
			lines: {
				show: true
			},
			points: {
				show: false
			}
		},
		yaxis: {
			ticks: 10
		},
		selection: {
			mode: "xy"
		}
	};
	var rangeMin = 0;
	var rangeMax = -1;
	var runList = [];
	var seqCount;
	var indCount;
	var variantTypesCount;
	var variantId;
	var alleleCount;
	var vcfFieldHeaders;
	var exporting = false;
	var isAnnotated = false;
	var gtTable;
	var ploidy = 2;
	var projectDescriptions = [];
	var dbDesc;
	var searchableVcfFieldListURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.SEARCHABLE_ANNOTATION_FIELDS_URL %>" />';
	var vcfFieldHeadersURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.ANNOTATION_HEADERS_PATH %>" />';
	var progressUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PROGRESS_PATH%>' />";
	var abortUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.ABORT_PROCESS_PATH%>' />";
	var variantTypesListURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.VARIANT_TYPES_PATH%>" />';
	var selectionDensityDataURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.DENSITY_DATA_PATH %>" />';
	var selectionFstDataURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.FST_DATA_PATH %>" />';
	var selectionTajimaDDataURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.TAJIMAD_DATA_PATH %>" />';
	var distinctSequencesInSelectionURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.DISTINCT_SEQUENCE_SELECTED_PATH %>" />';
	var tokenURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GET_SESSION_TOKEN%>"/>';
	var clearTokenURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.CLEAR_TOKEN_PATH%>" />';
	var galaxyPushURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GALAXY_HISTORY_PUSH%>" />';
	var downloadURL;
	var genotypeInvestigationMode = 0;
	var callSetResponse = [];
	var callSetMetadataFields = [];
	var gotMetaData = false;
	var referenceNames;
	var exportedIndividualCount = 0;
	
	$.ajaxSetup({cache: false});

	var defaultGenomeBrowserURL, onlineOutputTools = new Array();
        
    var stringVariantIdsFromUploadFile = null;

	// when HTML/CSS is fully loaded
	$(document).ready(function() {
		$('#module').on('change', function() {
			$('#serverExportBox').hide();
			if (referenceset != '')
				dropTempColl(false);

			referenceset = $(this).val();

			if (!loadProjects(referenceset))
				return;

			$("div#welcome").hide();

			$.ajax({
				url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.DEFAULT_GENOME_BROWSER_URL%>" />?module=' + referenceset,
				async: false,
				type: "GET",
				contentType: "application/json;charset=utf-8",
				success: function(url) {
					defaultGenomeBrowserURL = url;
					
					$("input#genomeBrowserURL").val(localStorage.getItem("genomeBrowserURL-" + referenceset));
					if ($("input#genomeBrowserURL").val() == "")
						$("input#genomeBrowserURL").val(defaultGenomeBrowserURL);
				},
				error: function(xhr, thrownError) {
					handleError(xhr, thrownError);
				}
			});

			$.ajax({
				url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.ONLINE_OUTPUT_TOOLS_URL%>" />?module=' + referenceset,
				async: false,
				type: "GET",
				contentType: "application/json;charset=utf-8",
				success: function(labelsAndURLs) {
					onlineOutputTools = labelsAndURLs;
					var options = "<option value='Custom tool'>Custom tool</option>";
					for (var label in labelsAndURLs)
						options += '<option value="' + label + '">' + label + '</option>';
					$("#onlineOutputTools").html(options);
					onlineOutputTools["Custom tool"] = {"url" : "", "formats" : ""};
					configureSelectedExternalTool();
				    $('#galaxyInstanceURL').val(localStorage.getItem("galaxyInstanceURL"));
				},
				error: function(xhr, thrownError) {
					handleError(xhr, thrownError);
				}
			});

			if (localStorage.getItem("genomeBrowserURL-" + referenceset) == null && defaultGenomeBrowserURL != null && defaultGenomeBrowserURL != "")
				localStorage.setItem("genomeBrowserURL-" + referenceset, defaultGenomeBrowserURL);
						
			checkBrowsingBoxAccordingToLocalVariable();
			$('input#browsingAndExportingEnabled').change();
			igvRemoveExistingBrowser();
			igvChangeModule(referenceset);
		});
		
		$('#project').on('change', function() {
			count = 0;
			$("table#individualFilteringTable").html("");
			$('#countResultPanel').hide();
			$('#rightSidePanel').hide();
			$("#grpAsm").hide();
			
			$.ajax({	// load assemblies
				url: '<c:url value="<%=GigwaRestController.REST_PATH + ServerinfoApi.URL_BASE_PREFIX + '/' + ReferencesetsApi.searchReferenceSetsPost_url%>" />',
				type: "POST",
				dataType: "json",
				async: false,
				contentType: "application/json;charset=utf-8",
		        headers: buildHeader(token, $('#assembly').val()),
				data: JSON.stringify({
					"studyDbIds": [getProjectId()]
				}),
				success: function(jsonResult) {
					$('#assembly').html("");
					jsonResult.result.data.forEach(refSet => {
						var asmId = refSet["referenceSetDbId"].split("${idSep}")[2];
						$('#assembly').append('<option value="' + asmId + '">' + (refSet["assemblyPUI"] == null ? '(unnamed assembly)' : refSet["assemblyPUI"]) + '</option>');
					});
					if (jsonResult.result.data.length > 1)
						$("#grpAsm").show();
					$('#assembly').selectpicker('refresh');
				},
				error: function(xhr, ajaxOptions, thrownError) {
					handleError(xhr, thrownError);
				}
			});

			fillWidgets();
			resetFilters();
			
			for (var groupNumber=1; groupNumber<=2; groupNumber++) {
				var localValue = localStorage.getItem("groupMemorizer" + groupNumber + "::" + $('#module').val() + "::" + $('#project').val());
				if (localValue == null)
					localValue = [];
				else
					localValue = JSON.parse(localValue);
				if (localValue.length > 0)
				{
					$("button#groupMemorizer" + groupNumber).attr("aria-pressed", "true");
					$("button#groupMemorizer" + groupNumber).addClass("active");
					$("#genotypeInvestigationMode").val(groupNumber);
					$('#genotypeInvestigationMode').selectpicker('refresh');
					setGenotypeInvestigationMode(groupNumber);
				}
				else
					$("button#groupMemorizer" + groupNumber).removeClass("active");
				applyGroupMemorizing(groupNumber, localValue);
			}

			toggleIndividualSelector($('#exportedIndividuals').parent(), false);
			var projectDesc = projectDescriptions[$(this).val()];
			if (projectDesc != null)
				$("#projectInfoLink").show();
			else
				$("#projectInfoLink").hide();
			$('#searchPanel').fadeIn();
			
			currentChartType = null;
			
			$.ajax({	// load runs
				url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PROJECT_RUN_PATH%>" />/' + encodeURIComponent(getProjectId()),
				type: "GET",
				dataType: "json",
				contentType: "application/json;charset=utf-8",
    	        headers: buildHeader(token, $('#assembly').val()),
				success: function(jsonResult) {
					runList = [];
					for (var run in jsonResult.runs)
						runList.push(jsonResult.runs[run]);
				},
				error: function(xhr, ajaxOptions, thrownError) {
					handleError(xhr, thrownError);
				}
			});
		});
		$('#numberOfAlleles').on('change', function() {
			updateGtPatterns();
			var hideMaf = $('#numberOfAlleles option[value=2]').length == 0;
	        for (var nGroup=1; nGroup<=2; nGroup++) {
			    $('.mafZone').css('display', hideMaf ? "none" : "block");
	        }
		});
		$('#exportFormat').on('change', function() {
			var opt = $(this).children().filter(':selected');
			$('#formatDesc').html(opt.data('desc'));
			$('#exportPanel div.individualRelated').css("display", $(this).val() == "BED" ? "none" : "block");
		});
		$('#Sequences').on('multiple_select_change', function() {
			var nCount = $('#Sequences').selectmultiple('count');
			$('#sequencesLabel').html("Sequences (" + (nCount == 0 ? seqCount : nCount) + "/" + seqCount + ")");
		});
		$('#Individuals1').on('multiple_select_change', function() {
			var nCount = $('#Individuals1').selectmultiple('count');
			$('#individualsLabel1').html("Individuals (" + (nCount == 0 ? indCount : nCount) + "/" + indCount + ")");
			updateGtPatterns();
		});
		$('#Individuals2').on('multiple_select_change', function() {
			var nCount = $('#Individuals2').selectmultiple('count');
			$('#individualsLabel2').html("Individuals (" + (nCount == 0 ? indCount : nCount) + "/" + indCount + ")");
			updateGtPatterns();
		});
		$('#displayAllGt').on('change', function() {
			loadGenotypes(true);
		});            

		$("#variantTable").on('click', 'th', function() { // Sort function on variant table. Enabled for sequence and position only
			if ($(this).text().trim() === "id") {
				if (sortBy == "_id")
					sortDesc = !sortDesc;
				else
					sortBy = "_id";
				searchVariants(2, '0');
			}
			else if ($(this).text().trim() === "sequence") {
				if (sortBy == seqPath)
					sortDesc = !sortDesc;
				else
					sortBy = seqPath;
				searchVariants(2, '0');
			} else if ($(this).text().trim() === "start") {
				if (sortBy == posPath)
					sortDesc = !sortDesc;
				else
					sortBy = posPath;
				searchVariants(2, '0');
			}
		});
		
		$('#grpProj').hide();
		$('[data-toggle="tooltip"]').tooltip({
			delay: {
				"show": 300,
				"hide": 100
			}
		});
		getToken();
		loadModules();
                
		$(window).resize(function() {
			resizeDialogs();
		}).on('shown.bs.modal', function(e) {
			if ("progress" != e.target.id)
				resizeDialogs();
		});
                
                $("#uploadVariantIdsFile").click(function(){
                    $(this).val("");
                });

                $("#uploadVariantIdsFile").change(function(){
                    if ($(this).val() !== "") {
                        var fileName = $('#uploadVariantIdsFile').get(0).files[0].name;
                        fileReader = new FileReader();
                        var selectedFile = $('#uploadVariantIdsFile').get(0).files[0];
                        fileReader.onload = function(progressEvent) {
                                onProvideVariantIds(fileReader.result, maxUploadableVariantIdCount);
                        };
                        fileReader.readAsText(selectedFile, "UTF-8");                       
                    }
                });
	});
	
	var onbeforeunloadCalled = false;
	window.onbeforeunload = function(e) {
		if (onbeforeunloadCalled)
			return;
		
		onbeforeunloadCalled = true;
		if (!exporting) {
			if (referenceset != "")
				dropTempColl(true);
			else
				clearToken();
		}
		exporting = false;
	};
        
    function removeUploadedFile() {
        $('#uploadVariantIdsFile').val('');
        $('#varIdsFileName').remove();
        stringVariantIdsFromUploadFile = null;
        $('#variantIdsSelect').removeAttr('disabled').selectpicker('refresh');            
    }       
	
	function resizeDialogs() {
 	   	$('div.modal div.modal-lg div.modal-content').css({ "max-height": ($(window).height() - 80) + 'px'});
		$('#igvPanel div.modal-lg div.modal-content').css('height', parseInt($(window).height()*0.9 - 20) + "px");
 		$("div.modal iframe#fjBytesFrame").css({height: ($(window).height() - 80) + 'px'});	// force the dialog to occupy all available height
 	   	$('div.modal iframe').css({width: ($(window).width() - 30) + 'px'});
	}
	
	function markCurrentProcessAsAborted() {
		processAborted = true;
 		$('#serverExportBox').hide();
	}

	// clear session and user's temporary collection 
	function dropTempColl(clearTokenAfterDroppingTempColl) {
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.DROP_TEMP_COL_PATH%>" />/' + referenceset + (clearTokenAfterDroppingTempColl ? "?clearToken=true" : ""),
			type: "DELETE",
			async: navigator.userAgent.indexOf("Firefox") == -1,	// for some reason it has to be synchronous for it to work with Firefox when triggered from a beforeunload event
			dataType: "json",
			contentType: "application/json;charset=utf-8",
			headers: {
				"Authorization": "Bearer " + token
			},
			success: function(jsonResult) {
				if (!jsonResult.success)
					alert("unable to drop temporary collection");
			},
			error: function(xhr, thrownError) {
				console.log("Error dropping temp coll (status " + xhr.status + "): " + thrownError);
			}
		});
	}

	function loadModules() {
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.REFERENCESETS_SEARCH%>" />',
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
			success: function(jsonResult) {
				var option = "";
				for (var set in jsonResult.referenceSets) {
					option += '<option>' + jsonResult.referenceSets[set].name + '</option>';
				}
				$('#module').html(option).selectpicker('refresh');
				var module = $_GET("module"); // get module from url
				if (module != null)	// sometimes a # appears at the end of the url so we remove it with regexp			   
					module = module.replace(new RegExp('#([^\\s]*)', 'g'), '');
				
				if (module !== null) {
					$('#module').selectpicker('val', module);
					$('#module').trigger('change');
				}
			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
	}

	function loadProjects(module) {
		var passedModule = $_GET("module");
		if (passedModule != null)
			passedModule = passedModule.replace(new RegExp('#([^\\s]*)', 'g'), '');
		var success;
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.VARIANTSETS_SEARCH%>"/>',
			async: false,
			type: "POST",
			dataType: "json",
			contentType: "application/json;charset=utf-8",
	        headers: buildHeader(token, $('#assembly').val()),
	        data: JSON.stringify({
				"datasetId": module == null && passedModule != null ? passedModule : module,
				"pageSize": null,
				"pageToken": null
			}),
			success: function(jsonResult) {
				if (module == null)
				{	// module was not listed but obviously exists: get around this
					$('#module').append('<option>' + passedModule + '</option>').selectpicker('refresh');
					$('#module').val(passedModule);
					referenceset = passedModule;
					if (passedModule.length >= 15 && passedModule.length <= 17)
					{
						var splitModule = passedModule.split("O");
						if (splitModule.length == 2 && isHex(splitModule[0]) && isHex(splitModule[1]))
							alert("This data will be accessible only via the current URL. It will be erased 24h after its creation.");
					}
				}
				var passedProject = $_GET("project");
				if (jsonResult.variantSets.length > 0) {
					var option = "";
					var projNames = [];
					for (var set in jsonResult.variantSets) {
						var project = jsonResult.variantSets[set];
						projectDescriptions[project.name] = null;
						for (var mdObjKey in project.metadata)
							if ("<%= AbstractVariantData.VCF_CONSTANT_DESCRIPTION %>" == project.metadata[mdObjKey].key) {
								if (projectDescriptions[project.name] == null)
									projectDescriptions[project.name] = project.metadata[mdObjKey].value;
								else
									projectDescriptions[project.name] = project.metadata[mdObjKey].value + "\n\n" + projectDescriptions[project.name];
							}
							else if ("<%= Constants.GENOTYPING_TECHNOLOGY %>" == project.metadata[mdObjKey].key) {
								if (projectDescriptions[project.name] == null)
									projectDescriptions[project.name] = project.metadata[mdObjKey].value;
								else
									projectDescriptions[project.name] += "\n\n<u><%= Constants.GENOTYPING_TECHNOLOGY %>:</u> " + project.metadata[mdObjKey].value;
							}
						option += '<option data-id="' + jsonResult.variantSets[set].id + '">' + jsonResult.variantSets[set].name + '</option>';
						projNames.push(jsonResult.variantSets[set].name);
					}
					// project id is stored in each <option> tag, project name is displayed. 
					// project id is formatted as follows: moduleId§projId
					// we can retrieve it with encodeURIComponent(getProjectId())
					$('#project').html(option).selectpicker('refresh');
					if (passedProject !== null) {
						// sometimes a # appears at the end of the url so we remove it with regexp
						passedProject = passedProject.replace(new RegExp('#([^\\s]*)', 'g'), '');
						// make sure that project in url is available in this module 
						if (projNames.indexOf(passedProject) !== -1) {
							$('#project').selectpicker('val', passedProject);
						} else {
							$('#project').selectpicker('val', jsonResult.variantSets[0].name);
						}
					} else {
						$('#project').selectpicker('val', jsonResult.variantSets[0].name);
					}

					$('#grpProj').show();
					$('#project').trigger('change');
					success = true;
				} else {
					$('#searchPanel').hide();
					// $('#viewerPanel').hide();
					handleError(null, "Database " + module + " is empty or corrupted");
					$('#module').val("");
					$('#grpProj').hide();
					success = false;
				}
			},
			error: function(xhr, ajaxOptions, thrownError) {
				$('#searchPanel').hide();
				// $('#viewerPanel').hide();
				handleError(xhr, thrownError);
				$('#module').val("");
				$('#grpProj').hide();
				return false;
			}
		});
		return success;
	}

	function loadVariantTypes() {                
	    $.ajax({
	            url: variantTypesListURL + '/' + encodeURIComponent(getProjectId()),
	            type: "GET",
	            dataType: "json",
	            contentType: "application/json;charset=utf-8",
    	        headers: buildHeader(token, $('#assembly').val()),
	            success: function(jsonResult) {
	                    variantTypesCount = jsonResult.length;
	                    var option = "";
	                    for (var key in jsonResult) {
	                            option += '<option value="'+jsonResult[key]+'">' + jsonResult[key] + '</option>';
	                    }
	                    $('#variantTypes').html(option).selectpicker('refresh');
	            },
	            error: function(xhr, ajaxOptions, thrownError) {
	                    handleError(xhr, thrownError);
	            }
	    });
	}
	function loadSequences() {
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + ServerinfoApi.URL_BASE_PREFIX + '/' + ReferencesApi.searchReferencesPost_url%>" />',
			type: "POST",
			dataType: "json",
			contentType: "application/json;charset=utf-8",
	        headers: buildHeader(token, $('#assembly').val()),
			data: JSON.stringify({
				"referenceSetDbIds": [/* $('#module').val() + "${idSep}" +*/ getProjectId() + "${idSep}" + $('#assembly').val()]
			}),
			success: function(jsonResult) {
				seqCount = jsonResult.result.data.length;
				$('#sequencesLabel').html("Sequences (" + seqCount + "/" + seqCount + ")");
				referenceNames = [];
				jsonResult.result.data.forEach(ref => {
					referenceNames.push(ref["referenceName"]);
				});

				$('#Sequences').selectmultiple({
					text: 'Sequences',
					data: referenceNames,
					placeholder: 'sequence'
				});
                if (seqCount == 0 || localStorage.getItem($('#module').val() + "${idSep}" + $('#project').val() + '_filterByIds')) {
                	if (seqCount == 0) {
	                    $('#sequenceFilter').hide();
	                    $('#positions').hide();
	                }
                    $('#filterIDsCheckbox').prop('checked', true);
                    onFilterByIds(true);
                } else {
                	if (seqCount > 0) {
	                    $('#sequenceFilter').show();
	                    $('#positions').show();
	                }
                    $('#filterIDsCheckbox').prop('checked', false);
                    onFilterByIds(false);
                }
			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
	}

	function loadIndividuals() {
		individualSubSet = "${param.individualSubSet}".trim().split(";");
		if (individualSubSet.length == 1 && individualSubSet[0] == "")
			individualSubSet = null;
						
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
				"variantSetId": getProjectId(),
				"name": null,
				"pageSize": null,
				"pageToken": null
			}),
			success: function(jsonResult) {
				callSetResponse = jsonResult.callSets === null ? [] : jsonResult.callSets;
				var indOpt = [];

				gotMetaData = false;
				
				// first pass to compile an exhaustive field list
				var headers = new Array();
				for (var ind in callSetResponse)
				{
					if (!gotMetaData && callSetResponse[ind].info != null && Object.keys(callSetResponse[ind].info).length > 0)
						gotMetaData = true;
					if (gotMetaData)
						for (var key in callSetResponse[ind].info)
							if (!headers.includes(key))
								headers.push(key);
					if (individualSubSet == null || $.inArray(callSetResponse[ind].name, individualSubSet) != -1)
						indOpt.push(callSetResponse[ind].name);
				}
				callSetMetadataFields = headers;
				
				var brapiBaseUrl = location.origin + '<c:url value="<%=GigwaRestController.REST_PATH %>" />/' + referenceset + '<%= BrapiRestController.URL_BASE_PREFIX %>';
				$.ajax({
					url: brapiBaseUrl,
					async: false,
					type: "GET",
					contentType: "application/json;charset=utf-8",
					success: function(jsonResult) {
						dbDesc = jsonResult['description'].replace('germplasm', 'individual');
						if ((dbDesc.match(/; 0/g) || []).length == 2)
							dbDesc += "<p class='bold'>This database contains no genotyping data, please contact administrator</p>";
					},
					error: function(xhr, thrownError) {
						handleError(xhr, thrownError);
					}
				});
				$('#exportPanel input#exportedIndividualMetadataCheckBox').prop('checked', false);
				$('#exportPanel input#exportedIndividualMetadataCheckBox').prop('disabled', !gotMetaData);
				$('#exportPanel input#exportedIndividualMetadataCheckBox').change();
				if (gotMetaData) {
					$('#asyncProgressButton').hide();
					$('button#abort').hide();
					$('#ddlWarning').hide();
					$('#progressText').html("Loading individuals' metadata...");
					$('#progress').modal({
						backdrop: 'static',
						keyboard: false,
						show: true
					});
					setTimeout(function() {
						var headerRow = new StringBuffer(), exportedMetadataSelectOptions = "";
						headerRow.append("<tr valign='top'><td></td><th>Individual</th>");
						for (var i in headers) {
							headerRow.append("<th>" + headers[i] + "<br/></th>");
							exportedMetadataSelectOptions += "<option selected>" + headers[i] + "</option>";
						}
						$("#exportedIndividualMetadata").html(exportedMetadataSelectOptions);

						var dataRows = new StringBuffer();
						for (var ind in callSetResponse) {
							dataRows.append("<tr><td><div style='margin-right:5px;' title='Remove from selection' class='close' onclick='$(this).parent().parent().hide(); updateFilteredIndividualCount();'>x</div></td><td><span class='bold'>" + callSetResponse[ind].name + "</span></td>");
							for (var i in headers) {
								var value = callSetResponse[ind].info[headers[i]];
								dataRows.append("<td>" + (value == null ? "" : value[0].trim()) + "</td>");
							}
							dataRows.append("</tr>");
						}
						var ifTable = $("table#individualFilteringTable");
						if (headerRow != "")
							ifTable.prepend(headerRow + "</tr>");
						ifTable.append(dataRows.toString());

						var tableObj = document.getElementById("individualFilteringTable");
						addSelectionDropDownsToHeaders(tableObj);

						$('#progress').modal('hide');
						displayMessage(dbDesc + "<p class='margin-top'><img src='images/brapi16.png' /> BrAPI baseURL: <a href='" + brapiBaseUrl + "' target=_blank>" + brapiBaseUrl + "</a></p>");
					}, 1);
				}
				else {
					displayMessage(dbDesc + "<p class='margin-top'><img src='images/brapi16.png' /> BrAPI baseURL: <a href='" + brapiBaseUrl + "' target=_blank>" + brapiBaseUrl + "</a></p>");
					$("#exportedIndividualMetadata").html("");
				}
				for (var groupNumber=1; groupNumber<=2; groupNumber++)
					if (gotMetaData)
						$("button#groupSelector" + groupNumber).removeClass("hidden");
					else
					{
						$("button#groupSelector" + groupNumber).addClass("hidden");
						$("table#individualFilteringTable").html("");
					}
				
				var multipleSelectOpts = {
					text: 'Individuals',
					data: indOpt,
					placeholder: 'Lookup'
				}
				if (individualSubSet != null)
					multipleSelectOpts['size'] = individualSubSet.length;
					
				$('#Individuals1').selectmultiple(multipleSelectOpts);
				$('#Individuals2').selectmultiple(multipleSelectOpts);
				
				$('#Individuals1').on('change', function(e) { applyGroupMemorizing(1); checkGroupOverlap(); });
				$('#Individuals2').on('change', function(e) { applyGroupMemorizing(2); checkGroupOverlap(); });
				
				indCount = indOpt.length;
				$('#individualsLabel').html("Individuals (" + indCount + "/" + indCount + ")");
				$('#individualsLabel2').html("Individuals (" + indCount + "/" + indCount + ")");
				
				updateGtPatterns(); // make sure to call this only after selectmultiple was initialized
				$("#genotypeInvestigationMode").prop('disabled', indCount == 0);
				if (indCount == 0)
					setGenotypeInvestigationMode(0);
				else {
					$('#individualsLabel1').show();
					$('#Individuals1').show();
					$('#Individuals1').next().show();
					$('#individualsLabel2').show();
					$('#Individuals2').show();
					$('#Individuals2').next().show();
					$("#genotypeInvestigationMode").prop('disabled', false);
				}
			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
	}

	function loadVariantEffects() {
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.EFFECT_ANNOTATION_PATH%>"/>/' + encodeURIComponent(getProjectId()),
			type: "GET",
			dataType: "json",
			contentType: "application/json;charset=utf-8",
	        headers: buildHeader(token, $('#assembly').val()),
			success: function(jsonResult) {
				if (jsonResult.effectAnnotations.length > 0) {
					var option = "";
					for (var effect in jsonResult.effectAnnotations) {
						option += '<option value"'+jsonResult.effectAnnotations[effect]+'>' + jsonResult.effectAnnotations[effect] + '</option>';
					}
					$('#variantEffects').html(option).selectpicker('refresh');
					$('#varEffGrp').show();
					$('#genesGrp').show();
					isAnnotated = true;
				} else {
					isAnnotated = false;
					$('#genesGrp').hide();
					$('#varEffGrp').hide();
				}
			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
	}

	function loadNumberOfAlleles() {
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.NUMBER_ALLELE_PATH%>" />/' + encodeURIComponent(getProjectId()),
			type: "GET",
			dataType: "json",
			async:false,
			contentType: "application/json;charset=utf-8",
	        headers: buildHeader(token, $('#assembly').val()),
			success: function(jsonResult) {
				alleleCount = jsonResult.numberOfAllele.length;
				var option = "";
				for (var allele in jsonResult.numberOfAllele)
					option += '<option value="' + jsonResult.numberOfAllele[allele] + '">' + jsonResult.numberOfAllele[allele] + '</option>';
				$('#numberOfAlleles').html(option).selectpicker('refresh');
				$('#nbAlleleGrp').show();

				if (jsonResult.numberOfAllele.length <= 1)
					$('#nbAlleleGrp').hide();				
			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
	}
	
	function readPloidyLevel() {
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PLOIDY_LEVEL_PATH%>" />/' + encodeURIComponent(getProjectId()),
			type: "GET",
			dataType: "json",
			contentType: "application/json;charset=utf-8",
			headers: {
				"Authorization": "Bearer " + token
			},
			success: function(ploidyLevel) {
				ploidy = ploidyLevel;
			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
	}
	
	function loadGenotypePatterns() {
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GENOTYPE_PATTERNS_PATH%>" />',
			type: "GET",
			dataType: "json",
			async:false,
			contentType: "application/json;charset=utf-8",
			success: function(jsonResult) {
				gtTable = jsonResult;
				$('#Genotypes1').on('change', function() {
					$('span#genotypeHelp1').attr('title', gtTable[$('#Genotypes1').val()]);
					var fMostSameSelected = $('#Genotypes1').val().indexOf("ostly the same") != -1;
					$('#mostSameRatioSpan1').toggle(fMostSameSelected);
					resetMafWidgetsIfNecessary(1);
				});
				$('#Genotypes2').on('change', function() {
					$('span#genotypeHelp2').attr('title', gtTable[$('#Genotypes2').val()]);
					var fMostSameSelected = $('#Genotypes2').val().indexOf("ostly the same") != -1;
					$('#mostSameRatioSpan2').toggle(fMostSameSelected);
					resetMafWidgetsIfNecessary(2);
				});
			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
	}

	function fillExportFormat()
	{
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.EXPORT_FORMAT_PATH%>" />',
			type: "GET",
			dataType: "json",
			contentType: "application/json;charset=utf-8",
			headers: {
				"Authorization": "Bearer " + token
			},
			success: function(jsonResult) {
				var gotVCF = false;
				var option = '';
				for (var format in jsonResult) {
					if (format == "VCF")
						gotVCF = true;
					option += '<option '
					if (jsonResult[format].supportedPloidyLevels !== undefined)
					    option += 'data-pdy="' + jsonResult[format].supportedPloidyLevels + '" ';
					option += 'data-ext="' + jsonResult[format].dataFileExtensions + '" data-desc="' + jsonResult[format].desc + '" ' + (jsonResult[format].supportedVariantTypes != null ? 'data-type="' + jsonResult[format].supportedVariantTypes + '"' : '') + '">' + format + '</option>';
				}
				if (!gotVCF)
					$("img#igvTooltip").hide();
				$('#exportFormat').html(option);
				$('#exportFormat').val("VCF").selectpicker('refresh');
				$('#formatDesc').html($('#exportFormat').children().filter(':selected').data('desc'));
			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
	}
	
	// main search method
	function searchVariants(searchMode, pageToken) {
		$(".alert").remove();
		if ($('#exportPanel').is(':visible'))
			$('#exportBoxToggleButton').click()
		$('#asyncProgressButton').hide();
		$('#ddlWarning').hide();
		$('button#abort').show();
		$('#progressText').html("Please wait...");
		$('#progress').modal({
			backdrop: 'static',
			keyboard: false,
			show: true
		}); // prevent the user from hiding progress modal when clicking outside
		$('#showCharts').show();
		$('#showIGV').show();
		$('#exportBoxToggleButton').show();
		processAborted = false;
		$('button#abort').attr('rel', token);
		
		currentPageToken = pageToken;
		$('#prev').prop('disabled', pageToken === '0');

		if (searchMode === 0 && $('#browsingAndExportingEnabled').prop('checked'))
			searchMode = 3;

        var query = buildSearchQuery(searchMode, currentPageToken);
        if (stringVariantIdsFromUploadFile !== null) {
            query.selectedVariantIds = stringVariantIdsFromUploadFile.replaceAll('\n', ';');
        }

        $.ajax({
                url: '<c:url value="<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.VARIANTS_SEARCH%>" />',
                type: "POST",
                dataType: "json",
                contentType: "application/json;charset=utf-8",
                timeout:0,
    	        headers: buildHeader(token, $('#assembly').val()),
                data: JSON.stringify(query),
                success: function(jsonResult) {
                        $('#savequery').css('display', jsonResult.count == 0 ? 'none' : 'block');
                        if (searchMode === 0) { // count only 
                                count = jsonResult.count;
                                handleCountSuccess();
                        } else {
                                handleSearchSuccess(jsonResult, pageToken);
                        }
                },
                error: function(xhr, ajaxOptions, thrownError) {
                        handleError(xhr, thrownError);
                }
        });

		$('#iconSeq').hide();
		$('#iconPos').hide();
		$('#rightSidePanel').hide();
		$('#countResultPanel').hide();
		$('#resultDisplayPanel').hide();
		$('#navigationPanel').hide();
 		$('#serverExportBox').hide();
		displayProcessProgress(2, token);
	}

    function loadVariantIds() {
        var options = {
                ajax:{
                    url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.VARIANTS_LOOKUP%>" />',
                    type: "GET",
                    headers: {
                            "Authorization": "Bearer " + token
                    },
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    data: {
                        projectId: getProjectId(),
                        q: '{{{q}}}'
                    },
                    success: function(jsonResult) {
                        return jsonResult;
                    },
                    error: function(xhr, ajaxOptions, thrownError) {
                        handleError(xhr, thrownError);
                    }
                },
                cache : false,
                preserveSelectedPosition : "before",
                preserveSelected: true,
                log: 2 /*warn*/,
                locale: {
                    statusInitialized: "Start typing a query",
                    emptyTitle: "Input IDs here",
                    statusTooShort: "Please type more"
                },
                minLength: 2,
                clearOnEmpty: true,
                preprocessData: function (data) {
                    $("div.bs-container.dropdown.bootstrap-select.show-tick.open > div > div.inner.open > ul").css("margin-bottom", "0");
                    var asp = this;
                    if (data.length == 1 && data[0].indexOf("Too many results") == 0) {
                        setTimeout(function() {asp.plugin.list.setStatus(data[0]);}, 50);
                        return;
                    }
                    
                    var array = [];
                    for (i=0; i<data.length; i++) {
                        array.push($.extend(true, data[i], {
                            value: data[i]
                        }));
                    }
                    return array;
                }
            };
        
        $('#VariantIds').find('div.status').remove(); //needed to avoid having multiple status messages "enter more characters" after selecting another project
        $('#variantIdsSelect').removeData('AjaxBootstrapSelect'); //needed to have the right projectId sent to the WS after selecting another project
        $('#variantIdsSelect').selectpicker().ajaxSelectPicker(options);
        $('#variantIdsSelect').trigger('change').data('AjaxBootstrapSelect').list.cache = {};
        
        if ($('#VariantIds').find('div.bs-searchbox a').length === 0) {  
            let inputObj = $('#VariantIds').find('div.bs-searchbox input');
            inputObj.css('width', "calc(100% - 24px)");               
            //when clicking on the button, selected IDs and search results are cleared
            inputObj.before("<a href=\"#\" onclick=\"clearVariantIdSelection();\" style='font-size:18px; margin-top:5px; font-weight:bold; text-decoration: none; float:right;' title='Clear selection'>&nbsp;X&nbsp;</a>");
        }
    }

	function buildGenotypeTableContents(jsonResult)
	{
		var before = new Date().getTime();
		var knownAlleles = jsonResult.alternateBases;
		knownAlleles.unshift(jsonResult.referenceBases);

		var gtTable = new Array();
		var headerPositions = new Array();
		for (var call in jsonResult.calls)
		{
			var individual = splitId(jsonResult.calls[call].callSetId, 2);
			var gtRow = new Array();
			gtRow.push(individual);
			var gt = '';
			for (var allele in jsonResult.calls[call].genotype)
				gt += '<div class="allele">' + knownAlleles[jsonResult.calls[call].genotype[allele]] + '</div>';
			gtRow.push(gt);
			for (var header in jsonResult.calls[call].info)
			{
				var headerPos = headerPositions[header];
				if (headerPos == null)
				{
					headerPos = Object.keys(headerPositions).length;
					headerPositions[header] = headerPos;
				}
				gtRow[headerPos + 2] = jsonResult.calls[call].info[header][0];
			}
			gtTable.push(gtRow);
		}
		var tableHeader = new Array(2);
		for (var header in headerPositions)
			tableHeader[headerPositions[header] + 2] = header;
		
		var htmlTableContents = new StringBuffer();
		htmlTableContents.append('<thead><tr><th>Individual</th><th>Genotype</th>');
		for (var headerPos in tableHeader)
		{
			var header = tableHeader[headerPos];
			htmlTableContents.append('<th' + (typeof vcfFieldHeaders[header] == 'undefined' ? '' : ' title="' + vcfFieldHeaders[header] + '"') + '>' + header + '</th>');
		}
		htmlTableContents.append('</tr></thead>');

		var annotationFieldThresholds = {};
		for (var i=1; i<=2; i++)
   		$('#vcfFieldFilterGroup' + i + ' input').each(function() {
   			if (parseFloat($(this).val()) > 0)
   				annotationFieldThresholds[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
   		});

		var checkThresholds = Object.keys(annotationFieldThresholds).length > 0;
		var indArray1 = getSelectedIndividuals(1);
		var indArray2 = getSelectedIndividuals(2);
		for (var row in gtTable)
		{
			var annotationThresholds = !checkThresholds ? null : getAnnotationThresholds(gtTable[row][0], indArray1, indArray2);
			htmlTableContents.append('<tr class="ind_' + gtTable[row][0].replaceAll(" ", "_") + '">');
			var inGroup1 = indArray1.length == 0 || indArray1.includes(gtTable[row][0]);
			var inGroup2 = $('#genotypeInvestigationDiv2').is(':visible') && (indArray2.length == 0 || indArray2.includes(gtTable[row][0]));
			for (var i=0; i<tableHeader.length; i++)
			{
				var indivClass = inGroup1 ? (inGroup2 ? "groups1and2" : "group1") : (inGroup2 ? "group2" : "");
				var missingData = false;
				if (checkThresholds && i >= 2)
					for (var annotation in annotationThresholds)
						if (tableHeader[i] == annotation && gtTable[row][i] < annotationThresholds[annotation])
						{
							missingData = true;
							break;
						}
				htmlTableContents.append((i == 0 ? "<th class='" + indivClass + "'" : "<td") + (missingData ? ' class="missingData"' : '') + ">" + (gtTable[row][i] != null ? gtTable[row][i] : "") + (i == 0 ? "</th>" : "</td>"));
			}
			htmlTableContents.append('</tr>');
		}
//		 console.log("buildGenotypeTableContents took " + (new Date().getTime() - before) + "ms for " + gtTable.length + " individuals");
		return htmlTableContents.toString();
	}

	// update genotype table when the checkbox in annotation panel is checked
	function loadGenotypes(reload) {
		var errorEncountered = false;
		// get genotypes for a variant 
		var modalContent = '';
		var ind;
		if (individualSubSet == null)
		{
			if ($("#displayAllGt").prop('checked'))
				ind = [];
			else
			{
   				ind = getSelectedIndividuals($('#genotypeInvestigationDiv2').is(':visible') ? null : 1);
   				if (ind.length == indCount)
   					ind = [];
			}
		}
		else
		{	// not all individuals are shown in the interface
			if ($("#displayAllGt").prop('checked'))
				ind = ($('#Individuals1 select option').map(function() { return $(this).text(); })).get();
			else
			{
				var	selectedInGroup1 = ($('#Individuals1 select option:selected').map(function() { return $(this).text(); })).get();
				var	selectedInGroup2 = ($('#Individuals2 select option:selected').map(function() { return $(this).text(); })).get();
				ind = selectedInGroup1.concat(selectedInGroup2);
			}
		}
		if (!reload)
			$("#displayAllGtOption").toggle(ind.length > 0);
		$("#runButtons").html("");
		var addedRunCount = 0;
		
		let requests = [];
		for (var runIndex in runList) {
			requests.push($.ajax({	// result of a run for a variant has an id as module§project§variant§run
				url: '<c:url value="<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.VARIANTS%>"/>/' + encodeURIComponent(variantId + "${idSep}") + runList[runIndex],
				type: "POST",
				data: JSON.stringify({"callSetIds": ind.map(i => $('#module').val() + "${idSep}" + $('#project').val() + "${idSep}" + i)}),
				async: false,
				dataType: "json",
				contentType: "application/json;charset=utf-8",
    	        headers: buildHeader(token, $('#assembly').val()),
				success: function(jsonResult) {
					if (addedRunCount == 0) {
						$('#varId').html("Variant: " + variantId.split("${idSep}")[2]);
						$('#varSeq').html("Seq: " + jsonResult.referenceName);
						$('#varType').html("Type: " + jsonResult.info.type[0]);
						$('#varPos').html("Pos: " + jsonResult.start + "-" + jsonResult.end);
					}

					var htmlTableContents = buildGenotypeTableContents(jsonResult);
					$("#runButtons").append('<label onclick="$(\'div#gtTable\').children().hide(); $(\'div#gtTable div#run' + runIndex + '\').fadeIn();" class="btn btn-sm btn-primary' + (addedRunCount == 0 ? ' active' : '') + '"><input type="radio" name="options" id="' + runIndex + '"' + (addedRunCount == 0 ? ' checked' : '') + (addedRunCount == 0 ? ' active' : '') + '>' + runList[runIndex] + '</label>');
					modalContent += '<div id="run' + runIndex + '"' + (addedRunCount == 0 ? '' : ' style="display:none;"') + '><table class="table table-overflow table-bordered genotypeTable">' + htmlTableContents + '</table></div>';
					if ($('#varId').html() == "") {
						$('#varId').html("Variant: " + variantId.split("${idSep}")[2]);
						$('#varSeq').html("Seq: " + jsonResult.referenceName);
						$('#varType').html("Type: " + jsonResult.info.type[0]);
						$('#varPos').html("Pos: " + jsonResult.start + "-" + jsonResult.end);
					}
					addedRunCount++;
				},
				error: function(xhr, ajaxOptions, thrownError) {
					handleError(xhr, thrownError);
					errorEncountered = true;
				}
			}));
		}
		
		Promise.allSettled(requests).then(function(){
		    $('#gtTable').html(modalContent);
			markInconsistentGenotypesAsMissing();

			if (!errorEncountered)
				$('#variantDetailPanel').modal('show').css({"z-index": 1100}); 
		});
	}

	// create the annotation detail panel 
	function loadVariantAnnotationData() {
		$('#displayAllGt').prop('checked', false);
		loadGenotypes(false);
		// get annotations 
	   	$('#scrollingAnnotationDiv').html("");
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.VARIANT_ANNOTATION%>"/>/' + encodeURIComponent(variantId),
			type: "GET",
			dataType: "json",
			contentType: "application/json;charset=utf-8",
	        headers: buildHeader(token, $('#assembly').val()),
			success: function(jsonResult) {
				var gotFunctAnn = jsonResult.info.ann_header != null && jsonResult.info.ann_header.length > 0
				$('#toggleFunctionalAnn').css('display', gotFunctAnn ? 'inline' : 'none');
				if (gotFunctAnn)
				{
					var additionalInfo = new StringBuffer();
					additionalInfo.append("<div id='functionalAnn'" + ($('#toggleFunctionalAnn').hasClass('active') ? "" : " style='display:none;'") + "><h5>Functional annotations</h5><table class='table'><tr>");
					for (var i=0; i<jsonResult.info.ann_header.length; i++)
						additionalInfo.append('<th style="padding:3px;" ' + (i%2 == 0 ? 'class="panel-grey"' : '') + 'title="' + (typeof vcfFieldHeaders[jsonResult.info.ann_header[i]] !== 'undefined' ? vcfFieldHeaders[jsonResult.info.ann_header[i]]: '') + '">' + jsonResult.info.ann_header[i] + "</th>");
					for (var i=0; jsonResult.info["ann_values_" + i] != null; i++)
					{
						additionalInfo.append("</tr><tr>");
						for (var j=0; j<jsonResult.info["ann_values_" + i].length; j++)
							additionalInfo.append("<td" + (j%2 == 0 ? ' class="panel-grey"' : '') + ">" + jsonResult.info["ann_values_" + i][j] + "</td>");
					}
					additionalInfo.append("</tr></table></div>");
					$('#scrollingAnnotationDiv').append(additionalInfo.toString());
				}
				
				var varGotMetaData = jsonResult.info.meta_header != null && jsonResult.info.meta_header.length > 0
				$('#toggleVariantMetadata').css('display', varGotMetaData ? 'inline' : 'none');
				if (varGotMetaData)
				{
					var additionalInfo = new StringBuffer();
					additionalInfo.append("<div id='variantMetadata'" + ($('#toggleVariantMetadata').hasClass('active') ? "" : " style='display:none;'") + "><h5>Variant metadata</h5><table class='table'><tr>");
					for (var i=0; i<jsonResult.info.meta_header.length; i++)
						additionalInfo.append('<th style="padding:3px;" ' + (i%2 == 0 ? 'class="panel-grey"' : '') + 'title="' + (typeof vcfFieldHeaders[jsonResult.info.meta_header[i]] !== 'undefined' ? vcfFieldHeaders[jsonResult.info.meta_header[i]]: '') + '">' + jsonResult.info.meta_header[i] + "</th>");
					additionalInfo.append("</tr><tr>");
					for (var i=0; i<jsonResult.info.meta_values.length; i++)
						additionalInfo.append("<td" + (i%2 == 0 ? ' class="panel-grey"' : '') + ">" + jsonResult.info.meta_values[i] + "</td>");
					additionalInfo.append("</tr></table></div>");
					$('#scrollingAnnotationDiv').append(additionalInfo.toString());
				}
				

			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
	}

	function exportData() {
		var keepExportOnServer = $('#keepExportOnServ').prop('checked');
		var indToExport = $('#exportedIndividuals').val() == "choose" ? $('#exportedIndividuals').parent().parent().find("select.individualSelector").val() : ($('#exportedIndividuals').val() == "12" ? getSelectedIndividuals() : ($('#exportedIndividuals').val() == "1" ? getSelectedIndividuals(1) : ($('#exportedIndividuals').val() == "2" ? getSelectedIndividuals(2) : null)));
		exportedIndividualCount = indToExport == null ? indCount : indToExport.length;
		if (!keepExportOnServer && $('#exportPanel div.individualRelated:visible').size() > 0) {
			if (exportedIndividualCount * count > 1000000000) {
				alert("The matrix you are about to export contains more than 1 billion genotypes and is too large to be downloaded directly. Please tick the 'Keep files on server' box.");
				return;
			}
		}

		var supportedTypes = $('#exportFormat').children().filter(':selected').data('type');
		if (supportedTypes != null) {
			supportedTypes = supportedTypes.split(";");
			var selectedTypes = $('#variantTypes').val() === null ? Array.from($('#variantTypes option')).map(opt => opt.innerText) : $('#variantTypes').val();
			for (var i in selectedTypes)
				if (!supportedTypes.includes(selectedTypes[i])) {
					alert("Error: selected export format does not support variant type " + selectedTypes[i]);
					return;
				}
		}
		var supportedPloidyLevels = $('#exportFormat').children().filter(':selected').data('pdy');
		if (supportedPloidyLevels != null && supportedPloidyLevels !== undefined && supportedPloidyLevels != "undefined") {
			supportedPloidyLevels = supportedPloidyLevels.toString().split(";").map(s => parseInt(s));
			if (!supportedPloidyLevels.includes(ploidy)) {
				alert("Error: selected export format does not support ploidy level " + ploidy);
				return;
			}
		}
		
		exporting = true;
		if (keepExportOnServer)
		{
			$('#ddlWarning').hide();
			$('#asyncProgressButton').show();
		}
		else
		{
			$('#ddlWarning').show();
			$('#asyncProgressButton').hide();
		}
		$('button#abort').show();
		$('#progressText').html("Please wait...");
		$('#progress').modal({
			backdrop: 'static',
			keyboard: false,
			show: true
		});

		var annotationFieldThresholds = "", annotationFieldThresholds2 = "";
   		$('#vcfFieldFilterGroup1 input').each(function() {
   			if (parseFloat($(this).val()) > 0)
   				annotationFieldThresholds += (annotationFieldThresholds == "" ? "" : ";") + this.id.substring(0, this.id.indexOf("_")) + ":" + $(this).val();
   		});
   		$('#vcfFieldFilterGroup2 input').each(function() {
   			if (parseFloat($(this).val()) > 0)
	   			annotationFieldThresholds2 += (annotationFieldThresholds2 == "" ? "" : ";") + this.id.substring(0, this.id.indexOf("_")) + ":" + $(this).val();
   		});
   		
		var url = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.EXPORT_DATA_PATH%>" />'

        var query = buildSearchQuery(3, currentPageToken);
        query["keepExportOnServer"] =  keepExportOnServer;
        query["exportFormat"] =  $('#exportFormat').val();
        query["exportedIndividuals"] =  indToExport === null ? [] : indToExport;
        query["metadataFields"] =  $('#exportPanel select#exportedIndividualMetadata').prop('disabled') || $('#exportPanel div.individualRelated:visible').size() == 0 ? [] : $("#exportedIndividualMetadata").val();

		processAborted = false;
		$('button#abort').attr('rel', 'export_' + token);
		if (keepExportOnServer) {
            $.ajax({
                url: url,
                type: "POST",       
                contentType: "application/json;charset=utf-8",
    	        headers: buildHeader(token, $('#assembly').val()),
                data: JSON.stringify(query),
                success: function(response) {
                        downloadURL = response;
                },
                error: function(xhr, ajaxOptions, thrownError) {
                        downloadURL = null;
                        $("div#exportPanel").hide();
                        $("a#exportBoxToggleButton").removeClass("active");
                        handleError(xhr, thrownError);
                }
            });
		} else {
			var headers = buildHeader(token, $('#assembly').val());
            headers["Content-Type"] = "application/json;charset=utf-8"; 

            var request = {
                method: "POST",
                headers: headers,
                body: JSON.stringify(query)
            };
            
            var filename = '';
            
            fetch(url, request).then((response) => {
                    var header = response.headers.get('Content-Disposition');
                    var parts = header.split(';');
                    filename = parts[1].split('=')[1];
                    return response.blob();
            })
            .then((result) => {
                if (result !== undefined) {
                    var objectURL = URL.createObjectURL(result);
                    var link = document.createElement("a");
                    link.setAttribute("href", objectURL);
                    link.setAttribute("download", filename);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                }
            });
			downloadURL = null;
			//postDataToIFrame("outputFrame", url, query);
			$("div#exportPanel").hide();
			$("a#exportBoxToggleButton").removeClass("active");
		}
		displayProcessProgress(2, "export_" + token, null, showServerExportBox);
	}

	function postDataToIFrame(frameName, url, params)
	{
		 var form = document.createElement("form");
		 form.setAttribute("method", "post");
		 form.setAttribute("action", url);
		 form.setAttribute("target", frameName);

		 for (var i in params) {
			 var input = document.createElement('input');
			 input.type = 'hidden';
			 input.name = i;
			 input.value = params[i];
			 form.appendChild(input);
		 }

		 document.body.appendChild(form);
		 form.submit();
		 document.body.removeChild(form);
	}

	// split an Id and return element at the corresponding position
	function splitId(id, pos) {
		var arr = id.split("${idSep}");
		return arr[pos];
	}

	var igvDataLoadPort, igvGenomeListUrl;
	<c:set var="igvDataLoadPort" value="<%= appConfig.get(\"igvDataLoadPort\") %>"></c:set>
	<c:set var="igvGenomeListUrl" value="<%= appConfig.get(\"igvGenomeListUrl\") %>"></c:set>
	<c:if test='${!fn:startsWith(igvDataLoadPort, "??") && !empty igvDataLoadPort && !fn:startsWith(igvGenomeListUrl, "??") && !empty igvGenomeListUrl}'>
	igvDataLoadPort = ${igvDataLoadPort};
	igvGenomeListUrl = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.IGV_GENOME_LIST_URL %>" />';
	</c:if>
	
	
	
	/**
	 * IGV.js genome browser integration
	 */
	
	// Global variables
	var igvBrowser;
	var igvGenomeList = [];  // Default genomes list, with sections
	var igvFlatGenomeList = [];  // Default genomes list, flat
	var igvGenomeListLoaded = false;
	var igvVariantTracks;  // Array containing the variant tracks
	var igvGenomeRefTable;  // Table of translation from genome references names to variant refs names
	var igvCurrentModule;  // Currently loaded module
	var igvDefaultGenome;
	
	// Configuration
	const igvCheckGenomeExistence = true;  // True to send a request to check whether the genome file exists beforehand
	const igvGenomeConfigURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.IGV_GENOME_CONFIG_PATH %>" />';  // URL to the default genomes list
	const igvDefaultMatchingGenome = true;  // True to load a genome with the same name as the module if it exists by default
	const igvCheckReferenceCountDifference = true;  // True to alert the user if the amounts of sequences in the genome and in gigwa do not match by at least a given difference
	const igvReferenceCountDifferenceThreshold = 0.3;  // Difference from which to alert the user. Ex : 0.3 -> 30% difference to alert
	
	// ----- Utilities
	
	// Extract the file name from an URL object
	function filenameFromURL(url){
		return url.pathname.split("/").pop();
	}
	
	// Promise to read a local text file
	async function readTextFile(file) {
		let result = await new Promise((resolve) => {
			let fileReader = new FileReader();
			fileReader.onload = (event) => resolve(fileReader.result);
			fileReader.readAsText(file);
		});
		return result;
	}
	
	// Get the constant prefix in each element of a list of strings
	function getPrefix(names){
		if (names.length <= 1) return "";  // Prevent returning the whole name as a prefix if there's only one
		let terminate = false;
		let prefix = "";
		for (let index in names[0]){
			let character = names[0][index]
			for (let name of names){
				if (name[index] != character){
					terminate = true;
					break;
				}
			}
			if (terminate){
				break;
			} else {
				prefix += character;
			}
		}
		return prefix;
	}
	
	// Get the prefixes present at least twice in elements of a list of strings, along with their numbers of occurences (prefixes are anything before a digit occurence)
	function getContigPrefixes(contigNames) {
		var prefixCounts = [];
		for (var i=0; i<contigNames.length; i++) {
		  var pfx = contigNames[i].replace(/\d+.*/, ""), count = prefixCounts[pfx];
		  prefixCounts[pfx] = count == null ? 1 : (count + 1) ;
		}
		for (var pfx in prefixCounts)	// Remove prefixes that were only found once
			if (prefixCounts[pfx] == 1)
				delete prefixCounts[pfx];
		return prefixCounts;
	}

	// Get the constant prefix in each element of a list of strings
	function getSuffix(names){
		if (names.length <= 1) return "";  // Prevent returning the whole name as a suffix if there's only one
		let terminate = false;
		let suffix = "";
		let reversed = names.map(name => name.split("").reverse().join(""));
		for (let index in reversed[0]){
			let character = reversed[0][index]
			for (let name of reversed){
				if (name[index] != character){
					terminate = true;
					break;
				}
			}
			if (terminate){
				break;
			} else {
				suffix = character + suffix;
			}
		}
		return suffix;
	}
	
	// Check whether a string represents a valid number
	function isNumeric(str){
		return !isNaN(str) && !isNaN(parseFloat(str));
	}
	
	
	// ----- Functions
	
	// Initialize the IGV functionalities for a given module
	function igvChangeModule(name){
		igvDefaultGenome = localStorage.getItem("igvDefaultGenome::" + name);
		if (!igvDefaultGenome){  // Not by name : check if stored by config (url)
			let jsonValue = localStorage.getItem("igvDefaultGenomeConfig::" + name);
			if (jsonValue){
				igvDefaultGenome = JSON.parse(jsonValue);
			} else {  // Not stored at all : Default to the matching genome if the list is loaded (otherwise delayed to the list loading)
				igvDefaultGenome = igvMatchingGenome();
			}
		}
	}
	
	// Open the IGV modal, initialise the browser if a default genome is set
	function igvOpenDialog() {
            if (seqCount === 0) {
                alert("No sequence to display");
            } else {                
                $('#igvPanel').modal('show');

                if (!igvGenomeListLoaded && igvGenomeConfigURL){
                        igvLoadGenomeList().then(function (genomeList){
                                igvCheckModuleChange();
                        });
                } else {
                        igvCheckModuleChange();
                }
            }
	}
	
	/* Load the default genomes list
	   More or less equivalent to this, but all requests are asynchronous :
		|	configList = get(igvGenomeConfigURL)
		|	igvGenomeList = []
		|	for config of configList:
		|		genomeList = get(config.url)
		|		igvGenomeList.push({
		|			name: config.name,
		|			url: config.url,
		|			genomes: genomeList,
		|		})
		|	igvUpdateGenomeMenu()
		|	return igvGenomeList */
	async function igvLoadGenomeList(configURL){
		// Set before the requests to avoid duplicate requests if the modal is closed and reopened meanwhile
		igvGenomeListLoaded = true;
		
		// Get the list of genome lists to download, then…
		return await $.get(igvGenomeConfigURL).then(function (configList){
			// Wait until all downloads completed (successfully or not)
			return Promise.allSettled(
				// For each config, download the genome list
				configList.map(
					config => $.ajax({
						url: config.url,
						method: "GET",
						dataType: "json",
					}).then(function(genomeList) {
						genomeList.sort((a, b) => a.id > b.id ? 1 : -1);
						return {
							name: config.name,
							url: config.url,
							genomes: genomeList,
						}
					}, function (xhr, ajaxOption, thrownError){
						// Error handler for each genome list download : show an error but do not abort
						console.log(xhr);
						displayMessage("Loading of genome list from " + config.url + " failed: " + thrownError);
					})
				)
			).then(function (results){
				// Once all requests completed
				// results is an array that contains the results of all promises in Promise.allSettled
				// Filter out the failed requests and keep only their value (the genome list + name + url above)
				igvGenomeList = results.filter(result => result.status == "fulfilled").map(result => result.value);
				
				// Flatten the genome list for search and IGV
				igvFlatGenomeList = [];
				igvGenomeList.forEach(function (listConfig){
					igvFlatGenomeList = igvFlatGenomeList.concat(listConfig.genomes);
				});
				
				igvUpdateGenomeMenu();
				return igvGenomeList;
			});
		}, function (xhr, ajaxOption, thrownError){  // Error loading the genome list configs : show an error, abort
			igvGenomeListLoaded = false;
			handleError(xhr, thrownError);
		});
	}
	
	// Check whether the loaded module changed and do all actions that apply (load the default genome, set the current module)
	function igvCheckModuleChange(){
		if (getModuleName() != igvCurrentModule){
			igvLoadDefaultGenome();
			igvCurrentModule = getModuleName();
		}
	}
	
	// Find a genome that matches the module name if it exists and if igvDefaultMatchingGenome is set to true
	// Returns undefined if no matching genome exists, if the configuration forbids it or if the genome list is not loaded
	function igvMatchingGenome(){
		if (igvDefaultMatchingGenome && igvGenomeListLoaded){
			let moduleName = getModuleName();
			let match = igvFlatGenomeList.find(genome => genome.id == moduleName)
			if (match) return match.id;
		}
		return undefined;
	}
	
	// Load the default genome, or the matching one if applicable
	function igvLoadDefaultGenome(){
		if (igvDefaultGenome){
			igvSwitchGenome(igvDefaultGenome);
		} else {  // Load the matching genome if applicable
			let genome = igvMatchingGenome();
			if (genome){
				igvSwitchGenome(genome);
			}
		}
	}
	
	// Update the default genomes list in the `load genome` menu
	function igvUpdateGenomeMenu(){
		// Discard the existing list, if it exists
		$("#igvDefaultGenomesDivider").nextAll().remove();
		
		let menu = $("#igvGenomeMenu");
		igvGenomeList.forEach(function (listConfig, index){
			// Make a section header
			if (index > 0){  // The divider already exists for the first one
				let divider = $('<li class="divider" role="separator"></li>');
				menu.append(divider);
			}
			let header = $('<li class="dropdown-header"></li>').text(listConfig.name);
			menu.append(header);
			
			listConfig.genomes.forEach(function (genome){
				let link = $('<a href="#"></a>').text(genome.id + " : " + genome.name).click(function(){
					igvSwitchGenome(genome.id).then(igvCheckReferenceCounts);
				});
				let item = $("<li></li>").append(link);
				menu.append(item);
			});
		});
	}
	
	// Load genome configuration(s) from JSON object
	function igvLoadJSONGenome(name, config){
		if (Array.isArray(config)){  // Genome list
			config.sort((a, b) => a.id > b.id ? 1 : -1);
			igvGenomeList.push({
				name: name,
				genomes: config,
			});
			igvFlatGenomeList = igvFlatGenomeList.concat(config);
			igvUpdateGenomeMenu();
			displayMessage("Loaded the genome list");
		} else {  // Genome config
			igvSwitchGenome(config).then(igvCheckReferenceCounts);
		}
	}
	
	// Load a genome file from the modal
	function igvLoadGenomeFromFile(){
		let genomeFile = $("#igvGenomeFileInput").get(0).files[0];
		let indexFile = $("#igvGenomeIndexFileInput").get(0).files[0];
		
		// Load a JSON genome config
		if (genomeFile.name.endsWith(".json")){
			readTextFile(genomeFile).then(function (content){
				igvLoadJSONGenome(genomeFile.name, JSON.parse(content));
			}).catch(function (reason){
				displayMessage("Error loading genome config : " + reason);
			});
		} else {  // FASTA genome
			let genome;
			if (indexFile){
				genome = {
					fastaURL: genomeFile,
					indexURL: indexFile,
				};
			} else {
				genome = {
					fastaURL: genomeFile,
					indexed: false,
				};
			}
			
			igvSwitchGenome(genome).then(igvCheckReferenceCounts);
		}
	}
	
	// Load a genome file by URL with the modal
	function igvLoadGenomeFromURL(){
		let genomeURL = $("#igvGenomeURLInput").val().trim();
		let indexURL = $("#igvGenomeIndexURLInput").val().trim();
		
		let genomeURLObject, indexURLObject;
		
		try {  // Check whether the genome URL is valid
			genomeURLObject = new URL(genomeURL);
		} catch (error){
			displayMessage("Invalid genome file URL : " + genomeURL);
			return;
		}
		
		if (indexURL.length > 0){
			try {  // Check whether the index URL is valid
				indexURLObject = new URL(indexURL);
			} catch (error){
				displayMessage("Invalid index file URL : " + indexURL);
				return;
			}
		}
		
		let filename = filenameFromURL(genomeURLObject);
		
		// Load a JSON genome config
		if (filename.endsWith(".json")){
			$.ajax({
				url: genomeURL,
				type: "GET",
				dataType: "json",
				success: function(data) {
					igvLoadJSONGenome(genomeURL, data);
				},
				error: function(xhr, ajaxOptions, thrownError) {
					handleError(xhr, thrownError);
				}
			})
		} else {  // FASTA config
			let genome;
			if (indexURL){
				genome = {
					fastaURL: genomeURL,
					indexURL,
				};
			} else {
				genome = {
					fastaURL: genomeURL,
					indexed: false,
				};
			}
			
			// Check the genome file existence beforehand by sending a HEAD request
			// Configurable with igvCheckGenomeExistence
			// Default behaviour of IGV is to only download the index, and throwing errors only when zoomed enough to show the genome
			if (igvCheckGenomeExistence){
				$.ajax({
					url: genomeURL,
					type: "HEAD",
					success: function(){
						igvSwitchGenome(genome).then(igvCheckReferenceCounts);
					},
					error: function(xhr, ajaxOptions, thrownError) {
						if (thrownError == "" && xhr.getAllResponseHeaders() == '')
							alert("Error accessing resource: " + genomeURL);
						else
							handleError(xhr, thrownError);
					}
				});
			} else {
				igvSwitchGenome(genome).then(igvCheckReferenceCounts);
			}
			
		}
	}

	// Change the current genome, create the browser if it doesn't exist
	function igvSwitchGenome(genome){
		let moduleName = getModuleName();
		if (typeof genome == "string"){  // Genome ID in the default list
			localStorage.removeItem("igvDefaultGenomeConfig::" + moduleName);
			localStorage.setItem("igvDefaultGenome::" + moduleName, genome);
			let matchingConfig = igvFlatGenomeList.find(config => config.id == genome);
			if (matchingConfig){
				genome = {...matchingConfig};  // Shallow copy as we modify it later
			} else {
				displayMessage("Default genome " + genome + " not found");
				return;
			}
		} else if (typeof genome.fastaURL == "string"){  // By URL
			localStorage.removeItem("igvDefaultGenome::" + moduleName);
			localStorage.setItem("igvDefaultGenomeConfig::" + moduleName, JSON.stringify(genome));
		}  // Impossible to save and reload with local files
		
		// Take the default tracks separately to ensure the alias table is build before them loading
		let tracks = genome.tracks || [];
		genome.tracks = [];
		
		let promise;
		if (!igvBrowser){
			promise = igvCreateBrowser(genome);
		} else {
			igvVariantTracks = undefined;
			igvBrowser.removeAllTracks();
			promise = igvBrowser.loadGenome(genome);
		}
		
		return promise.then(async function (){
			// Build the alias table
			let targetNames = igvBrowser.genome.chromosomeNames;
			let variantPrefix = getPrefix(referenceNames);
			let refNamesForNumberedContigsCount = referenceNames.filter(nm => !isNaN(nm.substring(nm.length - 1))).length;
			let targetPrefixCounts = getContigPrefixes(targetNames);
			let targetPrefix = "";
			for (var pfx in targetPrefixCounts)
				if (pfx.toLowerCase() == "chr" || targetPrefixCounts[pfx] == refNamesForNumberedContigsCount) {
					targetPrefix = pfx;
// 					console.log("Using " + pfx + " as contig name prefix");
					break;
				}

			let variantSuffix = getSuffix(referenceNames);
			let variantSuffixRegex = new RegExp(variantSuffix + "$");
			let targetSuffix = getSuffix(targetNames);
			let targetSuffixRegex = new RegExp(targetSuffix + "$");
			igvGenomeRefTable = {};
			for (let target of targetNames){  // target = chromosome name in the genome file, as used by IGV
				let zeroname = target.replace(targetPrefix, "").replace(targetSuffixRegex, "");
				let basename = zeroname.replace(/^0+/, "");  // Base chromosome name
				zeroname = isNumeric(basename) ? basename.padStart(2, "0") : zeroname  // Zero-padded 2-digits chromosome number
				igvBrowser.genome.chrAliasTable[zeroname.toLowerCase()] = target;  // 02 -> target
				igvBrowser.genome.chrAliasTable[basename.toLowerCase()] = target;  // 2 -> target
				if (zeroname.toLowerCase().startsWith("chr"))
					igvBrowser.genome.chrAliasTable["chr" + zeroname.toLowerCase()] = target;  // chr02 -> target
				if (basename.toLowerCase().startsWith("chr"))
					igvBrowser.genome.chrAliasTable["chr" + basename.toLowerCase()] = target;  // chr2 -> target
				igvBrowser.genome.chrAliasTable[(variantPrefix + zeroname).toLowerCase()] = target;  // With prefix used by variants
				igvBrowser.genome.chrAliasTable[(variantPrefix + basename).toLowerCase()] = target;
				igvBrowser.genome.chrAliasTable[(variantPrefix + zeroname + variantSuffix).toLowerCase()] = target;  // With prefix and suffix used by variants
				igvBrowser.genome.chrAliasTable[(variantPrefix + basename + variantSuffix).toLowerCase()] = target;
				
				// Associate the target name to the variants reference name
				let gigwaContigName = referenceNames.find(ref => ref.replace(variantPrefix, "").replace(variantSuffixRegex, "").replace(/^0+/, "") == basename);
				if (gigwaContigName != null)
					igvGenomeRefTable[target] = gigwaContigName;
				else
					igvGenomeRefTable[target] = target;	// couldn't find it, use the provided name (better than nothing)
			}
			
			// Load the default tracks
			for (let trackConfig of tracks){
				await igvBrowser.loadTrack(trackConfig);
			}

			// Add the variant tracks
			await igvUpdateVariants();
		});
	}
	
	// Alert the user if the number of sequences do not match by a given ratio
	// This can be configured with igvCheckReferenceCountDifference and igvReferenceCountDifferenceThreshold
	function igvCheckReferenceCounts(){
		if (igvCheckReferenceCountDifference && (
					referenceNames.length > igvBrowser.genome.chromosomeNames.length * (1 + igvReferenceCountDifferenceThreshold) ||
					igvBrowser.genome.chromosomeNames.length > referenceNames.length * (1 + igvReferenceCountDifferenceThreshold))){
			displayMessage("The amount of sequences (" + igvBrowser.genome.chromosomeNames.length + ") in the selected genome is substantially different from the amount in the Gigwa-provided data (" + referenceNames.length + " sequences). It is likely that you selected a wrong genome", 10000);
		}
	}
	
	// Load a track from a file with the modal
	function igvLoadTrackFromFile(){
		let trackFile = $("#igvTrackFileInput").get(0).files[0];
		let indexFile = $("#igvTrackIndexFileInput").get(0).files[0];
		let trackConfig = {
			name: trackFile.name,
			removable: true,
		};
		if (indexFile){
			trackConfig.url = trackFile;
			trackConfig.indexURL = indexFile;
		} else {
			trackConfig.url = trackFile;
			trackConfig.indexed = false;
		}
		
		igvLoadTrack(trackConfig);
	}
	
	// Load a track by URL with the modal
	function igvLoadTrackFromURL(){
		let trackURL = $("#igvTrackURLInput").val().trim();
		let indexURL = $("#igvTrackIndexURLInput").val().trim();
		
		let filename;
		try {  // Check whether the file URL is valid
			filename = filenameFromURL(new URL(trackURL));  // Get the file name from the given URL
		} catch (error){
			displayMessage("Invalid track file URL : " + trackURL);
			return;
		}
		
		if (indexURL.length > 0){
			try {  // Check whether the index URL is valid
				indexURLObject = new URL(indexURL);
			} catch (error){
				displayMessage("Invalid index file URL : " + indexURL);
				return;
			}
		}
		
		let trackConfig = {
			name: filename,
			removable: true,
		};
		if (indexURL){
			trackConfig.url = trackURL;
			trackConfig.indexURL = indexURL;
		} else {
			trackConfig.url = trackURL;
			trackConfig.indexed = false;
		}
			
		igvLoadTrack(trackConfig);
	}
	
	// Load a track with a track config
	function igvLoadTrack(config){
		if (igvBrowser) {
			igvBrowser.loadTrack(config);
		}
	}

	// Create the IGV browser, provided a genome config
	function igvCreateBrowser(genome){
		let browserConfig = {
			genome: genome,
			tracks: [],
			genomeList: igvFlatGenomeList,
			queryParametersSupported: true,
			loadDefaultGenomes: false,
			showSampleNames: true,
			sampleNameViewportWidth: 120,
		};
		
		return igv.createBrowser($("#igvContainer")[0], browserConfig).then(function (browser){
			console.log("Created IGV browser");
			igvBrowser = browser;
			$("#igvTracksDropdown").removeClass("disabled");
			$("#igvTracksDropdown ul").addClass("dropdown-menu").attr("hidden", "false");
			
			// Fix IGV browser resizing bug
			// Trigger a resize on modal reopening if it bugged
			$("#igvPanel").on("shown.bs.modal", function(){
				if (igvBrowser){
					// Check whether it bugged (negative range)
					let posString = igvBrowser.currentLoci()[0].split(":").pop().replace(/,/g, "").split(/\-(.+)/);
					if (posString.length >= 2 && parseInt(posString[0]) >= parseInt(posString[1]))
						igvBrowser.resize();

					setIgvLocusIfApplicable();
				}
			});
		}).catch(function (reason){
			displayMessage("Error during the creation of the IGV browser : " + reason);
			igv.removeAllBrowsers();  // Delete the parasite browser
		});
	}
	
	function setIgvLocusIfApplicable() {
		var minPos = getSearchMinPosition(), maxPos = getSearchMaxPosition();
	    if (minPos > -1 && minPos < maxPos && $('#Sequences').selectmultiple('count') == 1)
	    	setTimeout(function() {igvBrowser.goto($('#Sequences').selectmultiple('value')[0] + ":" + minPos + "-" + maxPos);}, 0);
	}

	// Called when the individuals groups have been changed
	// Update the browser's variant track if necessary
	function igvUpdateIndividuals(){
		let group = $('input[name="igvGroupsButton"]:checked').val();
		if (igvBrowser && group != "all"){
			igvUpdateVariants();
		}
	}
	
	// Update the browser's variant track
	function igvUpdateVariants(){
		if (igvBrowser){
			let trackIndividuals = igvSelectedIndividuals();
			let trackConfigs = [];
			
			trackIndividuals.forEach (function(individuals, index, array) {
				trackConfigs.push({
					name: array.length > 1 ? "Group " + (index+1) : "Query",
					type: "variant",
					format: "custom",
					sourceType: "file",
					order: Number.MAX_SAFE_INTEGER,
					visibilityWindow: 100000,
					reader: new GigwaSearchReader(
							individuals, token,
							"<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.IGV_DATA_PATH%>" />")
				});
			})
			
			
			// Display bug when updating while hidden
			// So we delay it until the modal is shown again
			let updateFunction = async function (){
				// Remove the existing variant tracks
				if (igvVariantTracks){
					for (let track of igvVariantTracks)
						await igvBrowser.removeTrack(track);
					igvVariantTracks = undefined;	
				}
				
				// Add the new tracks
				let availableHeight = igvAvailableHeight();
				for (let config of trackConfigs){
					config.height = Math.max(200, availableHeight / trackConfigs.length);
					let track = await igvBrowser.loadTrack(config);
					if (!igvVariantTracks) igvVariantTracks = [];
					igvVariantTracks.push(track);
				}
			}
			
			// Or .hasClass("in") ?
			if ($("#igvPanel").is(":visible")){  // Already visible -> update right away
				return updateFunction();
			} else {  // Not visible -> hook it on the modal opening event
				// In case several searches are made without showing the browser, prevents obsolete requests from triggering
				$("#igvPanel").off("shown.bs.modal.updateVariants");
			
				return new Promise(function(resolve, reject) {
					$("#igvPanel").one("shown.bs.modal.updateVariants", function() {
						updateFunction().then(resolve).catch(reject);
					});
				});
				
			}
		}
	}
	
	// Remove the browser if it is initialised
	function igvRemoveExistingBrowser(){
		if (igvBrowser){
			igv.removeBrowser(igvBrowser);
			igvBrowser = undefined;
			igvVariantTracks = undefined;
			
			// Disable the tracks menu again
			$("#igvTracksDropdown").addClass("disabled");
			$("#igvTracksDropdown ul").removeClass("dropdown-menu").attr("hidden", "true");
		}
	}
	
	// Calculate the available height in the browser
	function igvAvailableHeight(){
		// NOTE : Hack with internal attributes, high risk of breaking in future IGV releases
		let viewport = igvBrowser.trackViews[igvBrowser.trackViews.length - 1].viewports[0].$viewport;
		let top = viewport.offset().top + viewport.outerHeight();  // Top limit : bottom of the track immediately above
		let modal = $("#igvPanel div.modal-lg div.modal-content");
		let bottom = modal.offset().top + modal.innerHeight();  // Bottom limit : size of the modal content
		let height = bottom - top - 20;
		return height;
	}
	
	// Select a group of individuals to display
	function igvSelectGroup(){
		igvUpdateVariants();
	}
	
	// Get the list of individuals to display in IGV
	// Return an empty array for all individuals
	function igvSelectedIndividuals(){
		let group = $('input[name="igvGroupsButton"]:checked').val();
		let trackIndividuals;
		switch (group){
			case "selected":
				trackIndividuals = [getAllSelectedIndividuals(false)]; break;
			case "group1":
				trackIndividuals = [getSelectedIndividuals(1, false)]; break;
			case "group2":
				trackIndividuals = [getSelectedIndividuals(2, false)]; break;
			case "separate":
				trackIndividuals = [getSelectedIndividuals(1, false), getSelectedIndividuals(2, false)]; break;
			case "all":
				trackIndividuals = [[]]; break;
		}
		return trackIndividuals;
	}
</script>
<script type="text/javascript" src="js/charts.js"></script>
</head>

<c:if test='${!fn:startsWith(googleAnalyticsId, "??") && !empty googleAnalyticsId}'>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${googleAnalyticsId}');
</script>
</c:if>

<body>
	<%@include file="navbar.jsp"%>
	<iframe style='display:none;' id='outputFrame' name='outputFrame'></iframe>
	<main>
	<div id="welcome">
		<h3>Welcome to Gigwa</h3>
		<p>
		Gigwa, which stands for “Genotype Investigator for Genome-Wide Analyses”, is an application that provides an easy and intuitive way to explore large amounts of genotyping data by filtering it not only on the basis of variant features, including functional annotations, but also matching genotype patterns. It is a fairly lightweight, web-based, platform-independent solution that may be deployed on a workstation or as a data portal. It allows to feed a MongoDB database from various data formats with up to tens of billions of genotypes, and provides a user-friendly interface to filter data in real time.
		</p>
		<p>
		The system embeds various online visualization features that are easy to operate. Gigwa also provides the means to export filtered data into several popular formats and features connectivity not only with online genomic tools, but also with standalone software such as FlapJack or IGV. Additionnally, Gigwa-hosted datasets are interoperable via two standard REST APIs: GA4GH and BrAPI.
		</p>
		<p class="margin-top bold">
			Project homepage: <a href="https://southgreen.fr/content/gigwa" target='_blank'>http://southgreen.fr/content/gigwa</a>
			<br/>
			GitHub: <a href="https://github.com/SouthGreenPlatform/Gigwa2" target='_blank'>https://github.com/SouthGreenPlatform/Gigwa2</a>
		</p>
		<c:set var="adminEmail" value="<%= appConfig.get(\"adminEmail\") %>"></c:set>
		<c:if test='${!fn:startsWith(adminEmail, "??") && !empty adminEmail}'>
			<p class="margin-top">For any inquiries please contact <a href="mailto:${adminEmail}">${adminEmail}</a></p>
		</c:if>
		<div class="margin-top" style="margin:0 -30px; text-align:center; text-align:center;" id="logoRow">	 
			<a href="http://www.southgreen.fr/" target="_blank"><img alt="southgreen" height="28" src="images/logo-southgreen.png" /></a>
			<a href="http://www.cirad.fr/" target="_blank" class="margin-left"><img alt="cirad" height="28" src="images/logo-cirad.png" /></a>
			<a href="http://www.ird.fr/" target="_blank" class="margin-left"><img alt="ird" height="28" src="images/logo-ird.png" /></a>
			<a href="http://www.inrae.fr/" target="_blank" class="margin-left"><img alt="inra" height="20" src="images/logo-inrae.png" /></a>
			<a href="https://alliancebioversityciat.org/" target="_blank" class="margin-left"><img alt="bioversity intl" height="35" src="images/logo-bioversity.png" /></a>
			<a href="http://www.arcad-project.org/" target="_blank" class="margin-left"><img alt="arcad" height="25" src="images/logo-arcad.png" /></a>
		</div>
		<c:set var="howToCite" value="<%= appConfig.get(\"howToCite\") %>"></c:set>
		<c:choose>
			<c:when test='${!fn:startsWith(howToCite, "??") && !empty howToCite}'>
				<pre class="margin-top" style="font-size:10px; position:absolute;">${howToCite}</pre>
			</c:when>
			<c:otherwise>
<pre class="margin-top" style="font-size:10px; position:absolute;">Please cite Gigwa as follows:
Guilhem Sempéré, Adrien Pétel, Mathieu Rouard, Julien Frouin, Yann Hueber, Fabien De Bellis, Pierre Larmande,
Gigwa v2—Extended and improved genotype investigator, GigaScience, Volume 8, Issue 5, May 2019, giz051,
https://doi.org/10.1093/gigascience/giz051</pre>
			</c:otherwise>
		</c:choose>
	</div>
	<div class="container-fluid" style="padding:0 10px;">
		<div class="row" id="searchPanel" hidden>
			<div id="searchDiv" class="col-md-3" style="padding: 0px 0px 0px 15px;">
				<div class="col-md-12">
					<!-- Search panel -->
					<div class="row">
						<div class="panel panel-default">
							<p id="menu1" class="box-shadow-menu" onclick="menuAction();"><span class="glyphicon glyphicon-menu-hamburger" aria-hidden="true" style="margin-right:3px;"></span></p>
							<div id="submenu">
								<p><label><input type="checkbox" id="filterIDsCheckbox" name="filterIDsCheckbox" onchange="onFilterByIds(this.checked);"> Filter by IDs</label></p>
								<p onclick="if (confirm('Are you sure?')) resetFilters();"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span> Clear filters</p>
								<c:if test="${principal != null && !isAnonymous}">
					   				<p id="savequery" onclick="saveQuery()" ><span class="glyphicon glyphicon-bookmark" aria-hidden="true"> </span> Bookmark current query </p>
									<p id="listqueries" onclick="listQueries()"><span class="glyphicon glyphicon-th-list" aria-hidden="true"> </span> View bookmarked query list </p>
					   			</c:if>
								
							</div>
							<div class="panel-body panel-grey shadowed-panel">
								<form class="form">
								   <div class="col">
									  <div class="container-fluid">
										  <div class="row">
											<div class="col-xl-6 half-width" style="float:left;">
												<label for="variantTypes" class="custom-label" id="variantTypesLabel">Variant types</label>
												<select class="selectpicker" multiple id="variantTypes" data-actions-box="true" data-width="100%"											
													data-none-selected-text="Any" data-select-all-text="All" data-deselect-all-text="None" name="variantTypes"></select>												
										  	</div>
										  	<div class="col-xl-6 half-width" style="float:left; margin-left:10px;" id="nbAlleleGrp">
												<label for="numberOfAlleles" class="custom-label">Number of alleles</label>
												<select class="selectpicker" multiple id="numberOfAlleles" data-actions-box="true" data-width="100%"
													data-none-selected-text="Any" data-select-all-text="All" data-deselect-all-text="None" name="numberOfAlleles"></select>
											</div>
										 </div>
									  </div>
									</div>
                                    <div id="sequenceFilter">
                                        <div class="custom-label margin-top-md" id="sequencesLabel">Sequences</div>
                                        <div id="Sequences"></div>
                                    </div>
                                    <div id="positions" class="margin-top-md">
										<label id="positionLabel" for="minposition" class="custom-label">Position (bp)</label>
										<div class="container-fluid">
										  <div class="row">
										  	<div class="col-xl-6 input-group half-width" style="float:left;">
												<span class="input-group-addon input-sm">&ge;</span><input style="padding:3px; font-size:11px;"
													id="minposition" class="form-control input-sm" type="text"
													name="minposition" maxlength="11" onpaste="var el=this; setTimeout(function() { el.value=el.value.replace(/\D/g, ''); }, 0);" onkeypress="return isNumberKey(event);">
											</div>
										   <div class="col-xl-6 input-group half-width" style="float:left; margin-left:10px;">
											  <span class="input-group-addon input-sm">&le;</span><input style="padding:3px; font-size:11px;"
												  id="maxposition" class="form-control input-sm" type="text"
												  name="maxposition" maxlength="11" onpaste="var el=this; setTimeout(function() { el.value=el.value.replace(/\D/g, ''); }, 0);" onkeypress="return isNumberKey(event);">
											</div>
										  </div>
										</div>
									</div>
									<div class="margin-top-md" id="varEffGrp">
									   <label for="variantEffects">Variant Effects</label>
									   <div class="form-input">
										  <select class="selectpicker" multiple id="variantEffects"
											 data-actions-box="true" data-width="100%"
											 data-live-search="true" name="variantEffects"></select>
									   </div>
									</div>
									<div id="genesGrp" class="margin-top-md">
									   <label for="geneName" class="custom-label">Genes</label>
									   <div class="input-group">
										  <input id="geneName" class="form-control input-sm" type="text"
											 name="genes"> <span class="input-group-addon input-sm"> <span
											 class="glyphicon glyphicon-question-sign" id="geneHelp"
											 title="Leave blank to ignore this filter. Enter '-' for variants without gene-name annotation. Enter '+' for variants with any gene-name annotation. Enter comma-separated names for specific genes"></span>
										  </span>
									   </div>
									</div>
                                                                        <div id="VariantIds" class="margin-top-md">
                                        <div class="container-fluid">
                                            <div class="row">
                                                <div class="col-xl-6 input-group half-width custom-label" style="float:left;" id="variantIdsLabel">Variant IDs</div>   
                                            </div>
                                        </div>
                                        
                                        <div class="form-input">
                                            <select id="variantIdsSelect" class="selectpicker select-main" multiple data-live-search="true" disabled data-selected-text-format="count > 0" onchange="onVariantIdsSelect()"></select>
                                        </div>
                                        <div style="margin-top:-25px; text-align:right;">
											<a id="clearVariantIdSelection" href="#" onclick="clearVariantIdSelection();" style="display:none; font-size:18px; margin-left:-20px; position:absolute; font-weight:bold; text-decoration:none;" title="Clear selection">&nbsp;X&nbsp;</a>
                                            <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-copy" title="Copy current selection to clipboard" id="copyVariantIds" disabled onclick="copyVariants(); var infoDiv=$('<div class=\'col-xl-6 input-group half-width\' style=\'float:right\'>Copied!</div>'); $('#variantIdsLabel').after(infoDiv); setTimeout(function() {infoDiv.remove();}, 1200);"></button>
                                            <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-paste" aria-pressed="false" title="Paste filtered list from clipboard" id="pasteVariantIds" disabled onclick="toggleVariantsPasteBox();"></button>
                                            <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-upload" aria-pressed="false" title="Upload file with up to 1M variant IDs" id="uploadVariantIds" onclick="$('#uploadVariantIdsFile').trigger('click');"></button>
                                            <input name="file" type="file" id="uploadVariantIdsFile" style="display:none" />
                                        </div>
                                    </div>
									<div class="margin-top-md">
										<label class="custom-label margin-top-md">Investigate genotypes</label>
										<div style="float:right;">
											<select class="selectpicker form-control input-sm" data-width="92px" data-style="btn-primary" id="genotypeInvestigationMode" onchange="setGenotypeInvestigationMode(parseInt($(this).val()));">
											  <option value="0" selected>disabled</option>
											  <option value="1">on 1 group</option>
											  <option value="2">on 2 groups</option>
											</select>
										</div>
									</div>
								</form>
							</div>
						</div>
					</div>

					<div class="row genotypeInvestigationDiv" id="genotypeInvestigationDiv1">
						<span style="float:right; margin:3px; font-style:italic; font-weight:bold;">Group 1</span>
						<div class="panel panel-default group1 shadowed-panel">
							<div class="panel-body">
							   <form class="form" role="form">
							   <div class="custom-label" id="individualsLabel1">Individuals</div>
							   <div id="Individuals1"></div>
							   <div style="margin-top:-25px; text-align:right;">
								   <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-floppy-save" data-toggle="button" aria-pressed="false" id="groupMemorizer1" onclick="setTimeout('applyGroupMemorizing(1);', 100);"></button>
								   <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-search hidden" title="Filter using metadata" id="groupSelector1" onclick="selectGroupUsingMetadata(1);"></button>
								   <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-copy" title="Copy current selection to clipboard" onclick="copyIndividuals(1); var infoDiv=$('<div style=\'margin-top:-40px; right:55px; position:absolute;\'>Copied!</div>'); $(this).before(infoDiv); setTimeout(function() {infoDiv.remove();}, 1200);"></button>
								   <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-paste" aria-pressed="false" title="Paste filtered list from clipboard" id="pasteIndividuals1" onclick="toggleIndividualPasteBox(1);"></button>
							   </div>
							   <div class="col margin-top-md vcfFieldFilters">
							   		<label class="custom-label">Minimum per-sample...</label><br/>
									<div class="container-fluid">
									  <div class="row" id="vcfFieldFilterGroup1"></div>
									</div>
									<small class="text-muted">(other data seen as missing)</small>
							   </div>						
								<div class="margin-top-md">
									<div class="container-fluid">
									  <div class="row">
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
											<input name="minMissingData1" value="0" id="minMissingData1" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('MissingData', 1, 0, 100);">
											<span class="input-group-addon input-sm">&le;</span>
											</div>
										</div>
										<div class="col-md-4" style="text-align:center; padding:7px 2px;">
											<label class="custom-label">Missing %</label>
										</div>
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
										  <span class="input-group-addon input-sm">&le;</span>
										  <input name="maxMissingData1" value="100" id="maxMissingData1" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('MissingData', 1, 0, 100);">
										  </div>
										</div>
									  </div>
									</div>
								</div>
								<div class="mafZone">
									<div class="container-fluid">
									  <div class="row">
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
											<input name="minMaf1" value="0" id="minMaf1" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="50" onblur="rangeChanged('Maf', 1, 0, 50);">
											<span class="input-group-addon input-sm">&le;</span>
											</div>
										</div>
										<div class="col-md-4" style="text-align:center; padding:0 2px; margin-top:-3px;">
											<label class="custom-label">MAF %<small><br/>(for bi-allelic)</small></label>
										</div>
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
										  <span class="input-group-addon input-sm">&le;</span>
										  <input name="maxMaf1" value="50" id="maxMaf1" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="50" onblur="rangeChanged('Maf', 1, 0, 50);">
										  </div>
										</div>
									  </div>
									</div>
								</div>
								<div>
									<div class="container-fluid">
									  <div class="row">
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
											<input name="minHeZ1" value="0" id="minHeZ1" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('HeZ', 1, 0, 100);">
											<span class="input-group-addon input-sm">&le;</span>
											</div>
										</div>
										<div class="col-md-4" style="text-align:center; padding:7px 2px;">
											<label class="custom-label">HeteroZ %</label>
										</div>
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
										  <span class="input-group-addon input-sm">&le;</span>
										  <input name="maxHeZ1" value="100" id="maxHeZ1" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('HeZ', 1, 0, 100);">
										  </div>
										</div>
									  </div>
									</div>
								</div>
								<div class="margin-top-md">
								   <div id="mostSameRatioSpan1" style="position:absolute; right:10px; margin-top:-2px;">&nbsp;Similarity ratio
										<input id="mostSameRatio1" class="input-xs" style="width:35px;" value="100" maxlength="3"
										onkeypress="return isNumberKey(event);" onblur="if ($(this).val() > 100) $(this).val(100);">%
								   </div>
								   <label for="Genotypes1" class="custom-label">Genotype patterns</label>
								   &nbsp;
								   <span class="glyphicon glyphicon-question-sign" id="genotypeHelp1"></span>
								   <br/>
								   <select
									  class="selectpicker" id="Genotypes1" data-actions-box="true"
									  data-width="100%" data-live-search="true" name="Genotypes1"></select>
								</div>
								</form>
							</div>
						</div>
					</div>

					<div class="row" id="discriminationDiv" hidden>
						<div class="panel panel-default panel-pink shadowed-panel">
							<div class="panel-body">
								<div id="overlapWarning" hidden style="float:right; font-weight:bold; margin-top:2px; cursor:pointer; cursor:hand;" title="Some individuals are selected in both groups"><img align="left" src="images/warning.png" height="15" width="18" />&nbsp;Overlap</div>
								<label class="label-checkbox">
									<input type="checkbox" id="discriminate" class="input-checkbox" title="Check this box to limit search to variants for which the major genotype differs between both groups" onchange="checkGroupOverlap();">
									&nbsp;Discriminate groups
								</label>
							</div>
						</div>
					</div>

					<div class="row genotypeInvestigationDiv" id="genotypeInvestigationDiv2">
						<span style="float:right; margin:3px; font-style:italic; font-weight:bold;">Group 2</span>
						<div class="panel panel-default group2 shadowed-panel">
							<div class="panel-body">
							   <form class="form" role="form">
							   <div class="custom-label" id="individualsLabel2">Individuals</div>
							   <div id="Individuals2"></div>
							   <div style="margin-top:-25px; float:right;">
								   <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-floppy-save" data-toggle="button" aria-pressed="false" id="groupMemorizer2" onclick="setTimeout('applyGroupMemorizing(2);', 100);"></button>
								   <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-search hidden" title="Filter using metadata" id="groupSelector2" onclick="selectGroupUsingMetadata(2);"></button>
								   <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-copy" title="Copy current selection to clipboard" onclick="copyIndividuals(2); var infoDiv=$('<div style=\'margin-top:-40px; right:55px; position:absolute\'>Copied!</div>'); infoDiv.insertBefore($(this)); setTimeout(function() {infoDiv.remove();}, 1200);"></button>
								   <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-paste" aria-pressed="false" title="Paste filtered list from clipboard" id="pasteIndividuals2" onclick="toggleIndividualPasteBox(2);"></button>
							   </div>
							   <div class="col margin-top-md vcfFieldFilters">
							   		<label class="custom-label">Minimum per-sample...</label><br/>
									<div class="container-fluid">
									  <div class="row" id="vcfFieldFilterGroup2"></div>
									</div>
									<small class="text-muted">(other data seen as missing)</small>
							   </div>
								<div class="margin-top-md">
									<div class="container-fluid">
									  <div class="row">
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
											<input name="minMissingData2" value="0" id="minMissingData2" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('MissingData', 2, 0, 100);">
											<span class="input-group-addon input-sm">&le;</span>
											</div>
										</div>
										<div class="col-md-4" style="text-align:center; padding:7px 2px;">
											<label class="custom-label">Missing %</label>
										</div>
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
										  <span class="input-group-addon input-sm">&le;</span>
										  <input name="maxMissingData2" value="100" id="maxMissingData2" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('MissingData', 2, 0, 100);">
										  </div>
										</div>
									  </div>
									</div>
								</div>
								<div class="mafZone">
									<div class="container-fluid">
									  <div class="row">
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
											<input name="minMaf2" value="0" id="minMaf2" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="50" onblur="rangeChanged('Maf', 2, 0, 50);">
											<span class="input-group-addon input-sm">&le;</span>
											</div>
										</div>
										<div class="col-md-4" style="text-align:center; padding:0 2px; margin-top:-3px;">
											<label class="custom-label">MAF %<small><br/>(for bi-allelic)</small></label>
										</div>
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
										  <span class="input-group-addon input-sm">&le;</span>
										  <input name="maxMaf2" value="50" id="maxMaf2" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="50" onblur="rangeChanged('Maf', 2, 0, 50);">
										  </div>
										</div>
									  </div>
									</div>
								</div>
								<div>
									<div class="container-fluid">
									  <div class="row">
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
											<input name="minHeZ2" value="0" id="minHeZ2" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('HeZ', 2, 0, 100);">
											<span class="input-group-addon input-sm">&le;</span>
											</div>
										</div>
										<div class="col-md-4" style="text-align:center; padding:7px 2px;">
											<label class="custom-label">HeteroZ %</label>
										</div>
									  	<div class="col-md-4" style="padding:0;"><div class="input-group">
										  <span class="input-group-addon input-sm">&le;</span>
										  <input name="maxHeZ2" value="100" id="maxHeZ2" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('HeZ', 2, 0, 100);">
										  </div>
										</div>
									  </div>
									</div>
								</div>
								<div class="margin-top-md">
								   <div id="mostSameRatioSpan2" style="position:absolute; right:10px; margin-top:-2px;">&nbsp;Similarity ratio
										<input id="mostSameRatio2" class="input-xs" style="width:35px;" value="100" maxlength="3"
										onkeypress="return isNumberKey(event);" onblur="if ($(this).val() > 100) $(this).val(100);">%
								   </div>
								   <label for="Genotypes2" class="custom-label">Genotype patterns</label>
								   &nbsp;
								   <span class="glyphicon glyphicon-question-sign" id="genotypeHelp2"></span>
								   <br/>
								   <select
									  class="selectpicker" id="Genotypes2" data-actions-box="true"
									  data-width="100%" data-live-search="true" name="Genotypes2"></select>
								</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Variant table panel -->
			<div class="col-md-9">
				<div id="serverExportBox" class="panel"></div>
				<div class="row" style="margin-top:-5px; margin-left:1px; position:absolute; width:180px;">
					<label for="browsingAndExportingEnabled" class="label-checkbox" style="float:right; margin-top:-1px; width:90px;">&nbsp;Enable browse and export</label>
					<input type="checkbox" onchange="browsingBoxChanged();" id="browsingAndExportingEnabled" class="input-checkbox" checked="checked" style="float:right; margin-top:15px;">
					<button class="btn btn-primary btn-sm" type="button" name="search" onclick="sortBy=''; sortDesc=false; searchVariants(0, '0');">Search</button>
				</div>
				<div id="rightSidePanel">
					<div class="row text-center" id="navigationPanel">
						<div id="navigationDiv">
							<div style="float:left;"><button class="btn btn-primary btn-sm" type="button" id="prev" onclick="iteratePages(false);"> &lt; </button></div>					
							<div style="float:right;"><button class="col btn btn-primary btn-sm" type="button" id="next" onclick="iteratePages(true);"> &gt; </button></div>
							<div id="currentPage"></div>
						</div>
						<div style="float:right; margin-top:-5px; width:340px;" class="row">
							<div class="col-md-5" style='text-align:right;'>
								<button style="padding:2px;" title="Visualization charts" id="showCharts" class="btn btn-default" type="button" onclick="if (seqCount === 0) alert('No sequence to display'); else {  $('#density').modal('show'); initializeChartDisplay(); }">
									<img title="Visualization charts" src="images/density.webp" height="25" width="25" />
								</button>
								
								<!-- IGV.js browser button -->
								<button style="padding:2px;" title="IGV.js" id="showIGV" class="btn btn-default" type="button" onclick="igvOpenDialog();">
									<img title="IGV.js online genome browser" src="images/igvjs.png" height="25" width="25" />
								</button>
								
								<div class="row" id="exportPanel" style="position:absolute; margin-left:-220px; width:350px; margin-top:2px; z-index:1; display:none;">
									<div class="panel panel-default panel-grey shadowed-panel">
										<div class="panel-body panel-center text-center">
											<div class="form-group text-nowrap">
												<label for="exportFormat">Export format</label>
												<select class="selectpicker" data-actions-box="true" data-width="50%" id="exportFormat"></select>
												<div id="formatInfo" style="white-space: normal;" align='center'>
													<div id="formatDesc"></div>
												</div>
												<span title="Click to toggle information on selected format" class="glyphicon glyphicon-question-sign hand-cursor" id="formatHelp" onclick="$('#formatInfo').toggle();"></span>
											</div>
											<div class="form-group text-nowrap row margin-top-md">
												<div class="col-md-6" style="padding-right:10px;">
													<div class="individualRelated">
														<label for="exportedIndividuals">Exported individuals</label><br/>
														<select class="selectpicker" id="exportedIndividuals" onchange="toggleIndividualSelector($(this).parent(), 'choose' == $(this).selectpicker('val'));">
															<option id="exportedIndividualsAll" value="">All of them</option>
														</select>
													</div>
												</div>
												<div class="col-md-6" style="text-align:center; padding-left:10px;">
													<div class="individualRelated">
														<label for="exportedIndividualMetadataCheckBox">
															<input type="checkbox" class="input-checkbox" id="exportedIndividualMetadataCheckBox" onchange="$('#exportedIndividualMetadata').prop('disabled', !$(this).prop('checked'));" />
															Export metadata
														</label>&nbsp;<br/>
														<select disabled id="exportedIndividualMetadata" multiple style="width:100%;" size="12"></select>
													</div>
													<div style="width:100%; text-align:center;">
														<label class="margin-top margin-bottom label-checkbox" style="margin-left:-10px;">
															<input type="checkbox" onclick="var serverAddr=location.origin.substring(location.origin.indexOf('//') + 2); $('div#serverExportWarning').html($(this).prop('checked') && (serverAddr.toLowerCase().indexOf('localhost') == 0 || serverAddr.indexOf('127.0.0.1') == 0) ? 'WARNING: Gigwa seems to be running on localhost, any external tool running on a different machine will not be able to access exported files! If the computer running the webapp has an external IP address or domain name, you should use that instead.' : '');" id="keepExportOnServ" title="If ticked, generates a file URL instead of initiating a direct download. Required for pushing exported data to external online tools." class="input-checkbox"> Keep files on server&nbsp;&nbsp;
														</label>
														<div>
															<button id="export-btn" class="btn btn-primary btn-sm" onclick="exportData();">Export</button>
														</div>
													</div>
												</div>
											</div>
											<div id="serverExportWarning"></div>
										</div>
									</div>
								</div>
								<a class="btn icon-btn btn-default" id="exportBoxToggleButton" data-toggle="button" class-toggle="btn-inverse" style="padding:5px 10px 4px 10px;" href="#" onclick="toggleExportPanel();" title="Export selection">
									<span class="glyphicon btn-glyphicon glyphicon-save img-circle text-muted"></span>
								</a>
							</div>
							<div class="col-md-7 panel panel-default panel-grey shadowed-panel" style="padding:3px 12px;">
								External tools
								<a href="#" onclick='$("div#genomeBrowserConfigDiv").modal("show");'><img style="margin-left:8px; cursor:pointer; cursor:hand;" title="(DEPRECATED in favor of using the embedded IGV.js) Click to configure an external genome browser for this database" src="images/icon_genome_browser.gif" height="20" width="20" /></a>
								<img id="igvTooltip" style="margin-left:8px; cursor:pointer; cursor:hand;" src="images/logo-igv.jpg" height="20" width="20" title="(DEPRECATED in favor of using the embedded IGV.js) You may send selected variants to a locally running instance of the standalone IGV application by ticking the 'Keep files on server' box and exporting in VCF format. Click this icon to download IGV" onclick="window.open('https://software.broadinstitute.org/software/igv/download');" />
								<a href="#" onclick='$("div#outputToolConfigDiv").modal("show");'><img style="margin-left:8px; cursor:pointer; cursor:hand;" title="Click to configure online output tools" src="images/outputTools.png" height="20" width="20" /></a>
							</div>
						</div>
					</div>
					<div class="panel panel-default panel-grey shadowed-panel" id="countResultPanel">
						<div id="countResultDiv" class="padding-bottom text-center">
							<h4 class="textResult margin-top-md" id="result"></h4>
						</div>
					</div>
					<div class="panel panel-default panel-grey shadowed-panel" id="resultDisplayPanel" style="margin-top:5px;">
						<div class="auto-overflow table-div" id="scrollTable">
							<table class="table table-hover" id="variantTable"></table>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- IGV visualizer panel
		<div id="viewerPanel" class="row" hidden>
			<div id="igvContainer" class="col">
			</div>
		</div> -->
	</div>
	</main>
	<!-- modal which display process progress -->
	<div class="modal" tabindex="-1" id="progress" aria-hidden="true">
		<div class="modal-dialog modal-sm">
			<div class="modal-content modal-progress">
				<div class="loading text-center">
					<div>
						<div class="c1"></div>
						<div class="c2"></div>
						<div class="c3"></div>
						<div class="c4"></div>
					</div>
					<h3 class="loading-message"><span id="progressText" class="loading-message">Please wait...</span><span id="ddlWarning" style="display:none;"><br/><br/>Output file is being generated and will not be valid before this message disappears</span></h3>
					<br/>
					<button style="display:inline; margin-right:10px;" class="btn btn-danger btn-sm" type="button" name="abort" id='abort' onclick="abort($(this).attr('rel')); $('a#exportBoxToggleButton').removeClass('active');">Abort</button>
					<button style="display:inline; margin-left:10px;" id="asyncProgressButton" class="btn btn-info btn-sm" type="button" onclick="window.open('ProgressWatch.jsp?process=export_' + token + '&abortable=true&successURL=' + escape(downloadURL));" title="This will open a separate page allowing to watch export progress at any time. Leaving the current page will not abort the export process.">Open async progress watch page</button>
				</div>
			</div>
		</div>
	</div>
	<!-- genome browser modal -->
	<div class="modal" id="genomeBrowserPanel" role="dialog">
		<div class="modal-dialog modal-lg" role="document">
			<div class="modal-content">
				<div id="genomeBrowserPanelHeader"></div>
				<iframe id="genomeBrowserFrame" style="width:100%;"></iframe>
			</div>
		</div>
	</div>
	<!-- Flapjack-Bytes modal -->
	<div class="modal" id="fjBytesPanel" role="dialog">
		<div class="modal-dialog modal-lg" role="document">
			<div class="modal-content" style="overflow:hidden;">
				<div id="fjBytesPanelHeader"></div>
				<iframe id="fjBytesFrame" style="width:100%;"></iframe>
			</div>
		</div>
	</div>
	<!-- variant detail modal -->
	<div class="modal fade" role="dialog" id="variantDetailPanel" aria-hidden="true">
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<div style="float: right; margin: 10px;">
					<a class="btn btn-sm icon-btn btn-default active" id="toggleFunctionalAnn" data-toggle="button" class-toggle="btn-inverse" style="padding:5px 10px; margin-right:30px;" href="#" onclick="$('#functionalAnn').toggle(100);">
						View functional annotations
					</a>
					<a class="btn btn-sm icon-btn btn-default active" id="toggleVariantMetadata" data-toggle="button" class-toggle="btn-inverse" style="padding:5px 10px; margin-right:30px;" href="#" onclick="$('#variantMetadata').toggle(100);">
						View variant metadata
					</a>
					Run:
					<div class="btn-group" data-toggle="buttons" id="runButtons"></div>
				</div>
				<div class="modal-header">
					<h4 class="modal-title" id="variantDetailsLabel">Variant details</h4>
				</div>
				<div class="modal-body">
					<div class="bg-dark text-white">
						<div class="row margin-left">
							<div class="col-md-6">
								<p id="varId" class="text-bold"></p>
							</div>
							<div class="col-md-6">
								<p id="varSeq" class="text-bold"></p>
							</div>
						</div>
						<div class="row margin-left">
							<div class="col-md-6">
								<p id="varType" class="text-bold"></p>
							</div>
							<div class="col-md-6">
								<p id="varPos" class="text-bold"></p>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-12">
							<div class="auto-overflow" id="scrollingAnnotationDiv"></div>
						</div>
					</div>
					<div class="row margin-bottom text-center">
						<div class="col-md-2"></div>
						<div class="col-md-4">
							<label class="label-checkbox" id="displayAllGtOption">display all genotypes <input type="checkbox" id="displayAllGt" class="input-checkbox" /></label>
						</div>
						<div class="col-md-4">
							<label><span class="missingData">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> treated as missing data</label>
						</div>
					</div>
					<div class="row">
						<div class="col-md-12">
							<div id="gtTable" class="auto-overflow"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- modal which displays density data -->
	<div class="modal fade" role="dialog" id="density" aria-hidden="true">
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<div class="modal-header" id="chartContainer"></div>
			</div>
		</div>
	</div>
	<!-- modal which displays project information -->
	<div class="modal fade" role="dialog" id="projectInfo" aria-hidden="true" style="margin-top:200px;">
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<div class="modal-header" id="projectInfoContainer"></div>
			</div>
		</div>
	</div>
	<!-- modal which displays individual selection interface -->
	<div class="modal fade" role="dialog" id="individualFiltering" aria-hidden="true">
		<div class="modal-dialog modal-lg">
			<div class="modal-content" style="padding:10px; min-height:90vh;">
				<div class="bold" style='float:right;'>
					Click to set group <span id="filteredGroupNumber"></span> to currently selected <span id="filteredIndCount"></span> individuals
					<button class="btn btn-primary btn-sm" onclick="var groupN=$('span#filteredGroupNumber').text(); $('#Individuals' + groupN).selectmultiple('batchSelect', [$('table#individualFilteringTable tr:gt(0):not([style*=\'display: none\']) td span').map(function(index, value) { return $(value).text(); }).get()]); $('#Individuals' + groupN).change(); applyGroupMemorizing(groupN); $('#individualFiltering').modal('hide');">Apply</button>
				</div>
				<div class="modal-header bold">
					Please apply filters to select individuals
					<input class="btn btn-primary btn-sm" style="margin-left:150px;" type="button" value="Reset filters" onclick="resetDropDownFilterTable(document.getElementById('individualFilteringTable'));"/>
					<label style="margin-left:20px;">Always reset filters before using this dialog <input type="checkbox" id="resetMetadataFiltersOnDialogShown" checked></label>
				</div>
				<table id="individualFilteringTable" style="width:98%;"></table>
			</div>
		</div>
	</div>
	<!-- modal which displays a box for configuring online output tools -->
	<div id="outputToolConfigDiv" class="modal" role="dialog">
		<div class="modal-dialog modal-large" role="document">
		<div class="modal-content" style="padding:10px; text-align:center;">
			<div style="font-weight:bold; padding:10px; background-color:#eeeeee; border-top-left-radius:6px; border-top-right-radius:6px;">Configure this to be able to push exported data into external online tools<br />
			(feature available when the 'Keep files on server' box is ticked)<br />
			</div>
			<hr />
			<span class='bold'>Favourite <a href="https://galaxyproject.org/" target="_blank" border="0" style="background-color:#333333; color:white; border-radius:3px; padding:3px;"><img alt="southgreen" height="15" src="images/logo-galaxy.png" /> Galaxy</a> instance URL</span>
			<input type="text" style="font-size:11px; width:230px; margin-bottom:5px;" placeholder="https://usegalaxy.org/" id="galaxyInstanceURL" onfocus="$(this).prop('previousVal', $(this).val());" onkeyup="checkIfOuputToolConfigChanged();" />
			<br/>
			(You will need to provide an API key to be able to push exported files there)
			<hr />
			<p class='bold'>Configuring external tool <select id="onlineOutputTools" onchange="configureSelectedExternalTool();"></select></p>
			Supported formats (CSV) <input type="text" onfocus="$(this).prop('previousVal', $(this).val());" onkeyup="checkIfOuputToolConfigChanged();" style="font-size:11px; width:260px; margin-bottom:5px;" id="outputToolFormats" placeholder="Refer to export box contents (empty for all formats)" />
			<br />Online tool URL (any * will be replaced with exported file location)<br />
			<input type="text" style="font-size:11px; width:400px; margin-bottom:5px;" onfocus="$(this).prop('previousVal', $(this).val());" onkeyup="checkIfOuputToolConfigChanged();" id="outputToolURL" placeholder="http://some-tool.org/import?fileUrl=*" />
			<p>
				<input type="button" style="float:right; margin:10px;" class="btn btn-sm btn-primary" disabled id="applyOutputToolConfig" value="Apply" onclick='applyOutputToolConfig();' />
				<br/>
				(Set URL blank to revert to default)
			</p>
		</div>
		</div>
	</div>
	<!-- modal which displays a box for configuring a genome browser -->
	<div id="genomeBrowserConfigDiv" class="modal" role="dialog">
		<div class="modal-dialog modal-large" role="document">
		<div class="modal-content" style="padding:10px; text-align:center;">
			<b>Please specify a URL for the genome browser you want to use</b> <br />
			<i>indicate * wherever variant location (chr:start..end) needs to appear</i> <br />
			<input type="text" style="font-size: 11px; width: 350px;" id="genomeBrowserURL">
			<p>(Clear box to revert to default)</p>
			<input type="button" class="btn btn-sm btn-primary" value="Apply" onclick='applyGenomeBrowserURL();' />
		</div>
		</div>
	</div>
	
	<!-- modal which displays a box for managing saved queries -->
	<div id="queryManager" class="modal fade" role="dialog">
		<div class="modal-dialog modal-medium" role="document">
		<div id="loadedQueries" class="modal-content" style="padding:10px; text-align:center;">
		<b style="font-size:18px">Your bookmarked queries</b>
		<br>
		<br>
		</div>
		</div>
	</div>

	<!-- IGV modal -->
	<div class="modal fade" role="dialog" id="igvPanel" aria-hidden="true">
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<!-- IGV menu bar -->
				<div id="igvNav" class="navbar navbar-default">
					<div class="navbar-header">
						<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#igvMenu" aria-expanded="false">
							<span class="sr-only">Toggle navigation</span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
						</button>
					</div>
					<div class="collapse navbar-collapse" id="igvMenu">
						<ul class="nav navbar-nav">
							<li class="dropdown">
								<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
									Load reference genome <span class="caret"></span>
								</a>
								<ul class="dropdown-menu" id="igvGenomeMenu" style="max-height:75vh;overflow-y:auto">
									<li><a href="#" data-toggle="modal" data-target="#igvGenomeFileModal">Load from file</a></li>
									<li><a href="#" data-toggle="modal" data-target="#igvGenomeURLModal">Load from URL</a></li>
									<li role="separator" class="divider" id="igvDefaultGenomesDivider"></li>
								</ul>
							</li>
							<li id="igvTracksDropdown" class="dropdown disabled">
								<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
									Load track <span class="caret"></span>
								</a>
								<ul hidden="true">
									<li><a href="#" data-toggle="modal" data-target="#igvTrackFileModal">Load from file</a></li>
									<li><a href="#" data-toggle="modal" data-target="#igvTrackURLModal">Load from URL</a></li>
								</ul>
							</li>
							<li class="dropdown" id="igvGroupsMenu" hidden="true">
								<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
									Groups <span class="caret"></span>
								</a>
								<ul class="dropdown-menu" id="igvGenomeMenu" style="max-height:75vh;overflow-y:auto">
									<li id="igvGroupsSelected"><a href="#"><label><input type="radio" name="igvGroupsButton" value="selected" onchange="igvSelectGroup();" /> All selected individuals</label></a></li>
									<li id="igvGroups1"><a href="#"><label><input type="radio" name="igvGroupsButton" value="group1" onchange="igvSelectGroup();" /> Group 1</label></a></li>
									<li id="igvGroups2"><a href="#"><label><input type="radio" name="igvGroupsButton" value="group2" onchange="igvSelectGroup();" /> Group 2</label></a></li>
									<li id="igvGroupsSeparate"><a href="#"><label><input type="radio" name="igvGroupsButton" value="separate" onChange="igvSelectGroup();" /> Separate groups</label></a></li>
									<li id="igvGroupsAll"><a href="#"><label><input type="radio" name="igvGroupsButton" value="all" onchange="igvSelectGroup();" checked="checked" /> All individuals</label></a></li>
								</ul>
							</li>
						</ul>
					</div>
				</div>
				
				<!-- IGV browser container -->
				<div id="igvContainer"></div>
			</div>
		</div>
	</div>
	
	<!-- IGV menu submodals -->
	
	<!-- Load genome by URL -->
	<div id="igvGenomeURLModal" class="modal fade" role="dialog" aria-hidden=true>
		<div class="modal-md modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<div class="modal-title"><button type="button" class="close" data-dismiss="modal" style="float:right;">x</button><h4>Load genome from URL</h4></div>
				</div>
				
				<div class="modal-body">
					<table style="width:100%;">
						<tr><td>Genome file URL</td><td><input type="url" id="igvGenomeURLInput" style="width:100%;"/></td></tr>
						<tr><td>Index file URL (recommended)</td><td><input type="url" id="igvGenomeIndexURLInput" style="width:100%;" /></td></tr>
					</table>
				</div>
	
				<div class="modal-footer">
					<button type="button" class="btn btn-sm btn-outline-secondary" data-dismiss="modal">Cancel</button>
					<button type="button" class="btn btn-sm btn-secondary" data-dismiss="modal" onclick="igvLoadGenomeFromURL()">OK</button>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Load genome from local file -->
	<div id="igvGenomeFileModal" class="modal fade" role="dialog" aria-hidden=true>
		<div class="modal-md modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<div class="modal-title"><button type="button" class="close" data-dismiss="modal" style="float:right;">x</button><h4>Load genome from local file</h4></div>
				</div>
				
				<div class="modal-body">
					<table style="width:100%;">
						<tr><td>Genome file</td><td><input type="file" id="igvGenomeFileInput" style="width:100%;"/></td></tr>
						<tr><td>Index file (recommended)</td><td><input type="file" id="igvGenomeIndexFileInput" style="width:100%;" /></td></tr>
					</table>
				</div>
	
				<div class="modal-footer">
					<button type="button" class="btn btn-sm btn-outline-secondary" data-dismiss="modal">Cancel</button>
					<button type="button" class="btn btn-sm btn-secondary" data-dismiss="modal" onclick="igvLoadGenomeFromFile()">OK</button>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Load track by URL -->
	<div id="igvTrackURLModal" class="modal fade" role="dialog" aria-hidden=true>
		<div class="modal-md modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<div class="modal-title"><button type="button" class="close" data-dismiss="modal" style="float:right;">x</button><h4>Load track from URL</h4></div>
				</div>
				
				<div class="modal-body">
					<table style="width:100%;">
						<tr><td>Track file URL</td><td><input type="url" id="igvTrackURLInput" style="width:100%;"/></td></tr>
						<tr><td>Index file URL (optional)</td><td><input type="url" id="igvTrackIndexURLInput" style="width:100%;" /></td></tr>
					</table>
				</div>
	
				<div class="modal-footer">
					<button type="button" class="btn btn-sm btn-outline-secondary" data-dismiss="modal">Cancel</button>
					<button type="button" class="btn btn-sm btn-secondary" data-dismiss="modal" onclick="igvLoadTrackFromURL()">OK</button>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Load genome from local file -->
	<div id="igvTrackFileModal" class="modal fade" role="dialog" aria-hidden=true>
		<div class="modal-md modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<div class="modal-title"><button type="button" class="close" data-dismiss="modal" style="float:right;">x</button><h4>Load genome from local file</h4></div>
				</div>
				
				<div class="modal-body">
					<table style="width:100%;">
						<tr><td>Track file</td><td><input type="file" id="igvTrackFileInput" style="width:100%;"/></td></tr>
						<tr><td>Index file (optional)</td><td><input type="file" id="igvTrackIndexFileInput" style="width:100%;" /></td></tr>
					</table>
				</div>
	
				<div class="modal-footer">
					<button type="button" class="btn btn-sm btn-outline-secondary" data-dismiss="modal">Cancel</button>
					<button type="button" class="btn btn-sm btn-secondary" data-dismiss="modal" onclick="igvLoadTrackFromFile()">OK</button>
				</div>
			</div>
		</div>
	</div>
</body>
</html>
