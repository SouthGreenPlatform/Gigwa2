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
<%@ page language="java" contentType="text/html; charset=utf-8" import="fr.cirad.web.controller.ga4gh.Ga4ghRestController,fr.cirad.web.controller.gigwa.GigwaRestController" %>
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
<sec:authentication property="principal" var="principal"/>
<sec:authorize access="hasRole('ROLE_ANONYMOUS')" var="isAnonymous"/>
<c:set var="customCssFolder" value='<%= new java.io.File(application.getRealPath("/custom/css")).isDirectory() ? "custom/" : "" %>' />

<html>
    <head>
        <meta charset="utf-8">
		<title>Gigwa <%= appVersion == null ? "" : ("v" + appVersion)%></title>
        <link rel="shortcut icon" href="images/favicon.png" type="image/x-icon" /> 
        <link type="text/css" rel="stylesheet" href="${customCssFolder}css/bootstrap-select.min.css "> 
		<link type="text/css" rel="stylesheet" href="${customCssFolder}css/bootstrap.min.css">
        <link type="text/css" rel="stylesheet" href="${customCssFolder}css/dropzone.css">
        <link type="text/css" rel="stylesheet" href="${customCssFolder}css/main.css">
        <script type="text/javascript" src="js/jquery-1.12.4.min.js"></script>
        <script type="text/javascript" src="js/bootstrap-select.min.js"></script>
        <script type="text/javascript" src="js/bootstrap.min.js"></script>
        <script type="text/javascript" src="js/main.js"></script>
        <script type="text/javascript">
        var tokenURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GET_SESSION_TOKEN%>"/>';
        var clearTokenURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.CLEAR_TOKEN_PATH%>" />';
        var token;

        function loadExportList()
        {
        	$('#moduleProjectNavbar').hide();
        	<c:if test="${principal != null && !isAnonymous}">
        	getToken();

            $.ajax({
                url: '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.EXPORTED_DATA_PATH%>"/>/${principal.username}/',
                type: "GET",
                dataType: "json",
                contentType: "application/json;charset=utf-8",
                headers: {
                    "Authorization": "Bearer " + token
                },
                success: function (jsonResult) {
                	var fGotData = Object.keys(jsonResult).length > 0;
                	if (fGotData)
                		$("#exportList").html("<ul>");
                   	for (var timeMillis in jsonResult)
                   	{
                   		var fileName = jsonResult[timeMillis].substring(jsonResult[timeMillis].lastIndexOf("/") + 1);
                   		var database = fileName.substring(0, fileName.indexOf("["));
                   		$("#exportList").prepend("<li class='margin-top-md'><b>Export date:</b> " + new Date(parseInt(timeMillis)).toLocaleString("en-GB") + (database == "" ? "" : " - <b>Database</b>: " + database) + " - <b>File</b>: <a href='" + jsonResult[timeMillis] + "'>" + fileName + "</a></li>");
                   	}
                	if (fGotData)
                		$("#exportList").append("</ul>");

                	clearToken();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                	clearToken();
                    handleError(xhr, thrownError);
                }
            });
            </c:if>
        }
        </script>
    </head>
    <body onload="loadExportList();">
        <%@include file="../../../navbar.jsp" %>        
        <div class="container margin-top-md">
        	<h3>Datasets recently exported to server<c:if test="${principal != null && !isAnonymous}"> by user ${principal.username}</c:if></h3>
        	<div id="exportList">(no exported datasets found)</div>
        </div>
    </body>
</html>