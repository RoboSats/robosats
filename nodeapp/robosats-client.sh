#!/bin/sh

# Runs two simple services on a single container.
# 1) socat: exposes remote RoboSats backend from TOR socks to http//localhost:81.
#    Every robosat coordinators needs a tor bridge
# 2) nginx: does the magic of redirecting every request to either local (the app, static,
#    languages) or remote (for each coordinator, either API or WS, and static avatar)

# Every robosat coordinators needs a tor socat bridge.

# Experimental Coordinator
# Mainnet
mainnet_exp_onion=robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion
mainnet_exp_port=81
# Testnet
testnet_exp_onion=robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion
testnet_exp_port=82

# Template Coordinator
# Mainnet
mainnet_temp_onion=robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion
mainnet_temp_port=83
# Testnet
testnet_temp_onion=robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion
testnet_temp_port=84

# ... add more

mainnet_exp_socat="socat tcp4-LISTEN:${mainnet_exp_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_exp_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_exp_socat="socat tcp4-LISTEN:${testnet_exp_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${testnet_exp_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

mainnet_temp_socat="socat tcp4-LISTEN:${mainnet_temp_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_temp_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_temp_socat="socat tcp4-LISTEN:${testnet_temp_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${testnet_temp_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"


$mainnet_exp_socat & $testnet_exp_socat & $mainnet_temp_socat & $testnet_temp_socat & nginx