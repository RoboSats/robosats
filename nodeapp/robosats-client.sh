#!/bin/sh

# Runs two simple services on a single container.
# 1) socat: exposes remote RoboSats backend from TOR socks to http//localhost:81.
#    Every robosat coordinators needs a tor bridge
# 2) nginx: does the magic of redirecting every request to either local (the app, static,
#    languages) or remote (for each coordinator, either API or WS, and static avatar)

# Every robosat coordinators needs a tor bridge. So far only experimental coordinator available.
experimental_onion=robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion
experimental_socat="socat tcp4-LISTEN:81,reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${experimental_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

$experimental_socat & nginx