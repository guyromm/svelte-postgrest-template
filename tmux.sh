#!/bin/bash
session=`whoami`
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
source $DIR/.env

function ti() {
    #tmux -d "$@" -s $session
    tmux new-session -d -s $session
}

function t() {
    tmux "$@"
}
function ts() {
    tmux "$@" -t "$session"
}

function tsk() {
    wn="$1"
    shift
    t send-keys -t "$session:$wn" "$@" C-m
}

function tnw() {
    t new-window -a -t "$session" -n "$1"
}

function tsw() {
    wn="$1"
    shift
    t split-window "$@" -t "$session:$wn"
}

function destroy() {
echo '* destroying previous session' && \
    ts kill-session -t "$session"
}
function create() {
echo '* creating session' && \
    ti && \
    echo '* creating window postgrest' && \
    t rename-window -t "$session.0" "postgrest" && \
    tsk postgrest 'source .env ; export DBURI ; export POSTGRESTPORT ; export JWTSECRET ; [[ ! -z "$POSTGRESTPORT" ]] && postgrest postgrest.conf || echo "no POSTGRESTPORT provided"' && \    
    echo '* app' && \
    tnw app && \
    tsk app "nvm use && cd app ; npm run dev -- --port=$APP_PORT" && \
    echo '* server' && \
    tnw server && \
    tsk server "nvm use && cd server ; PORT=$SERVER_PORT npm run start" && \ 
    echo '* email-worker' && \
    tnw email-worker && \
    tsk email-worker "cli/email_worker.js -l" && \
    ( [[ ! -z $POSTGREST_PROXY_PORT ]] && (
	  echo '* postgrest_proxy' && \
	      tnw pgproxy && \
	      tsk pgproxy "source .env && mitmdump -p $POSTGREST_PROXY_PORT -w mitm.log --mode reverse:$(echo $POSTGREST_BASE_URI | sed -E 's/\/default\/testicle//g')"
	  ) || echo '* postgrest proxy disabled')
}
function attach() {
    ts attach-ses
    }


echo "0 = '$0'"
[[ $0 =~ bash$ ]] && echo "tmux.sh sourced" ||
        {
            destroy
            create && \
                attach
        }
