#!/bin/bash

# Navigate to your project directory
cd /path/to/your/project

# Pull the latest changes from the repository
echo "Pulling latest changes..."
git pull origin main

# Install any new dependencies
echo "Installing dependencies..."
npm install

# Build the project (if applicable)
echo "Building the project..."
npm run build

# Restart the Node.js server
echo "Restarting the server..."
pm2 reload all 

echo "Deployment completed at $(date)"