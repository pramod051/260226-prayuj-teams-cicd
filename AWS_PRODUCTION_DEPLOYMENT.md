# AWS Production Deployment Guide - Prayuj Teams

Complete guide to deploy Prayuj Teams chat application on AWS using Terraform, Jenkins, ECR, ECS, DocumentDB, Prometheus, and Grafana.

## Architecture Overview

```
GitHub → Jenkins → AWS ECR → AWS ECS (Fargate) → ALB → Users
                                ↓
                          DocumentDB (MongoDB)
                                ↓
                    Prometheus + Grafana (EC2 t2.medium)
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Terraform** >= 1.0 installed
4. **Docker** installed
5. **Git** repository (GitHub)
6. **SSH Key Pair** for EC2 monitoring instance

## Step 1: Initial AWS Setup

### 1.1 Create S3 Bucket for Terraform State

```bash
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
```

### 1.2 Create DynamoDB Table for State Locking

```bash
aws dynamodb create-table \
    --table-name prayuj-terraform-lock \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region ap-south-1
```

### 1.3 Create EC2 Key Pair

```bash
aws ec2 create-key-pair \
    --key-name prayuj-monitoring-key \
    --region ap-south-1 \
    --query 'KeyMaterial' \
    --output text > prayuj-monitoring-key.pem

chmod 400 prayuj-monitoring-key.pem
```

## Step 2: Configure Terraform Variables

Create `terraform/terraform.tfvars` with sensitive values:

```bash
cd terraform

cat > terraform.tfvars <<EOF
aws_region                  = "ap-south-1"
environment                 = "prod"
vpc_cidr                    = "10.0.0.0/16"
availability_zones          = ["ap-south-1a", "ap-south-1b"]
public_subnet_cidrs         = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs        = ["10.0.10.0/24", "10.0.11.0/24"]
documentdb_instance_class   = "db.t3.medium"
key_name                    = "prayuj-monitoring-key"
documentdb_master_username  = "admin"
documentdb_master_password  = "YourSecurePassword123!"
jwt_secret                  = "your-super-secret-jwt-key-change-this-in-production"
EOF
```

**Important:** Add `terraform.tfvars` to `.gitignore` to avoid committing secrets.

## Step 3: Deploy Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

This will create:
- VPC with public/private subnets
- ECR repositories for frontend and backend
- DocumentDB cluster (2 instances)
- Application Load Balancer
- ECS Cluster with Fargate services
- EC2 instance for Prometheus + Grafana

**Note:** Save the outputs:
```bash
terraform output > outputs.txt
```

## Step 4: Setup Jenkins on EC2

### 4.1 Launch Jenkins EC2 Instance

```bash
# Create security group for Jenkins
aws ec2 create-security-group \
    --group-name prayuj-jenkins-sg \
    --description "Security group for Jenkins" \
    --vpc-id $(terraform output -raw vpc_id) \
    --region ap-south-1

# Add inbound rules
aws ec2 authorize-security-group-ingress \
    --group-id <JENKINS_SG_ID> \
    --protocol tcp --port 8080 --cidr 0.0.0.0/0 \
    --region ap-south-1

aws ec2 authorize-security-group-ingress \
    --group-id <JENKINS_SG_ID> \
    --protocol tcp --port 22 --cidr 0.0.0.0/0 \
    --region ap-south-1

# Launch instance
aws ec2 run-instances \
    --image-id ami-0f58b397bc5c1f2e8 \
    --instance-type t2.medium \
    --key-name prayuj-monitoring-key \
    --security-group-ids <JENKINS_SG_ID> \
    --subnet-id $(terraform output -json public_subnet_ids | jq -r '.[0]') \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=prayuj-jenkins}]' \
    --region ap-south-1
```

### 4.2 Install Jenkins

SSH into the instance:
```bash
ssh -i prayuj-monitoring-key.pem ubuntu@<JENKINS_PUBLIC_IP>
```

Run installation script:
```bash
#!/bin/bash
sudo apt update
sudo apt install -y openjdk-11-jdk docker.io awscli

# Install Jenkins
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Add Jenkins to docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### 4.3 Configure Jenkins

1. Access Jenkins: `http://<JENKINS_PUBLIC_IP>:8080`
2. Enter initial admin password
3. Install suggested plugins
4. Create admin user
5. Install additional plugins:
   - AWS Steps
   - Docker Pipeline
   - GitHub Integration

### 4.4 Add Jenkins Credentials

Go to **Manage Jenkins → Credentials → Global → Add Credentials**:

1. **AWS Credentials**
   - Kind: AWS Credentials
   - ID: `aws-credentials`
   - Access Key ID: Your AWS Access Key
   - Secret Access Key: Your AWS Secret Key

2. **ECR Backend Repo URL**
   - Kind: Secret text
   - ID: `ecr-backend-repo-url`
   - Secret: `<AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/prod-prayuj-backend`

3. **ECR Frontend Repo URL**
   - Kind: Secret text
   - ID: `ecr-frontend-repo-url`
   - Secret: `<AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/prod-prayuj-frontend`

4. **ECS Cluster Name**
   - Kind: Secret text
   - ID: `ecs-cluster-name`
   - Secret: `prod-prayuj-cluster`

5. **AWS Account ID**
   - Kind: Secret text
   - ID: `aws-account-id`
   - Secret: Your AWS Account ID

### 4.5 Create Jenkins Pipeline

1. New Item → Pipeline
2. Name: `prayuj-teams-deployment`
3. Pipeline → Definition: Pipeline script from SCM
4. SCM: Git
5. Repository URL: Your GitHub repo URL
6. Credentials: Add GitHub credentials
7. Branch: `*/main`
8. Script Path: `Jenkinsfile`
9. Save

