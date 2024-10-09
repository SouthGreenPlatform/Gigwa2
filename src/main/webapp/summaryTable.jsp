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
<%@ page contentType="text/html; charset=utf-8" pageEncoding="UTF-8" language="java" import="fr.cirad.tools.Helper,fr.cirad.web.controller.gigwa.GigwaRestController,fr.cirad.web.controller.ga4gh.Ga4ghRestController" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<%
	java.util.Properties prop = new java.util.Properties();
	prop.load(getServletContext().getResourceAsStream("/META-INF/MANIFEST.MF"));
	String appVersion = prop.getProperty("Implementation-version");
	String[] splittedAppVersion = appVersion == null ? new String[] {""} : appVersion.split("-");
%>
<c:set var="appVersionNumber" value='<%= splittedAppVersion[0] %>' />
<c:set var="appVersionType" value='<%= splittedAppVersion.length > 1 ? splittedAppVersion[1] : "" %>' />
<c:set var="customCssFolder" value='<%= new java.io.File(application.getRealPath("/custom/css")).isDirectory() ? "custom/" : "" %>' />

<html>
<head>
<title>Summary Table</title>
    <link type="text/css" rel="stylesheet" href="${customCssFolder}css/bootstrap-select.min.css ">
    <link type="text/css" rel="stylesheet" href="${customCssFolder}css/bootstrap.min.css">
    <link type="text/css" rel="stylesheet" href="${customCssFolder}css/main.css">
	<style type="text/css">
	    #moduleProjectNavbar {
	    	display:none;
		}
	</style>
    <script type="text/javascript" src="js/jquery-1.12.4.min.js"></script>
    <script type="text/javascript" src="js/common.js"></script>
    <script type="text/javascript" src="js/bootstrap-select.min.js"></script>
    <script type="text/javascript" src="js/bootstrap.min.js"></script>
    <script type="text/javascript">
    var token;
    var tokenURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.GET_SESSION_TOKEN%>"/>';
    var summaryTableURL = '<c:url value="<%=GigwaRestController.REST_PATH + GigwaRestController.BASE_URL + GigwaRestController.INSTANCE_CONTENT_SUMMARY%>"/>';

    function listModules() {
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
                var dbNames = [];
                for (var set in jsonResult.referenceSets)
                    dbNames.push(jsonResult.referenceSets[set].name);

                if (dbNames.length > 0)
                	buildSummaryTable(dbNames);
                else
                	$("div#mainContents").html("<center style='font-size:14px; margin-top:30px;'>No data is currently available to you on this instance</center>");
		    },
            error: function(xhr, ajaxOptions, thrownError) {
                handleError(xhr, thrownError);
            }
        });
    }

    function buildSummaryTable(dbNames){
        $.ajax({
            url: summaryTableURL,
            type: "GET",
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            headers: {
                "Authorization": "Bearer " + token
            },
            success: function(jsonResult) {
                var jsonTable = document.createElement("table");
                jsonTable.style.borderCollapse = 'collapse';
                jsonTable.style.display = 'flex';
                jsonTable.style.justifyContent = 'center';
                jsonTable.style.alignItems = 'center';
                jsonTable.style.marginTop = '30px';
                var style = document.createElement('style');
                style.type = 'text/css';
                style.innerHTML = '.cellStyle { \
				  border: 1px solid #dddddd; \
				  text-align: left; \
				  padding: 5px; \
				}';
                document.head.appendChild(style);
                var currentrow = jsonTable.insertRow();
                currentrow.style.color = '#ffffff';
                currentrow.style.backgroundColor = '#2fa4e7';
                currentrow.style.borderColor = '#2fa4e7';
                currentrow.style.fontStyle = 'bold';
                var currentcell = currentrow.insertCell();
                currentcell.textContent = "Databases";
                currentcell.className = "cellStyle";
                currentcell = currentrow.insertCell();
                currentcell.textContent = "Taxon";
                currentcell.className = "cellStyle";
                currentcell = currentrow.insertCell();
                currentcell.textContent = "# Variants";
                currentcell.className = "cellStyle";
                currentcell = currentrow.insertCell();
                currentcell.textContent = "# Individuals";
                currentcell.className = "cellStyle";
                currentcell = currentrow.insertCell();
                currentcell.textContent = "Projects";
                currentcell.className = "cellStyle";
                currentrow = jsonTable.insertRow();
                i = 1
                for (var key in jsonResult) {
                    if (arrayContains(dbNames, jsonResult[key]["database"])) {
                        currentcell = currentrow.insertCell();
                        var db = jsonResult["Database" + i];
                        var keys = Object.keys(db)
                        var rowSpan = Math.max(1, keys.length - 4);
                        currentcell.rowSpan = rowSpan;
                        var a = document.createElement("a");
                        var url = window.location.href;
                        var lastSlashIndex = url.lastIndexOf('/');
                        var urlGigwa = url.substring(0, lastSlashIndex);
                        a.href = urlGigwa + "/?module=" + db["database"];
                        a.textContent = db["database"];
                        currentcell.appendChild(a);
                        currentcell.style.fontWeight = 'bold';
                        currentcell.className = "cellStyle";
                        currentcell.id = db["database"] + "cellid";
                        currentcell = currentrow.insertCell();
                        currentcell.rowSpan = rowSpan;
                        currentcell.textContent = db["taxon"];
                        currentcell.className = "cellStyle";
                        currentcell = currentrow.insertCell();
                        currentcell.rowSpan = rowSpan;
                        currentcell.textContent = db["markers"];
                        currentcell.className = "cellStyle";
                        currentcell = currentrow.insertCell();
                        currentcell.rowSpan = rowSpan;
                        currentcell.textContent = db["individuals"];
                        currentcell.className = "cellStyle";

                        if (keys.length < 5)
                        {
                            currentcell = currentrow.insertCell();
                            currentcell.textContent = "(empty database)";
                            currentcell.className = "cellStyle";
                            currentrow = jsonTable.insertRow();
                        }
                        else {
                            for (var j = 1; j <= keys.length - 4; j++) {
                                var projects = Object.keys(db["Project" + j])
                                currentcell = currentrow.insertCell();
                                var projectName = document.createTextNode(db["Project" + j]["name"]);
                                var strongElement = document.createElement("strong");
                                strongElement.appendChild(projectName);
                                currentcell.appendChild(strongElement);
                                if (arrayContains(projects, "description")) {
                                    var span = document.createElement("span");
                                    span.role = "button";
                                    span.title = db["Project" + j]["description"];
                                    span.className = "glyphicon glyphicon-info-sign";
                                    span.style.color = 'blue';
                                    span.style.marginLeft = '5px';
                                    currentcell.appendChild(span);
                                }
                                currentcell.appendChild(document.createElement('br'));
                                currentcell.appendChild(document.createTextNode("Variant types: " + db["Project" + j]["variantType"].toString().split(',').join(', ')));
                                currentcell.appendChild(document.createElement('br'));
                                currentcell.appendChild(document.createTextNode("Ploidy level: " + db["Project" + j]["ploidy"]));
                                currentcell.appendChild(document.createElement('br'));
                                currentcell.appendChild(document.createTextNode("# Samples: " + db["Project" + j]["samples"]));
                                currentcell.appendChild(document.createElement('br'));
                                currentcell.appendChild(document.createTextNode("Runs: " + db["Project" + j]["runs"].join(" ; ")));
                                currentcell.className = "cellStyle";
                                currentrow = jsonTable.insertRow();
                            }
                        }
                        i++;
                    }
                }
                $("div#mainContents img").replaceWith(jsonTable);
            },
            error: function(xhr, ajaxOptions, thrownError) {
                handleError(xhr, thrownError);
            }
        });
    }
    
	$(document).ready(function() {
	    getToken();
	    listModules();		
	});
</script>
</head>
<body>
<%@include file="navbar.jsp"%>
<h3 style="display: flex; justify-content: center">Summary of instance contents</h3>
<div id="mainContents"style="text-align:center;"><img src='images/progress.gif' /> </div>
</body>
</html>