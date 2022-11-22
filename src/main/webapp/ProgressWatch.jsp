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
<%@ page language="java" contentType="text/html; charset=utf-8" pageEncoding="UTF-8" import="fr.cirad.web.controller.gigwa.GigwaRestController"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<html>

<head>
    <script type="text/javascript" src="js/jquery-1.12.4.min.js"></script>
    <script type="text/javascript" src="js/bootstrap.min.js"></script>
	<script type="text/javascript" src="<c:url value="/js/main.js" />"></script>
	<link rel="shortcut icon" href="images/favicon.png" type="image/x-icon" />
	<link type="text/css" rel="stylesheet" href="css/bootstrap.min.css">
    <link type="text/css" rel="stylesheet" href="css/main.css">
	<script type="text/javascript">
		var progressUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.PROGRESS_PATH%>' />";
		var abortUrl = "<c:url value='<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.ABORT_PROCESS_PATH%>' />";

		var destinationLink = "${param.successURL}";
		var fileName = destinationLink.substring(destinationLink.lastIndexOf("/") + 1);
		if (fileName.startsWith("?"))
			fileName = location.origin + '<c:url value='/' />' + fileName;
		
		var processAborted = false;
		
		function watchProgress()
		{
	    	$.ajax({
		        url: progressUrl<c:if test="${param.process != null}">+'?progressToken=${param.process}'</c:if>,
		        type: "GET",
		        async: false,
		        <c:if test="${param.token != null}">headers: { "Authorization": "Bearer ${param.token}" },</c:if>
		        success: function (jsonResult) {
		            if (jsonResult == null)
		            	$('body').append('<center><p style="margin-top:60px;" class="bold">No such process is running at the moment.</p><p>Refresh to try again or use the link below to access resulting data in case the process has already finished:<br/><br/><a style="cursor:pointer;" href="' + destinationLink + '">' + (fileName == '?' ? destinationLink : fileName) + '</a></p></center>');
		            else
		            {
		        		$('#progress').modal({backdrop: 'static', keyboard: false, show: true});
		        		$('.modal-backdrop.in').css('opacity', '0.1');
		        		displayProcessProgress(5, <c:choose><c:when test="${param.token != null}">'${param.token}'</c:when><c:otherwise>null</c:otherwise></c:choose>, '${param.process}');
		        		
		                $('#progress').on('hidden.bs.modal', function () {
		                	if (processAborted)
		                		$('body').append('<center><p style="margin-top:60px;" class="bold">Process aborted</p></center>');
		                	else if (!$('#progress').data('error'))
		        	            $('body').append('<center><p style="margin-top:60px;" class="bold">Process has completed. Data is now <a style="cursor:pointer;" href="' + destinationLink + '">available here</a></center>');
		                });
		            }
		        },
		        error: function (xhr, ajaxOptions, thrownError) {
		            handleError(xhr, thrownError);
		        }
	    	});
	    	$("div.modal-backdrop").remove();
		}
	</script>
	<title>Gigwa process watcher</title>
</head>

<body style='background-color:#f0f0f0;' onload="$('button#abortButton').css('display', ${param.abortable eq 'true'} ? 'inline' : 'none'); watchProgress();">
	<div style='background-color:white; width:100%; padding:5px;'><img src="<c:url value='/images/logo.png' />" height="25"></div>
	<div id='progress' style='margin-top:50px; width:100%; display:block; text-align:center; display:none;'>
		<p>This process is running as a background task.</p>
		<p>You may leave the main Gigwa page and either keep this one open or copy its URL to check again later.</p>
		<h2 id="progressText" class="loading-message" style='margin-top:50px'>Please wait...</h2>
		<button class="btn btn-danger btn-sm" id="abortButton" style="display:none;" type="button" name="abort" onclick="if (confirm('Are you sure?')) abort('${param.process}');">Abort</button>
	</div>
</body>

</html>