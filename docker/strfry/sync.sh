#!/bin/sh

/app/strfry --config /app/strfry.conf sync ws://ngdk7ocdzmz5kzsysa3om6du7ycj2evxp2f2olfkyq37htx3gllwp2yd.onion/nostr --filter '{"kinds":[38383]}' --dir both >> /var/log/cron.log 2>&1
/app/strfry --config /app/strfry.conf sync ws://satstraoq35jffvkgpfoqld32nzw2siuvowanruindbfojowpwsjdgad.onion/nostr --filter '{"kinds":[38383]}' --dir both >> /var/log/cron.log 2>&1
/app/strfry --config /app/strfry.conf sync ws://4t4jxmivv6uqej6xzx2jx3fxh75gtt65v3szjoqmc4ugdlhipzdat6yd.onion/nostr --filter '{"kinds":[38383]}' --dir both >> /var/log/cron.log 2>&1
/app/strfry --config /app/strfry.conf sync ws://mmhaqzuirth5rx7gl24d4773lknltjhik57k7ahec5iefktezv4b3uid.onion/nostr --filter '{"kinds":[38383]}' --dir both >> /var/log/cron.log 2>&1
