#!/bin/bash

# Variables
project_version="2.8-RELEASE"
tomcat_version="9.0.64"
mongodb_osx_file="macos-x86_64-4.2.25"
path_to_osx_jre="zulu17.40.19-ca-jre17.0.6-macosx_x64.tar.gz"

bundle_dir_osx="Gigwa_V${project_version}-OSX"

zip_requested=0

# Delete --zip if it exists not to fail during mvn install
if [[ $1 == "--zip" ]]; then
    zip_requested=1
    shift
fi

# Download JRE
echo "Downloading JRE..."
curl -o ${path_to_osx_jre} "https://cdn.azul.com/zulu/bin/${path_to_osx_jre}"

# Download and unzip Tomcat
echo "Downloading Tomcat..."
curl -o apache-tomcat-${tomcat_version}.zip "https://archive.apache.org/dist/tomcat/tomcat-9/v${tomcat_version}/bin/apache-tomcat-${tomcat_version}.zip"
unzip -q apache-tomcat-${tomcat_version}.zip -d ${bundle_dir_osx}
rm apache-tomcat-${tomcat_version}.zip

# Download and unzip MongoDB
echo "Downloading MongoDB..."
curl -o mongodb-osx.tgz "https://fastdl.mongodb.org/osx/mongodb-${mongodb_osx_file}.tgz"
tar -xzf mongodb-osx.tgz -C ${bundle_dir_osx}
rm mongodb-osx.tgz

# Rename Tomcat and MongoDB directories
mv ${bundle_dir_osx}/apache-tomcat-${tomcat_version} ${bundle_dir_osx}/tomcat
mv ${bundle_dir_osx}/mongodb-${mongodb_osx_file} ${bundle_dir_osx}/mongodb

# Copy sample vcf
mkdir ${bundle_dir_osx}/vcf
echo "Downloading VCF Sample..."
curl -o  sample.vcf "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/test/sample.vcf"
mv sample.vcf ${bundle_dir_osx}/vcf/sample.vcf

# Create setenv scripts for Tomcat
echo -e "export CATALINA_OPTS=\"\$CATALINA_OPTS -Xms512m -Xmx2048m\"\nexport JAVA_OPTS=\"\$JAVA_OPTS -Dlog4j2.formatMsgNoLookups=true\"" > ${bundle_dir_osx}/tomcat/bin/setenv.sh

# Copy additional files to bundles
cd ${bundle_dir_osx}
echo "Downloading LICENSE.txt..."
curl -o  LICENSE.txt "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/bundle_files/LICENSE.txt"
echo "Downloading README.txt..."
curl -o  README.txt "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/bundle_files/README.txt"
echo "Downloading startGigwa.command..."
curl -o  startGigwa.command "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/bundle_files/osx/startGigwa.command"
echo "Downloading stopGigwa.command..."
curl -o  stopGigwa.command "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/bundle_files/osx/stopGigwa.command"
echo "Downloading updateGigwa.command..."
curl -o  updateGigwa.command "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/bundle_files/osx/updateGigwa.command"
cd ..

# Create data and logs directories
mkdir ${bundle_dir_osx}/data ${bundle_dir_osx}/logs

# Add JRE to bundles
mkdir ${bundle_dir_osx}/jre
tar -xzf ${path_to_osx_jre} -C ${bundle_dir_osx}/jre --strip-components=1

# Delete Tomcat's examples webapp
rm -rf ${bundle_dir_osx}/tomcat/webapps/examples

# Delete JRE
rm -rf ${path_to_osx_jre}

# Copy Gigwa webapp into Tomcat
echo "Downloading Gigwa Webapp..."
curl -o gigwa.zip -L "https://github.com/SouthGreenPlatform/Gigwa2/releases/download/${project_version}/Gigwa_V${project_version}_Webapp.zip"
unzip -q gigwa.zip
mv gigwa ${bundle_dir_osx}/tomcat/webapps
rm -rf gigwa.zip updateGigwa.*

# Set Tomcat ports in server.xml
cp "${bundle_dir_osx}/tomcat/conf/server.xml" /tmp/server.xml.tmp

sed -i '' 's@8080@59395@g' /tmp/server.xml.tmp
sed -i '' 's@8005@59396@g' /tmp/server.xml.tmp
sed -i '' 's@8009@59397@g' /tmp/server.xml.tmp

mv /tmp/server.xml.tmp "${bundle_dir_osx}/tomcat/conf/server.xml"

# Make scripts executable
chmod -R 755 ${bundle_dir_osx}

# Zip bundle archives
if [[ ${zip_requested} == 1 ]]; then
  cd ${bundle_dir_osx}/..
  zip -u -r Gigwa_V${project_version}-OSX.zip Gigwa_V${project_version}-OSX
  rm -rf ${bundle_dir_osx}
fi