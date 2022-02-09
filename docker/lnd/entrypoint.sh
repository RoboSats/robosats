#!/bin/sh
set -e

# Create lnd.conf if it doesn't exist
if [ ! -f "/home/lnd/.lnd/lnd.conf" ]; then
    envsubst < /tmp/lnd.conf > /home/lnd/.lnd/lnd.conf
fi

# Change local user id and group
usermod -u "${LOCAL_USER_ID:?}" lnd
groupmod -g "${LOCAL_GROUP_ID:?}" lnd

# Fix ownership
chown -R lnd /home/lnd

# Start lnd
exec sudo -u lnd "$@"
