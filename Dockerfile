FROM tomcat:8.5-alpine

COPY target/gigwa webapps/gigwa

#Env Var to avoid ip/port inside image
RUN sed -i "s|127.0.0.1|\#\{systemEnvironment\[\'MONGO_IP\'\]\}|g" webapps/gigwa/WEB-INF/classes/applicationContext-data.xml \
&& sed -i "s|59393|\#\{systemEnvironment\[\'MONGO_PORT\'\]\}|g" webapps/gigwa/WEB-INF/classes/applicationContext-data.xml \
#allowLinking="true" to be able to use symbolic link
&& sed -i "s|<WatchedResource>WEB-INF\/classes\/config.properties<\/WatchedResource>|<WatchedResource>WEB-INF\/classes\/config.properties<\/WatchedResource><Resources allowLinking\=\"true\" \/>|g" webapps/gigwa/META-INF/context.xml \
#Volume for config files
&& mkdir config \
&& chmod 755 config \
&& mv webapps/gigwa/WEB-INF/classes/applicationContext-data.xml config \
&& ln -s /usr/local/tomcat/config/applicationContext-data.xml webapps/gigwa/WEB-INF/classes/applicationContext-data.xml \
&& mv webapps/gigwa/WEB-INF/classes/datasources.properties config \
&& ln -s /usr/local/tomcat/config/datasources.properties webapps/gigwa/WEB-INF/classes/datasources.properties \
&& mv webapps/gigwa/WEB-INF/classes/users.properties config \
&& ln -s /usr/local/tomcat/config/users.properties webapps/gigwa/WEB-INF/classes/users.properties \