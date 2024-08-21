<!DOCTYPE html>

<%@ page language="java" contentType="text/html; charset=utf-8" import="fr.cirad.web.controller.GigwaAuthenticationController" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <link rel="shortcut icon" href="images/favicon.png" type="image/x-icon" />
        <link type="text/css" rel="stylesheet" href="css/bootstrap.min.css">
        <link type="text/css" rel="stylesheet" href="css/main.css">
        <link type="text/css" rel="stylesheet" href="css/login.css">
        <script type="text/javascript" src="js/jquery-1.12.4.min.js"></script>
        <script type="text/javascript">
            $(document).ready(function() {
                $("form").on("submit", function(e) {
                    var newPassword = $("input[name='newPassword']").val();
                    var maxLength = 20;

                    if (newPassword.length > maxLength) {
                        e.preventDefault();
                        alert("Password must not exceed " + maxLength + " characters.");
                        return false;
                    }
                });
            });
        </script>
    </head>
    <body>
        <div class="container">
            <div class="row margin-top">
                <div class="col-md-4"></div>
                <div class="col-md-4">
                    <div class="panel panel-default">
                        <div class="panel-body">
                            <div class="text-center" style="background-color:white; padding:7px; border:darkblue 5px outset; margin:10px 0 40px 0;">
                                <img alt="Gigwa" height="40" src="images/logo_big.png" /><br/>RESET PASSWORD
                            </div>
                            <form action="<c:url value='<%= GigwaAuthenticationController.LOGIN_RESET_PASSWORD_URL %>' />" method="POST">
                                <input type="text" name="code" placeholder="Reset code" required />
                                <span class="glyphicon glyphicon-eye-open margin-icon" style="cursor:pointer; float:right; color:lightgray; margin-top:10px; font-size:20px;" onclick='if ($(this).next().prop("type")=="password") {$(this).next().prop("type", "text"); $(this).removeClass("glyphicon-eye-open"); $(this).addClass("glyphicon-eye-close");} else {$(this).next().prop("type", "password"); $(this).removeClass("glyphicon-eye-close"); $(this).addClass("glyphicon-eye-open");}'></span>
                                <input type="password" name="newPassword" placeholder="New password" required minlength="8" maxlength="20" style="width:calc(100% - 50px);" />
                                <c:choose>
	                                <c:when test="${not empty param.error}">
	                                    <p style="font-size:13px;" class="text-center text-danger">${param.error}</p>
	                                </c:when>
	                                <c:otherwise>
		                                <c:if test="${not empty param.message}">
		                                    <p style="font-size:13px;" class="text-center text-success">${param.message}</p>
		                                </c:if>
		                            </c:otherwise>
	                            </c:choose>
                                <button type="submit" class="btn btn-primary btn-block btn-large" style="margin:40px 0 20px 0;">Update password</button>
                            </form>
                            <a type="button" class="btn btn-primary btn-block btn-large margin-top-md" href="${pageContext.request.contextPath}/login.do">Return to login page</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
