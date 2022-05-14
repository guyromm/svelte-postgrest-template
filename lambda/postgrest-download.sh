#!/bin/bash
cd lambda/ && \
    echo '** downloading & extracting' && \
    curl -L -s 'https://github.com/PostgREST/postgrest/releases/download/v9.0.0/postgrest-v9.0.0-linux-static-x64.tar.xz' | tar -Jxvf - && \
    echo '** success' && \
    ls -la postgrest
cd -                                                                                                                                                                         
