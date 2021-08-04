#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
source $DIR/.env
#echo 'connecting to "'$DBURI'"'
psql "$@" "$DBURI"
