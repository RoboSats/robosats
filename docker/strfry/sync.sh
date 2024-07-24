#!/bin/sh

filters='{"kinds":[38383]}'

/app/strfry --config /etc/strfry.conf sync ws://testraliar7xkhos2gipv2k65obykofb4jqzl5l4danfryacifi4t7qd.onion/nostr --filter "$filters" --dir both
/app/strfry --config /etc/strfry.conf sync ws://jpp3w5tpxtyg6lifonisdszpriiapszzem4wod2zsdweyfenlsxeoxid.onion/nostr --filter "$filters" --dir both
/app/strfry --config /etc/strfry.conf sync ws://ghbtv7lhoyhomyir4xvxaeyqgx4ylxksia343jaat3njqqlkqpdjqcyd.onion/nostr --filter "$filters" --dir both
/app/strfry --config /etc/strfry.conf sync ws://wsjyhbashc4zrrex6vijpryujggbka5plry2o62dxqoz3pxinblnj4ad.onion/nostr --filter "$filters" --dir both
