# Quick Reference Guide - AWS Deployment

## Quick Start Commands

### 1. Deploy Infrastructure (One Command)
```bash
./deploy-to-aws.sh
```

### 2. Manual Deployment Steps

#### Setup AWS Backend
```bash
# Create S3 bucket
aws s3api create-bucket --bucket prayuj-teams-terraform-state --region ap-south-1 --create-bucket-configuration LocationConstraint=ap-south-1

# Create DynamoDB table
aws dynamodb create-table --table-name prayuj-terraform-lock --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region ap-south-1

# Create key pair
aws ec2 create-key-pair --key-name prayuj-monitoring-key --region ap-south-1 --query 'KeyMaterial' --output text > prayuj-monitoring-key.pem
chmod 400 prayuj-monitoring-key.pem
```

#### Deploy with Terraform
```bash
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

#### Build and Push Images
```bash
# Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

# Backend
cd backend
docker build -f Dockerfile.prod -t prayuj-backend .
docker tag prayuj-backend:latest <ECR_BACKEND_URL>:latest
docker push <ECR_BACKEND_URL>:latest

# Frontend
cd ../frontend
docker build -f Dockerfile.prod -t prayuj-frontend .
docker tag prayuj-frontend:latest <ECR_FRONTEND_URL>:latest
docker push <ECR_FRONTEND_URL>:latest
```

## Important URLs

### Get Outputs
```bash
cd terraform
terraform output
```

### Access Points
- **Application:** `http://<ALB_DNS_NAME>`
- **Backend API:** `http://<ALB_DNS_NAME>/api`
- **Prometheus:** `http://<MONITORING_IP>:9090`
- **Grafana:** `http://<MONITORING_IP>:3001`
- **Jenkins:** `http://<JENKINS_IP>:8080`

## Common Operations

### View Logs
```bash
# Backend logs
aws logs tail /ecs/prod-prayuj-backend --follow --region ap-south-1

# Frontend logs
aws logs tail /ecs/prod-prayuj-frontend --follow --region ap-south-1
```

### Check Service Status
```bash
aws ecs describe-services \
  --cluster prod-prayuj-cluster \
  --services prod-prayuj-backend-service prod-prayuj-frontend-service \
  --region ap-south-1
```

### Scale Services
```bash
# Scale backend
aws ecs update-service \
  --cluster prod-prayuj-cluster \
  --service prod-prayuj-backend-service \
  --desired-count 3 \
  --region ap-south-1

# Scale frontend
aws ecs update-service \
  --cluster prod-prayuj-cluster \
  --service prod-prayuj-frontend-service \
  --desired-count 3 \
  --region ap-south-1
```

### Force New Deployment
```bash
aws ecs update-service \
  --cluster prod-prayuj-cluster \
  --service prod-prayuj-backend-service \
  --force-new-deployment \
  --region ap-south-1
```

### Rollback
```bash
# List task definitions
aws ecs list-task-definitions --family-prefix prod-prayuj-backend --region ap-south-1

# Update to specific version
aws ecs update-service \
  --cluster prod-prayuj-cluster \
  --service prod-prayuj-backend-service \
  --task-definition prod-prayuj-backend:VERSION \
  --region ap-south-1
```

## Troubleshooting

### ECS Task Not Starting
```bash
# Get task ARN
TASK_ARN=$(aws ecs list-tasks --cluster prod-prayuj-cluster --service prod-prayuj-backend-service --query 'taskArns[0]' --output text --region ap-south-1)

# Describe task
aws ecs describe-tasks --cluster prod-prayuj-cluster --tasks $TASK_ARN --region ap-south-1
```

### Check Target Health
```bash
# Get target group ARN
TG_ARN=$(aws elbv2 describe-target-groups --names prod-prayuj-backend-tg --query 'TargetGroups[0].TargetGroupArn' --output text --region ap-south-1)

# Check health
aws elbv2 describe-target-health --target-group-arn $TG_ARN --region ap-south-1
```

### DocumentDB Connection Test
```bash
# From ECS task
mongosh "mongodb://admin:PASSWORD@DOCDB_ENDPOINT:27017/?tls=true&tlsCAFile=rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
```

### Jenkins Issues
```bash
# SSH to Jenkins instance
ssh -i prayuj-monitoring-key.pem ubuntu@<JENKINS_IP>

# Check Jenkins logs
sudo tail -f /var/log/jenkins/jenkins.log

# Restart Jenkins
sudo systemctl restart jenkins

# Check Docker
sudo systemctl status docker
```

