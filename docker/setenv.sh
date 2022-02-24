# Set memory range allocated to Tomcat
export CATALINA_OPTS=" -Xms512m -Xmx2048m"

# In container start Tomcat using the host's locale
if [ ! -z "${HOST_LOCALE}" ]; then
	export LANG=${HOST_LOCALE};
fi

# Migration to v2.4+ from previous versions: adapt Spring context file syntax
if (( `grep -c UserCredentials /usr/local/tomcat/config/applicationContext-data.xml` != 0 )); then
	wget https://github.com/SouthGreenPlatform/Gigwa2/files/7052390/applicationContext-data.xml.txt && mv /usr/local/tomcat/config/applicationContext-data.xml /usr/local/tomcat/config/applicationContext-data_OLD.xml && mv applicationContext-data.xml.txt /usr/local/tomcat/config/applicationContext-data.xml && touch ../web.xml ;
fi

# Migration to v2.5+ from previous versions: replace the deprecated project-CREATOR role with the new DB-level SUPERVISOR role, specify a location to store DB dumps
sed -i 's/project$CREATOR/SUPERVISOR/g' /usr/local/tomcat/config/users.properties
if [ "$(grep -c dumpFolder /usr/local/tomcat/config/config.properties)" -eq 0 ]; then
	printf "\ndumpFolder=$HOME/gigwaDumps\n" >> /usr/local/tomcat/config/config.properties;
fi