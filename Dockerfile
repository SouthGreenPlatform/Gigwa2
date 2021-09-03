FROM tomcat:8.5-alpine

COPY target/gigwa webapps/gigwa

#env vars to avoid ip/port inside image
RUN echo -e "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<beans xmlns=\"http://www.springframework.org/schema/beans\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:mongo=\"http://www.springframework.org/schema/data/mongo\" xsi:schemaLocation=\"http://www.springframework.org/schema/data/mongo http://www.springframework.org/schema/data/mongo/spring-mongo-3.0.xsd http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd\">\n<mongo:mongo-client host=\"#{systemEnvironment['MONGO_IP']}\" port=\"#{systemEnvironment['MONGO_PORT']}\" id=\"defaultMongoHost\" credential=\"#{systemEnvironment['MONGO_INITDB_ROOT_USERNAME']}:#{systemEnvironment['MONGO_INITDB_ROOT_PASSWORD']}@admin\" />\n</beans>" > webapps/gigwa/WEB-INF/classes/applicationContext-data.xml \
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
#create setenv.sh (ends with a line updating applicationContext-data.xml for transition to v2.4 from previous versions)
&& echo -e "export CATALINA_OPTS=\"$CATALINA_OPTS -Xms512m -Xmx2048m\"\nif [ ! -z \"\${HOST_LOCALE}\" ]; then export LANG=\${HOST_LOCALE}; fi\nif (( \`grep -c UserCredentials /usr/local/tomcat/config/applicationContext-data.xml\` != 0 )); then wget https://github.com/SouthGreenPlatform/Gigwa2/files/7052390/applicationContext-data.xml.txt && mv /usr/local/tomcat/config/applicationContext-data.xml /usr/local/tomcat/config/applicationContext-data_OLD.xml && mv applicationContext-data.xml.txt /usr/local/tomcat/config/applicationContext-data.xml && touch ../web.xml ; fi" >> /usr/local/tomcat/bin/setenv.sh \