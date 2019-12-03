#!/bin/bash

if [![ $# -eq 3 ]] ; then
    echo 'updateGigwa.sh Path_of_new_gigwa_webapp Path_of_old_gigwa_webapp Path_of_where_to_save'
    exit 1
fi

if [ -d "$1" ]; then
	if [ -d "$2" ]; then
		
		DATE=$(date +%Y%m%d%H%M)

		#save old gigwa files
		mkdir -p $3 && cp -avr $2 $3/gigwa.$DATE

		#remove gigwa folder
		rm -rf $2

		#copy new gigwa folder
		cp -avr $1 $2

		#copy configuration files from saved folder to new gigwa folder
		cp -avr $3/gigwa.$DATE/WEB-INF/classes/applicationContext-data.xml $2/WEB-INF/classes/applicationContext-data.xml
		cp -avr $3/gigwa.$DATE/WEB-INF/classes/datasources.properties $2/WEB-INF/classes/datasources.properties
		cp -avr $3/gigwa.$DATE/WEB-INF/classes/users.properties $2/WEB-INF/classes/users.properties
	fi
fi
