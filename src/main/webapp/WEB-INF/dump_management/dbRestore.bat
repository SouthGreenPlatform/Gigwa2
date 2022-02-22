@echo off

SETLOCAL

:: Argument parsing
set INPUT=.
set HOST=127.0.0.1:27017
set AUTHDB=admin

:GETOPTS
for %%P in ("-h" "--host") do if "%1"==%%P set HOST=%2& shift
for %%P in ("-f" "--file" "-i" "--input") do if "%1"==%%P set FILENAME=%2& shift
for %%P in ("-nf" "--nsFrom") do if "%1"==%%P set NAMESPACE_FROM=%2& shift
for %%P in ("-nt" "--nsTo") do if "%1"==%%P set NAMESPACE_TO=%2& shift
for %%P in ("-u" "--username") do if "%1"==%%P set DBUSERNAME=%2& shift
for %%P in ("-p" "--password") do if "%1"==%%P set DBPASSWORD=%2& shift
for %%P in ("-pp" "--passwordPrompt") do if "%1"==%%P set PASSWORD_PROMPT=YES
for %%P in ("--drop") do if "%1"==%%P set DROP_OPTION=--drop
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

if not exist "%FILENAME%" (
	if "%LOGFILE%"=="" (
		echo Archive file %FILENAME% not found
	) else (
		powershell -Command "Write-Output 'Archive file %FILENAME% not found' | Tee-Object %LOGFILE%"
	)
	EXIT /B 87)

if not "%DBUSERNAME%"=="" (
	if not "%PASSWORD_PROMPT%"=="" (
		set CREDENTIAL_OPTIONS=--username=%DBUSERNAME% --authenticationDatabase=%AUTHDB%
	) else (
		set CREDENTIAL_OPTIONS=--username=%DBUSERNAME% --password=%DBPASSWORD% --authenticationDatabase=%AUTHDB%
	)
)

set COMMAND=mongorestore -v %CREDENTIAL_OPTIONS% --host=%HOST% --archive=%FILENAME% --nsTo=%NAMESPACE_TO% --nsFrom=%NAMESPACE_FROM% --gzip %DROP_OPTION%

if "%LOGFILE%"=="" (
	%COMMAND%
) else (
	powershell -Command "%COMMAND% 2>&1 | Tee-Object %LOGFILE%; return $LASTEXITCODE"
	EXIT /B %ERRORLEVEL%
)