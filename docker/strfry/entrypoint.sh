#!/bin/sh

cron -f -l 8 & tail -f /var/log/cron.log & /app/strfry relay
