#!/bin/bash

echo "🚀 Deploying Talk With Teams to Production..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | xargs)
else
    echo "❌ .env.production file not found!"
    exit 1
fi

# Pull latest images and deploy
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# Clean up unused images
docker system prune -f

echo "✅ Deployment completed!"
echo "🌐 Application available at: http://your-domain.com"
