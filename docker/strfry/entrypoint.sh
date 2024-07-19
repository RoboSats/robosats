#!/bin/sh

crontab /app/crontab

crond -f -l 8 & /app/strfry.sh
