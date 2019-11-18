#!/bin/bash

BASEDIR=$(dirname $0)
cd "${BASEDIR}"

echo ""
echo "GIGWA is shutting down..."
echo ""

mongodb-linux-x86_64-ubuntu1804-4.0.10/bin/mongo admin --port 59393 --eval "printjson(db.shutdownServer())"

export JAVA_HOME=jre1.8.0_192
export CATALINA_HOME=apache-tomcat-8.5.35
$CATALINA_HOME/bin/shutdown.sh