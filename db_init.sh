#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
source $DIR/.env
sudo -u postgres psql template1 -c 'drop database "'$DBNAME'"' && \
    sudo -u postgres psql template1 -c 'create database "'$DBNAME'"' && \
    (cd sql/schema ; cat order.txt | xargs cat | ../../psql.sh -v ON_ERROR_STOP=ON ; cd - )

