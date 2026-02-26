# Quick Start Commands

## Initial Setup

```bash
# 1. Install prerequisites
brew install terraform awscli  # macOS
# or
sudo apt install terraform awscli  # Ubuntu

# 2. Configure AWS
aws configure

# 3. Deploy infrastructure
./deploy-aws.sh
```

## Jenkins Setup

```bash
# Install Jenkins (Ubuntu)
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt update
sudo apt install jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

## Docker Commands

```bash
# Build images locally
docker build -f backend/Dockerfile.prod -t prayuj-backend .
docker build -f frontend/Dockerfile.prod -t prayuj-frontend .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
docker tag prayuj-backend:latest <ECR_BACKEND_URL>:latest
docker push <ECR_BACKEND_URL>:latest
```

## Terraform Commands

```bash
cd terraform

# Initialize
terraform init

# Plan
terraform plan

# Apply
terraform apply

# Destroy
terraform destroy

# Show outputs
terraform output
```

## AWS CLI Commands

```bash
# List ECS services
aws ecs list-services --cluster prod-prayuj-cluster

# Describe service
aws ecs describe-services --cluster prod-prayuj-cluster --services prod-prayuj-backend

# View logs
aws logs tail /ecs/prod-prayuj-backend --follow

# Update service (force new deployment)
aws ecs update-service --cluster prod-prayuj-cluster --service prod-prayuj-backend --force-new-deployment

# List ECR images
aws ecr list-images --repository-name prod-prayuj-backend

# DocumentDB connection
aws docdb describe-db-clusters --db-cluster-identifier prod-prayuj-docdb
```

## Monitoring

```bash
# Get Prometheus IP
aws ecs list-tasks --cluster prod-prayuj-cluster --service-name prod-prometheus
aws ecs describe-tasks --cluster prod-prayuj-cluster --tasks <task-arn> | grep "publicIp"

# Get Grafana IP
aws ecs list-tasks --cluster prod-prayuj-cluster --service-name prod-grafana
aws ecs describe-tasks --cluster prod-prayuj-cluster --tasks <task-arn> | grep "publicIp"
```

## Troubleshooting

```bash
# Check ECS task status
aws ecs describe-tasks --cluster prod-prayuj-cluster --tasks <task-id>

# Check service events
aws ecs describe-services --cluster prod-prayuj-cluster --services prod-prayuj-backend --query 'services[0].events[0:5]'

# Check ALB health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# SSH to DocumentDB (from EC2 in same VPC)
mongo --ssl --host <docdb-endpoint>:27017 --sslCAFile rds-combined-ca-bundle.pem --username admin --password <password>
```

## Environment Variables

Create `terraform/terraform.tfvars`:
```hcl
db_master_username = "admin"
db_master_password = "SecurePassword123!"
jwt_secret = "your-jwt-secret-key"
```

## Jenkins Credentials

Add in Jenkins UI:
- `aws-account-id`: Your AWS Account ID (e.g., 123456789012)
- `ecr-backend-repo-url`: From terraform output
- `ecr-frontend-repo-url`: From terraform output

## URLs After Deployment

```bash
# Get ALB URL
terraform output alb_dns_name

# Application: http://<ALB_DNS>
# Backend API: http://<ALB_DNS>/api
# Prometheus: http://<PROMETHEUS_IP>:9090
# Grafana: http://<GRAFANA_IP>:3000
```
