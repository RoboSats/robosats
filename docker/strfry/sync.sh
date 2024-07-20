#!/bin/sh

/app/strfry --config /app/strfry.conf sync wss://nostr.satstralia.com --filter '{"kinds":[38383]}' --dir both >> /var/log/cron.log 2>&1