## Step 5: Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit with AWS deployment"

# Add remote and push
git remote add origin <YOUR_GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

## Step 6: Configure GitHub Webhook

1. Go to GitHub repository → Settings → Webhooks
2. Add webhook:
   - Payload URL: `http://<JENKINS_PUBLIC_IP>:8080/github-webhook/`
   - Content type: `application/json`
   - Events: Just the push event
   - Active: ✓

## Step 7: Initial Docker Image Push

Before Jenkins can deploy, push initial images:

```bash
# Get ECR login
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

# Build and push backend
cd backend
docker build -f Dockerfile.prod -t prod-prayuj-backend:latest .
docker tag prod-prayuj-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/prod-prayuj-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/prod-prayuj-backend:latest

# Build and push frontend
cd ../frontend
docker build -f Dockerfile.prod -t prod-prayuj-frontend:latest .
docker tag prod-prayuj-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/prod-prayuj-frontend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/prod-prayuj-frontend:latest
```

## Step 8: Access Your Application

Get the ALB DNS name:
```bash
terraform output alb_dns_name
```

Access your application:
- **Frontend:** `http://<ALB_DNS_NAME>`
- **Backend API:** `http://<ALB_DNS_NAME>/api`

## Step 9: Setup Monitoring

### Access Prometheus
```bash
terraform output prometheus_url
# Default: http://<MONITORING_IP>:9090
```

### Access Grafana
```bash
terraform output grafana_url
# Default: http://<MONITORING_IP>:3001
# Username: admin
# Password: admin
```

### Configure Grafana Dashboard

1. Login to Grafana
2. Add Prometheus datasource (already configured)
3. Import dashboard:
   - Dashboard ID: 1860 (Node Exporter Full)
   - Dashboard ID: 10000 (ECS Cluster Monitoring)

## Step 10: Setup Custom Domain (Optional)

### 10.1 Create Route53 Hosted Zone

```bash
aws route53 create-hosted-zone \
    --name yourdomain.com \
    --caller-reference $(date +%s) \
    --region ap-south-1
```

### 10.2 Create SSL Certificate

```bash
aws acm request-certificate \
    --domain-name yourdomain.com \
    --subject-alternative-names www.yourdomain.com \
    --validation-method DNS \
    --region ap-south-1
```

### 10.3 Update ALB Listener

Add HTTPS listener to ALB module in Terraform and apply.

## Maintenance Commands

### View ECS Service Status
```bash
aws ecs describe-services \
    --cluster prod-prayuj-cluster \
    --services prod-prayuj-backend-service prod-prayuj-frontend-service \
    --region ap-south-1
```

### View Logs
```bash
# Backend logs
aws logs tail /ecs/prod-prayuj-backend --follow --region ap-south-1

# Frontend logs
aws logs tail /ecs/prod-prayuj-frontend --follow --region ap-south-1
```

### Scale Services
```bash
aws ecs update-service \
    --cluster prod-prayuj-cluster \
    --service prod-prayuj-backend-service \
    --desired-count 3 \
    --region ap-south-1
```

### Rollback Deployment
```bash
# List task definitions
aws ecs list-task-definitions --family-prefix prod-prayuj-backend --region ap-south-1

# Update to previous version
aws ecs update-service \
    --cluster prod-prayuj-cluster \
    --service prod-prayuj-backend-service \
    --task-definition prod-prayuj-backend:PREVIOUS_VERSION \
    --region ap-south-1
```

## Troubleshooting

### ECS Tasks Not Starting
```bash
# Check task status
aws ecs describe-tasks \
    --cluster prod-prayuj-cluster \
    --tasks $(aws ecs list-tasks --cluster prod-prayuj-cluster --service prod-prayuj-backend-service --query 'taskArns[0]' --output text --region ap-south-1) \
    --region ap-south-1
```

### DocumentDB Connection Issues
- Ensure ECS tasks are in private subnets
- Check security group rules
- Verify connection string format

### Jenkins Build Failures
- Check Jenkins logs: `/var/log/jenkins/jenkins.log`
- Verify AWS credentials
- Ensure Docker is running

## Cost Estimation

Monthly costs (approximate):
- **ECS Fargate:** $50-100 (2 backend + 2 frontend tasks)
- **DocumentDB:** $200-300 (2 db.t3.medium instances)
- **ALB:** $20-30
- **EC2 (Jenkins + Monitoring):** $60-80 (2 x t2.medium)
- **Data Transfer:** $10-50
- **Total:** ~$340-560/month

## Cleanup

To destroy all resources:

```bash
cd terraform
terraform destroy
```

Delete S3 bucket and DynamoDB table:
```bash
aws s3 rb s3://prayuj-teams-terraform-state --force --region ap-south-1
aws dynamodb delete-table --table-name prayuj-terraform-lock --region ap-south-1
```

## Security Best Practices

1. ✅ Use AWS Secrets Manager for sensitive data
2. ✅ Enable VPC Flow Logs
3. ✅ Enable CloudTrail
4. ✅ Use IAM roles instead of access keys
5. ✅ Enable MFA for AWS account
6. ✅ Regular security audits
7. ✅ Keep dependencies updated
8. ✅ Use HTTPS with valid SSL certificates

## Support

For issues or questions:
- Check CloudWatch Logs
- Review ECS task definitions
- Verify security group rules
- Check DocumentDB connectivity

---

**Deployment Complete!** 🚀

Your Prayuj Teams application is now running on AWS with production-grade infrastructure, CI/CD pipeline, and monitoring.
