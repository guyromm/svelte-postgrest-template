#!/bin/bash
source .env
(aws rds create-db-instance \
     --db-instance-identifier $APPNAME \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --engine-version 14.2 \
     --master-user-password $RDS_PASSWORD \
     --db-subnet-group-name $RDS_VPC_GROUP \
     --master-username postgres \
     --publicly-accessible\
     --allocated-storage 20 || echo 'ERROR_CREATING:'$?) | tee envs/$ENV.rds-ins.json

while (true) ; do 
    echo '** awaiting instance creation'
    aws rds describe-db-instances --db-instance-identifier $APPNAME > envs/$ENV.rds.json
    EP=$(jq '.DBInstances[0].Endpoint.Address' envs/$ENV.rds.json -r | sed -E 's/^null$//g')
    echo '*** sleeping'
    [[ ! -z "$EP" ]] && break
    sleep 5
done
echo "RDS_HOSTNAME="$EP
