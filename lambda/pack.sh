#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
F=function.zip
R=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 4 ; echo '')
cd $DIR && \
    npm i && \
    rm -rf $DIR/node_modules/xz
    (egrep -q '^REV=' $DIR/../.env && sed -i -E 's/^REV=(.*)$/REV='$R'/g' $DIR/../.env || echo "REV="$R >> $DIR/../.env) && \
    zip -r $F index.js postgrest.js postgrest  package.json node_modules .env --exclude node_modules/postgrest/postgrest && \
    echo 'REV='$R && \
    du -h $F && \
    cd -
