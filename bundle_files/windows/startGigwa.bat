@echo off

echo.
netstat -n -a -o | FINDSTR ":59395" | FINDSTR LISTENING > NUL && ECHO Tomcat port (59395) already in use. Unable to start Gigwa! && PAUSE && EXIT
netstat -n -a -o | FINDSTR ":59393" | FINDSTR LISTENING > NUL && ECHO MongoDB port (59393) already in use. Unable to start Gigwa! && PAUSE && EXIT

%~d0
cd "%~dp0"

set errors=
powershell -executionPolicy bypass -command "& {$process = start-process $args[0] -RedirectStandardError errFile -passthru -argumentlist $args[1..($args.length-1)]; exit $process.id}" mongodb\bin\mongod.exe --profile 0 --port 59393 --slowms 60000 --storageEngine wiredTiger --wiredTigerCollectionBlockCompressor=zstd --directoryperdb --quiet --dbpath data --logpath logs/mongod.log
set mongoPID=%errorlevel%

timeout 3 > NUL
set /p errors= < errFile
del errFile
if "%errors%" neq "" (
	echo Unable to start MongoDB: %errors%
	exit /b %errorlevel%
)

tasklist /FI "PID eq %mongoPID%" | FINDSTR %mongoPID% > NUL
if %errorlevel% neq 0 (
	echo Unable to start MongoDB, contents of logs/mongod.log below:
	powershell -command "Get-Content -tail 20 logs/mongod.log"
	exit /b %errorlevel%
)

set JAVA_HOME=jre
set CATALINA_HOME=tomcat
cmd /c %CATALINA_HOME%\bin\startup.bat

echo.
echo GIGWA is starting up...
echo.
timeout 5 > NUL

start http://localhost:59395/gigwa