#!/bin/bash

# Runs three simple services on a single container (why? simpler deployment)
# 1) http-server: serves client app and static files within the image. Sends API requests to socat bridge.
# 2) socat: exposes remote RoboSats backend from TOR socks to http//localhost:81.
# 3) nginx: is just a hack to bypass http-server directly to socat for websocket connections (http-server does not support WS)

client_server="npm exec http-server -- . -p 9000 -P http://127.0.0.1:81 -i false -d false"
backend_tor_bridge="socat tcp4-LISTEN:81,reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${ROBOSATS_ONION:-robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

$client_server & $backend_tor_bridge & nginx -g "daemon off;"