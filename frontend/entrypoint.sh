#!/bin/sh

# Print first start up message when node_modules does not exist
if [ ! -d "/usr/src/frontend/node_modules" ]; then
    echo "Looks like the first run of this container. Node modules were not detected on the attached volume, copying them into the attached volume."
fi

# copy modules without replacing
cp -R -n /tmp/node_modules /usr/src/frontend/node_modules

exec "$@"
