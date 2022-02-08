#!/bin/sh
set -e

# Create bitcoin.conf if it doesn't exist
if [ ! -f "/home/bitcoin/.bitcoin/bitcoin.conf" ]; then
    envsubst < /tmp/bitcoin.conf > /home/bitcoin/.bitcoin/bitcoin.conf
fi

_USER_ID="$(id -u)"

# Change local user id and group
if [ -n "${LOCAL_USER_ID:?}" ] && [ "$_USER_ID" != "${LOCAL_USER_ID:?}" ]; then
    usermod -u "${LOCAL_USER_ID:?}" bitcoin
fi
groupmod -g "${LOCAL_GROUP_ID:?}" bitcoin

# Fix ownership
chown -R bitcoin /home/bitcoin

# Run original entrypoint
exec /entrypoint.sh "$@"
