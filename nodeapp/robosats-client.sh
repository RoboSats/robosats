#!/bin/sh

# Runs two simple services on a single container.
# 1) socat: exposes remote RoboSats backend from TOR socks to http//localhost:81.
#    Every robosat coordinators needs a tor bridge
# 2) nginx: does the magic of redirecting every request to either local (the app, static,
#    languages) or remote (for each coordinator, either API or WS, and static avatar)

# Every robosat coordinators needs a tor socat bridge.

###############################
# Experimental
# Mainnet
mainnet_exp_onion=robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion
mainnet_exp_port=101
# Testnet
testnet_exp_onion=robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion
testnet_exp_port=1001
# socat cmd
mainnet_exp_socat="socat tcp4-LISTEN:${mainnet_exp_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_exp_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_exp_socat="socat tcp4-LISTEN:${testnet_exp_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${testnet_exp_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

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
# Satstralia
# Mainnet
mainnet_satstralia_onion=satstraoq35jffvkgpfoqld32nzw2siuvowanruindbfojowpwsjdgad.onion
mainnet_satstralia_port=103
# Testnet
testnet_satstralia_onion=testraliar7xkhos2gipv2k65obykofb4jqzl5l4danfryacifi4t7qd.onion
testnet_satstralia_port=1003
# socat cmd
mainnet_satstralia_socat="socat tcp4-LISTEN:${mainnet_satstralia_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_satstralia_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_satstralia_socat="socat tcp4-LISTEN:${testnet_satstralia_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${testnet_satstralia_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

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


# RUN!
$mainnet_exp_socat & $testnet_exp_socat & $mainnet_temple_socat & $testnet_temple_socat & $mainnet_satstralia_socat & $testnet_satstralia_socat & $mainnet_lake_socat & $testnet_lake_socat & $mainnet_veneto_socat & $testnet_veneto_socat & nginx