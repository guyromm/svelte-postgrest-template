#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
source $DIR/.env
#echo 'connecting to "'$DBURI'"'
if [ -z "$DBADMINSUDO" ]
then
    psql "$@" "$DBURIADMIN"
else
    sudo -u $DBADMINSUDO psql "$@" "$DBURIADMIN"
    fi
