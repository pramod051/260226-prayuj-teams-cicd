#!/bin/bash

# Jenkins Installation Script for Ubuntu 22.04
# Run this on your Jenkins EC2 instance

set -e

echo "========================================="
echo "Jenkins Installation for Prayuj Teams"
echo "========================================="
echo ""

# Update system
echo "Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Java 11
echo "Installing Java 11..."
sudo apt install -y openjdk-11-jdk

# Install Docker
echo "Installing Docker..."
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker

# Install AWS CLI
echo "Installing AWS CLI..."
sudo apt install -y awscli

# Add Jenkins repository
echo "Adding Jenkins repository..."
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
echo "Installing Jenkins..."
sudo apt update
sudo apt install -y jenkins

# Start Jenkins
echo "Starting Jenkins..."
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Add Jenkins to docker group
echo "Adding Jenkins to docker group..."
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# Wait for Jenkins to start
echo "Waiting for Jenkins to start..."
sleep 30

# Get initial admin password
echo ""
echo "========================================="
echo "Jenkins Installation Complete!"
echo "========================================="
echo ""
echo "Initial Admin Password:"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
echo ""
echo "Access Jenkins at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080"
echo ""
echo "Next steps:"
echo "1. Open Jenkins in your browser"
echo "2. Enter the initial admin password above"
echo "3. Install suggested plugins"
echo "4. Create admin user"
echo "5. Install additional plugins: AWS Steps, Docker Pipeline, GitHub Integration"
echo ""
