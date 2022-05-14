#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
source $DIR/.env
time aws lambda update-function-code --function-name $AWS_POSTGREST_LAMBDA_FUNC --zip-file fileb://$DIR/function.zip
