#!/bin/bash



# Arguments parsing
INPUT="."
HOST="127.0.0.1:27017"

while [ $# -gt 0 ]; do
	case $1 in
		-h | --host)
			HOST="$2"
			shift; shift
			;;
		-i | -f | --input | --file)
			FILENAME="$2"
			shift; shift
			;;
		-u | --username)
			DBUSERNAME="$2"
			shift; shift
			;;
		-p | --password)
			DBPASSWORD="$2"
			shift; shift
			;;
		-pp | --passwordPrompt)
			PASSWORD_PROMPT=YES
			shift;
			;;
		-a | --authenticationDatabase)
			AUTHDB="$2"
			shift; shift
			;;
		--drop)
			DROP_OPTION="--drop"
			shift
			;;
		-l | --log)
			LOGFILE=YES
			shift
			;;
		*)  # Unknown option
			echo "Unknown option $1"
			exit 10
			;;
	esac
done


# Arguments checks

if [ -z $HOST ]; then
	echo "You must specify the database host"
	exit 11
fi

if [ ! -f $FILENAME ]; then
	echo "Archive file $FILENAME not found"
	exit 12
fi

if [ ! -z $DBUSERNAME ]; then
	if [ ! -z PASSWORD_PROMPT ]; then
		CREDENTIAL_OPTIONS="--username=$DBUSERNAME --authenticationDatabase=$AUTHDB"
	else
		CREDENTIAL_OPTIONS="--username=$DBUSERNAME --password=$DBPASSWORD --authenticationDatabase=$AUTHDB"
	fi
fi


logged_part(){
	set -x
	mongorestore -v $CREDENTIAL_OPTIONS --host=$HOST --archive=$FILENAME --gzip $DROP_OPTION
	return $?
}

if [ ! -z $LOGFILE ]; then
	logged_part 2>&1 | tee "$FILENAME-restore-`date +%Y-%m-%dT%H%M%S`.log"
	exit ${PIPESTATUS[0]}
else
	logged_part
	exit $?
fi
