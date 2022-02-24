@echo off

if "%1"=="" (
	echo You forgot to specify new gigwa path.
	GOTO eof )
if "%2"=="" (
	echo You forgot to specify old gigwa path.
	GOTO eof )
if "%3"=="" (
	echo You forgot to specify save path.
	GOTO eof )
if not exist %1 (
	echo %1 not exist
	GOTO eof )
if not exist %2 (
	echo %2 not exist
	GOTO eof )

set d=%date:~6,4%%date:~3,2%%date:~0,2%%time:~0,2%%time:~3,2%

::save old gigwa files
xcopy /seyi %2 "%3\gigwa.%d%"

::remove gigwa folder
del /S /Q %2

::copy new gigwa folder
xcopy /seyi %1 %2

::copy configuration files from saved folder to new gigwa folder
xcopy /seyi "%3\gigwa.%d%\WEB-INF\classes\applicationContext-data.xml" "%2\WEB-INF\classes\applicationContext-data.xml"
xcopy /seyi "%3\gigwa.%d%\WEB-INF\classes\applicationContext-security.xml" "%2\WEB-INF\classes\applicationContext-security.xml"
xcopy /seyi "%3\gigwa.%d%\WEB-INF\classes\datasources.properties" "%2\WEB-INF\classes\datasources.properties"
xcopy /seyi "%3\gigwa.%d%\WEB-INF\classes\users.properties" "%2\WEB-INF\classes\users.properties"
xcopy /seyi "%3\gigwa.%d%\WEB-INF\classes\config.properties" "%2\WEB-INF\classes\config.properties"
xcopy /seyi "%3\gigwa.%d%\WEB-INF\classes\log4j.xml" "%2\WEB-INF\classes\log4j.xml"

# Changes specific to migration to v2.5
powershell -Command "(gc %2\WEB-INF\classes\users.properties) -replace 'project$CREATOR', 'SUPERVISOR' | Out-File %2\WEB-INF\classes\users.properties"		# replace the deprecated project-CREATOR role with the new DB-level SUPERVISOR role
powershell -Command "if ($(Select-String -Path %2\WEB-INF\classes\config.properties -Pattern 'dumpFolder') -eq $null) {Add-Content %2\WEB-INF\classes\config.properties \"`ndumpFolder=%USERPROFILE%\gigwaDumps`n\".replace('\', '\\'")}"# add dumpFolder entry to config.properties it not present

chmod -R 755 $2

echo
echo Update complete.

:eof