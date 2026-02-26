#!/bin/bash

# Prayuj Teams - AWS Deployment Script
# This script automates the initial AWS infrastructure setup

set -e

echo "========================================="
echo "Prayuj Teams - AWS Deployment Setup"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Terraform not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo ""

# Step 1: Create S3 bucket for Terraform state
echo "Step 1: Creating S3 bucket for Terraform state..."
if aws s3 ls s3://prayuj-teams-terraform-state 2>/dev/null; then
    echo -e "${YELLOW}S3 bucket already exists${NC}"
else
    aws s3api create-bucket \
        --bucket prayuj-teams-terraform-state \
        --region ap-south-1 \
        --create-bucket-configuration LocationConstraint=ap-south-1
    
    aws s3api put-bucket-versioning \
        --bucket prayuj-teams-terraform-state \
        --versioning-configuration Status=Enabled
    
    aws s3api put-bucket-encryption \
        --bucket prayuj-teams-terraform-state \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'
    echo -e "${GREEN}✓ S3 bucket created${NC}"
fi
echo ""

# Step 2: Create DynamoDB table for state locking
echo "Step 2: Creating DynamoDB table for state locking..."
if aws dynamodb describe-table --table-name prayuj-terraform-lock --region ap-south-1 2>/dev/null; then
    echo -e "${YELLOW}DynamoDB table already exists${NC}"
else
    aws dynamodb create-table \
        --table-name prayuj-terraform-lock \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region ap-south-1
    echo -e "${GREEN}✓ DynamoDB table created${NC}"
fi
echo ""

# Step 3: Create EC2 key pair
echo "Step 3: Creating EC2 key pair..."
if [ -f "prayuj-monitoring-key.pem" ]; then
    echo -e "${YELLOW}Key pair already exists${NC}"
else
    aws ec2 create-key-pair \
        --key-name prayuj-monitoring-key \
        --region ap-south-1 \
        --query 'KeyMaterial' \
        --output text > prayuj-monitoring-key.pem
    chmod 400 prayuj-monitoring-key.pem
    echo -e "${GREEN}✓ Key pair created: prayuj-monitoring-key.pem${NC}"
fi
echo ""

# Step 4: Create terraform.tfvars
echo "Step 4: Creating terraform.tfvars..."
read -p "Enter DocumentDB master username [admin]: " DB_USERNAME
DB_USERNAME=${DB_USERNAME:-admin}

read -sp "Enter DocumentDB master password: " DB_PASSWORD
echo ""

read -sp "Enter JWT secret: " JWT_SECRET
echo ""

cat > terraform/terraform.tfvars <<EOF
aws_region                  = "ap-south-1"
environment                 = "prod"
vpc_cidr                    = "10.0.0.0/16"
availability_zones          = ["ap-south-1a", "ap-south-1b"]
public_subnet_cidrs         = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs        = ["10.0.10.0/24", "10.0.11.0/24"]
documentdb_instance_class   = "db.t3.medium"
key_name                    = "prayuj-monitoring-key"
documentdb_master_username  = "$DB_USERNAME"
documentdb_master_password  = "$DB_PASSWORD"
jwt_secret                  = "$JWT_SECRET"
EOF

echo -e "${GREEN}✓ terraform.tfvars created${NC}"
echo ""

# Step 5: Initialize and apply Terraform
echo "Step 5: Deploying infrastructure with Terraform..."
cd terraform

terraform init
terraform validate

echo ""
echo -e "${YELLOW}Review the plan carefully before proceeding${NC}"
terraform plan -out=tfplan

read -p "Do you want to apply this plan? (yes/no): " APPLY
if [ "$APPLY" = "yes" ]; then
    terraform apply tfplan
    echo -e "${GREEN}✓ Infrastructure deployed${NC}"
    
    # Save outputs
    terraform output > ../terraform-outputs.txt
    echo -e "${GREEN}✓ Outputs saved to terraform-outputs.txt${NC}"
else
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

cd ..
echo ""

# Step 6: Get outputs
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo ""
echo "ECR Backend Repository: $(terraform -chdir=terraform output -raw ecr_backend_repository_url)"
echo "ECR Frontend Repository: $(terraform -chdir=terraform output -raw ecr_frontend_repository_url)"
echo "ALB DNS Name: $(terraform -chdir=terraform output -raw alb_dns_name)"
echo "Prometheus URL: $(terraform -chdir=terraform output -raw prometheus_url)"
echo "Grafana URL: $(terraform -chdir=terraform output -raw grafana_url)"
echo ""

# Step 7: Build and push initial images
echo "Step 7: Building and pushing Docker images..."
read -p "Do you want to build and push Docker images now? (yes/no): " BUILD

if [ "$BUILD" = "yes" ]; then
    ECR_BACKEND=$(terraform -chdir=terraform output -raw ecr_backend_repository_url)
    ECR_FRONTEND=$(terraform -chdir=terraform output -raw ecr_frontend_repository_url)
    
    # ECR login
    aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
    
    # Build and push backend
    echo "Building backend..."
    cd backend
    docker build -f Dockerfile.prod -t prayuj-backend:latest .
    docker tag prayuj-backend:latest $ECR_BACKEND:latest
    docker push $ECR_BACKEND:latest
    cd ..
    
    # Build and push frontend
    echo "Building frontend..."
    cd frontend
    docker build -f Dockerfile.prod -t prayuj-frontend:latest .
    docker tag prayuj-frontend:latest $ECR_FRONTEND:latest
    docker push $ECR_FRONTEND:latest
    cd ..
    
    echo -e "${GREEN}✓ Docker images pushed${NC}"
fi

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Setup Jenkins on EC2 (see AWS_PRODUCTION_DEPLOYMENT.md)"
echo "2. Configure GitHub webhook"
echo "3. Access your application at: http://$(terraform -chdir=terraform output -raw alb_dns_name)"
echo ""
echo "For detailed instructions, see AWS_PRODUCTION_DEPLOYMENT.md"
echo ""
