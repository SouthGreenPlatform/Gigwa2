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
<%@ page language="java" contentType="text/html; charset=utf-8" import="fr.cirad.web.controller.gigwa.GigwaRestController" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>
<jsp:useBean id="appConfig" class="fr.cirad.tools.AppConfig" />
<sec:authentication property="principal" var="principal"/>
<sec:authorize access="hasRole('ROLE_ADMIN')" var="isAdmin"/>
<sec:authorize access="hasRole('ROLE_ANONYMOUS')" var="isAnonymous"/>

    <nav class="navbar navbar-inverse navbar-default<c:if test="${param.hideNavBar eq 'true'}"> hidden</c:if>">
        <div class="container-fluid">
            <div class="navbar-header">
                <a class="navbar-brand" href="<c:url value='/' />"><img src="<c:url value='/images/logo.png' />" height="25"></a>
            </div>
           	<div id="appVersionNumber">${appVersionNumber == "" ? "" : ("v".concat(appVersionNumber))}</div>
           	<div id="appVersionType">${appVersionType}</div>
            <div class="collapse navbar-collapse">
                <ul class="nav navbar-nav navbar-right">
                    <li><a href="<c:url value='/' />" data-toggle="tooltip" data-placement="bottom" title="Search / browse genotyping data"><span class="glyphicon glyphicon-home margin-icon" aria-hidden="true"></span>Home</a></li>
		   			<li class="dropdown">
		   				<a href="#" class="dropdown-toggle" data-toggle="dropdown"><span class="glyphicon glyphicon-list-alt margin-icon" aria-hidden="true"></span>Manage data</a>
		   				<ul class="dropdown-menu">
						<li><a href="<c:url value='<%= GigwaRestController.IMPORT_PAGE_URL%>' />" id="import" onclick="window.location.href = this.href" data-toggle="tooltip" data-placement="bottom">Import data</a></li>
		                    <c:if test="${!isAnonymous}">
								<li><a href="<c:url value='/permissionManagement.jsp' />" data-toggle="tooltip" data-placement="bottom">Administer existing data<br/>and/or user permissions</a></li>
							</c:if>
							<c:if test="${principal != null && !isAnonymous}">
								<li><a href="<c:url value='/exportedData.jsp' />" id="import" onclick="window.location.href = this.href" data-toggle="tooltip" data-placement="bottom">View exported data</a></li>
							</c:if>
						</ul>
   		   			</li>
                    <li><a href="<c:url value='<%= GigwaRestController.REST_PATH %>' />/swagger-ui/index.html" target="_blank" data-toggle="tooltip" data-placement="bottom" title="Rest API Swagger"><span class="glyphicon glyphicon-leaf margin-icon" aria-hidden="true"></span>Rest APIs</a></li>
                    <li><a href="#" onclick="$('#manual').modal('show');" data-toggle="tooltip" data-placement="bottom" title="Display online documentation"><span class="glyphicon glyphicon-book margin-icon" aria-hidden="true"></span>Docs</a></li>
                    <c:if test="${principal != null && isAnonymous}">
                        <li>
                            <a href="<c:url value='/login.do' />" data-toggle="tooltip" data-placement="bottom" title="Log-in for private data"><span class="glyphicon glyphicon-user margin-icon" aria-hidden="true"></span>Log-in</a>
                        </li>
					</c:if>
					<c:if test="${principal != null && !isAnonymous}">
                        <li>
                            <a href="<c:url value='logout' />" data-toggle="tooltip" data-placement="bottom" title="Log out ${principal.username}" id="logOut"><span class="glyphicon glyphicon-log-out margin-icon" aria-hidden="true"></span>Log out</a>
                        </li>
					</c:if>
                </ul>
                <form class="navbar-form navbar-left" role="search" id="moduleProjectNavbar">
                    <div class="form-group" id="grpTaxa" style="display:none;">
	                    <select class="selectpicker" id="taxa" data-actions-box="true" data-live-search="true" name="taxa" onchange="taxonSelected();"><option>(Any taxon)</option></select>&nbsp;
					</div>
                    <select class="selectpicker" id="module" data-actions-box="true" data-live-search="true" name="module" title="Database"></select>
                    <div class="form-group" id="grpProj">&nbsp;
                        <label for="project" class="label-light" id="projectLabel">Project </label>
                        <select class="selectpicker" multiple id="project" data-actions-box="true" data-live-search="true" name="project"></select>
	                    <a href="#" onclick="displayProjectInfo($('#project').val());" id="projectInfoLink" style="display:none;"><span role='button' title="Click for project information" class="glyphicon glyphicon-info-sign" id="formatHelp" style="color:yellow;"></span></a>
                    </div>
                    <div class="form-group" id="grpAsm" style="display:none;">
	                    &nbsp;<label for="assembly" class="label-light">Assembly </label>
                        <select class="selectpicker" id="assembly" data-actions-box="true" name="assembly"></select>
                    </div>
                </form>
            </div>
        </div>
    </nav>

    <!-- modal which displays documentation -->
	<div class="modal fade" tabindex="-1" role="dialog" id="manual" aria-hidden="true">
		<div class="modal-dialog modal-lg">
			<div class="modal-content" style="padding:10px; overflow:hidden;">
				<iframe id="manualFrame" style="width: 100%; border:0; min-height:90vh;" src='docs/gigwa_docs.html'></iframe>
			</div>
		</div>
	</div>

	<!-- modal which displays terms of use -->
	<div class="modal fade" tabindex="-1" role="dialog" id="termsOfUse" aria-hidden="true">
		<div class="modal-dialog">
			<div class="modal-content" style="min-width:700px; padding:0 30px;">
				<div class="modal-header" id="termsOfUseContainer">
					<center><h3>Gigwa - Terms of use</h3></center>
					<ol>
						<li><h4>Limitation of warranty</h4>
							<p>a) You acknowledge that the actual state of scientific and technical knowledge do not permit to test and check all uses of Gigwa, nor to detect the being of possible defaults. You acknowledge that the changes, the Use, the modification, the development, the reproduction of Gigwa are deemed to be executed by experimented users and contain risks. You are responsible for the checking by any means of fitness of Gigwa for your own purposes, of checking of its working, of its Use in conditions that do not cause damages to persons or goods.</p>
							<p>b) Gigwa is provided on a « as is » basis, without warranties express or implied other than its existence, including all disclaimer of warranty relating to a title or deed (of property or exploitation), the lack of infringement, the merchantability, the secured, innovative or accurate features of Gigwa, the lack of mistakes, the suitability with Your equipment and/or software configuration.</p>
						</li>
						<li><h4>Disclaimer of liability</h4>
							a) CIRAD or IRD can not be held responsible towards anyone:
							<ul>
							<li>i) for any damage due to the complete or partial breach of Your obligations;
							<li>ii) for any direct or indirect damages resulting of the Use or the performance of Gigwa caused to the Final User when he is a professional using Gigwa for professional purposes;
							<li>iii) for any indirect damage arising from the Use or the performances of Gigwa
							</ul>
							<p>b) The parties agree expressly that any financial or commercial prejudice (for instance loose of data, loose of customers or orders, loose of benefit, trading loss, misses to gain, commercial disorder) or any action suited against You by a third party is considered as an indirect damage and can not be subject of a indemnifying by CIRAD or IRD.</p>
						</li>
						<li><h4>Applicable law</h4>
							<p>This contract and all disputes arising out of the execution or interpretation of this license shall be governed by French law.</p>
						</li>
			         	<c:set var="googleAnalyticsId" value="<%= appConfig.get(\"googleAnalyticsId\") %>"></c:set>
			         	<c:if test='${!fn:startsWith(googleAnalyticsId, "??") && !empty googleAnalyticsId}'>
			         	<li>
							<h4>Cookie consent</h4>
							<p>This website uses Google Analytics to analyze anonymized traffic and improve your experience. You can choose to accept or decline the use of cookies for analytics purposes. You can change your preference at any time by clicking the 'Terms of use' link in the Gigwa page footer.</p>
              <label><input type="checkbox" id="cookieConsentCheckbox" name="cookieConsent" value="accepted" checked="checked"> I consent to the use of cookies for analytics purposes.</label><br/>
			      		</li>
			      		</c:if>
						<%= appConfig.get("customTermsOfUseHtmlParagraph", "") %>
					</ol>
					<p style="text-align:center"><input type="button" id="termsOfUseAgreeButton" value="I understand and consent to the above" style="margin:5px;" class="btn btn-primary btn-sm" data-dismiss="modal"/></p>
				</div>
			</div>
		</div>
	</div>

	<script type="text/javascript" src="private/js/jquery.cookie.js"></script>
	<script type="text/javascript">
		$.ajax({
			url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.TERMS_OF_USE_COOKIE_DURATION_IN_HOURS_URL %>" />',
			type: "GET",
			dataType: "json",
			success: function(nHours) {
				var termsOfUseCookieDuration = 1000 * 60 * 60 * nHours;	
				$("#termsOfUseAgreeButton").on("click", function() {
					$.cookie('termsOfUseAgreed', true, { expires: new Date(new Date().getTime() + termsOfUseCookieDuration) });
				});
				if (!$.cookie('termsOfUseAgreed'))
			        $('#termsOfUseLink').click();
// 				else
// 					$.cookie('termsOfUseAgreed', true, { expires: new Date(new Date().getTime() + termsOfUseCookieDuration) });	// push expiry date back
			},
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		})
		
		$("#project").attr('data-selected-text-format', "count>1");
	</script>

	<%= new java.io.File(application.getRealPath("/custom/custom.css")).exists() ? "<link type='text/css' rel='stylesheet' href='custom/custom.css'>" : "" %>
	<%= new java.io.File(application.getRealPath("/custom/custom.js")).exists() ? "<script type='text/javascript' src='custom/custom.js'></script>" : "" %>