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
mainnet_temple_socat="socat tcp4-LISTEN:${mainnet_temple_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_temple_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_temple_socat="socat tcp4-LISTEN:${testnet_temple_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${testnet_temple_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

################################
# TheBigLake
# Mainnet
mainnet_lake_onion=4t4jxmivv6uqej6xzx2jx3fxh75gtt65v3szjoqmc4ugdlhipzdat6yd.onion
mainnet_lake_port=104
# Testnet
testnet_lake_onion=ghbtv7lhoyhomyir4xvxaeyqgx4ylxksia343jaat3njqqlkqpdjqcyd.onion
testnet_lake_port=1004
# socat cmd
mainnet_lake_socat="socat tcp4-LISTEN:${mainnet_lake_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_lake_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_lake_socat="socat tcp4-LISTEN:${testnet_lake_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${testnet_lake_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

################################
# Libre Bazaar
# Mainnet
mainnet_bazaar_onion=librebazovfmmkyi2jekraxsuso3mh622avuuzqpejixdl5dhuhb4tid.onion
mainnet_bazaar_port=107
# Testnet
testnet_bazaar_onion=librebazovfmmkyi2jekraxsuso3mh622avuuzqpejixdl5dhuhb4tid.onion
testnet_bazaar_port=1007
# socat cmd
mainnet_bazaar_socat="socat tcp4-LISTEN:${mainnet_bazaar_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_bazaar_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_bazaar_socat="socat tcp4-LISTEN:${testnet_bazaar_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${testnet_bazaar_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"


################################
# Eleuteria
# Mainnet
mainnet_eleuteria_onion=ixiiqsuzt7hh5qxshiqwyewyh3gyygltbygqlvlyitg3gl3u2cemk3ad.onion
mainnet_eleuteria_port=110
# Testnet
testnet_eleuteria_onion=ixiiqsuzt7hh5qxshiqwyewyh3gyygltbygqlvlyitg3gl3u2cemk3ad.onion
testnet_eleuteria_port=1010
# socat cmd
mainnet_eleuteria_socat="socat tcp4-LISTEN:${mainnet_eleuteria_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_eleuteria_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_eleuteria_socat="socat tcp4-LISTEN:${testnet_eleuteria_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${testnet_eleuteria_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

################################
# FreePort
# Mainnet
mainnet_freeport_onion=2enoseg66hme76khjjn2qvrhipnzwgwa44mewgrdphrxbhzcxd2vdiqd.onion
mainnet_freeport_port=111
# Testnet
testnet_freeport_onion=2enoseg66hme76khjjn2qvrhipnzwgwa44mewgrdphrxbhzcxd2vdiqd.onion
testnet_freeport_port=1011
# socat cmd
mainnet_freeport_socat="socat tcp4-LISTEN:${mainnet_freeport_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_freeport_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_freeport_socat="socat tcp4-LISTEN:${testnet_freeport_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${testnet_freeport_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

################################
# Alice
# Mainnet
mainnet_alice_onion=alice7bqexhtnkiqhtgkuwgtzzfkishw23ac4sfwpznrwlmnipxlomyd.onion
mainnet_alice_port=109
# Testnet
testnet_alice_onion=alice7bqexhtnkiqhtgkuwgtzzfkishw23ac4sfwpznrwlmnipxlomyd.onion
testnet_alice_port=1009
# socat cmd
mainnet_alice_socat="socat tcp4-LISTEN:${mainnet_alice_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${mainnet_alice_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"
testnet_alice_socat="socat tcp4-LISTEN:${testnet_alice_port},reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS5-CONNECT:${TOR_PROXY_IP:-127.0.0.1}:${testnet_alice_onion}:80,socksport=${TOR_PROXY_PORT:-9050}"

# RUN!
mkdir -p /etc/nginx/ssl
if [ ! -f /etc/nginx/ssl/server.crt ]; then
    openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
        -keyout /etc/nginx/ssl/server.key -out /etc/nginx/ssl/server.crt \
        -subj "/CN=robosats_client" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi

$mainnet_temple_socat & $testnet_temple_socat & $mainnet_lake_socat & $testnet_lake_socat & $mainnet_bazaar_socat & $testnet_bazaar_socat & $mainnet_eleuteria_socat & $testnet_eleuteria_socat & $mainnet_freeport_socat & $testnet_freeport_socat & $mainnet_alice_socat & $testnet_alice_socat & nginx
