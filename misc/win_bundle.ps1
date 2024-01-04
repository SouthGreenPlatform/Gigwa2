# Variables
$project_version = "2.7-beta"
$tomcat_version = "9.0.64"
$mongodb_windows_file = "win32-x86_64-2012plus-4.2.24"
$path_to_windows_jre = "zulu17.40.19-ca-jre17.0.6-win_x64.zip"

$bundle_dir_win = "Gigwa_V${project_version}-Windows"

$zip_requested = 0

# Delete --zip if it exists not to fail during mvn install
if ($args -contains "--zip") {
    $zip_requested = 1
    $args = $args | Where-Object { $_ -ne "--zip" }
}

# Create repository
New-Item -ItemType Directory -Path $bundle_dir_win -Force

# Download JRE
echo "Downloading JRE..."
Invoke-WebRequest -Uri "https://cdn.azul.com/zulu/bin/${path_to_windows_jre}" -OutFile "${path_to_windows_jre}"

# Download and unzip Tomcat
echo "Downloading Tomcat..."
Invoke-WebRequest -Uri "https://archive.apache.org/dist/tomcat/tomcat-9/v${tomcat_version}/bin/apache-tomcat-${tomcat_version}.zip" -OutFile "apache-tomcat-${tomcat_version}.zip"
Expand-Archive -Path "apache-tomcat-${tomcat_version}.zip" -DestinationPath $bundle_dir_win
Remove-Item "apache-tomcat-${tomcat_version}.zip"

# Download and unzip MongoDB
echo "Downloading MongoDB..."
Invoke-WebRequest -Uri "https://fastdl.mongodb.org/win32/mongodb-${mongodb_windows_file}.zip" -OutFile "mongodb-windows.zip"
Expand-Archive -Path "mongodb-windows.zip" -DestinationPath $bundle_dir_win
Remove-Item "mongodb-windows.zip"

# Rename Tomcat and MongoDB directories
Move-Item -Path "${bundle_dir_win}\apache-tomcat-${tomcat_version}" -Destination "${bundle_dir_win}\tomcat" -Force
Move-Item -Path "${bundle_dir_win}\mongodb-${mongodb_windows_file}" -Destination "${bundle_dir_win}\mongodb" -Force

# Copy sample vcf
echo "Downloading VCF Sample..."
New-Item -ItemType Directory -Path "${bundle_dir_win}\vcf" -Force
$rawUrl = "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/$project_version/test/sample.vcf"
Invoke-WebRequest -Uri $rawUrl -OutFile "${bundle_dir_win}\vcf\sample.vcf"

# Create setenv scripts for Tomcat
Set-Content -Path "${bundle_dir_win}\tomcat\bin\setenv.bat" -Value 'set "JAVA_OPTS=%JAVA_OPTS% -Xms512m -Xmx2048m"'
Add-Content -Path "${bundle_dir_win}\tomcat\bin\setenv.bat" -Value 'set "JAVA_OPTS=%JAVA_OPTS% -Dlog4j2.formatMsgNoLookups=true"'

# Copy additional files to bundles
Set-Location -Path $bundle_dir_win

echo "Downloading LICENCE.txt..."
$rawUrl = "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/$project_version/bundle_files/windows/LICENSE.txt"
Invoke-WebRequest -Uri $rawUrl -OutFile "LICENSE.txt"

echo "Downloading README.txt..."
$rawUrl = "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/$project_version/bundle_files/windows/README.txt"
Invoke-WebRequest -Uri $rawUrl -OutFile "README.txt"

echo "Downloading startGigwa.bat..."
$rawUrl = "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/$project_version/bundle_files/windows/startGigwa.bat"
Invoke-WebRequest -Uri $rawUrl -OutFile "startGigwa.bat"

echo "Downloading stopGigwa.bat..."
$rawUrl = "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/$project_version/bundle_files/windows/stopGigwa.bat"
Invoke-WebRequest -Uri $rawUrl -OutFile "stopGigwa.bat"

echo "Downloading updateGigwa.bat..."
$rawUrl = "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/$project_version/bundle_files/windows/updateGigwa.bat"
Invoke-WebRequest -Uri $rawUrl -OutFile "updateGigwa.bat"

Set-Location -Path ..

# Create data and logs directories
New-Item -ItemType Directory -Path "${bundle_dir_win}\data" -Force
New-Item -ItemType Directory -Path "${bundle_dir_win}\logs" -Force

# Add JRE to bundles
New-Item -ItemType Directory -Path "${bundle_dir_win}\jre" -Force
Expand-Archive -Path $path_to_windows_jre -DestinationPath "${bundle_dir_win}\jre"
Move-Item -Path "${bundle_dir_win}\jre\zulu17.40.19-ca-jre17.0.6-win_x64\*" -Destination "${bundle_dir_win}\jre"
Remove-Item -Path "${bundle_dir_win}\jre\zulu17.40.19-ca-jre17.0.6-win_x64"

# Delete Tomcat's examples webapp
Remove-Item -Path "${bundle_dir_win}\tomcat\webapps\examples" -Recurse -Force

# Delete JRE
Remove-Item -Path "${path_to_windows_jre}" -Force

# Copy Gigwa webapp into Tomcat
echo "Downloading Gigwa Webapp..."
Invoke-WebRequest -Uri "https://github.com/SouthGreenPlatform/Gigwa2/releases/download/${project_version}/Gigwa_V${project_version}_Webapp.zip" -OutFile "gigwa.zip"
Expand-Archive -Path "gigwa.zip" -DestinationPath "${bundle_dir_win}\tomcat\webapps"
Remove-Item "gigwa.zip" -Force
Remove-Item "${bundle_dir_win}\tomcat\webapps\updateGigwa.*" -Force

# Set Tomcat ports in server.xml
(Get-Content -Path "${bundle_dir_win}\tomcat\conf\server.xml") | ForEach-Object {
    $_ -replace '8080', '59395' `
       -replace '8005', '59396' `
       -replace '8009', '59397'
} | Set-Content -Path "${bundle_dir_win}\tomcat\conf\server.xml"

# Make scripts executable
Get-ChildItem -Path $bundle_dir_win -Recurse | ForEach-Object {
    $_.Attributes = [System.IO.FileAttributes]::Normal
}

# Zip bundle archives
if ($zip_requested -eq 1) {
    Compress-Archive -Path $bundle_dir_win -DestinationPath ".\Gigwa_V${project_version}-Windows.zip" -Force
    Remove-Item -Path $bundle_dir_win -Recurse -Force
}