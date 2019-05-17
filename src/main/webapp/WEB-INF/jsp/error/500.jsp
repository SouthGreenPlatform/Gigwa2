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
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<html>
    <head>
		<link rel ="stylesheet" type="text/css" href="../../private/css/role_manager.css" title="style">
		<script type="text/javascript" src="<c:url value="/private/js/jquery-1.12.4.min.js" />"></script>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Error 500</title>
    </head>
    <body>
    	<center>
	    <div style="margin-top:50px;" class="formErrors">
	        <p style="font-size:15px; font-weight:bold;">Sorry, there is a problem</p>
	        <p style="font-size:13px;">${exception.message}</p>
	        <p>
	        <a href="#" onclick="$('div#stackTrace').fadeIn();">
	        	Click for technical details
	        </a>
	        </p>
        </div>
        </center>
        <div id="stackTrace" style="background-color:#f7f7f7; margin:10px; height:310px; overflow-y:scroll; display:none;"><b>${exception}</b><c:forEach items='${exception.stackTrace}' var='ste'><br>${ste}</c:forEach></div>
    </body>
</html>