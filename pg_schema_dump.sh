#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
source $DIR/.env
mkdir -p sql/schema && \
    pg_dump $DBNAME --schema-only --no-owner > sql/schema.sql && \
    cd sql/schema/ && \
    (rm * ||:) && \
    csplit ../schema.sql -f '' -b '%02d' '/^\-\- Name: .*/' '{*}' && \
    for FN in `ls *` ; do
        NF="$(egrep -o "Name: ([^;]+); Type: ([^;]+)" $FN  | sed -E 's/(Name: |Type: |; |\(|\)| )/./g' | sed -E 's/(\.+)/./g' | sed -E 's/$/.sql/' | sed -E "s/^\.//g" | sed -E 's/character\.varying([^\.]*)\./cv\./g' | sed -E 's/timestamp.with.time.zone/tstz/g')";
        #mv -n $FN $FN$NF  ;
        (
            echo "$NF" >> order.txt #'-- SPLIT '$FN ; # disabled to not trigger train diffs
            cat $FN
        ) > $NF && rm $FN
        #echo "mv -n $FN $FN$NF"
    done
[ "$(wc -l < order.txt)" -eq "$(sort -u order.txt | wc -l)" ] || (echo 'FILENAMES NOT UNIQUE!' ; exit 1)
cd -
    
# to reconstruct a single file schema:
# ls * | sort -k1n | xargs cat  > ../schema-reconstructed.sql
