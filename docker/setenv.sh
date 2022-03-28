# Set memory range allocated to Tomcat
export CATALINA_OPTS=" -Xms512m -Xmx2048m"


# Manage Log4jV vulnerability CVE-2021-44228
export JAVA_OPTS="$JAVA_OPTS -Dlog4j2.formatMsgNoLookups=true"


# In container start Tomcat using the host's locale
if [ ! -z "${HOST_LOCALE}" ]; then
	export LANG=${HOST_LOCALE};
fi



# Migration to v2.4+ from previous versions: adapt Spring context file syntax
# ---------------------------------------------------------------------------
if (( `grep -c UserCredentials /usr/local/tomcat/config/applicationContext-data.xml` != 0 )); then
	wget https://github.com/SouthGreenPlatform/Gigwa2/files/7052390/applicationContext-data.xml.txt && mv /usr/local/tomcat/config/applicationContext-data.xml /usr/local/tomcat/config/applicationContext-data_OLD.xml && mv applicationContext-data.xml.txt /usr/local/tomcat/config/applicationContext-data.xml && touch ../web.xml ;
fi



# Migration to v2.5+ from previous versions 
# -----------------------------------------

# replace the deprecated project-CREATOR role with the new DB-level SUPERVISOR role
sed -i 's/project$CREATOR/SUPERVISOR/g' /usr/local/tomcat/config/users.properties

# specify a location to store DB dumps
if [ "$(grep -c dumpFolder /usr/local/tomcat/config/config.properties)" -eq 0 ]; then
	printf "\ndumpFolder=$HOME/gigwaDumps\n" >> /usr/local/tomcat/config/config.properties;
fi

# add or override casServerURL parameter if present in docker-compose.yml, and if so, add provided or computed enforcedWebapRootUrl (unless already exists)
if [ ! -z "${casServerURL}" ]; then
        if [ $(grep -c "^casServerURL\s*=" /usr/local/tomcat/config/config.properties) -eq 0 ]; then
                printf "\ncasServerURL=${casServerURL}\n" >> /usr/local/tomcat/config/config.properties
        else
                sed -i "s|^casServerURL\s*.*|casServerURL=${casServerURL}|g" /usr/local/tomcat/config/config.properties
        fi

        if [ $(grep -c "^enforcedWebapRootUrl\s*=" /usr/local/tomcat/config/config.properties) -eq 0 ]; then
                if [ ! -z "${enforcedWebapRootUrl}" ]; then
                        printf "\nenforcedWebapRootUrl=${enforcedWebapRootUrl}\n" >> /usr/local/tomcat/config/config.properties
                else
                        printf "\n#System tried to guess the correct URL, it might be wrong...\nenforcedWebapRootUrl=http://${MONGO_IP}:8080/gigwa\n" >> /usr/local/tomcat/config/config.properties
                fi
        fi
fi

# add or override casOrganisation parameter if present in docker-compose.yml
if [ ! -z "${casOrganisation}" ]; then
        if [ $(grep -c "^casOrganisation\s*=" /usr/local/tomcat/config/config.properties) -eq 0 ]; then
                printf "\ncasOrganisation=${casOrganisation}\n" >> /usr/local/tomcat/config/config.properties
        else
                sed -i "s|^casOrganisation\s*.*|casOrganisation=${casOrganisation}|g" /usr/local/tomcat/config/config.properties
        fi
fi