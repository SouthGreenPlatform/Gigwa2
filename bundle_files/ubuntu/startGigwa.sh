#!/bin/bash

if [ "$(ss -na | grep LISTEN | grep -Ec -e "\<59395\>")" -gt 0 ]; then
  echo "Tomcat port (59395) already in use. Unable to start Gigwa!"
  sleep 2
  exit
fi

if [ "$(ss -na | grep LISTEN | grep -Ec -e "\<59393\>")" -gt 0 ]; then
  echo "MongoDB port (59393) already in use. Unable to start Gigwa!"
  sleep 2
  exit
fi

BASEDIR=$(dirname $0)
cd "${BASEDIR}"

export LC_ALL=C

setsid mongodb/bin/mongod --profile 0 --pidfilepath mongoPID --port 59393 --slowms 60000 --storageEngine wiredTiger --wiredTigerCollectionBlockCompressor=zstd --directoryperdb --quiet --dbpath data --logpath logs/mongo.log 2>errFile &
sleep 3
errors="$(cat errFile)"
rm errFile
if [ ! -z "$errors" ]; then
	echo "Unable to start MongoDB: $errors"
	exit 1
fi

mongoPID="$(cat mongoPID)"
rm mongoPID
if [ $(ps -p $mongoPID | grep $mongoPID | wc -l) -eq 0 ]; then
	echo "Unable to start MongoDB, contents of logs/mongod.log below:"
	tail -20 logs/mongo.log
	exit 1
fi

export JAVA_HOME=jre
export CATALINA_HOME=tomcat
setsid $CATALINA_HOME/bin/startup.sh

echo ""
echo "GIGWA is starting up..."
echo ""
sleep 5

setsid xdg-open http://localhost:59395/gigwa &> /dev/null