@echo off

if "%1"=="" (
	echo You forgot to specify new gigwa path.
	GOTO eof
)

if "%2"=="" (
	echo You forgot to specify old gigwa path.
	GOTO eof
)

if "%3"=="" (
	echo You forgot to specify save path.
	GOTO eof
)

if not exist %1 (
	echo %1 not exist
	GOTO eof
)

if not exist %2 (
	echo %2 not exist
	GOTO eof
)

if not exist "%1\WEB-INF" (
    echo %1 does not contain a WEB-INF directory.
    GOTO eof
)
if not exist "%2\WEB-INF" (
    echo %2 does not contain a WEB-INF directory.
    GOTO eof
)

set "folder=%~2"
if "%folder:~-1%"=="\" set "folder=%folder:~0,-1%"

for %%a in ("%folder:\=" "%") do (
    set "backup_dir=%%~a"
)

set timeString=%time: =0%
set d=%date:~6,4%%date:~3,2%%date:~0,2%%timeString:~0,2%%timeString:~3,2%

::save old gigwa files
xcopy /seyi "%2" "%3\%backup_dir%.%d%"

::remove gigwa folder
del /S /Q %2

::copy new gigwa folder
xcopy /seyi %1 %2

::copy configuration files from saved folder to new gigwa folder
xcopy /seyi "%3\%backup_dir%.%d%\WEB-INF\classes\applicationContext-data.xml" "%2\WEB-INF\classes\applicationContext-data.xml"
xcopy /seyi "%3\%backup_dir%.%d%\WEB-INF\classes\applicationContext-MVC.xml" "%2\WEB-INF\classes\applicationContext-MVC.xml"
xcopy /seyi "%3\%backup_dir%.%d%\WEB-INF\classes\datasources.properties" "%2\WEB-INF\classes\datasources.properties"
xcopy /seyi "%3\%backup_dir%.%d%\WEB-INF\classes\users.properties" "%2\WEB-INF\classes\users.properties"
xcopy /seyi "%3\%backup_dir%.%d%\WEB-INF\classes\config.properties" "%2\WEB-INF\classes\config.properties"
xcopy /seyi "%3\%backup_dir%.%d%\WEB-INF\classes\log4j.xml" "%2\WEB-INF\classes\log4j.xml"

:: Changes specific to migration to v2.5
powershell -Command "(gc %2\WEB-INF\classes\users.properties) -replace 'project$CREATOR', 'SUPERVISOR' | Out-File -Encoding ascii %2\WEB-INF\classes\users.properties"		# replace the deprecated project-CREATOR role with the new DB-level SUPERVISOR role

powershell -Command "if ($(Select-String -Path %2\WEB-INF\classes\config.properties -Pattern 'dumpFolder') -eq $null) {Add-Content %2\WEB-INF\classes\config.properties \"`n`ndumpFolder=%USERPROFILE%\gigwaDumps\".replace('\', '\\'")}"	# add dumpFolder entry to config.properties it not present

powershell -Command "if ($(Select-String -Path %2\WEB-INF\classes\config.properties -Pattern 'igvGenomeConfig_') -eq $null) {Add-Content %2\WEB-INF\classes\config.properties \"`n`nigvGenomeConfig_1=South Green provided genomes;res/genomes.json`nigvGenomeConfig_2=GV default genomes;https://igv.org/genomes/genomes.json\".replace('\', '\\'")}"	# add default genome lists to config.properties it not present

:: applicationContext-security.xml has changed much in v2.5 so we don't want to keep that of the previous version. However, still make sure we keep the same passwordEncoder as in the previous version
powershell -Command "$previousPE = $(Select-String -Path %3\%backup_dir%.%d%\WEB-INF\classes\applicationContext-security.xml -Pattern 'id=\"passwordEncoder\"' | Select-String -Pattern '<!--' -NotMatch | ForEach-Object {$_.Line}); if ($(Select-String -Path %2\WEB-INF\classes\applicationContext-security.xml -Pattern 'id=\"passwordEncoder\"' | Select-String -Pattern '<!--' -NotMatch | ForEach-Object {$_.Line}) -ne $previousPE) {(gc %1\WEB-INF\classes\applicationContext-security.xml) -creplace '.*PasswordEncoder.*', '' -creplace '.*Only one passwordEncoder bean should be enabled at a time.*', '' -creplace '.*</beans>.*', '' | Out-File -Encoding ascii %2\WEB-INF\classes\applicationContext-security.xml; Add-Content -Path %2\WEB-INF\classes\applicationContext-security.xml -value $previousPE; Add-Content -Path %2\WEB-INF\classes\applicationContext-security.xml -value '</beans>'} else {Write-Host 'same'}"

echo -------------------------------
echo Update complete.

:eof
