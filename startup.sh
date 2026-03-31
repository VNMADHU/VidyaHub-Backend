#!/bin/bash
# Azure App Service startup script for VidyaHub Backend

echo "=== VidyaHub Backend Startup ==="

# Run database migrations (node_modules already installed by Azure Oryx)
echo "Running database migrations..."
npx prisma migrate deploy

# Start the server
echo "Starting server on port 8080..."
node src/index.js
