#!/bin/bash
echo '* removing old env (disregard error if no env set)' && \
    rm .env .env.sh
echo '* symlinking .env.sh' && \
    ln -s envs/$1 ./.env.sh && \
    echo '* evaluating .env.sh into .env (node)' && \
    source .env.sh && \
    (
	IFS=$'\n'
	for L in $(cat .env.sh) ; do
	    #echo 'L="'$L'"'
	    N="$(echo "$L"|cut -f1 -d'=')"
	    EV="$(eval 'echo $'$N)"
	    #echo '# evaluating '$N
	    echo "$N='"$EV"'"
	done
    echo ENV=$1
    ) > .env

