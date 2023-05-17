#!/bin/sh

# Apply migrations
python manage.py migrate

# Collect static files
if [ $SKIP_COLLECT_STATIC ]; then
    echo "Skipping collection of static files."
else
    python manage.py collectstatic --noinput
fi

# Print first start up message when pb2/grpc files if they do exist
if [ ! -f "/usr/src/robosats/api/lightning/lightning_pb2.py" ]; then
    echo "Looks like the first run of this container. pb2 and gRPC files were not detected on the attached volume, copying them into the attached volume /robosats/api/lightning ."
fi

# Copy and overwrite all existing pb2/grpc files always. Therefore, running
# /scripts/generate_grpc.sh only makes sense if done during Dockerfile build
cp -R /tmp/* /usr/src/robosats/api/lightning/

# Start server / gunicorn / daphne / command
exec "$@"