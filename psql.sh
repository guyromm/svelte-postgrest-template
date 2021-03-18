#!/bin/bash
source .env
psql "$@" "$DBNAME"
