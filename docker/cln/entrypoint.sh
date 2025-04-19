#!/usr/bin/env bash

: "${EXPOSE_TCP:=false}"

networkdatadir="${LIGHTNINGD_DATA}/${LIGHTNINGD_NETWORK}"

if [ "$EXPOSE_TCP" == "true" ]; then
    set -m
    lightningd "$@" &

    echo "Core-Lightning starting"
    while read -r i; do if [ "$i" = "lightning-rpc" ]; then break; fi; done \
    < <(inotifywait -e create,open --format '%f' --quiet "${networkdatadir}" --monitor)
    echo "Core-Lightning started"
    echo "Core-Lightning started, RPC available on port $LIGHTNINGD_RPC_PORT"

    socat "TCP4-listen:$LIGHTNINGD_RPC_PORT,fork,reuseaddr" "UNIX-CONNECT:${networkdatadir}/lightning-rpc" &
    fg %-
else
    # Always copy the holdinvoice plugin into the plugins directory on start up
    mkdir -p /root/.lightning/plugins
    cp /tmp/holdinvoice /root/.lightning/plugins/holdinvoice
    if [ ! -f /root/.lightning/config ]; then
        cp /tmp/config /root/.lightning/config
    fi
    exec "$@"
fi