FROM tomcat:8.5.75-jre8-openjdk-slim-bullseye

COPY target/gigwa webapps/gigwa

#env vars to avoid ip/port inside image
RUN echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<beans xmlns=\"http://www.springframework.org/schema/beans\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:mongo=\"http://www.springframework.org/schema/data/mongo\" xsi:schemaLocation=\"http://www.springframework.org/schema/data/mongo http://www.springframework.org/schema/data/mongo/spring-mongo-3.0.xsd http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd\">\n<mongo:mongo-client host=\"#{systemEnvironment['MONGO_IP']}\" port=\"#{systemEnvironment['MONGO_PORT']}\" id=\"defaultMongoHost\" credential=\"#{systemEnvironment['MONGO_INITDB_ROOT_USERNAME']}:#{systemEnvironment['MONGO_INITDB_ROOT_PASSWORD']}@admin\" />\n</beans>" > webapps/gigwa/WEB-INF/classes/applicationContext-data.xml \
&& apt-get update && apt-get install -y wget \
&& wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu1804-x86_64-100.5.2.deb && dpkg -i mongodb-database-tools-ubuntu1804-x86_64-100.5.2.deb && rm -f mongodb-database-tools-ubuntu1804-x86_64-100.5.2.deb \
&& sed -i 's|<appender-ref ref="FILE" />|<appender-ref ref="console" /> <appender-ref ref="FILE" />|g' webapps/gigwa/WEB-INF/classes/log4j.xml \
#allowLinking="true" to be able to use symbolic link
&& sed -i "s|<WatchedResource>WEB-INF\/classes\/config.properties<\/WatchedResource>|<WatchedResource>WEB-INF\/classes\/config.properties<\/WatchedResource><Resources allowLinking\=\"true\" \/>|g" webapps/gigwa/META-INF/context.xml \
#volume for config files
&& mkdir config \
&& chmod 755 config \
&& mv webapps/gigwa/WEB-INF/classes/applicationContext-data.xml config \
&& ln -s /usr/local/tomcat/config/applicationContext-data.xml webapps/gigwa/WEB-INF/classes/applicationContext-data.xml \
&& mv webapps/gigwa/WEB-INF/classes/datasources.properties config \
&& ln -s /usr/local/tomcat/config/datasources.properties webapps/gigwa/WEB-INF/classes/datasources.properties \
&& mv webapps/gigwa/WEB-INF/classes/users.properties config \
&& ln -s /usr/local/tomcat/config/users.properties webapps/gigwa/WEB-INF/classes/users.properties \
#create setenv.sh (ends with a line updating applicationContext-data.xml for transition to v2.4+ from previous versions, and another for migration to v2.5+ where we replace the deprecated project-CREATOR role with the new DB-level SUPERVISOR role)
&& echo "export CATALINA_OPTS=\"$CATALINA_OPTS -Xms512m -Xmx2048m\"\nif [ ! -z \"\${HOST_LOCALE}\" ]; then export LANG=\${HOST_LOCALE}; fi\nif (( \`grep -c UserCredentials /usr/local/tomcat/config/applicationContext-data.xml\` != 0 )); then wget https://github.com/SouthGreenPlatform/Gigwa2/files/7052390/applicationContext-data.xml.txt && mv /usr/local/tomcat/config/applicationContext-data.xml /usr/local/tomcat/config/applicationContext-data_OLD.xml && mv applicationContext-data.xml.txt /usr/local/tomcat/config/applicationContext-data.xml && touch ../web.xml ; fi\nsed -i 's/project\$CREATOR/SUPERVISOR/g' /usr/local/tomcat/config/users.properties\nif [ \"\$(grep -c dumpFolder webapps/gigwa/WEB-INF/classes//config.properties)\" -eq 0 ]; then printf \"\\\ndumpFolder=$HOME/gigwaDumps\\\n\" >> webapps/gigwa/WEB-INF/classes/config.properties; fi" >> /usr/local/tomcat/bin/setenv.sh \
&& apt-get remove -y wget \
#volume for dumps
&& mkdir /usr/local/gigwaDumps