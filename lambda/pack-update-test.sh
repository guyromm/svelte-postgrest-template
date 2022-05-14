#!/bin/bash
source .env && \
    lambda/pack.sh && \
    lambda/update.sh && \
    curl -vvv $POSTGREST_BASE_URI
