#!/bin/sh

# Apply migrations
python manage.py migrate

# Collect static files
if [ $SKIP_COLLECT_STATIC ]; then
    echo "Skipping collection of static files."
else
    python manage.py collectstatic --noinput
fi

# Copy pb2/grpc files if they do exist
if [ ! -f "/usr/src/robosats/api/lightning/lightning_pb2.py" ]; then
    echo "Looks like the first run of this container. pb2 and gRPC files were not detected on the attached volume, copying them into the attached volume /robosats/api/node ."
    cp -R /tmp/* /usr/src/robosats/api/lightning/
fi

# Start server / gunicorn / daphne / command
exec "$@"