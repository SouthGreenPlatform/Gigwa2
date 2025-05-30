#!/bin/bash

if [ $# -ne 3 ] ; then
    echo 'USAGE: updateGigwa.sh Path_of_new_gigwa_webapp Path_of_old_gigwa_webapp Path_of_where_to_create_backup'
    exit 1
fi

if [ -d "$1" ]; then
	if [ -d "$2" ]; then

		if [ ! -d "$1/WEB-INF" ]; then
			echo "Error: $1 does not contain a WEB-INF directory."
			exit 1
		fi

		if [ ! -d "$2/WEB-INF" ]; then
			echo "Error: $2 does not contain a WEB-INF directory."
			exit 1
		fi

		DATE=$(date +%Y%m%d%H%M)

		# Get the name of the last directory in the second argument path
		backup_dir=$(basename "$2")

		#save old gigwa files
		mkdir -p "$3" && cp -avr "$2" "$3/$backup_dir.$DATE"

		#remove gigwa folder
		rm -rf $2

		#copy new gigwa folder
		cp -avr $1 $2

		#copy configuration files from saved folder to new gigwa folder
		cp -avr $3/$backup_dir.$DATE/WEB-INF/classes/applicationContext-data.xml $2/WEB-INF/classes/applicationContext-data.xml
		cp -avr $3/$backup_dir.$DATE/WEB-INF/classes/applicationContext-MVC.xml $2/WEB-INF/classes/applicationContext-MVC.xml
		cp -avr $3/$backup_dir.$DATE/WEB-INF/classes/datasources.properties $2/WEB-INF/classes/datasources.properties
		cp -avr $3/$backup_dir.$DATE/WEB-INF/classes/users.properties $2/WEB-INF/classes/users.properties
		cp -avr $3/$backup_dir.$DATE/WEB-INF/classes/config.properties $2/WEB-INF/classes/config.properties
		cp -avr $3/$backup_dir.$DATE/WEB-INF/classes/log4j.xml $2/WEB-INF/classes/log4j.xml
		cp -avr $3/$backup_dir.$DATE/custom $2/custom


		# Changes specific to migration to v2.5
		sed -i 's/project\$CREATOR/SUPERVISOR/g' $2/WEB-INF/classes/users.properties	# replace the deprecated project-CREATOR role with the new DB-level SUPERVISOR role

		if [ "$(grep -c dumpFolder $2/WEB-INF/classes/config.properties)" -eq 0 ]; then
			printf "\ndumpFolder=$HOME/gigwaDumps\n" >> $2/WEB-INF/classes/config.properties	# add dumpFolder entry to config.properties it not present
		fi

		if [ "$(grep -c igvGenomeConfig_ $2/WEB-INF/classes/config.properties)" -eq 0 ]; then
			printf "\n\nigvGenomeConfig_1=South Green provided genomes;res/genomes.json\nigvGenomeConfig_2=GV default genomes;https://igv.org/genomes/genomes.json" >> $2/WEB-INF/classes/config.properties	# add default genome lists to config.properties it not present
		fi

		# applicationContext-security.xml has changed much in v2.5 so we don't want to keep that of the previous version. However, still make sure we keep the same passwordEncoder we had
		if [ "$(grep 'id="passwordEncoder"' $3/$backup_dir.$DATE/WEB-INF/classes/applicationContext-security.xml | grep -v '<!--')" != "$(grep 'id="passwordEncoder"' $2/WEB-INF/classes/applicationContext-security.xml | grep -v '<!--')" ]; then
			sed -i "s/.*PasswordEncoder.*//g;s/.*Only one passwordEncoder bean should be enabled at a time.*//g;s|</secur:http>|</secur:http>\n\n\n$(grep 'id="passwordEncoder"' $3/$backup_dir.$DATE/WEB-INF/classes/applicationContext-security.xml | grep -v '<!--')|g;" $2/WEB-INF/classes/applicationContext-security.xml
		fi


		# Changes specific to migration to v2.9
		if [ "$(grep '<context:component-scan base-package' $1/WEB-INF/classes/applicationContext-MVC.xml)" != "$(grep '<context:component-scan base-package' $2/WEB-INF/classes/applicationContext-MVC.xml)" ]; then
			sed -i "s|<context:component-scan base-package.*|<context:component-scan base-package=\"fr.cirad.mgdb.service,fr.cirad.web.controller,fr.cirad.manager,fr.cirad.configuration,org.brapi.v2.api,fr.cirad.web.controller,fr.cirad.service\" />|g" $2/WEB-INF/classes/applicationContext-MVC.xml
		fi
	fi
fi

chmod -R 755 $2

echo -------------------------------
echo "Update complete. You may want to apply chown -R on the updated folder."
