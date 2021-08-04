#!/bin/bash
echo '* forking npm i' && \
    (cp app && npm install ; cd - ) & \
    (cd common && npm install ; cd - ) & \
    (cd cli && npm install ; cd - ) & \
    (cd server && npm install ; cd - ) & \
    echo '* waiting' && \
	wait && \
	echo '* all done!'

