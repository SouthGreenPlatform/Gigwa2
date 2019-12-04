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
xcopy /seyi "%3\gigwa.%d%\WEB-INF\classes\datasources.properties" "%2\WEB-INF\classes\datasources.properties"
xcopy /seyi "%3\gigwa.%d%\WEB-INF\classes\users.properties" "%2\WEB-INF\classes\users.properties"

:eof