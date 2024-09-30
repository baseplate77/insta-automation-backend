#!/bin/bash

set -o allexport
source .env
set -o allexport

# Check if the environment variable INSTANCES is set; if not, use the command-line argument
echo "Running $INSTANCES"

if [ -z "$INSTANCES" ]; then
  if [ -z "$1" ]; then
    echo "Usage: $0 <number_of_instances> or set INSTANCES environment variable."
    exit 1
  else
    NUM_INSTANCES=$1
  fi
else
  NUM_INSTANCES=$INSTANCES
fi

yarn build

# Number of instances to run
NUM_INSTANCES=$1

# Base port (You can change this as needed)
BASE_PORT=3000

# Loop to start multiple instances
for ((i=0; i<NUM_INSTANCES; i++))
do
  PORT=$((BASE_PORT + i))
  echo "Starting instance $i on port $PORT"
  
  # Start the Node.js server with PM2 and pas   s the port as an environment variable
 pm2 start dist/index.js --name "app-instance-$PORT" -- $PORT 
done

echo "All $NUM_INSTANCES instances have been started."