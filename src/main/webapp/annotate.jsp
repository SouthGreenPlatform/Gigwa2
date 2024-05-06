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
<%@ page import="org.brapi.v2.api.ServerinfoApi" %>
<%@ page import="org.brapi.v2.api.ReferencesetsApi" %>
<%@ page import="fr.cirad.tools.Helper" %>
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
<c:set var="idSep" value='<%= Helper.ID_SEPARATOR %>' />
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
		<script type="text/javascript" src="js/multiple-select-big.js"></script>
        <script type="text/javascript">
	    	var progressUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PROGRESS_PATH%>' />";
	    	var tokenURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GET_SESSION_TOKEN%>"/>';
	    	var maxUploadSizeURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.MAX_UPLOAD_SIZE_PATH%>"/>';
            var token;
            var metadataError;
            var maxUploadSizeInMb, maxImportSizeInMb;
        	var projectDescriptions = [];

        	var availableGenomes = [];
        	var downloadableGenomes = [];

			var importDropzone;

            $(function () {
                $('#moduleExisting').on('change', function () {
                    clearFields();
                    if ($(this).val() !== '- Select -' && $(this).val() !== null) {
                        loadProjects($(this).val());
                       	$('#projectExisting').change();
                    } else {
                        $('#projectExisting').html('<option value="">Nothing selected</option>').selectpicker('refresh');
                    }
                });
                $('#projectExisting').on('change', function () {
                    $('#runExisting').html('<option value="">Nothing selected</option>').selectpicker('refresh');
                    if ($("#projectExisting").val() != null) {
	                	$('#emptyBeforeImportDiv').toggle();
	                    loadRuns();
	                    $('#emptyBeforeImportDiv').show(100);
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

                $("#genomeInputType").on("change", function (event) {
                    switch ($("#genomeInputType").val()) {
                    	case "select":
                    	    $("#downloadableGenomesContainer").show();
                    	    $("#downloadURLContainer").hide();
                    	    $("#uploadContainer").hide();
                    	    break;
                    	case "url":
                    	    $("#downloadableGenomesContainer").hide();
                    	    $("#downloadURLContainer").show();
                    	    $("#uploadContainer").hide();
                    	    break;
                    	case "files":
                    	    $("#downloadableGenomesContainer").hide();
                    	    $("#downloadURLContainer").hide();
                    	    $("#uploadContainer").show();
                    }
                });
            });

            $(document).ready(function () {
				Dropzone.autoDiscover = false;
    	        $('#moduleProjectNavbar').hide();
                $('[data-toggle="tooltip"]').tooltip({delay: {"show": 300, "hide": 100}});
           		getToken();
                loadModules();
                loadGenomes();

                $('button#startButton').on("click", function() {annotateVariants()});

                $("#downloadableGenomesContainer").show();
                $("#downloadURLContainer").hide();
                $("#uploadContainer").hide();

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
    	        }).then(function() {
					importDropzone = new Dropzone("#importDropzone", {
    	                url: "<c:url value='<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.SNPEFF_INSTALL_GENOME%>' />",
    	                maxFiles: 4,
    	                previewsContainer: "#dropZonePreviews",
   		           	    dictResponseError: 'Error importing data',
   		           	    parallelUploads: 10,
   		           	    acceptedFiles: ".fasta,.fasta.gz,.fa,.fa.gz,.fas,.fas.gz,.gtf,.gtf.gz,.gff,.gff.gz,.gff2,.gff2.gz,.gff3,.gff3.gz,.genbank,.gbk,.genbank.gz,.gbk.gz,.refseq,.refseq.gz,.embl,.embl.gz,.knowngenes,.knowngenes.gz,.kg,.kg.gz",
   		           	  	headers: {
   		           	  		"Authorization": "Bearer " + token
   		           	  	},
   		           	  	previewTemplate: "<div class='dz-preview dz-file-preview'>\n <div class='dz-details' style='width:260px;'>\n  <div class='dz-filename' style='max-height:45px;'><span data-dz-name style='overflow-wrap:anywhere; text-align:left;'></span></div>\n  <div class='dz-size'><span data-dz-size></span></div>\n  <a style='float:right;' class='dz-remove' href='javascript:undefined;' data-dz-remove>Remove file</a>\n  </div>\n  <div class='dz-progress'><span class='dz-upload' data-dz-uploadprogress></span></div>\n  <div class='dz-error-message'><span data-dz-errormessage></span></div>\n  <div class='dz-success-mark'>\n  <svg width='54px' height='54px' viewBox='0 0 54 54' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:sketch='http://www.bohemiancoding.com/sketch/ns'>\n   <title>Check</title>\n   <defs></defs>\n   <g id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd' sketch:type='MSPage'>\n    <path d='M23.5,31.8431458 L17.5852419,25.9283877 C16.0248253,24.3679711 13.4910294,24.366835 11.9289322,25.9289322 C10.3700136,27.4878508 10.3665912,30.0234455 11.9283877,31.5852419 L20.4147581,40.0716123 C20.5133999,40.1702541 20.6159315,40.2626649 20.7218615,40.3488435 C22.2835669,41.8725651 24.794234,41.8626202 26.3461564,40.3106978 L43.3106978,23.3461564 C44.8771021,21.7797521 44.8758057,19.2483887 43.3137085,17.6862915 C41.7547899,16.1273729 39.2176035,16.1255422 37.6538436,17.6893022 L23.5,31.8431458 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z' id='Oval-2' stroke-opacity='0.198794158' stroke='#747474' fill-opacity='0.816519475' fill='#FFFFFF' sketch:type='MSShapeGroup'></path>\n   </g>\n  </svg>\n  </div>\n  <div class='dz-error-mark'>\n  <svg width='54px' height='54px' viewBox='0 0 54 54' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:sketch='http://www.bohemiancoding.com/sketch/ns'>\n   <title>Error</title>\n   <defs></defs>\n   <g id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd' sketch:type='MSPage'>\n    <g id='Check-+-Oval-2' sketch:type='MSLayerGroup' stroke='#747474' stroke-opacity='0.198794158' fill='#ff9999' fill-opacity='0.816519475'>\n     <path d='M32.6568542,29 L38.3106978,23.3461564 C39.8771021,21.7797521 39.8758057,19.2483887 38.3137085,17.6862915 C36.7547899,16.1273729 34.2176035,16.1255422 32.6538436,17.6893022 L27,23.3431458 L21.3461564,17.6893022 C19.7823965,16.1255422 17.2452101,16.1273729 15.6862915,17.6862915 C14.1241943,19.2483887 14.1228979,21.7797521 15.6893022,23.3461564 L21.3431458,29 L15.6893022,34.6538436 C14.1228979,36.2202479 14.1241943,38.7516113 15.6862915,40.3137085 C17.2452101,41.8726271 19.7823965,41.8744578 21.3461564,40.3106978 L27,34.6568542 L32.6538436,40.3106978 C34.2176035,41.8744578 36.7547899,41.8726271 38.3137085,40.3137085 C39.8758057,38.7516113 39.8771021,36.2202479 38.3106978,34.6538436 L32.6568542,29 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z' id='Oval-2' sketch:type='MSShapeGroup'></path>\n    </g>\n   </g>\n  </svg>\n </div>\n</div>",
   		           	    init: function() {
   							var self = this;
   							self.options.maxFilesize = maxUploadSizeInMb;
   							self.options.autoProcessQueue = false;
   							self.options.uploadMultiple = true;
   							self.on("sending", function (file) {
   								$('.meter').show();
   							});
   						}
   		        	});
    	        });
            });

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
                        $('#moduleExisting').html("<option value=''>- Select -</option>").selectpicker('refresh');

                        var options = "";
                        for (var set in jsonResult.referenceSets)
                            options += '<option>' + jsonResult.referenceSets[set].name + '</option>';

                        $('#moduleExisting').append(options).selectpicker('refresh');
                        <c:if test="${!(empty param.module)}">
	                        $('#moduleExisting').val('${param.module}').selectpicker('refresh');
	                        $('#moduleExisting').change();
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

    	        		var passedModule = $_GET("module");
    	        		if (passedModule != null)
    	        			passedModule = passedModule.replace(new RegExp('#([^\\s]*)', 'g'), '');
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
                        	var isNewProject = Object.keys(project).length == 0;
                            if (!isNewProject)
                        		option += '<option data-id="' + project.id + '">' + project.name + '</option>';
                        }
                        $('#projectExisting').html(option).selectpicker('refresh');
                        $('#projectExisting').val(0).selectpicker('refresh');
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        handleError(xhr, thrownError);
                    }
                });
				loadAssembly();
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
                        var option = "";
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

			function loadAssembly() {
				$("#grpAsmAnnotate").hide();
				
				if ($("#projectExisting").val() == null)
					return;

				$.ajax({	// load assemblies
					url: '<c:url value="<%=GigwaRestController.REST_PATH + ServerinfoApi.URL_BASE_PREFIX + '/' + ReferencesetsApi.searchReferenceSetsPost_url%>" />',
					type: "POST",
					dataType: "json",
					async: false,
					contentType: "application/json;charset=utf-8",
					headers: buildHeader(token, $('#assemblyAnnotate').val()),
					data: JSON.stringify({
						"studyDbIds": [$('#projectExisting :selected').data("id")]
					}),
					success: function(jsonResult) {
						$('#assemblyAnnotate').html("");
						jsonResult.result.data.forEach(refSet => {
							var asmId = refSet["referenceSetDbId"].split("${idSep}")[2];
							$('#assemblyAnnotate').append('<option value="' + asmId + '">' + (refSet["assemblyPUI"] == null ? '(unnamed assembly)' : refSet["assemblyPUI"]) + '</option>');
						});
						if (jsonResult.result.data.length > 1)
							$("#grpAsmAnnotate").show();
						$('#assemblyAnnotate').selectpicker('refresh');
					},
					error: function(xhr, ajaxOptions, thrownError) {
						handleError(xhr, thrownError);
					}
				});
			}

            function loadGenomes() {
                $.ajax({
                    url: "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.SNPEFF_GENOME_LIST%>' />",
					method: "GET",
					headers: {
					    "Authorization": "Bearer " + token,
					},
					dataType: "json",
					contentType: "application/json;charset=utf-8",
					success: function (jsonResult) {
					    availableGenomes = jsonResult.availableGenomes.sort();
					    downloadableGenomes = jsonResult.downloadableGenomes;

					    let availableOptions = "";
					    for (let genome of availableGenomes)
					        availableOptions += '<option value="' + genome + '">' + genome + '</option>';

					    let downloadableOptions = "";
					    for (let genomeKey in downloadableGenomes)
					        downloadableOptions += '<option value="' + genomeKey + '">' + downloadableGenomes[genomeKey] + '</option>';

						$("#availableGenomes").html(availableOptions).selectpicker('refresh');
						$("#downloadableGenomeList").html(downloadableOptions);
					}
                });
            }

            function clearFields() {
                $('#module').val("");
                $('#project').val("");
                $('#run').val("");
                $('#vcfImportSuccessText').html("");
            }

            function annotateVariants() {
                const data = new FormData();
	    		let value = $("#moduleExisting").val();
			    if (!value) {
				    alert("You must select a database");
                    $('#progress').modal('hide');
                    return;
			    }
			    data.set("module", value);
			    
			    value = $("#projectExisting").val();
			    if (!value) {
				    alert("You must select a project");
                    $('#progress').modal('hide');
                    return;
			    }
			    data.set("project", value);
			    
                value = $("#runExisting").val();
			    if (!value) {
				    alert("You must select a run");
                    $('#progress').modal('hide');
                    return;
			    }
			    data.set("run", value);
			    
                value = $("#availableGenomes").val();
			    if (!value) {
				    alert("You must select a genome");
                    $('#progress').modal('hide');
                    return;
			    }
			    data.set("genome", value);
			    
			    

				$.ajax({
				    url: "<c:url value='<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.SNPEFF_ANNOTATION_PATH%>' />",
				    method: "POST",
				    headers: buildHeader(token, $('#assemblyAnnotate').val()),
				    processData: false,
				    contentType: false,
				    data: data,
				});

                $('#progress').modal({backdrop: 'static', keyboard: false, show: true});
                $('#progress').data('error', false);
                $('#progress').off('hidden.bs.modal').on('hidden.bs.modal', function () {
                    if (!$('#progress').data('error')) {
                        $('.importFormDiv input').prop('disabled', true);
                        $('.importFormDiv button').prop('disabled', true);
                        $('.importFormDiv textarea').prop('disabled', true);
						var link1 = "<c:url value='/' />?module=" + $("#moduleExisting").val() + "&project=" + $("#projectExisting").val();
						$('#progressContents').html('<p class="bold panel" style="padding:10px;">Annotation complete.<br/>The annotated data is <a style="cursor:pointer;" href="' + link1 + '">available here</a></p>');
						$('#progress').modal('show');
                    }
                });

                displayProcessProgress(5, token);
            }

            function submitGenomeInstall() {
                const data = new FormData();
                switch ($("#genomeInputType").val()) {
					case "select":
					    const genomeName = $("#downloadableGenomes").val();
					    if (!genomeName) {
						    alert("You must select a genome");
		                    $('#progress').modal('hide');
		                    return;
					    }
					    data.set("genomeName", genomeName);
					    break;

					case "url":
					    data.set("genomeURL", $("#genomeURL").val());
					    break;

					case "files":
					    if ($("#newGenomeID").val().length == 0) {
					        alert("Please specify an identifier for the new genome");
					        $("#progress").modal("hide");
					        return;
					    }
					    if (importDropzone.getRejectedFiles().length > 0) {
		                    alert("Please remove any rejected files before submitting!");
		                    $('#progress').modal('hide');
		                    return;
		                }
					    //$('#progress').modal({backdrop: 'static', keyboard: false, show: true});
		                //$('#progress').data('error', true);
		                //$('#progress').off('hidden.bs.modal');
		                //$("#installDialog").modal('hide');
		                //displayProcessProgress(5, token, () => loadGenomes());
					    //importDropzone.processQueue();
					    //return;

					    // Must do this manually because we need the API response
					    data.set("newGenomeID", $("#newGenomeID").val());
					    data.set("newGenomeName", $("#newGenomeName").val());
					    let i = 0;
					    for (let file of importDropzone.files) {
					        data.set("file[" + i + "]", file, file.name);
					        i += 1;
					    }
				}

                $.ajax({
				    url: "<c:url value='<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.SNPEFF_INSTALL_GENOME%>' />",
				    method: "POST",
				    headers: {
				        "Authorization": "Bearer " + token,
				    },
				    processData: false,
				    contentType: false,
				    data: data,
				    dataType: "json",
				    success: function (jsonResult) {
				        if (jsonResult == null)
						    return;

						$("#importResult").modal("show");
						if (jsonResult.success) {
						    $("#importResultSuccess").html("Success");
						} else {
						    $("#importResultSuccess").html("Failure");
						}

						$("#importResultLog").text(jsonResult.log);
						loadGenomes();
				    },
				});

                $('#progress').modal({backdrop: 'static', keyboard: false, show: true});
                $('#progress').data('error', true);
                $('#progress').off('hidden.bs.modal');
                $("#installDialog").modal('hide');
				displayProcessProgress(5, token);
            }
        </script>
    </head>
    <body>
        <%@include file="../../../navbar.jsp" %>
        <div class="container margin-top-md">
                <div class="panel panel-default importFormDiv">
                    <div class="panel-body panel-grey">
                        <div class="form text-center">
                            <div class ="row">
                                <div class="col-md-1" style="text-align:right;"></div>
                                <div class="col-md-10">
                                    <h4>Add functional annotations to variants using SnpEff</h4>
							<p class="margin-top-md text-red">Properties followed by * are required</p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-1" style="text-align:right;"></div>
                                <div class="col-md-10">
                                    <div class="form-group margin-top-md text-left"<c:if test="${limitToTempData}"> hidden</c:if>>
                                        <div class="row" id="rowModuleExisting">
                                     	<div class="col-md-2" style="text-align:right;">
                                          <label for="moduleExisting">Database <span class="text-red">*</span></label>
                                         </div>
                                            <div class="col-md-3">
                                                <select class="selectpicker" id="moduleExisting" class="moduleExisting" name="moduleExisting" data-actions-box="true" data-width="100%" data-live-search="true"></select>
                                            </div>
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
                                        </div>
                                    </div>
									<div class="form-group" id="grpAsmAnnotate" style="display:none;">
										&nbsp;<label for="assemblyAnnotate" class="label-light">Assembly </label>
										<select class="selectpicker" id="assemblyAnnotate" data-actions-box="true" name="assemblyAnnotate"></select>
									</div>

                                    <!-- Default genomes selector -->
                                    <div id="genomeSelectContainer" class="form-group text-left">
                                        <div class="row">
	                                     	<div class="col-md-2" style="text-align:right;">
	                                            <label for="availableGenomes">Select a genome<span class="text-red">*</span></label>
	                                      	</div>
	                                      	<div class="col-md-4" style="width:450px; margin-left:-15px;">
	                                      		<select id="availableGenomes" name="availableGenomes" class="selectpicker col-md-6" title="Select an available genome" data-live-search="true"></select>
	                                      	</div>
                                            <button class="col-md-2 btn btn-default btn-sm" type="button" data-toggle="modal" data-target="#installDialog">Install a new genome</button>
                                        </div>
                                    </div>
                              <div class ="row">
                              	  <div class="col-md-2"></div>
                                  <div class="col-md-1">
                                   <button class="btn btn-primary btn-sm" style='margin-top:50px;' id="startButton" type="button">Start annotation process</button>
                                  </div>
                              </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </form>
        </div>

		<!-- progress modal -->
        <div class="modal fade" tabindex="-1" role="dialog" id="progress" aria-hidden="true">
            <div class="modal-dialog modal-sm margin-top-lg">
                <div class="modal-content modal-progress">
                    <div class="loading text-center" id="progressContents">
                        <h3 id="progressText" class="loading-message">Please wait...</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Genome install modal -->
        <div class="modal fade" role="dialog" id="installDialog" aria-hidden="true">
        	<div class="modal-dialog modal-lg">
        		<div class="modal-content" style="height:550px;">
        			<div class="modal-header">
	        			Install a new genome
	        		</div>
        			<div class="modal-body">
			            <div class="row">
				          	<div class="col-md-3" style="text-align:right;">
				                 <label for="genomeInputType">Genome input</label>
				           	</div>
			                <div class="col-md-6">
			                	<select id="genomeInputType" name="genomeInputType" class="selectpicker">
			                		<option value="select">Default SnpEff genomes</option>
			                		<option value="url">Download from specific URL</option>
			                		<option value="files">Build from local genome files</option>
			                	</select>
			                </div>
			            </div>

			            <!-- Default genomes selector -->
			            <div class="row margin-top-md" id="downloadableGenomesContainer">
			            	<div class="col-md-3" style="text-align:right;">
				                 <label for="downloadableGenomes">Downloadable genomes</label>
				           	</div>
		            		<div class="col-md-9">
		            			<input list="downloadableGenomeList" style="width: 500px;" name="downloadableGenomes" id="downloadableGenomes" placeholder="(Please select)"/>
		            		</div>
                            <datalist id="downloadableGenomeList"></datalist>
			            </div>

			            <!-- Download from URL -->
			            <div class="row margin-top-md" id="downloadURLContainer">
			            	<div class="col-md-3" style="text-align:right;">
			            		<label for="genomeURL">SnpEff database URL (.zip)</label>
			            	</div>
			            	<div class="col-md-9">
			            		<input type="url" style="width:calc(100% - 20px);" id="genomeURL" name="genomeURL" />
			            	</div>
			            </div>

			            <!-- Upload files -->
			            <div class="row margin-top-md" id="uploadContainer">
			            	<form class="dropzone" style="background-color:#ffffff; overflow: hidden;" action="<c:url value='<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.SNPEFF_INSTALL_GENOME%>' />" id="importDropzone">
			            		<div class="row">
			            			<div class="col-md-3" style="text-align:right;">
			            				<label for="newGenomeID">New genome identifier</label>
			            			</div>
			            			<div class="col-md-9">
			            				<input type="text" style="width:300px;" id="newGenomeID" name="newGenomeID" />
			            			</div>
			            		</div>
			            		<div class="row margin-top-md">
			            			<div class="col-md-3" style="text-align:right;">
			            				<label for="newGenomeName">New genome name</label>
			            			</div>
			            			<div class="col-md-9">
			            				<input type="text" style="width:300px;" id="newGenomeName" name="newGenomeName" />
			            			</div>
			            		</div>
			            		<div class="row margin-top">
			            			<div class="col-md-1"></div>
                                    <div class="col-md-5" style="padding-right:0;">
										<div class="dz-default dz-message" style="margin-left:10px; height:270px; background-color:#e8e8e8; padding:5px; border:2px dashed lightblue;">
	       									<h4>&nbsp;Please drop files here or click to upload</h4>
	       									<div style="font-size:13px; margin:25px;">
	       										<b><u>Required files:</u> FASTA</b> sequence <b>plus</b> one of
	       										<ul>
	       											<li>.gtf</li>
	       											<li>.gff</li>
													<li>.gbk</li>
													<li>.refseq</li>
													<li>.embl</li>
													<li>.kg</li>
												</ul>
												When possible, you should also provide a CDS sequence and a protein sequence to check the genome, named cds.fa[.gz] and protein.fa[.gz]
											</div>
       									</div>
                                    </div>
                                    <div class="col-md-5" id="dropZonePreviews" style="padding-left:30px;">
                                    </div>
                                    <div class="col-md-1"></div>
                                </div>
			            </div>
			        </div>
			        <div class="modal-footer">
	        			<button class="btn btn-info btn-sm" type="button" onclick="submitGenomeInstall()">Install</button>
	        		</div>
        		</div>
        	</div>
        </div>

        <!-- Genome install result modal -->
        <div class="modal fade" role="dialog" id="importResult" aria-hidden="true">
        	<div class="modal-dialog modal-lg">
        		<div class="modal-content">
        			<div class="modal-header">
	        			Genome installation
	        		</div>
        			<div class="modal-body">
			            <h5 id="importResultSuccess"></h5>
			            <pre id="importResultLog"></pre>
			        </div>
        		</div>
        	</div>
        </div>
    </body>
</html>