@echo off

echo.
netstat -n -a -o | FINDSTR ":59395" | FINDSTR LISTENING > NUL && ECHO Tomcat port (59395) already in use. Unable to start Gigwa! && PAUSE && EXIT
netstat -n -a -o | FINDSTR ":59393" | FINDSTR LISTENING > NUL && ECHO MongoDB port (59393) already in use. Unable to start Gigwa! && PAUSE && EXIT

%~d0
cd "%~dp0"

start mongodb-win32-x86_64-2008plus-ssl-4.0.10\bin\mongod.exe --port 59393 --slowms 60000 --storageEngine wiredTiger --wiredTigerCollectionBlockCompressor=zlib --dbpath data --logpath logs/mongo.log

set JAVA_HOME=jre1.8.0_192
set CATALINA_HOME=apache-tomcat-8.5.35
cmd /c %CATALINA_HOME%\bin\startup.bat

echo.
echo GIGWA is starting up...
echo.
timeout 5 > NUL

start http://localhost:59395/gigwa