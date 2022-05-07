#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
source $DIR/.env

PGJWTFN=pgjwt/pgjwt--0.1.0.sql
[[ ! -z "$RDS" ]] && [[ -f "$PGJWTFN" ]] && (
    echo '* rds' ;
    (
     echo 'create extension pgcrypto;' ;
     echo 'drop role if exists admin;';
     echo 'drop role if exists client;';
     echo 'drop role if exists anon;';          
     echo 'create role admin;';
     echo 'create role client;';
     echo 'create role anon;';           
     tail -n+2 $PGJWTFN | sed -E 's/@extschema@/public/g'  ) > ./sql/pgjwt.sql 
) ;
echo '* db creation' && \
	$DIR/psql-admin.sh -c 'drop database if exists "'$DBNAME'"' && \
	$DIR/psql-admin.sh -c 'create database "'$DBNAME'"' && \
	echo '* schema' && \
	(
	    (cd sql/schema ;
	     #cat order.txt | xargs -t -n1 sh -c '../../psql.sh -v ON_ERROR_STOP=ON -f $0 || exit 255' ;
	     ( ( [[ ! -z "$RDS" ]] && echo ../pgjwt.sql || echo '../pgjwt-nords.sql' ) ; echo 00 ; cat order.txt | grep -v 'pgjwt' ) | xargs cat | \
		 ( [[ ! -z "$RDS" ]] && sed -E "s/current_setting\('app.jwt_secret'\)/'"$JWTSECRET"'/g" || cat )
		 
	    ) | $DIR/psql.sh --quiet -v ON_ERROR_STOP=ON ) && \
		echo '* fixtures' && \
		(cat $DIR/sql/fixtures.sql | \
		     $DIR/psql.sh -v ON_ERROR_STOP=ON ) && \
		echo '* jwtsecret' && \
		( [[ -z "$RDS" ]] && $DIR/psql-admin.sh -c 'ALTER DATABASE "'$DBNAME'"'" SET app.jwt_secret = '"$JWTSECRET"'")
#cat ../schema.sql | ../../psql.sh -v ON_ERROR_STOP=ON ;  

