#!/bin/sh

# Apply migrations
python manage.py migrate

# Collect static files
if [ $DEVELOPMENT ]; then
    echo "Installing python development dependencies"
    pip install -r requirements_dev.txt
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
