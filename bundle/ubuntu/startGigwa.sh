#!/bin/bash

if [ "$(netstat -na | grep LISTEN | grep -Ec -e "\<59395\>")" -gt 0 ]; then
  echo "Tomcat port (59395) already in use. Unable to start Gigwa!"
  sleep 2
  exit
fi

if [ "$(netstat -na | grep LISTEN | grep -Ec -e "\<59393\>")" -gt 0 ]; then
  echo "MongoDB port (59393) already in use. Unable to start Gigwa!"
  sleep 2
  exit
fi

BASEDIR=$(dirname $0)
cd "${BASEDIR}"

export LC_ALL=C
mongodb-linux-x86_64-ubuntu1804-4.0.10/bin/mongod --fork --port 59393 --slowms 60000 --storageEngine wiredTiger --wiredTigerCollectionBlockCompressor=zlib --dbpath data --logpath logs/mongo.log &

export JAVA_HOME=jre1.8.0_192
export CATALINA_HOME=apache-tomcat-8.5.35
setsid $CATALINA_HOME/bin/startup.sh

echo ""
echo "GIGWA is starting up..."
echo ""
sleep 5

setsid xdg-open http://localhost:59395/gigwa &> /dev/null