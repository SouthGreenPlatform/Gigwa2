<%--
 * GIGWA - Genotype Investigator for Genome Wide Analyses
 * Copyright (C) 2016, 2018, <CIRAD> <IRD>
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
		                    <c:if test="${userDao.doesLoggedUserOwnEntities()}">
								<li><a href="<c:url value='/permissionManagement.jsp' />" data-toggle="tooltip" data-placement="bottom">Administer existing data<br/>and user permissions</a></li>
							</c:if>
							<c:if test="${principal != null && !isAnonymous}">
								<li><a href="<c:url value='/exportedData.jsp' />" id="import" onclick="window.location.href = this.href" data-toggle="tooltip" data-placement="bottom">View exported data</a></li>
							</c:if>
						</ul>
   		   			</li>
                    <li><a href="<c:url value='/rest/swagger-ui.html' />" target="_blank" data-toggle="tooltip" data-placement="bottom" title="Rest API Swagger"><span class="glyphicon glyphicon-leaf margin-icon" aria-hidden="true"></span>Rest APIs</a></li>
                    <c:if test="${principal != null && isAnonymous}">
                        <li>
                            <a href="<c:url value='/login.jsp' />" data-toggle="tooltip" data-placement="bottom" title="Log-in for private data"><span class="glyphicon glyphicon-user margin-icon" aria-hidden="true"></span>Connexion</a>
                        </li>
					</c:if>
					<c:if test="${principal != null && !isAnonymous}">
                        <li>
                            <a href="<c:url value='/j_spring_security_logout' />" data-toggle="tooltip" data-placement="bottom" title="Log out ${principal.username}" id="logOut"><span class="glyphicon glyphicon-log-out margin-icon" aria-hidden="true"></span>Log out</a>
                        </li>
					</c:if>
                </ul>
                <form class="navbar-form navbar-left" role="search" id="moduleProjectNavbar">
                    <select class="selectpicker" id="module" data-actions-box="true" data-live-search="true" name="module" title="Database"></select>
                    <div class="form-group" id="grpProj">&nbsp;
                        <label for="project" class="label-light" id="projectLabel">Project </label>
                        <select class="selectpicker" id="project" data-actions-box="true" data-live-search="true" name="project"></select>
	                    <a href="#" onclick="displayProjectInfo($('#project').val());" id="projectInfoLink" style="display:none;"><span role='button' title="Click for project information" class="glyphicon glyphicon-info-sign" id="formatHelp" style="color:yellow;"></span></a>
                    </div>
                </form>
            </div>
        </div>
    </nav>