@echo off

%~d0
cd "%~dp0"

echo.
echo GIGWA is shutting down...
echo.

mongodb-win32-x86_64-2008plus-ssl-4.0.10\bin\mongo.exe admin --port 59393 --eval "printjson(db.shutdownServer())"

set JAVA_HOME=jre1.8.0_192
set CATALINA_HOME=apache-tomcat-8.5.35
%CATALINA_HOME%\bin\shutdown.bat