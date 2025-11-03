#!/bin/bash

echo "🐳 Starting Kuiz with Docker..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker is running"
echo ""
echo "🚀 Building and starting services..."
echo "   - MongoDB (port 27017)"
echo "   - Kuiz App (port 3000)"
echo ""

# Build and start services
docker-compose up --build -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Kuiz is running!"
    echo ""
    echo "📝 Access the app:"
    echo "   🌐 URL: http://localhost:3000"
    echo ""
    echo "🔐 Demo credentials:"
    echo "   📧 Email: demo@kuiz.app"
    echo "   🔑 Password: password123"
    echo ""
    echo "📊 View logs:"
    echo "   docker-compose logs -f app"
    echo ""
    echo "🛑 To stop:"
    echo "   docker-compose down"
    echo ""
else
    echo ""
    echo "❌ Error: Services failed to start"
    echo "Check logs with: docker-compose logs"
    exit 1
fi
