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

<%@ page language="java" contentType="text/html; charset=utf-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>

<jsp:useBean id="appConfig" class="fr.cirad.tools.AppConfig" />

<%
	java.util.Properties prop = new java.util.Properties();
	prop.load(getServletContext().getResourceAsStream("/META-INF/MANIFEST.MF"));
	String appVersion = prop.getProperty("Implementation-version");
	String[] splittedAppVersion = appVersion == null ? new String[] {""} : appVersion.split("-");
	String casOrganisation = appConfig.get("casOrganisation");
	if (casOrganisation == null) casOrganisation = "organisation";
%>
<c:set var="appVersionNumber" value='<%= splittedAppVersion[0] %>' />
<c:set var="appVersionType" value='<%= splittedAppVersion.length > 1 ? splittedAppVersion[1] : "" %>' />

<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
        <title>Gigwa <%= appVersion == null ? "" : ("v" + appVersion)%></title>  
        <link rel="shortcut icon" href="images/favicon.png" type="image/x-icon" /> 
		<link type="text/css" rel="stylesheet" href="css/bootstrap.min.css">
		<link type="text/css" rel="stylesheet" href="css/main.css">
        <script type="text/javascript" src="js/jquery-1.12.4.min.js"></script>
        <script type="text/javascript" src="js/bootstrap.min.js"></script>
        <script type="text/javascript">
        	var token;
            $(document).ready(function () {
            	$('#moduleProjectNavbar').hide();
            });
        </script>
</head>
<body>
	<%@include file="navbar.jsp"%>
	<main style="max-width:700px; margin: 0 auto;">
		<h3>You have successfully logged out of Gigwa</h3>
		<p>
			You may now <strong>log out from your <%= casOrganisation %> account</strong> by clicking <strong><a href="logout/cas">here</a></strong>
		</p>
	</main>
</body>
</html>