## Monitoring

### CloudWatch Metrics
```bash
# CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=prod-prayuj-backend-service Name=ClusterName,Value=prod-prayuj-cluster \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region ap-south-1
```

### Prometheus Queries
```promql
# Container CPU usage
container_cpu_usage_seconds_total

# Container memory usage
container_memory_usage_bytes

# HTTP request rate
rate(http_requests_total[5m])
```

## Cost Management

### View Current Costs
```bash
# Get cost for last 30 days
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '30 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region ap-south-1
```

### Stop Non-Production Resources
```bash
# Stop ECS services (set desired count to 0)
aws ecs update-service --cluster prod-prayuj-cluster --service prod-prayuj-backend-service --desired-count 0 --region ap-south-1
aws ecs update-service --cluster prod-prayuj-cluster --service prod-prayuj-frontend-service --desired-count 0 --region ap-south-1

# Stop monitoring instance
aws ec2 stop-instances --instance-ids <MONITORING_INSTANCE_ID> --region ap-south-1

# Stop Jenkins instance
aws ec2 stop-instances --instance-ids <JENKINS_INSTANCE_ID> --region ap-south-1
```

## Backup and Restore

### DocumentDB Backup
```bash
# Create manual snapshot
aws docdb create-db-cluster-snapshot \
  --db-cluster-snapshot-identifier prayuj-manual-snapshot-$(date +%Y%m%d) \
  --db-cluster-identifier prod-prayuj-docdb-cluster \
  --region ap-south-1

# List snapshots
aws docdb describe-db-cluster-snapshots \
  --db-cluster-identifier prod-prayuj-docdb-cluster \
  --region ap-south-1
```

### Restore from Snapshot
```bash
aws docdb restore-db-cluster-from-snapshot \
  --db-cluster-identifier prod-prayuj-docdb-cluster-restored \
  --snapshot-identifier prayuj-manual-snapshot-20260212 \
  --engine docdb \
  --region ap-south-1
```

## Security

### Rotate Secrets
```bash
# Update DocumentDB password
aws docdb modify-db-cluster \
  --db-cluster-identifier prod-prayuj-docdb-cluster \
  --master-user-password NewSecurePassword123! \
  --apply-immediately \
  --region ap-south-1

# Update ECS task definition with new password
# Then force new deployment
```

### Review Security Groups
```bash
# List security groups
aws ec2 describe-security-groups \
  --filters "Name=tag:Project,Values=Prayuj-Teams" \
  --region ap-south-1
```

### Enable CloudTrail
```bash
aws cloudtrail create-trail \
  --name prayuj-teams-trail \
  --s3-bucket-name prayuj-cloudtrail-logs \
  --region ap-south-1

aws cloudtrail start-logging --name prayuj-teams-trail --region ap-south-1
```

## Cleanup

### Destroy Everything
```bash
cd terraform
terraform destroy

# Delete S3 bucket
aws s3 rb s3://prayuj-teams-terraform-state --force --region ap-south-1

# Delete DynamoDB table
aws dynamodb delete-table --table-name prayuj-terraform-lock --region ap-south-1

# Delete key pair
aws ec2 delete-key-pair --key-name prayuj-monitoring-key --region ap-south-1
rm prayuj-monitoring-key.pem
```

## Environment Variables

### Required for Backend
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:PASSWORD@ENDPOINT:27017/prayuj?tls=true&tlsCAFile=rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
JWT_SECRET=your-secret-key
```

### Required for Frontend
```bash
REACT_APP_API_URL=http://<ALB_DNS_NAME>
```

## Jenkins Credentials IDs

- `aws-credentials` - AWS Access Key and Secret
- `ecr-backend-repo-url` - Backend ECR repository URL
- `ecr-frontend-repo-url` - Frontend ECR repository URL
- `ecs-cluster-name` - ECS cluster name
- `aws-account-id` - AWS account ID

## Support Contacts

- **AWS Support:** https://console.aws.amazon.com/support/
- **Terraform Docs:** https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- **ECS Docs:** https://docs.aws.amazon.com/ecs/
- **DocumentDB Docs:** https://docs.aws.amazon.com/documentdb/

## Useful Links

- [AWS Pricing Calculator](https://calculator.aws)
- [AWS Status Page](https://status.aws.amazon.com/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
