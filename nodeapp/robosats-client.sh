#!/bin/sh

# Runs two simple services on a single container.
# 1) socat: exposes remote RoboSats backend from TOR socks to http//localhost:81.
#    Every robosat coordinators needs a tor bridge
# 2) nginx: does the magic of redirecting every request to either local (the app, static,
#    languages) or remote (for each coordinator, either API or WS, and static avatar)

# Every robosat coordinators needs a tor socat bridge.

################################
# Temple of Sats
# Mainnet
mainnet_temple_onion=ngdk7ocdzmz5kzsysa3om6du7ycj2evxp2f2olfkyq37htx3gllwp2yd.onion
mainnet_temple_port=102
# Testnet
testnet_temple_onion=jpp3w5tpxtyg6lifonisdszpriiapszzem4wod2zsdweyfenlsxeoxid.onion
testnet_temple_port=1002
# socat cmd
mainnet_temple_socat="socat tcp4-LISTEN:${mainnet_temple_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_temple_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_temple_socat="socat tcp4-LISTEN:${testnet_temple_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${testnet_temple_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

################################
# TheBigLake
# Mainnet
mainnet_lake_onion=4t4jxmivv6uqej6xzx2jx3fxh75gtt65v3szjoqmc4ugdlhipzdat6yd.onion
mainnet_lake_port=104
# Testnet
testnet_lake_onion=ghbtv7lhoyhomyir4xvxaeyqgx4ylxksia343jaat3njqqlkqpdjqcyd.onion
testnet_lake_port=1004
# socat cmd
mainnet_lake_socat="socat tcp4-LISTEN:${mainnet_lake_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_lake_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_lake_socat="socat tcp4-LISTEN:${testnet_lake_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${testnet_lake_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

################################
# BitcoinVeneto
# Mainnet
mainnet_veneto_onion=mmhaqzuirth5rx7gl24d4773lknltjhik57k7ahec5iefktezv4b3uid.onion
mainnet_veneto_port=105
# Testnet
testnet_veneto_onion=wsjyhbashc4zrrex6vijpryujggbka5plry2o62dxqoz3pxinblnj4ad.onion
testnet_veneto_port=1005
# socat cmd
mainnet_veneto_socat="socat tcp4-LISTEN:${mainnet_veneto_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_veneto_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_veneto_socat="socat tcp4-LISTEN:${testnet_veneto_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${testnet_veneto_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

################################
# Over the Moon
# Mainnet
mainnet_moon_onion=otmoonrndnrddqdlhu6b36heunmbyw3cgvadqo2oqeau3656wfv7fwad.onion
mainnet_moon_port=106
# Testnet
testnet_moon_onion=otmtestgbj3kqo3nre6oksusuqfb4ids5zg2y5z2qza2jogeu67stwid.onion
testnet_moon_port=1006
# socat cmd
mainnet_moon_socat="socat tcp4-LISTEN:${mainnet_moon_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_moon_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_moon_socat="socat tcp4-LISTEN:${testnet_moon_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${testnet_moon_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"


# RUN!
$mainnet_temple_socat & $testnet_temple_socat & $mainnet_lake_socat & $testnet_lake_socat & $mainnet_veneto_socat & $testnet_veneto_socat & $mainnet_moon_socat & $testnet_moon_socat & nginx