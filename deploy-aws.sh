#!/bin/bash

set -e

echo "=== Prayuj Teams AWS Deployment Script ==="

# Variables
AWS_REGION="us-east-1"
ENVIRONMENT="prod"

# Step 1: Initialize Terraform
echo "Step 1: Initializing Terraform..."
cd terraform
terraform init

# Step 2: Create S3 bucket for Terraform state (if not exists)
echo "Step 2: Creating S3 bucket for Terraform state..."
aws s3api create-bucket \
    --bucket prayuj-teams-terraform-state \
    --region $AWS_REGION \
    --create-bucket-configuration LocationConstraint=$AWS_REGION 2>/dev/null || echo "Bucket already exists"

aws s3api put-bucket-versioning \
    --bucket prayuj-teams-terraform-state \
    --versioning-configuration Status=Enabled

# Step 3: Create DynamoDB table for state locking
echo "Step 3: Creating DynamoDB table for state locking..."
aws dynamodb create-table \
    --table-name terraform-state-lock \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION 2>/dev/null || echo "Table already exists"

# Step 4: Plan Terraform
echo "Step 4: Planning Terraform deployment..."
terraform plan -out=tfplan

# Step 5: Apply Terraform
echo "Step 5: Applying Terraform configuration..."
read -p "Do you want to apply these changes? (yes/no): " confirm
if [ "$confirm" == "yes" ]; then
    terraform apply tfplan
else
    echo "Deployment cancelled"
    exit 1
fi

# Step 6: Get outputs
echo "Step 6: Getting deployment outputs..."
ECR_BACKEND=$(terraform output -raw ecr_backend_repository_url)
ECR_FRONTEND=$(terraform output -raw ecr_frontend_repository_url)
ALB_DNS=$(terraform output -raw alb_dns_name)

echo ""
echo "=== Deployment Complete ==="
echo "Backend ECR: $ECR_BACKEND"
echo "Frontend ECR: $ECR_FRONTEND"
echo "Application URL: http://$ALB_DNS"
echo ""
echo "Next steps:"
echo "1. Configure Jenkins with AWS credentials"
echo "2. Add ECR repository URLs to Jenkins credentials"
echo "3. Push code to GitHub to trigger Jenkins pipeline"
echo "4. Access Prometheus and Grafana from ECS console"
