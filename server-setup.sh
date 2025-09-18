#!/bin/bash

# Server Setup Script für Timetracker Deployment
echo "🚀 Starting Timetracker server setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
sudo apt-get install -y git curl

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
echo "👤 Adding user to docker group..."
sudo usermod -aG docker $USER

# Install Docker Compose (if not already included)
echo "🔧 Verifying Docker Compose..."
docker compose version || {
    echo "Installing Docker Compose..."
    sudo apt-get update
    sudo apt-get install docker-compose-plugin -y
}

# Create deployment directory
echo "📁 Creating deployment directory..."
sudo mkdir -p /opt/timetracker
sudo chown $USER:$USER /opt/timetracker

# Install Nginx (optional)
read -p "🌐 Install Nginx for reverse proxy? (y/n): " install_nginx
if [[ $install_nginx == "y" || $install_nginx == "Y" ]]; then
    echo "🌐 Installing Nginx..."
    sudo apt-get install -y nginx

    # Install Certbot for SSL
    echo "🔒 Installing Certbot for SSL..."
    sudo apt-get install -y certbot python3-certbot-nginx

    echo "✅ Nginx installed. Configure SSL with:"
    echo "sudo certbot --nginx -d timetracker.hkp-solutions.de -d timeapi.hkp-solutions.de"
fi

echo "✅ Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Logout and login again (or run 'newgrp docker')"
echo "2. Configure GitHub Actions secrets:"
echo "   - HOST: $(curl -s ifconfig.me)"
echo "   - USERNAME: $USER"
echo "   - DEPLOY_PATH: /opt/timetracker"
echo "   - PRIVATE_KEY: (your SSH private key)"
echo "   - POSTGRES_PASSWORD: (secure database password)"
echo "   - SECRET_KEY: (JWT secret key, 32+ characters)"
echo ""
echo "3. Push to main branch to trigger deployment"
echo "4. Configure .env file in /opt/timetracker after first deployment"