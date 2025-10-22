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
<link type="text/css" rel="stylesheet" href="css/jquery-ui.min-1.12.1.css">
<link type="text/css" rel="stylesheet" href="css/main.css">
<script type="text/javascript" src="js/jquery-1.12.4.min.js"></script>
<script type="text/javascript" src="js/bootstrap-select.min.js"></script>
<script type="text/javascript" src="js/bootstrap.min.js"></script>
<script type="text/javascript" src="js/jquery.flot.min.js"></script>
<script type="text/javascript" src="js/jquery.flot.selection.js" async></script>
<script type="text/javascript" src="js/multiple-select-big.js"></script>
<script type="text/javascript" src="js/common.js"></script>
<script type="text/javascript" src="js/main.js"></script>
<script type="text/javascript" src="js/highcharts.js"></script>
<script type="text/javascript" src="js/highcharts/exporting.js"></script>
<script type="text/javascript" src="js/highcharts/export-data.js"></script>
<script type="text/javascript" src="js/igv.min.js"></script>
<script type="text/javascript" src="js/IgvCsvSearchReader.js"></script>
<script type="text/javascript" src="js/ajax-bootstrap-select.min.js"></script>
<script type="text/javascript" src="js/jquery-ui.min-1.12.1.js"></script>
</head>

