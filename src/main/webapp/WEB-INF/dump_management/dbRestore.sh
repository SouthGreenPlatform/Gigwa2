#!/bin/sh



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
			USERNAME="$2"
			shift; shift
			;;
		-p | --password)
			PASSWORD="$2"
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
			exit
			;;
	esac
done


# Arguments checks

if [ -z $HOST ]; then
	echo "You must specify the database host"
	exit
fi

if [ ! -f $FILENAME ]; then
	echo "Archive file $FILENAME not found"
	exit
fi

if [ -z $USERNAME ]; then
	CREDENTIAL_OPTIONS = "--username=$USERNAME --password=$PASSWORD --authenticationDatabase=admin"
fi 


logged_part(){
	set -x
	mongorestore -v $CREDENTIAL_OPTIONS --host=$HOST --archive=$FILENAME --gzip $DROP_OPTION
}

if [ ! -z $LOGFILE ]; then
	logged_part 2>&1 | tee "$FILENAME-restore-`date +%Y-%m-%dT%H%M%S`.log"
else
	logged_part
fi
