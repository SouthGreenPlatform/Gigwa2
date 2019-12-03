@echo off

%~d0
cd "%~dp0"

echo.
echo GIGWA is shutting down...
echo.

mongodb\bin\mongo.exe admin --port 59393 --eval "printjson(db.shutdownServer())"

set JAVA_HOME=jre
set CATALINA_HOME=tomcat
%CATALINA_HOME%\bin\shutdown.bat