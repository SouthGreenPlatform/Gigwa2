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
        	var projectDescriptions = [];

            $(function () {
                $('#moduleExistingG').on('change', function () {
                    clearFields();
                    if ($(this).val() !== '- Select -' && $(this).val() !== null) {
                        loadProjects($(this).val());
                        $('#projectExisting').change();
                    } else {
                        $('#projectExisting').html('<option>Nothing selected</option>').selectpicker('refresh');
                        $('#runExisting').html('<option>Nothing selected</option>').selectpicker('refresh');
                    }
                });
                $('#projectExisting').on('change', function () {
                	$('#emptyBeforeImportDiv').toggle();
                    loadRuns();
                    $('#emptyBeforeImportDiv').show(100);
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
						var link1 = "<c:url value='/' />?module=" + $("#moduleExistingG").val() + "&project=" + $("#projectExisting").val();
						$('#progressContents').html('<p class="bold panel" style="padding:10px;">Annotation complete.<br/>The annotated data is <a style="cursor:pointer;" href="' + link1 + '">available here</a></p>');
						$('#progress').modal('show');
                    }
                });
            });

            $(document).ready(function () {
    	        $('#moduleProjectNavbar').hide();
                $('[data-toggle="tooltip"]').tooltip({delay: {"show": 300, "hide": 100}});
           		getToken();
                loadModules();

                $('button#startButton').on("click", function() {annotateVariants()});
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
                        $('#moduleExistingG').html("<option>- Select -</option>").selectpicker('refresh');

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

            function clearFields() {
                $('#module').val("");
                $('#project').val("");
                $('#run').val("");
                $('#vcfImportSuccessText').html("");
            }

            function annotateVariants() {
				$.ajax({
				    url: "<c:url value='<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.SNPEFF_ANNOTATION_PATH%>' />",
				    method: "POST",
				    headers: {
				        "Authorization": "Bearer " + token,
				    },
				    processData: false,
				    contentType: false,
				    data: new FormData(document.getElementById("importDropzoneG")),
				});

                $('#progress').modal({backdrop: 'static', keyboard: false, show: true});
                $('#progress').data('error', false);
                displayProcessProgress(5, token);
            }
        </script>
    </head>
    <body>
        <%@include file="../../../navbar.jsp" %>
        <div class="container margin-top-md">
            <form autocomplete="off" id="importDropzoneG" action="<c:url value='<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.SNPEFF_ANNOTATION_PATH%>' />" method="post">
                <div class="panel panel-default importFormDiv">
                    <div class="panel-body panel-grey">
                        <div class="form text-center">
                            <div class ="row">
                                <div class="col-md-1" style="text-align:right;"></div>
                                <div class="col-md-10">
                                    <h4>Annotate data</h4>
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
                                    <div class="form-group text-left">
                                        <div class="row">
                                     	<div class="col-md-2" style="text-align:right;">
                                          <label for="snpEffDatabase">SnpEff database<span class="text-red">*</span></label>
                                      </div>
                                            <div class="col-md-3">
                                            	<input type="text" name="snpEffDatabase" id="snpEffDatabase" />
                                            </div>
                                        </div>
                                    </div>
                              <div class ="row">
                                  <div class="col-md-1">
                                   <button class="btn btn-primary btn-sm" style='margin-top:50px;' id="startButton" type="button">Start</button>
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