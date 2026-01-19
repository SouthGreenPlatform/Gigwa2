#!/bin/bash

# Variables
project_version="2.11-RELASE"
tomcat_version="9.0.113"
mongodb_linux_file="linux-x86_64-ubuntu1804-4.2.25"
path_to_ubuntu_jre="zulu17.40.19-ca-jre17.0.6-linux_x64.tar.gz"

bundle_dir_ubuntu="Gigwa_V${project_version}-Ubuntu"

zip_requested=0

# Delete --zip if it exists not to fail during mvn install
if [[ $1 == "--zip" ]]; then
    zip_requested=1
    shift
fi

# Download JRE
echo "Downloading JRE..."
curl -o ${path_to_ubuntu_jre} "https://cdn.azul.com/zulu/bin/${path_to_ubuntu_jre}"

# Download and unzip Tomcat
echo "Downloading Tomcat..."
curl -o apache-tomcat-${tomcat_version}.zip "https://archive.apache.org/dist/tomcat/tomcat-9/v${tomcat_version}/bin/apache-tomcat-${tomcat_version}.zip"
unzip -q apache-tomcat-${tomcat_version}.zip -d ${bundle_dir_ubuntu}
rm apache-tomcat-${tomcat_version}.zip

# Download and unzip MongoDB
echo "Downloading MongoDB..."
curl -o mongodb-linux.tgz "https://fastdl.mongodb.org/linux/mongodb-${mongodb_linux_file}.tgz"
tar -xzf mongodb-linux.tgz -C ${bundle_dir_ubuntu}
rm mongodb-linux.tgz

# Rename Tomcat and MongoDB directories
mv ${bundle_dir_ubuntu}/apache-tomcat-${tomcat_version} ${bundle_dir_ubuntu}/tomcat
mv ${bundle_dir_ubuntu}/mongodb-${mongodb_linux_file} ${bundle_dir_ubuntu}/mongodb

# Copy sample vcf
mkdir ${bundle_dir_ubuntu}/vcf
echo "Downloading VCF Sample..."
curl -o  sample.vcf "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/test/sample.vcf"
mv sample.vcf ${bundle_dir_ubuntu}/vcf/sample.vcf

# Create setenv scripts for Tomcat
echo -e "LC_ALL=\nexport CATALINA_OPTS=\"\$CATALINA_OPTS -Xms512m -Xmx2048m\"\nexport JAVA_OPTS=\"\$JAVA_OPTS -Dlog4j2.formatMsgNoLookups=true\"" > ${bundle_dir_ubuntu}/tomcat/bin/setenv.sh

# Copy additional files to bundles
cd ${bundle_dir_ubuntu}
echo "Downloading LICENSE.txt..."
curl -o  LICENSE.txt "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/bundle_files/LICENSE.txt"
echo "Downloading README.txt..."
curl -o  README.txt "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/bundle_files/README.txt"
echo "Downloading startGigwa.sh..."
curl -o  startGigwa.sh "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/bundle_files/ubuntu/startGigwa.sh"
echo "Downloading stopGigwa.sh..."
curl -o  stopGigwa.sh "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/bundle_files/ubuntu/stopGigwa.sh"
echo "Downloading updateGigwa.sh..."
curl -o  updateGigwa.sh "https://raw.githubusercontent.com/SouthGreenPlatform/Gigwa2/${project_version}/bundle_files/ubuntu/updateGigwa.sh"
cd ..

# Create data and logs directories
mkdir ${bundle_dir_ubuntu}/data ${bundle_dir_ubuntu}/logs

# Add JRE to bundles
mkdir ${bundle_dir_ubuntu}/jre
tar -xzf ${path_to_ubuntu_jre} -C ${bundle_dir_ubuntu}/jre --strip-components=1

# Delete Tomcat's examples webapp
rm -rf ${bundle_dir_ubuntu}/tomcat/webapps/examples

# Delete JRE
rm -rf ${path_to_ubuntu_jre}

# Copy Gigwa webapp into Tomcat
echo "Downloading Gigwa Webapp..."
curl -o gigwa.zip -L "https://github.com/SouthGreenPlatform/Gigwa2/releases/download/${project_version}/Gigwa_V${project_version}_Webapp.zip"
unzip -q gigwa.zip
mv gigwa ${bundle_dir_ubuntu}/tomcat/webapps
rm -rf gigwa.zip updateGigwa.*

# Set Tomcat ports in server.xml
sed -i 's/8080/59395/g' ${bundle_dir_ubuntu}/tomcat/conf/server.xml
sed -i 's/8005/59396/g' ${bundle_dir_ubuntu}/tomcat/conf/server.xml
sed -i 's/8009/59397/g' ${bundle_dir_ubuntu}/tomcat/conf/server.xml

# Make scripts executable
chmod -R 755 ${bundle_dir_ubuntu}

# Zip bundle archives
if [[ $zip_requested -eq 1 ]]; then
  cd ${bundle_dir_ubuntu}/..
  zip -u -r Gigwa_V${project_version}-Ubuntu.zip Gigwa_V${project_version}-Ubuntu
  rm -rf ${bundle_dir_ubuntu}
fi