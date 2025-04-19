#!/bin/sh

filters='{"kinds":[38383, 31986, 1059]}'

while IFS= read -r line; do
  /app/strfry --config /etc/strfry.conf sync ${line} --filter "$filters" --dir both
done < /app/onion_urls.txt
