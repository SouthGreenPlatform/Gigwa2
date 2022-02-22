#!/bin/bash

# Argument parsing
INPUT="."
HOST="127.0.0.1:27017"
AUTHDB="admin"

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
		-nf | --nsFrom)
			NAMESPACE_FROM="$2"
			shift; shift
			;;
		-nt | --nsTo)
			NAMESPACE_TO="$2"
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
			LOGFILE="$2"
			shift; shift
			;;
		*)  # Unknown option
			echo "Unknown option $1"
			exit 10
			;;
	esac
done


# Argument checking
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
	mongorestore -v $CREDENTIAL_OPTIONS --host=$HOST --archive=$FILENAME --nsTo=$NAMESPACE_TO --nsFrom=$NAMESPACE_FROM --gzip $DROP_OPTION
	return $?
}

if [ ! -z $LOGFILE ]; then
	logged_part 2>&1 | tee $LOGFILE
	STATUS=${PIPESTATUS[0]}
	gzip $LOGFILE
	exit $STATUS
else
	logged_part
	exit $?
fi