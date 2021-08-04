#!/bin/bash
# use -l to get a return code of whether everything is fine (0)
# use --write to enforce the prettier style
npx prettier "$@" '**/*.{css,html,js,svelte}'
