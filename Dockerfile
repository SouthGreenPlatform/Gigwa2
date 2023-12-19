FROM tomcat:9.0.58-jdk17-openjdk-slim

ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

COPY target/gigwa webapps/gigwa
COPY docker/setenv.sh /usr/local/tomcat/bin/setenv.sh

RUN sed -i 's|Connector port="8080"|Connector port="8080" maxHttpHeaderSize="65536" maxParameterCount="-1" maxPostSize="-1"|g' conf/server.xml \
#env vars to avoid ip/port inside image
&& echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<beans xmlns=\"http://www.springframework.org/schema/beans\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:mongo=\"http://www.springframework.org/schema/data/mongo\" xsi:schemaLocation=\"http://www.springframework.org/schema/data/mongo http://www.springframework.org/schema/data/mongo/spring-mongo-3.0.xsd http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd\">\n<mongo:mongo-client host=\"#{systemEnvironment['MONGO_IP']}\" port=\"#{systemEnvironment['MONGO_PORT']}\" id=\"defaultMongoHost\" credential=\"#{systemEnvironment['MONGO_INITDB_ROOT_USERNAME']}:#{systemEnvironment['MONGO_INITDB_ROOT_PASSWORD']}@admin\" />\n</beans>" > webapps/gigwa/WEB-INF/classes/applicationContext-data.xml \
&& apt-get update && apt-get install -y wget \
&& wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu1804-x86_64-100.5.2.deb && dpkg -i mongodb-database-tools-ubuntu1804-x86_64-100.5.2.deb && rm -f mongodb-database-tools-ubuntu1804-x86_64-100.5.2.deb \
&& apt-get remove -y wget libpsl5 publicsuffix \
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
&& mv webapps/gigwa/WEB-INF/classes/config.properties config \
&& ln -s /usr/local/tomcat/config/config.properties webapps/gigwa/WEB-INF/classes/config.properties \
#volume for dumps
&& mkdir /usr/local/gigwaDumps