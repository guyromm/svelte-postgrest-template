#!/bin/bash
source .env && \
    postgrest-lambda/pack.sh && \
    postgrest-lambda/update.sh && \
    curl -vvv $POSTGREST_BASE_URI
