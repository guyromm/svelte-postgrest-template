APPNAME=DBNAMEREPLACE
APP_PORT=APPPORTREPLACE
APP_BASE_URI=http://localhost:$APP_PORT
DBHOST=localhost
DBNAME=DBNAMEREPLACE
DBADMINSUDO=postgres
DBPASS=''
DBUSER=''
DBURIADMIN='postgres:///template1'
DBURI="postgres:///$DBNAME"
JWTSECRET=JWTSECRETREPLACE
POSTGRESTPORT=POSTGRESTPORTREPLACE
POSTGREST_BASE_URI=http://localhost:$POSTGRESTPORT
RDS=''
PYTHON_EXEC="../../../../.pyenv/shims/python"
SERVER_PORT=SERVERPORTREPLACE
SERVER_BASE_URI=http://localhost:$SERVER_PORT/server
SITE_SOCKETIO_URI=ws://localhost:$SERVER_PORT
VITE_APP_BASE_URI=$APP_BASE_URI
VITE_DB=$DBNAME
VITE_POSTGREST_BASE_URI=$POSTGREST_BASE_URI
VITE_SERVER_BASE_URI=$SERVER_BASE_URI
VITE_SITE_SOCKETIO_URI=$SITE_SOCKETIO_URI
