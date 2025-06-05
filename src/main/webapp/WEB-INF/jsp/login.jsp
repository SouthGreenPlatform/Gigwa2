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
<%@ page language="java" contentType="text/html; charset=utf-8" import="fr.cirad.web.controller.GigwaAuthenticationController" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>

<jsp:useBean id="appConfig" class="fr.cirad.tools.AppConfig" />

<html>
    <head>
        <meta charset="utf-8">
        <title>Gigwa - Login</title>
        <link rel="shortcut icon" href="images/favicon.png" type="image/x-icon" /> 
        <link type="text/css" rel="stylesheet" href="css/bootstrap.min.css">
		<link type="text/css" rel="stylesheet" href="css/main.css">
        <link type="text/css" rel="stylesheet" href="css/login.css">
		<%= new java.io.File(application.getRealPath("/custom/custom.css")).exists() ? "<link type='text/css' rel='stylesheet' href='custom/custom.css'>" : "" %>
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
			<c:forEach var="registration" items="${oauth2Providers}" >			    
			    <a href='<c:out value="${registration.providerDetails.authorizationUri}" />?response_type=code&scope=openid&client_id=${registration.clientId}&redirect_uri=${registration.redirectUri}'>Authenticate with <c:out value="${registration.registrationId}" /></a><br/>
			</c:forEach>
            <div class="row margin-top">
                <div class="col-md-4"></div>
                <div class="col-md-4">
                    <div class="panel panel-default">
                        <div class="panel-body text-center">
                        	<div style="background-color:white; padding:7px; border:darkblue 5px outset; margin:10px 0 40px 0;"><img alt="Gigwa" height="40" src="images/logo_big.png" /><br/>LOGIN FORM</div>
                            <form name="f" action='login' method='POST' id="form-login" style="">
                                <input type="text" name="username" id="username" placeholder="Username" required="required" />
                                <input type="password" name="password" id="password" placeholder="Password" required="required" />
                                <c:if test="${resetPasswordEnabled}">
                                	<a class="text-danger" style="font-size:13px;" href="${pageContext.request.contextPath}<%= GigwaAuthenticationController.LOGIN_LOST_PASSWORD_URL %>">Lost your password?</a>
                                </c:if>
                                <button type="submit" name="connexion" class="btn btn-primary btn-block btn-large" style="margin:40px 0 20px 0;">Log me in</button>
                            </form>
                            <c:set var="casServerURL" value="<%= appConfig.get(\"casServerURL\") %>"></c:set>
                            <c:set var="enforcedWebapRootUrl" value="<%= appConfig.get(\"enforcedWebapRootUrl\") %>"></c:set>
                            <c:if test='${!fn:startsWith(casServerURL, "??") && !empty casServerURL && !fn:startsWith(enforcedWebapRootUrl, "??") && !empty enforcedWebapRootUrl}'>
                            	<a id="casAuthenticationEntryPoint" class="btn btn-primary btn-block btn-large margin-top" href="login/cas.do?url=${loginOrigin}" target="_top">Authenticate using
                            	<c:set var="casOrganization" value="<%= appConfig.get(\"casOrganization\") %>"></c:set>
                            	<c:choose><c:when test='${!fn:startsWith(casOrganization, "??") && !empty casOrganization}'>${casOrganization}</c:when><c:otherwise>organization</c:otherwise></c:choose>
                            	account</a>
							</c:if>
							<c:choose>
	                            <c:when test="${param.auth eq 'failure'}">
	                                <div class="text-red margin-top-md">
	                                    &nbsp;
	                                    <span id="loginErrorMsg" style="background-color:white; padding:0 10px;"><c:out value="${SPRING_SECURITY_LAST_EXCEPTION.message}" /></span>
	                                    <script type="text/javascript">
	                                    setTimeout(function () {
	                                        $("span#loginErrorMsg").fadeTo(1000, 0);
	                                    }, 2000);
	                                    </script>
	                                </div>
	                            </c:when>
	                            <c:otherwise>
	                                <c:if test="${not empty param.message}">
	                                    <p style="font-size:13px;" class="text-success">${param.message}</p>
	                                </c:if>
	                            </c:otherwise>
                            </c:choose>
                            <button type="button" class="btn btn-primary btn-block btn-large margin-top-md" onclick="window.location.href = 'index.jsp';">Return to public databases</button>
                            <c:set var="adminEmail" value="<%= appConfig.get(\"adminEmail\") %>"></c:set>
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