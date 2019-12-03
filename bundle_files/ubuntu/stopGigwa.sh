#!/bin/bash

BASEDIR=$(dirname $0)
cd "${BASEDIR}"

echo ""
echo "GIGWA is shutting down..."
echo ""

mongodb/bin/mongo admin --port 59393 --eval "printjson(db.shutdownServer())"

export JAVA_HOME=jre
export CATALINA_HOME=tomcat
$CATALINA_HOME/bin/shutdown.sh