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
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jstl/fmt" %>

<jsp:useBean id="appConfig" class="fr.cirad.tools.AppConfig" />

<%
	String casOrganisation = appConfig.get("casOrganisation");
	if (casOrganisation == null) casOrganisation = "organisation";
%>

<fmt:setBundle basename="config" />
<html>
    <head>
        <meta charset="utf-8">
        <title>Gigwa - Login</title>
        <link rel="shortcut icon" href="images/favicon.png" type="image/x-icon" /> 
        <link type="text/css" rel="stylesheet" href="css/bootstrap.min.css">
		<link type="text/css" rel="stylesheet" href="css/main.css">
        <link type="text/css" rel="stylesheet" href="css/login.css">
        <script type="text/javascript" src="js/jquery-1.12.4.min.js"></script>
		<script type="text/javascript">
			var currentWindow = this;
			while (currentWindow != top)
			{
				try
				{
		 			currentWindow.parent.document;	// accessing this throws an exception if Gigwa is running in a frame
					currentWindow = currentWindow.parent;
				}
				catch(e)
				{
					break;
				}
			}
			if (currentWindow != this)
				currentWindow.location.href = location.href;

            $.ajaxSetup({
                cache: false
            });
        </script>
    </head>
    <body>
        <div class ="container">
            <div class="row margin-top">
                <div class="col-md-4"></div>
                <div class="col-md-4">
                    <div class="panel panel-default">
                        <div class="panel-body text-center">
                        	<div style="background-color:white; padding:7px; border:darkblue 5px outset; margin:10px 0 40px 0;"><img alt="Gigwa" height="40" src="images/logo_big.png" /><br/>LOGIN FORM</div>
                            <form name="f" action='login' method='POST' id="form-login">
                                <input type="text" name="username" id="username" placeholder="Username" required="required" />
                                <input type="password" name="password" id="password" placeholder="Password" required="required" />
                                <button type="submit" name="connexion" class="btn btn-primary btn-block btn-large">Log me in</button> 
                            </form>
                            <c:if test="${appConfig.get('casServerURL') != null}">
                            	<a class="btn btn-primary btn-block btn-large margin-top" href="login/cas.do">Authenticate using my <%= casOrganisation %> account</a>
							</c:if>
							<div class="text-red margin-top-md">
								&nbsp;
								<c:if test="${param.auth eq 'failure'}">
									<span id="loginErrorMsg" style="background-color:white; padding:0 10px;"><c:out value="${SPRING_SECURITY_LAST_EXCEPTION.message}" /></span>
							        <script type="text/javascript">
	                                setTimeout(function () {
	                                    $("span#loginErrorMsg").fadeTo(1000, 0);
	                                }, 2000);
	                                </script>
								</c:if>
							</div>
                            <button type="button" class="btn btn-primary btn-block btn-large margin-top-md" onclick="window.location.href = 'index.jsp';">Return to public databases</button>
                            <fmt:message var="adminEmail" key="adminEmail" />
                            <c:if test='${!fn:startsWith(adminEmail, "??") && !empty adminEmail}'>
                                <p class="margin-top">Apply for an account at <a href="mailto:${adminEmail}?subject=Gigwa account request">${adminEmail}</a></p>
                            </c:if>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>