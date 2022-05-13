#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
source $DIR/.env
SCHEMAFN=$DIR/sql/schema.sql
RSCHEMAFN=$DIR/sql/schema-reconstructed.sql
mkdir -p sql/schema && \
    pg_dump --schema-only --no-owner $DBURI > $SCHEMAFN && \
    cd sql/schema/ && \
    (rm * ||:) && \
    csplit $SCHEMAFN -f '' -b '%02d' '/^\-\- Name: .*/' '{*}' && \
    for FN in `ls -1v *` ; do
	echo $FN
        NF="$(egrep -o "Name: ([^;]+); Type: ([^;]+)" $FN  | sed -E 's/(Name: |Type: |; |\(|\)| )/./g' | sed -E 's/(\.+)/./g' | sed -E 's/$/.sql/' | sed -E "s/^\.//g" | sed -E 's/character\.varying([^\.]*)\./cv\./g' | sed -E 's/timestamp.with.time.zone/tstz/g')";
        #mv -n $FN $FN$NF  ;
        (
            #echo '-- SPLIT '$FN ; # disabled to not trigger train diffs
            cat $FN
	    
	    echo "$NF" >> order.txt
	    #echo $NF ;
        )  | sed -E "s/ '"$JWTSECRET"'/ current_setting('app.jwt_secret')/" > $NF && rm $FN
    done
[ "$(wc -l < order.txt)" -eq "$(sort -u order.txt | wc -l)" ] || (echo 'FILENAMES NOT UNIQUE!' ; exit 1)
cd -

echo '* reconstructing'
# to reconstruct a single file schema:
cd sql/schema && (echo 00 ; cat order.txt) | xargs cat  > $RSCHEMAFN ; 
diff -Nuar $SCHEMAFN $RSCHEMAFN || (echo "DUMPS $SCHEMAFN && $RSCHEMAFN NOT EQUAL!" ; exit 2) &&
   echo '* erasing monodumps' && \
	rm $SCHEMAFN $RSCHEMAFN
cd - 
