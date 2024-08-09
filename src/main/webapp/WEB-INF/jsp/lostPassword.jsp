<!DOCTYPE html>

<%@ page language="java" contentType="text/html; charset=utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<html>
    <head>
        <meta charset="utf-8">
        <title>Gigwa - Lost password</title>
        <link rel="shortcut icon" href="images/favicon.png" type="image/x-icon" />
        <link type="text/css" rel="stylesheet" href="css/bootstrap.min.css">
        <link type="text/css" rel="stylesheet" href="css/main.css">
        <link type="text/css" rel="stylesheet" href="css/login.css">
        <script type="text/javascript" src="js/jquery-1.12.4.min.js"></script>
    </head>
    <body>
        <div class="container">
            <div class="row margin-top">
                <div class="col-md-4"></div>
                <div class="col-md-4">
                    <div class="panel panel-default">
                        <div class="panel-body text-center">
                            <div style="background-color:white; padding:7px; border:darkblue 5px outset; margin:10px 0 40px 0;"><img alt="Gigwa" height="40" src="images/logo_big.png" /><br/>RESET PASSWORD</div>
                            <form action="lostPassword.do" method="POST">
                                <input type="email" name="email" placeholder="Email address" required />
                                <c:if test="${not empty error}">
                                    <p class="text-danger">${error}</p>
                                </c:if>
                                <button type="submit" class="btn btn-primary btn-block btn-large" style="margin:40px 0 20px 0;">Send reset code</button>
                            </form>
                            <a type="button" class="btn btn-primary btn-block btn-large margin-top-md" href="${pageContext.request.contextPath}/login.do">Return to login</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
