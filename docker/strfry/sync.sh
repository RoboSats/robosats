#!/bin/sh

filters='{"kinds":[38383]}'

while IFS= read -r line; do
  /app/strfry --config /etc/strfry.conf sync ws://${line}/nostr --filter "$filters" --dir both
done < /app/onion_urls.txt
