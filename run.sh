#!/bin/bash

# Set variables
IMAGE_NAME="my-node-app"
CONTAINER_NAME="my-node-container"
PORT=3000

# Build the Docker image
echo "Building the Docker image..."
docker build -t $IMAGE_NAME .

# Check if a container with the same name is already running and stop it
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Stopping the existing container..."
    docker stop $CONTAINER_NAME
fi

# Remove the existing container if it exists
if [ "$(docker ps -a -q -f name=$CONTAINER_NAME)" ]; then
    echo "Removing the existing container..."
    docker rm $CONTAINER_NAME
fi

# Run the Docker container
echo "Running the Docker container..."
docker run -d --name $CONTAINER_NAME -p $PORT:3000 $IMAGE_NAME

echo "Container $CONTAINER_NAME is up and running on port $PORT."
