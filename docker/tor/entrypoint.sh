#!/bin/sh
set -e

# Create torrc if it doesn't exist
if [ ! -f "/etc/tor/torrc" ]; then
    cp /tmp/torrc /etc/tor/torrc
fi

# Change local user id and group
usermod -u "${LOCAL_USER_ID:?}" alice
groupmod -g "${LOCAL_GROUP_ID:?}" alice

# Set correct owners on volumes
chown -R tor:alice "${TOR_DATA}"
chown -R :alice /etc/tor
chown -R alice:alice /home/alice

exec sudo -u tor /usr/bin/tor
