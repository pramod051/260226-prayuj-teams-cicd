#!/bin/bash

echo "🚀 Deploying Talk With Teams Chat Application..."

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Remove old images (optional)
echo "Removing old images..."
docker-compose down --rmi all

# Build and start containers
echo "Building and starting containers..."
docker-compose up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Check if services are running
echo "Checking service status..."
docker-compose ps

echo "✅ Talk With Teams deployment complete!"
echo ""
echo "🌐 Access your application at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   MongoDB: localhost:27017"
echo ""
echo "📋 Default MongoDB credentials:"
echo "   Username: admin"
echo "   Password: password123"
echo ""
echo "🔧 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop the application:"
echo "   docker-compose down"