<body>
	<%@include file="navbar.jsp"%>
	<c:set var="googleAnalyticsId" value="<%= appConfig.get(\"googleAnalyticsId\") %>"></c:set>
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
		<p class="margin-top bold" style="float: left">
			Project homepage: <a href="https://southgreen.fr/content/gigwa" target='_blank'>http://southgreen.fr/content/gigwa</a>
			<br/>
			GitHub: <a href="https://github.com/SouthGreenPlatform/Gigwa2" target='_blank'>https://github.com/SouthGreenPlatform/Gigwa2</a>
		</p>
		<div id="summaryTable" class='bold' style="display: flex; justify-content: right; margin-bottom: 25px; margin-top: 35px;">
			<a href="summaryTable.jsp">Click here</a>&nbsp;to view a summary of instance contents
		</div>
		<c:set var="adminEmail" value="<%= appConfig.get(\"adminEmail\") %>"></c:set>
		<c:if test='${!fn:startsWith(adminEmail, "??") && !empty adminEmail}'>
			<p class="margin-top text-center">For any inquiries please contact <a href="mailto:${adminEmail}">${adminEmail}</a></p>
		</c:if>
		<c:set var="customHomepageParagraph" value="<%= appConfig.get(\"customHomepageParagraph\") %>"></c:set>
		<c:if test='${!fn:startsWith(customHomepageParagraph, "??") && !empty customHomepageParagraph}'>
			<p class="margin-top text-justify" style='border-radius:5px; padding:7px; border:1px solid darkblue;'> ${customHomepageParagraph} </p>
		</c:if>
		<div class="margin-top" style="margin-left:-20px; margin-right:-20px; text-align:center; text-align:center;" id="logoRow">	 
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
<pre class="margin-top" style="margin-left:15px; font-size:10px; position:absolute;">Please cite Gigwa as follows:
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
                                        <div class="custom-label margin-top-md" id="sequencesLabel">Sequences <span style="font-weight:normal;"></span></div>
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
										<label class="custom-label" for="variantEffects">Variant Effects</label>
										<div class="form-input">
											<select class="selectpicker" multiple id="variantEffects"
												data-actions-box="true" data-width="100%"
												data-live-search="true" name="variantEffects"></select>
										</div>
									</div>
									<div id="GeneIds" class="margin-top-md">
										<div class="container-fluid">
											<div class="row">
												<div class="col-xl-6 input-group half-width custom-label" style="float: left;" id="geneIdsLabel">Gene Names</div>
													<div class="col-xl-6 input-group half-width custom-label" style="float: right; font-weight:400;">Selection mode</div>
											</div>
										</div>
										<div class="form-input">
											<select id="geneIdsSelect" class="selectpicker select-main" multiple multiple data-live-search="true" disabled data-selected-text-format="count > 0"></select>
										</div>
										<div style="margin-top: -25px; text-align: right;">
											<a id="clearGenesIdSelection" href="#" onclick="clearGeneIdSelection();" style="display: none; font-size: 18px; margin-left: -20px; position: absolute; font-weight: bold; text-decoration: none;" title="Clear selection">
												<button type='button' style='border:none' class='btn btn-default btn-xs glyphicon glyphicon-trash'></button>
											</a>
                                            <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-paste" aria-pressed="false" title="Paste filtered list from clipboard" id="pasteGeneIds" disabled onclick="toggleGenesPasteBox();"></button>
											<button type="button" class="btn btn-default btn-xs glyphicon glyphicon-plus" title="Variants with any gene-name annotation" id="plusMode" disabled onclick="onGeneSelectionPlusMode();"></button>
											<button type="button" class="btn btn-default btn-xs glyphicon glyphicon-minus" aria-pressed="false" title="Variants without gene-name annotation" id="minusMode" disabled onclick="onGeneSelectionMinusMode();"></button>
											<button type="button" class="btn btn-default btn-xs glyphicon glyphicon-pencil" aria-pressed="false" title="Use gene name lookup" id="editMode" disabled onclick="onGeneSelectionEditMode();"></button>
										</div>
									</div>
                                    <div id="VariantIds" class="margin-top-md">
 										<div style="display:flex; justify-content:left; align-items:center; gap:5px; white-space:nowrap;">
                                                <input type="checkbox" style="margin:0; width:10px; height:10px;" id="filterIDsCheckbox" name="filterIDsCheckbox" onchange="onFilterByIds(this.checked);">
                                                <label for="filterIDsCheckbox" class="col-xl-6 input-group half-width custom-label" style="float:left; line-height:normal;" id="variantIdsLabel">Filter by variant IDs</label>
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
											<select class="selectpicker form-control input-sm" data-width="92px" data-style="btn-primary" id="genotypeInvestigationMode" onchange="setGenotypeInvestigationMode(parseInt($(this).val()));" 
                                                    data-style="btn-primary" id="genotypeInvestigationMode"
                                                    onchange="setGenotypeInvestigationMode(parseInt($(this).val()));">
                                                <option value="0" selected>disabled</option>
											</select>
										</div>
									</div>
								</form>
							</div>
						</div>
					</div>
					<div id="workWithSamplesDiv" class="row">
						<div class="panel panel-grey panel-default text-center bold">
							<input type="checkbox" id="workWithSamples" onchange="showSamples($(this).is(':checked')); localStorage.setItem('workWithSamples', $(this).is(':checked') ? 1 : 0);" class="input-checkbox" title="At least some individuals in this dataset have multiple samples attached. With this box clicked, each sample will be considered separately (genotypes will not be expected to be the same for samples of a same individual, and data will be exported per-sample rather than applying an individual-level synthesis)"><label style="margin-left:5px;" for="workWithSamples">Work on samples</label>
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
						<div style="float:right; margin-top:-5px;" class="row text-nowrap">
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
													<div style="width:100%; margin-left:-10px;" class="margin-top margin-bottom label-checkbox">
														<div style="text-align:center;">
															<input type="checkbox" id="enableExportPush" style="vertical-align:top; margin-left:15px; margin-right:5px;" onclick="showHideLocalhostWarning();" title="If ticked, exported data will be provided by URL, and available for pushing into external online tools." class="input-checkbox">
															<label style="width:120px;" for="enableExportPush">Provide export URL</label>
														</div>
														<div>
															<input type="checkbox" id="keepExportOnServ" style="vertical-align:top; margin-left:15px; margin-right:5px;" onclick="var enabled=$(this).is(':checked'); $('#enableExportPush').prop('checked', enabled); $('#enableExportPush').prop('disabled', enabled); showHideLocalhostWarning();" title="If ticked, export data will remain downloadable for at least 48h. You may then share its URL with collaborators." class="input-checkbox">
															<label style="width:120px;" for="keepExportOnServ">Keep files on server</label>
														</div>
													</div>
													<div>
														<button id="export-btn" class="btn btn-primary btn-sm" onclick="exportData();">Export</button>
													</div>
												</div>
											</div>
										</div>
										<div id="serverExportWarning" style="white-space:initial; text-align:center;"></div>
									</div>
								</div>
								<a class="btn icon-btn btn-default" id="exportBoxToggleButton" data-toggle="button" class-toggle="btn-inverse" style="padding:5px 10px 4px 10px;" href="#" onclick="toggleExportPanel();" title="Export selection">
									<span class="glyphicon btn-glyphicon glyphicon-save img-circle text-muted"></span>
								</a>
							</div>
							<div class="col-md-7 panel panel-default panel-grey shadowed-panel" style="padding:3px 10px;">
								External tools
								<span id="snpclust" style="text-align:right;">
									<a target="_blank"><img style="margin-left:8px; cursor:pointer; cursor:hand;" onclick="$('#snpClustProjLinks').toggle();" title="Edit genotypes with SnpClust" src="images/logo_snpclust.png" height="20" width="20" /></a>
									<div id="snpClustProjLinks" style="position:absolute; right:70px; margin-top:6px; padding:5px; background-color:#eeeeee; border:1px solid #51518b; z-index:10; display:none;"></div>
								</span>
								<a href="#" onclick='$("div#genomeBrowserConfigDiv").modal("show");'><img style="margin-left:8px; cursor:pointer; cursor:hand;" title="(DEPRECATED in favor of using the embedded IGV.js) Click to configure an external genome browser for this database" src="images/icon_genome_browser.gif" height="20" width="20" /></a>
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
					<h3 class="loading-message"><span id="progressText" class="loading-message">Please wait...</span></h3>
					<br/>
					<button style="display:inline; margin-right:10px;" class="btn btn-danger btn-sm" type="button" name="abort" id='abort' onclick="abort($(this).attr('rel')); $('a#exportBoxToggleButton').removeClass('active');">Abort</button>
					<button style="display:inline; margin-left:10px;" id="asyncProgressButton" class="btn btn-info btn-sm" type="button" onclick="window.open('ProgressWatch.jsp?process=export_' + token + '&abortable=true&successURL=' + escape(downloadURL) + '&module=' + getModuleName() + '&exportFormat=' + $('#exportFormat').val() + '&keepExportOnServ=' + $('#keepExportOnServ').prop('checked') + '&galaxyInstanceUrl=' + $('#galaxyInstanceURL').val() + '&exportedVariantCount=' + count + '&exportedIndividualCount=' + exportedIndividualCount + '&exportFormatExtensions=' + $('#exportFormat option:selected').data('ext') + '&exportedTsvMetadata=' + ($('#exportPanel input#exportedIndividualMetadataCheckBox').is(':checked') && 'FLAPJACK' != $('#exportFormat').val() && 'DARWIN' != $('#exportFormat').val()));" title="This will open a separate page allowing to watch export progress at any time. Leaving the current page will not abort the export process.">Open async progress watch page</button>
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
				</div>
				<div class="modal-header">
					<h4 class="modal-title" id="variantDetailsLabel">Variant details</h4>
				</div>
				<div class="modal-body">
					<div class="bg-dark text-white padding d-flex flex-row justify-between">
						<div class="d-flex flex-column">
							<div class="">
								<p id="varId" class="text-bold"></p>
							</div>
							<div class="">
								<p id="varType" class="text-bold"></p>
							</div>
						</div>
						<div class="d-flex flex-column">
							<div class="">
								<p id="varSeq" class="text-bold"></p>
							</div>
							<div class="">
								<p id="varPos" class="text-bold"></p>
							</div>
						</div>
						<div class="d-flex flex-column">
							<div>
								<p id="textKnownAlleles" class="text-bold">Known Allele(s)</p>
							</div>
							<div>
								<div id="varKnownAlleles" class="text-bold d-flex d-row" style="gap:5px"></div>
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
					<div style="display: flex; position: relative; justify-content: center;" >
						<div style="position: absolute; top: 0; left: 0">
							<div id="quickvariantsstats" style="min-width:200px;"></div>
						</div>
							<div id="gtTable" style="display:flex; justify-content:center;" class="auto-overflow"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- modal which displays chart data -->
	<div class="modal fade" role="dialog" id="density" aria-hidden="true">
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<div class="modal-header" id="chartContainer"></div>
			</div>
		</div>
	</div>
	<!-- modal which displays project information -->
	<div class="modal fade" role="dialog" id="projectInfo" aria-hidden="true" style="margin-top:200px; z-index:2100;">
		<div class="modal-dialog modal-sm">
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
				<table id="individualFilteringTable" style="width:98%;" class="draggableColumnTable"></table>
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
			<span class='bold'>Favourite <a href="https://galaxyproject.org/" target="_blank" border="0" style="background-color:#333333; color:white; border-radius:3px; padding:6px;"><img alt="Galaxy" height="15" src="images/logo-galaxy.png" /> Galaxy</a> instance URL</span>
			<input type="text" style="font-size:11px; width:230px; margin-bottom:5px;" placeholder="https://usegalaxy.org/" id="galaxyInstanceURL" onfocus="$(this).prop('previousVal', $(this).val());" onkeyup="checkIfOuputToolConfigChanged();" />
			<br/>
			(You will be requested to provide an API key to be able to push exported files there)
			<hr />
			<p class='bold'>Configuring external tool <select id="onlineOutputTools" onchange="configureSelectedExternalTool();"></select></p>
			Supported formats (CSV) <input type="text" onfocus="$(this).prop('previousVal', $(this).val());" onkeyup="checkIfOuputToolConfigChanged();" style="font-size:11px; width:260px; margin-bottom:5px;" id="outputToolFormats" placeholder="Refer to export box contents (empty for all formats)" />
			<br />Online tool URL with placeholders specifying extensions, e.g. {don|tsv|phenotype}<br />
			<input type="text" style="font-size:11px; width:400px; margin-bottom:5px;" onfocus="$(this).prop('previousVal', $(this).val());" onkeyup="checkIfOuputToolConfigChanged();" id="outputToolURL" placeholder="http://some-tool.org/import?fileUrl={vcf|vcf.gz}" />
			<p>
				<br/>
				(Set URL blank to revert to default)
			</p>
			<hr />
			<input type="button" style="float:right; margin:10px;" class="btn btn-sm btn-primary" disabled id="applyOutputToolConfig" value="Apply" onclick='applyOutputToolConfig();' />
		</div>
		</div>
	</div>
	<!-- modal which displays a box for configuring a genome browser -->
	<div id="genomeBrowserConfigDiv" class="modal" role="dialog">
		<div class="modal-dialog modal-sm" role="document">
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
		<div class="modal-dialog modal-sm" role="document">
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
								<ul class="dropdown-menu" id="igvGenomeMenu" style="max-height:75vh; z-index: 2000; overflow-y:auto;">
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
									Displayed genotypes <span class="caret"></span>
								</a>
								<ul class="dropdown-menu" style="max-height:75vh; z-index: 2000; overflow-y:auto;"></ul>
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
	var runList = {};
	var seqCount;
	var variantTypesCount;
	var variantId;
	var alleleCount;
	var vcfFieldHeaders;
	var exporting = false;
	var isAnnotated = false;
	var gtTable;
	var ploidy = [2];
	var projectDescriptions = [];
	var dbDesc;
	var searchableVcfFieldListURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.SEARCHABLE_ANNOTATION_FIELDS_URL %>" />';
	var vcfFieldHeadersURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.ANNOTATION_HEADERS_PATH %>" />';
	var progressUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PROGRESS_PATH%>' />";
	var abortUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.ABORT_PROCESS_PATH%>' />";
	var variantTypesListURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.VARIANT_TYPES_PATH%>" />';
	var selectionVcfFieldDataURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.VCF_FIELD_PLOT_DATA_PATH %>" />';
	var selectionDensityDataURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.DENSITY_DATA_PATH %>" />';
	var selectionFstDataURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.FST_DATA_PATH %>" />';
	var selectionTajimaDDataURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.TAJIMAD_DATA_PATH %>" />';
	var selectionMafDataURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.MAF_DATA_PATH %>" />';
	var distinctSequencesInSelectionURL = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.DISTINCT_SEQUENCE_SELECTED_PATH %>" />';
	var tokenURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GET_SESSION_TOKEN%>"/>';
	var clearTokenURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.CLEAR_TOKEN_PATH%>" />';
	var loadBookmarkedQueryURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.LOAD_QUERY_URL%>" />';
	var saveBookmarkedQueryURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.SAVE_QUERY_URL%>" />';
	var deleteBookmarkedQueryURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.DELETE_QUERY_URL%>" />';
	var listBookmarkedQueriesURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.LIST_SAVED_QUERIES_URL%>" />';
	var galaxyPushURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GALAXY_HISTORY_PUSH%>" />';
	var distinctIndividualMetadata = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.DISTINCT_INDIVIDUAL_METADATA %>" />';
	var distinctSampleMetadata = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.DISTINCT_SAMPLE_METADATA %>" />';
	var filterIndividualMetadata = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.FILTER_INDIVIDUAL_METADATA %>" />';
	var filterSampleMetadata = '<c:url value="<%= GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.FILTER_SAMPLE_METADATA %>" />';
	var searchCallSetsUrl = '<c:url value="<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.CALLSETS_SEARCH%>" />';
	var snpclustEditionURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.snpclustEditionURL%>" />';
	var downloadURL;
	var gotMetaData = false;
	var referenceNames;
	var exportedIndividualCount = 0;
    var indOpt = [];
    var databasesByTaxon = {};

	$.ajaxSetup({cache: false});

	var defaultGenomeBrowserURL, onlineOutputTools = new Array();
    var stringVariantIdsFromUploadFile = null, callSetMetadataFields = null
    const groupColors = ["#bcd4f2", "#efecb1", "#f59c85", "#8dc891", "#d7aefc", "#f2d19c", "#a3c8c9", "#ffb347", "#d9c1cc", "#a3e7d8"];

    async function onProjectChange() {
		let projIDs = getProjectId();
		if (projIDs.length === 0)
			localStorage.removeItem("projectSelection" + "::" + $('#module').val());
		else
			localStorage.setItem("projectSelection" + "::" + $('#module').val(), projIDs.join(","));
		if (projIDs.length == 0) {
			$('#searchPanel').hide();
			$("#grpAsm").hide();
			return;
		}

		$('#searchPanel').show();
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
				"studyDbIds": projIDs
			}),
			success: function(jsonResult) {
				$('#assembly').html("");
				jsonResult.result.data.forEach(refSet => {
					var asmId = refSet["referenceSetDbId"].split("${idSep}")[1];
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

		await fillWidgets();
		resetFilters();
		
		for (var groupNumber = groupColors.length; groupNumber >= 1; groupNumber--) {
			var localValue = localStorage.getItem("groupMemorizer" + groupNumber + "::" + $('#module').val() + "::" + $('#project').val());
			if (localValue == null)
				localValue = [];
			else
				localValue = JSON.parse(localValue);
			if (localValue.length > 0)
			{
				if ($("#genotypeInvestigationMode").val() == 0) {
					setGenotypeInvestigationMode(groupNumber);
					$("#genotypeInvestigationMode").val(groupNumber);
					$('#genotypeInvestigationMode').selectpicker('refresh');
				}
				$("button#groupMemorizer" + groupNumber).attr("aria-pressed", "true");
				$("button#groupMemorizer" + groupNumber).addClass("active");
			}
			applyGroupMemorizing(groupNumber, localValue);
		}

		toggleIndividualSelector($('#exportedIndividuals').parent(), false);
		var projectDesc = "";
		for (let pjName of $("#project").val())
			projectDesc += projectDescriptions[pjName];
		$("#projectInfoLink").show();
		$('#searchPanel').fadeIn();
		
		$.ajax({	// load runs
			url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PROJECT_RUN_PATH%>" />/' + encodeURIComponent(getProjectId()),
			type: "GET",
			dataType: "json",
			contentType: "application/json;charset=utf-8",
	        headers: buildHeader(token, $('#assembly').val()),
			success: function(jsonResult) {
				runList = jsonResult;
			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
		
		$('#snpclust').hide();
		let htmlSnpClustProjLinks = "";
        let projNames = $("select#project").find('option').toArray().reduce((acc, option) => (acc[splitId(option.dataset.id, 1)] = $(option).text(), acc), {});
		for (let projId of getProjectId()) {
			let shortProjId = projId.split(idSep)[1];
	        $.ajax({
		        url: snpclustEditionURL + '?module=' + $('#module').val() + "&project=" + shortProjId,
		        type: "GET",
		        dataType: "text",
		        async: false,
		        contentType: "application/json;charset=utf-8",
		        headers: {
		            "Authorization": "Bearer " + token
		        },
		        success: function(url) {
					if (url != "") {
						htmlSnpClustProjLinks += "<a onclick=\"$('#project').parent().hide();\" href=\"" + url + "?maintoken=" + token + "&mainapiURL=" + location.origin + "<c:url value='<%=GigwaRestController.REST_PATH%>' />&mainbrapistudy=" + getProjectId() + "&mainbrapiprogram=" + referenceset + "\" target='_blank'>Open project '" + projNames[shortProjId] + "' in SnpClust</a><br/>";
						$('#snpclust').show();
					}
		        },
		        error: function(xhr, ajaxOptions, thrownError) {
		            handleError(xhr, thrownError);
		        }
		    });
		}
		$('#snpClustProjLinks').html(htmlSnpClustProjLinks);
	}

	// when HTML/CSS is fully loaded
	$(document).ready(function() {
		for (var i=0; i<groupColors.length; i++) {
	    	const className = "group" + (i + 1);
	    	const color = groupColors[i];
	    	const styleTag = document.createElement('style');
	    	styleTag.textContent = "." + className + " { background-color: " + color + "; }";
	    	document.head.appendChild(styleTag);
			$("#genotypeInvestigationMode").append('<option value="' + (i+1) + '">on ' + (i+1) + ' group' + (i == 0 ? '' : 's') + '</option>');
    	}

		$('#module').on('change', function() {
			$('#serverExportBox').hide();
			if (referenceset != '')
				dropTempColl(false);
			
			referenceset = $(this).val();

			projectDescriptions = [];
			if (referenceset == "" || !loadProjects(referenceset)) {
				$("div.alert-info").hide();
				$("div#searchPanel").fadeOut();
				$("div#welcome").fadeIn();
				return;
			}

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
				url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.ONLINE_OUTPUT_TOOLS_URL%>" />',
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
		
		$('#project').on('change', onProjectChange);

		$('#numberOfAlleles').on('change', function() {
			updateGtPatterns();
			var hideMaf = $('#numberOfAlleles option[value=2]').length == 0;
	        for (var nGroup=1; nGroup<=groupColors.length; nGroup++) {
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
			$('#sequencesLabel span').text((nCount == 0 ? seqCount : nCount) + "/" + seqCount + "");
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
	   	$('div.modal-lg div.modal-content').css('max-height', parseInt($(window).height() - 60) + 'px').css('height', parseInt($(window).height() - 60) + "px");
 		$("div.modal iframe").css({height: ($(window).height() - 80) + 'px'});
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
				var dbListOptions = "";
				for (var set in jsonResult.referenceSets) {
					let taxon = null;
					jsonResult.referenceSets[set].description.split(" ; ").forEach(function(descItem) {
						if (descItem.startsWith("Species:"))
							taxon = descItem.substring("Species:".length).trim();
						else if (descItem.startsWith("Taxon:"))
							taxon = descItem.substring("Taxon:".length).trim();

					});
					if (taxon == null)
						taxon = "(Unspecified taxon)";
					if (databasesByTaxon[taxon] == null)
						databasesByTaxon[taxon] = [];
					databasesByTaxon[taxon].push(jsonResult.referenceSets[set].name);

					dbListOptions += '<option data-taxon="' + taxon + '">' + jsonResult.referenceSets[set].name + '</option>';
				}

				let sortedTaxa = Object.keys(databasesByTaxon);
				sortedTaxa.sort();
				if (Object.keys(databasesByTaxon).length > 1) {
					$('#grpTaxa').show();
					for (let i in sortedTaxa) {
						databasesByTaxon[sortedTaxa[i]].sort();
						$("#taxa").append("<option>" + sortedTaxa[i] + "</option>")
					}
				}
				$("#taxa").selectpicker("refresh");

				$('#module').html(dbListOptions).selectpicker('refresh');
				var module = $_GET("module"); // get module from url
				if (module != null)	// sometimes a # appears at the end of the url so we remove it with regexp			   
					module = module.replace(new RegExp('#([^\\s]*)', 'g'), '');
				
				if (module != null) {
					let moduleTaxon = $('#module option').filter((_, element) => $(element).text() === module).attr("data-taxon");
					if (moduleTaxon != null) {
						$("#taxa").val(moduleTaxon);
						$("#taxa").selectpicker("refresh").trigger('change');
					}
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

				if (jsonResult.variantSets.length > 0) {
					var option = "";
					var projNames = {};
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
							else if ("<%= Constants.GENOTYPING_TECHNOLOGY %>" == project.metadata[mdObjKey].key || "<%= Constants.PLOIDY %>" == project.metadata[mdObjKey].key) {
								if (projectDescriptions[project.name] == null)
									projectDescriptions[project.name] = "<u>" + project.metadata[mdObjKey].key + ":</u> " + project.metadata[mdObjKey].value;
								else
									projectDescriptions[project.name] += "\n\n<u>" + project.metadata[mdObjKey].key + ":</u> " + project.metadata[mdObjKey].value;
							}
						projNames[jsonResult.variantSets[set].id] = jsonResult.variantSets[set].name;
					}
					
					var selectedProjects = $_GET("project");
					if (selectedProjects !== null) {
						selectedProjects = selectedProjects.replace(new RegExp('#([^\\s]*)', 'g'), '');	// sometimes a # appears at the end of the url so we remove it with regexp
						selectedProjects = selectedProjects.split(",");					
					}
					else {
						selectedProjects = localStorage.getItem("projectSelection" + "::" + $('#module').val());
						selectedProjects = selectedProjects === null ? [] : selectedProjects.split(",").map(pj => projNames[pj]);
					}
					
					// project id (formatted as follows: moduleId§projId) is stored in each <option> tag, project name is displayed. 
					// we can retrieve it with encodeURIComponent(getProjectId())
					$('#project').html(Object.keys(projNames).map(projId => '<option data-id="' + projId + '">' + projNames[projId] + '</option>')).selectpicker('refresh');
					if (selectedProjects.length > 0)
						$('#project').selectpicker('val', selectedProjects);
					else if (Object.keys(projNames).length == 1)
						$('#project').selectpicker('val', jsonResult.variantSets[0].name);

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

	async function loadVariantTypes() {
	    return new Promise((resolve, reject) => {
		    $.ajax({
		            url: variantTypesListURL + '/' + encodeURIComponent(getProjectId()),
		            type: "GET",
		            dataType: "json",
		            contentType: "application/json;charset=utf-8",
	    	        headers: buildHeader(token, $('#assembly').val()),
		            success: function(jsonResult) {
		                    variantTypesCount = jsonResult.length;
		                    var option = "";
		                    for (var key in jsonResult)
		                    	option += '<option value="'+jsonResult[key]+'">' + jsonResult[key] + '</option>';
		                    $('#variantTypes').html(option).selectpicker('refresh');
		                    resolve(jsonResult);
		            },
		            error: function(xhr, ajaxOptions, thrownError) {
		                    handleError(xhr, thrownError);
		            }
		    });
	    });
	}
	async function loadSequences() {
	    return new Promise((resolve, reject) => {
		    $.ajax({
				url: '<c:url value="<%=GigwaRestController.REST_PATH + ServerinfoApi.URL_BASE_PREFIX + '/' + ReferencesApi.searchReferencesPost_url%>" />',
				type: "POST",
				dataType: "json",
				contentType: "application/json;charset=utf-8",
		        headers: buildHeader(token, $('#assembly').val()),
				data: JSON.stringify({
					"referenceSetDbIds": [$('#module').val() + idSep + $('#assembly').val()]
				}),
				success: function(jsonResult) {
					seqCount = jsonResult.result.data.length;
					$('#sequencesLabel span').text( seqCount + "/" + seqCount + "");
					referenceNames = [];
					jsonResult.result.data.forEach(ref => {
						referenceNames.push(ref["referenceName"]);
					});
	
					$('#Sequences').empty([]);
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
	                resolve(jsonResult);
				},
				error: function(xhr, ajaxOptions, thrownError) {
					handleError(xhr, thrownError);
				}
			});
	    });
	}

    function loadIndividuals(showDataSummary) {
        individualSubSet = "${param.individualSubSet}".trim().split(";");
        if (individualSubSet.length == 1 && individualSubSet[0] == "")
            individualSubSet = null;

        if (showDataSummary) {
            var brapiBaseUrl = location.origin + '<c:url value="<%=GigwaRestController.REST_PATH %>" />/' + referenceset + '<%= BrapiRestController.URL_BASE_PREFIX %>';
            $.ajax({
                url: brapiBaseUrl,
                async: false,
                type: "GET",
                contentType: "application/json;charset=utf-8",
                success: function (jsonResult) {
                	let descFigures = jsonResult['description'].replace(/[^\d;]+/g, '').split(";");
                	$('input#workWithSamples').prop("checked", localStorage.getItem('workWithSamples') == 1);
                    dbDesc = jsonResult['description'].replace('germplasm', 'individuals');
                    if ((dbDesc.match(/; 0/g) || []).length == 2)
                        dbDesc += "<p class='bold'>This database contains no genotyping data, please contact administrator</p>";
                },
                error: function (xhr, thrownError) {
                    handleError(xhr, thrownError);
                }
            });
        }
        let workWithSamples = $('#workWithSamples').is(':checked');
        $.ajax({
            url: searchCallSetsUrl,
            type: "POST",
            dataType: "json",
            async: false,
            contentType: "application/json;charset=utf-8",
            headers: {
                "Authorization": "Bearer " + token,
                "workWithSamples": workWithSamples
            },
            data: JSON.stringify({
                "variantSetId": getProjectId().join(","),
                "name": null,
                "pageSize": null,
                "pageToken": null
            }),
            success: function (jsonResult) {
                var callSetResponse = jsonResult.callSets === null ? [] : jsonResult.callSets;

                indOpt = [];
				gotMetaData = false;

                // first pass to compile an exhaustive field list
                try {
                	callSetMetadataFields = JSON.parse(localStorage.getItem($('#module').val() + idSep + $('#project').val() + "_mdFields"));
                }
                catch (ignored)
                {}
                if (callSetMetadataFields == null)
                	callSetMetadataFields = new Array();
                for (var ind in callSetResponse) {
                    if (!gotMetaData && callSetResponse[ind].info != null && Object.keys(callSetResponse[ind].info).length > 0)
                        gotMetaData = true;
                    if (gotMetaData)
                        for (var key in callSetResponse[ind].info)
                            if (!callSetMetadataFields.includes(key))
                                callSetMetadataFields.push(key);
                    if (individualSubSet == null || $.inArray(callSetResponse[ind].name, individualSubSet) != -1)
                        indOpt.push(callSetResponse[ind].name);
                }

                $('#exportPanel input#exportedIndividualMetadataCheckBox').prop('checked', false);
                $('#exportPanel input#exportedIndividualMetadataCheckBox').prop('disabled', !gotMetaData);
                $('#exportPanel input#exportedIndividualMetadataCheckBox').change();
                if (gotMetaData) {
                    $('#asyncProgressButton').hide();
                    $('button#abort').hide();
                    $('#progressText').html("Loading individuals' metadata...");
                    $('#progress').modal({
                        backdrop: 'static',
                        keyboard: false,
                        show: true
                    });
                    setTimeout(function () {
                        var headerRow = new StringBuffer(), exportedMetadataSelectOptions = "";
                        headerRow.append("<thead><tr valign='top'><td></td><th>" + (workWithSamples ? "Samples" : "Individual") + "</th>");
                        for (var i in callSetMetadataFields) {
                            headerRow.append("<th class='draggable'><div>" + callSetMetadataFields[i] + "</div></th>");
                            exportedMetadataSelectOptions += "<option selected>" + callSetMetadataFields[i] + "</option>";
                        }
                        $("#exportedIndividualMetadata").html(exportedMetadataSelectOptions);

                        var ifTable = $("table#individualFilteringTable");
                        if (headerRow != "")
                            ifTable.prepend(headerRow + "</tr></thead>");

                        addSelectionDropDownsToHeaders(document.getElementById("individualFilteringTable"));  
                        
                     	// Make the table headers draggable & droppable
                        ifTable.find("th.draggable").draggable({
                            helper: function() {
                                return $(this).clone().addClass("dragging-helper");
                            },
                            revert: true
                        }).droppable({
                            over: function(event, ui) {
                                $(this).addClass("highlight");
                            },
                            out: function(event, ui) {
                                $(this).removeClass("highlight");
                            },
                            drop: function(event, ui) {
                                var dropped = ui.draggable;
                                var droppedOn = $(this);

                                // Get the indices of the dropped and droppedOn elements
                                var droppedIndex = dropped.index();
                                var droppedOnIndex = droppedOn.index();

                                // Prevent moving before the first column or after the last column
                                if (droppedIndex === 0 && droppedOnIndex === 0) return;
                                var draggableColCount = ifTable.find("th.draggable").length;
                                if (droppedIndex === draggableColCount - 1 && droppedOnIndex === draggableColCount - 1) return;

                                // Move the header cell
                                if (droppedIndex < droppedOnIndex) {
                                    dropped.insertAfter(droppedOn);
                                } else {
                                    dropped.insertBefore(droppedOn);
                                }

                                // Move the corresponding cells in the body for all rows
                                ifTable.find("tbody tr").each(function() {
                                    var cells = $(this).find("td");
                                    var droppedCell = cells.eq(droppedIndex);  // Get the dropped cell
                                    var droppedOnCell = cells.eq(droppedOnIndex);  // Get the dropped-on cell
                                    
                                    if (droppedIndex < droppedOnIndex) {
                                        droppedCell.insertAfter(droppedOnCell);
                                    } else {
                                        droppedCell.insertBefore(droppedOnCell);
                                    }
                                });

                                // Remove the highlight class after drop
                                $(this).removeClass("highlight");

                                localStorage.setItem($('#module').val() + idSep + $('#project').val() + "_mdFields", JSON.stringify(ifTable.find("thead th:gt(0)").get().filter(t => !$(t).hasClass("dragging-helper")).map(t => $(t).find("div:eq(0)").text())));
                            }
                        });
  
                        $('#progress').modal('hide');
                        if (showDataSummary)
                        	displayMessage(dbDesc + "<p class='margin-top'><img src='images/brapi16.png' /> BrAPI baseURL: <a href='" + brapiBaseUrl + "' target=_blank>" + brapiBaseUrl + "</a></p>");
                    }, 1);
                } else {
                    if (showDataSummary)
	                    displayMessage(dbDesc + "<p class='margin-top'><img src='images/brapi16.png' /> BrAPI baseURL: <a href='" + brapiBaseUrl + "' target=_blank>" + brapiBaseUrl + "</a></p>");
                    $("#exportedIndividualMetadata").html("");
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                handleError(xhr, thrownError);
            }
        });
    }

	async function loadVariantEffects() {
	    return new Promise((resolve, reject) => {
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
						$('#GeneIds').show();
						isAnnotated = true;
					} else {
						isAnnotated = false;
						$('#GeneIds').hide();
						$('#varEffGrp').hide();
					}
					resolve(jsonResult);
				},
				error: function(xhr, ajaxOptions, thrownError) {
					handleError(xhr, thrownError);
				}
			});
	    });
	}

	function loadNumberOfAlleles() {
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.NUMBER_ALLELE_PATH%>" />/' + encodeURIComponent(getProjectId()),
			type: "GET",
			dataType: "json",
			async: false,
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
	
	async function readPloidyLevels() {
	    return new Promise((resolve, reject) => {
		    $.ajax({
				url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PLOIDY_LEVEL_PATH%>" />/' + encodeURIComponent(getProjectId()),
				type: "GET",
				dataType: "json",
				contentType: "application/json;charset=utf-8",
				headers: {
					"Authorization": "Bearer " + token
				},
				success: function(ploidyLevels) {
					ploidy = ploidyLevels;
					resolve(ploidyLevels);
				},
				error: function(xhr, ajaxOptions, thrownError) {
					handleError(xhr, thrownError);
				}
			});
	    });
	}
	
	function loadGenotypePatterns() {
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GENOTYPE_PATTERNS_PATH%>" />',
			type: "GET",
			dataType: "json",
			async: false,
			contentType: "application/json;charset=utf-8",
			success: function(jsonResult) {
				gtTable = jsonResult;
				for (var i=0; i<getGenotypeInvestigationMode(); i++)
					$('#Genotypes' + (i + 1)).on('change', function() {
						var j = this.id.replace(/[^0-9.]/g, '');
						$('span#genotypeHelp' + j).attr('title', gtTable[$('#Genotypes' + j).val()]);
						var fMostSameSelected = $('#Genotypes' + j).val().indexOf("ostly the same") != -1;
						$('#mostSameRatioSpan' + j).toggle(fMostSameSelected);
						resetMafWidgetsIfNecessary(j);
					});
			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
	}

	async function fillExportFormat()
	{
	    return new Promise((resolve, reject) => {
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
					resolve(jsonResult);
				},
				error: function(xhr, ajaxOptions, thrownError) {
					handleError(xhr, thrownError);
				}
			});
	    });
	}
	
	// main search method
	function searchVariants(searchMode, pageToken) {
		$(".alert").remove();
		if ($('#exportPanel').is(':visible'))
			$('#exportBoxToggleButton').click()
		$('#asyncProgressButton').hide();
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
    	        headers: buildHeader(token, $('#assembly').val(), $('#workWithSamples').is(':checked')),
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
                    projectId: encodeURIComponent(getProjectId()),
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
        
        $('#variantIdsSelect').parent().html($('#variantIdsSelect').prop('outerHTML'));	// best way we found to cleanly reset the widget
        $('#variantIdsSelect').selectpicker().ajaxSelectPicker(options);
       	$('#variantIdsSelect').data('AjaxBootstrapSelect').list.cache = {};
        
        $('#VariantIds button.dropdown-toggle').on('click', function() {
   			if ($('#VariantIds ul li.selected').length == 0)
   				$('#VariantIds ul li').remove();
   			else
				$('#VariantIds ul li:gt(0):not(.selected)').remove();
   		});
           		
        if ($('#VariantIds').find('div.bs-searchbox a').length === 0) {  
            let inputObj = $('#VariantIds').find('div.bs-searchbox input');
            inputObj.css('width', "calc(100% - 24px)");               
            //when clicking on the button, selected IDs and search results are cleared
            inputObj.before("<a href=\"#\" onclick=\"clearVariantIdSelection();\" style='font-size:18px; margin-top:5px; font-weight:bold; text-decoration: none; float:right;' title='Clear selection'><button type='button' style='border:none' class='btn btn-default btn-xs glyphicon glyphicon-trash'></button></a>");
        }
    }
    
    function loadGeneIds() {
        var options = {
            ajax:{
                url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GENES_LOOKUP%>" />',
                type: "GET",
                headers: {
                        "Authorization": "Bearer " + token
                },
                dataType: "json",
                contentType: "application/json;charset=utf-8",
                data: {
                    projectId: encodeURIComponent(getProjectId()),
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
                emptyTitle: "Input Names here",
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
        
        $('#geneIdsSelect').parent().html($('#geneIdsSelect').prop('outerHTML'));	// best way we found to cleanly reset the widget
        $('#geneIdsSelect').selectpicker().ajaxSelectPicker(options);
       	$('#geneIdsSelect').data('AjaxBootstrapSelect').list.cache = {};
        
   		$('#GeneIds button.dropdown-toggle').on('click', function() {
   			if ($('#GeneIds ul li.selected').length == 0)
   				$('#GeneIds ul li').remove();
   			else
				$('#GeneIds ul li:gt(0):not(.selected)').remove();
   		});
        
        if ($('#GeneIds').find('div.bs-searchbox a').length === 0) {  
            let inputObj = $('#GeneIds').find('div.bs-searchbox input');
            inputObj.css('width', "calc(100% - 24px)");
            
            let bsSearchboxDiv = $('#GeneIds').find('div.bs-searchbox');
            bsSearchboxDiv.css('display', 'flex');
            bsSearchboxDiv.css('flex-direction', 'row-reverse');
            
            //when clicking on the button, selected IDs and search results are cleared
            inputObj.before("<a href=\"#\" onclick=\"clearGeneIdSelection();\" style='font-size:18px; margin-top:5px; font-weight:bold; text-decoration: none; float:right;' title='Clear selection'><button type='button' style='border:none' class='btn btn-default btn-xs glyphicon glyphicon-trash'></button></a>");
        }
    }

	// update genotype table when the checkbox in annotation panel is checked
	function loadGenotypes(reload) {
		var errorEncountered = false;
		// get genotypes for a variant 
		var modalContent = '';
		var ind;
		var activeGroups = $(".genotypeInvestigationDiv").length;
		if (activeGroups == 0 || $("#displayAllGt").prop('checked'))
			ind = individualSubSet == null ? [] : individualSubSet;
		else
			ind = getSelectedIndividuals(Array.from({ length: activeGroups }, (_, index) => index + 1));
		
		if (!reload)
			$("#displayAllGtOption").toggle(ind.length > 0);
		var addedRunCount = 0;
		
		
		let responseObjects = {};
		let requests = [];
		var firstValidRun = null, runIndex = 0;
		for (var projId in runList) {
			for (var runId of runList[projId]) {
	            requests.push($.ajax({        // result of a run for a variant has an id as module§variant§project§run
		            url: '<c:url value="<%=GigwaRestController.REST_PATH + Ga4ghRestController.BASE_URL + Ga4ghRestController.VARIANTS%>"/>/' + encodeURIComponent(variantId + "${idSep}") + projId + "${idSep}" + runId,
		            type: "POST",
		            data: JSON.stringify({"callSetIds": ind.map(i => $('#module').val() + "${idSep}" + i)}),
		            async: false,
		            dataType: "json",
		            contentType: "application/json;charset=utf-8",
		            headers: buildHeader(token, $('#assembly').val(), $('#workWithSamples').is(':checked')),
		            success: function(jsonResult) {
		            	responseObjects[projId + idSep + runId] = jsonResult;
		            },
		            error: function(xhr, ajaxOptions, thrownError) {
		                    handleError(xhr, thrownError);
		                    errorEncountered = true;
		            }
	            }));
	            runIndex++;
	    	}
		}

		let projNames = $("select#project").find('option').toArray().reduce((acc, option) => (acc[splitId(option.dataset.id, 1)] = $(option).text(), acc), {});

		Promise.allSettled(requests).then(function() {
			let mergedJsonContents = null;
			for (let projAndRun in responseObjects)
			 if (responseObjects[projAndRun].calls.map(call => call.genotype).filter(gt => gt.length > 0).length > 0) /* ignore empty runs */ {
					if (requests.length > 1)
						responseObjects[projAndRun].calls.forEach(function(call) {
							let splitProjAndRun = projAndRun.split(idSep);
							call.info.project = [projNames[splitProjAndRun[0]]];
							call.info.run = [splitProjAndRun[1]];
						});
					if (mergedJsonContents === null)
						mergedJsonContents = responseObjects[projAndRun];
					else {	// merge additional contents 
						if (mergedJsonContents.id !== responseObjects[projAndRun].id) {
							console.log("Cannot merge genotypes for different variants ( " + mergedJsonContents.id  + "!=" + responseObjects[projAndRun].id + " )");
							continue;
						}
						mergedJsonContents.calls = mergedJsonContents.calls.concat(responseObjects[projAndRun].calls);
					}
				}
			
			if (mergedJsonContents != null)
				mergedJsonContents.calls.sort((a, b) => {	// Sort the `calls` so that table contents are readable
				    if (a.callSetId < b.callSetId) return -1;
				    if (a.callSetId > b.callSetId) return 1;
	
				    if (a.info.project[0] < b.info.project[0]) return -1;
				    if (a.info.project[0] > b.info.project[0]) return 1;
	
				    if (a.info.run[0] < b.info.run[0]) return -1;
				    if (a.info.run[0] > b.info.run[0]) return 1;
	
				    return 0;
				});
			else
				mergedJsonContents = responseObjects[Object.keys(responseObjects)[0]];

            modalContent += '<table class="table table-overflow table-bordered" id="genotypeTable" style="width: auto;">' + buildGenotypeTableContents(mergedJsonContents) + '</table>';
		    $('#gtTable').html(modalContent);

		    $('#varId').html("Variant: " + variantId.split("${idSep}")[1]);
            $('#varSeq').html("Seq: " + mergedJsonContents.referenceName);
            $('#varType').html("Type: " + mergedJsonContents.info.type[0]);
            $('#varPos').html("Pos: " + mergedJsonContents.start + "-" + mergedJsonContents.end);

			markInconsistentGenotypesAsMissing();
			calculateVariantStats();

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
		var indToExport = $('#exportedIndividuals').val() == "choose" ? $('#exportedIndividuals').parent().parent().find("select.individualSelector").val() : ($('#exportedIndividuals').val() == "allGroups" ? getSelectedIndividuals() : ($('#exportedIndividuals').val() == "" ? [] : getSelectedIndividuals([parseInt($('#exportedIndividuals').val())])));
		exportedIndividualCount = indToExport == null ? indOpt.length : indToExport.length;
		var keepExportOnServer = $('#keepExportOnServ').prop('checked');

		if (!$("#filterIDsCheckbox").is(":checked")) {	// FIXME: this is just a workaround, we should be able to check the results' contents rather than relying on widget values
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
				for (let ploidyLevel of ploidy)
					if (!supportedPloidyLevels.includes(ploidyLevel)) {
						alert("Error: selected export format does not support ploidy level " + ploidyLevel);
						return;
					}
			}
		}
		
		exporting = true;

		$('#asyncProgressButton').show();
		$('button#abort').show();
		$('#progressText').html("Please wait...");
		$('#progress').modal({
			backdrop: 'static',
			keyboard: false,
			show: true
		});
   		
		var url = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.EXPORT_DATA_PATH%>" />';
        var query = buildSearchQuery(3, currentPageToken);
        query["keepExportOnServer"] = keepExportOnServer;
        query["exportFormat"] =  $('#exportFormat').val();
        query["exportedIndividuals"] =  indToExport === null ? [] : indToExport;
        query["metadataFields"] =  $('#exportPanel select#exportedIndividualMetadata').prop('disabled') || $('#exportPanel div.individualRelated:visible').size() == 0 ? [] : $("#exportedIndividualMetadata").val();

		processAborted = false;
		$('button#abort').attr('rel', 'export_' + token);
        $.ajax({
            url: url,
            type: "POST",       
            contentType: "application/json;charset=utf-8",
	        headers: buildHeader(token, $('#assembly').val(), $('#workWithSamples').is(':checked')),
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

		displayProcessProgress(2, "export_" + token, null, function() {
	        if ($('#enableExportPush').prop('checked'))
				showServerExportBox(keepExportOnServer);
	        else {
	        	var link = document.createElement('a');
	        	link.href = downloadURL;
	        	link.style.display = 'none';
	        	link.download = downloadURL.substring(downloadURL.lastIndexOf('/') + 1);
	        	document.body.appendChild(link);
	        	link.click();
	        	document.body.removeChild(link);
	        }
		});
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
    function igvUpdateGenomeMenu() {
        // Discard the existing list, if it exists
        $("#igvDefaultGenomesDivider").nextAll().remove();

        let menu = $("#igvGenomeMenu");
        igvGenomeList.forEach(function (listConfig, index) {
            // Make a section header
            if (index > 0) {  // The divider already exists for the first one
                let divider = $('<li class="divider" role="separator"></li>');
                menu.append(divider);
            }
            let header = $('<li class="dropdown-header"></li>').text(listConfig.name);
            menu.append(header);

            listConfig.genomes.forEach(function (genome) {
                let link = $('<a href="#"></a>').text(genome.id + " : " + genome.name).click(function () {
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
			let aliasLessContigs = new Set();
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
				else {
					aliasLessContigs.add(target);
					igvGenomeRefTable[target] = target;	// couldn't find it, use the provided name (better than nothing)
				}
			}
			if (aliasLessContigs.size > 0)
				console.log("Unable to find an alias for the following contigs in Gigwa sequences: " + Array.from(aliasLessContigs).join(", "));
			
			// Load the default tracks
			for (let trackConfig of tracks){
				await igvBrowser.loadTrack(trackConfig);
			}

			// Add the variant tracks
			await igvUpdateVariants();
			
			setIgvLocusIfApplicable();
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
	    	setTimeout(function() {igvBrowser.goto($('#Sequences').selectmultiple('value')[0].replace(/^\D+/, '').replace(/^0+/, '') + ":" + minPos + "-" + maxPos);}, 0);
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
    function igvUpdateVariants() {
        if (igvBrowser) {
            let trackIndividuals = igvSelectedIndividuals();
            let trackConfigs = [];

            trackIndividuals.forEach(function (individuals, index, array) {
                trackConfigs.push({
                    name: array.length > 1 ? $("input#group" + (index + 1)).val() : "Query",
                    type: "variant",
                    format: "custom",
                    sourceType: "file",
                    order: Number.MAX_SAFE_INTEGER,
                    visibilityWindow: 100000,
//                     showGenotypes: false,
                    reader: new GigwaSearchReader(
                        individuals, token,
                        "<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.IGV_DATA_PATH%>" />")
                });
            })


            // Display bug when updating while hidden
            // So we delay it until the modal is shown again
            let updateFunction = async function () {
                // Remove the existing variant tracks
                if (igvVariantTracks) {
                    for (let track of igvVariantTracks)
                        await igvBrowser.removeTrack(track);
                    igvVariantTracks = undefined;
                }

                // Add the new tracks
                let availableHeight = igvAvailableHeight();
                for (let config of trackConfigs) {
                    config.height = Math.max(200, availableHeight / trackConfigs.length);
                    let track = await igvBrowser.loadTrack(config);
                    if (!igvVariantTracks) igvVariantTracks = [];
                    igvVariantTracks.push(track);
                }
            }

            // Or .hasClass("in") ?
            if ($("#igvPanel").is(":visible")) {  // Already visible -> update right away
                return updateFunction();
            } else {  // Not visible -> hook it on the modal opening event
                // In case several searches are made without showing the browser, prevents obsolete requests from triggering
                $("#igvPanel").off("shown.bs.modal.updateVariants");

                return new Promise(function (resolve, reject) {
                    $("#igvPanel").one("shown.bs.modal.updateVariants", function () {
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
	
	// Build the list of individuals to display in IGV
    function igvSelectedIndividuals() {
        let trackIndividuals, group = $('input[name="igvGroupsButton"]:checked').val();
        switch (group) {
	        case "none":
	        	trackIndividuals = [[]];
	            break;
            case "selected":
            	var groupInds = getSelectedIndividuals(null, false);
            	trackIndividuals = [groupInds.length == 0 ? indOpt : groupInds];
                break;
            case "separate":
                trackIndividuals = [];
                for (var i = 1; i <= $(".genotypeInvestigationDiv").length; i++) {
                	var groupInds = getSelectedIndividuals([i], false);
                    trackIndividuals.push(groupInds.length == 0 ? indOpt : groupInds);
                }
                break;
            case "all":
                trackIndividuals = [indOpt];
                break;
            default:	// single group
            	var groupInds = getSelectedIndividuals([group.replace("group", "")], false);
         	   	trackIndividuals = [groupInds.length == 0 ? indOpt : groupInds];
            	break;
        }
        return trackIndividuals;
    }
	
    function handleRangePaste(event) {
        event.preventDefault();
        var paste = (event.originalEvent.clipboardData || window.clipboardData).getData('text');
        
        var inputs = {
            min: $('#minposition'),
            max: $('#maxposition')
        };

        if (paste.includes('-')) {
            var parts = paste.split('-').map(part => part.trim());
            inputs.min.val(parts[0].replace(/\D/g, ''));
            inputs.max.val(parts[1].replace(/\D/g, ''));
        } else {
            $(event.target).val(paste);
        }
    }
    
 	// Required by chart.js
    function getChartDistinctSequenceList() {
    	let result;
    	$.ajax({
            url: distinctSequencesInSelectionURL + "/" + getProjectId().join(","),
            type: "GET",
            async: false,
            headers: buildHeader(token, $('#assembly').val()),
            success: function (jsonResult) {
            	result = jsonResult;
            },
            error: function (xhr, ajaxOptions, thrownError) {
                handleError(xhr, thrownError);
            }
        });
    	
        var selectedSequences = getSelectedSequences() == "" ? [] : getSelectedSequences().split(";");		
    	if (result.length == 0 || selectedSequences.length < result.length)
    		result = selectedSequences;
        return result;
    }

    // Beginning of: Methods for configuring chart.js
    function getChartDistinctTypes() {
    	return getSelectedTypes().split(";");
    }
    
    function getChartModule() {
 		return referenceset;
 	}
 	
    function getChartVcfFieldDataURL() {
 		return selectionVcfFieldDataURL;
 	}
 	
    function getChartDensityDataURL() {
 		return selectionDensityDataURL;
 	}
 	
    function getChartMafDataURL() {
 		return selectionMafDataURL;
 	}
 	
    function getChartFstDataURL() {
 		return selectionFstDataURL;
 	}
 	
    function getChartTajimaDDataURL() {
 		return selectionTajimaDDataURL;
 	}
 	
    function getChartSearchableVcfFieldListURL() {
 		return searchableVcfFieldListURL;
 	}
    
    function getChartInitialRange() {
    	return [$('#minposition').val() === "" ? -1 : parseInt($('#minposition').val()), $('#maxposition').val() === "" ? -1 : parseInt($('#maxposition').val())];
    }
       
    function getChartCallSetMetadataFields() {
    	return callSetMetadataFields;
    }
    
    function getChartIndividualGroupsBasedOnMainUISelection() {
		let selectOptions = new Object();
		for (var i=1; i<=getGenotypeInvestigationMode(); i++)
			selectOptions[i] = $("input#group" + i).val();
		return selectOptions;
	}
    
    function generateChartProcessID() {
    	return null;	// means: use token
    }
    
    function buildChartDataPayLoad(displayedSequence, displayedVariantType) {
        let activeGroups = $(".genotypeInvestigationDiv").length;
    	let query = {
            "variantSetId": getProjectId().join(","),
            "discriminate": typeof getDiscriminateArray == "undefined" ? [] : getDiscriminateArray(),
            "alleleCount": getSelectedNumberOfAlleles(),
            "displayedSequence": displayedSequence,
            "displayedVariantType": displayedVariantType != "" ? displayedVariantType : null,
            "displayedRangeMin": localmin,
            "displayedRangeMax": localmax,
            "displayedRangeIntervalCount": displayedRangeIntervalCount,
    		"callSetIds": callSetIds.length > 0 ? callSetIds : indOpt.map(ind => referenceset + idSep + ind),
    		"additionalCallSetIds": additionalCallSetIds,
            "start": typeof getChartInitialRange == "undefined" ? -1 : getChartInitialRange()[0],
            "end": typeof getChartInitialRange == "undefined" ? -1 : getChartInitialRange()[1]
        };
        
    	query.annotationFieldThresholds = [];
        for (let i = 0; i < activeGroups; i++) {
            var threshold = {};
            $(`#vcfFieldFilterGroup${i + 1} input`).each(function() {
                if (parseInt($(this).val()) > 0)
                    threshold[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
            });
            query.annotationFieldThresholds.push(threshold);
        }
        return query;
    }
 	// End of: Methods for configuring chart.js

    // Attach paste handler to the inputs using jQuery
    $('#minposition, #maxposition').on('paste', handleRangePaste);
</script>
<script type="text/javascript" src="js/charts.js"></script>

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

</html>