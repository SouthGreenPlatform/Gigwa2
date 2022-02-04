#!/bin/bash

# Arguments parsing
OUTPUT="."
AUTHDB="admin"
while [ $# -gt 0 ]; do
	case $1 in
		-h | --host)
			HOST="$2"
			shift; shift
			;;
		-o | --output)
			OUTPUT="$2"
			shift; shift
			;;
		-n | --name)
			DUMPNAME="$2"
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
		-d | --db | --database)
			DATABASE="$2"
			shift; shift
			;;
		-a | --authenticationDatabase)
			AUTHDB="$2"
			shift; shift
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


# Arguments checks

if [ -z $HOST ]; then
	echo "You must specify the database host"
	exit 11
fi

if [ -z $DATABASE ]; then
	echo "You must specify a database to export"
	exit 12
fi

if [ -z "$DUMPNAME" ]; then
	DUMPNAME=$DATABASE"_"`date +%Y-%m-%dT%H-%M-%S`
fi

if [ ! -d $OUTPUT ]; then
	mkdir "$OUTPUT"
fi

if [ ! -z $DBUSERNAME ]; then
	if [ ! -z PASSWORD_PROMPT ]; then
		CREDENTIAL_OPTIONS="--username=$DBUSERNAME --authenticationDatabase=$AUTHDB"
	else
		CREDENTIAL_OPTIONS="--username=$DBUSERNAME --password=$DBPASSWORD --authenticationDatabase=$AUTHDB"
	fi
fi

#FILENAME=$OUTPUT/$DATABASE/$DATABASE"_"`date +%Y-%m-%dT%H-%M-%S`".gz"
FILENAME="$OUTPUT/$DUMPNAME.gz"

logged_part(){
	echo "Name : $DUMPNAME"
	set -x
	mongodump -vv $CREDENTIAL_OPTIONS --excludeCollectionsWithPrefix=tmpVar_ --excludeCollection=cachedCounts --excludeCollection=brapiGermplasmsSearches --host=$HOST --db=$DATABASE --archive=$FILENAME --gzip <&0
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