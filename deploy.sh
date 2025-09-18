#!/bin/bash

# Simple deployment script for server setup
set -e

# Configuration
PROJECT_DIR="/opt/timetracker"
REPO_URL="https://github.com/your-username/timetracker.git"

echo "🚀 Starting deployment..."

# Create project directory if it doesn't exist
sudo mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clone or update repository
if [ -d ".git" ]; then
    echo "📦 Updating existing repository..."
    git pull origin main
else
    echo "📦 Cloning repository..."
    git clone $REPO_URL .
fi

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your production values!"
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deployment completed!"
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend API: http://localhost:8000"
echo "📍 API Docs: http://localhost:8000/docs"