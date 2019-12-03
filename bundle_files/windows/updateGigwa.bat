@echo off

if not exist %1 (exit)
if not exist %2 (exit)
if not exist %3 (exit)

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
