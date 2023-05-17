#!/bin/sh

# Copy node_modules if it doesn't exist
if [ ! -d "/usr/src/frontend/node_modules" ]; then
    echo "Looks like the first run of this container. Node modules were not detected on the attached volume, copying them into the attached volume."
    cp -R /tmp/node_modules /usr/src/frontend/node_modules
fi

exec "$@"
