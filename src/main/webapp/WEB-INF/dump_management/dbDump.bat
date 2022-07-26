@echo off

SETLOCAL

:: Argument parsing
set OUTPUT=.
set AUTHDB=admin


:GETOPTS
for %%P in ("-h" "--host") do if "%1"==%%P set HOST=%2& shift
for %%P in ("-o" "--output") do if "%1"==%%P set OUTPUT=%2& shift
for %%P in ("-n" "--name") do if "%1"==%%P set DUMPNAME=%2& shift
for %%P in ("-u" "--username") do if "%1"==%%P set DBUSERNAME=%2& shift
for %%P in ("-p" "--password") do if "%1"==%%P set DBPASSWORD=%2& shift
for %%P in ("-pp" "--passwordPrompt") do if "%1"==%%P set PASSWORD_PROMPT=YES
for %%P in ("-d" "--db" "--database") do if "%1"==%%P set DATABASE=%2& shift
for %%P in ("-a" "--authenticationDatabase") do if "%1"==%%P set AUTHDB=%2& shift
for %%P in ("-l" "--log") do if "%1"==%%P set LOGFILE=%2& shift
shift
if not "%1" == "" goto GETOPTS

if "%HOST%"=="" (
	if "%LOGFILE%"=="" (
		echo You must specify the database host
	) else (
		powershell -Command "Write-Output 'You must specify the database host' | Tee-Object %LOGFILE%"
	)
	EXIT /B 87)

if "%DATABASE%"=="" (
	if "%LOGFILE%"=="" (
		echo You must specify a database to export
	) else (
		powershell -Command "Write-Output 'You must specify a database to export' | Tee-Object %LOGFILE%"
	)
	EXIT /B 87)
	
if "%DUMPNAME%"==""	set DUMPNAME=%DATABASE%_%DATE:~-4%%DATE:~-7,2%%DATE:~-10,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
	
if not exist %OUTPUT% md %OUTPUT%
	
if not "%DBUSERNAME%"=="" (
	if not "%PASSWORD_PROMPT%"=="" (
		set CREDENTIAL_OPTIONS=--username=%DBUSERNAME% --authenticationDatabase=%AUTHDB%
	) else (
		set CREDENTIAL_OPTIONS=--username=%DBUSERNAME% --password=%DBPASSWORD% --authenticationDatabase=%AUTHDB%
	)
)

set FILENAME=%OUTPUT%\%DUMPNAME%.gz
set COMMAND=mongodump -vv %CREDENTIAL_OPTIONS% --db=%DATABASE% --excludeCollectionsWithPrefix=tmpVar_ --excludeCollectionsWithPrefix=brapi --excludeCollection=cachedCounts --host=%HOST% --archive=%FILENAME% --gzip

if "%LOGFILE%"=="" (
	%COMMAND%
) else (
	powershell -Command "%COMMAND% 2>&1 | Tee-Object %LOGFILE%; return $LASTEXITCODE"
	EXIT /B %ERRORLEVEL%
)