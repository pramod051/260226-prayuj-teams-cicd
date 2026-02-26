# Prayuj Teams - AWS Production Deployment Guide

## Architecture Overview

```
GitHub → Jenkins → AWS ECR → AWS ECS (Fargate)
                              ↓
                         AWS DocumentDB
                              ↓
                    Prometheus + Grafana (Monitoring)
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Terraform** >= 1.0 installed
4. **Docker** installed
5. **Jenkins** server setup
6. **GitHub** repository

## Step-by-Step Deployment

### 1. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json
```

### 2. Set Terraform Variables

Create `terraform/terraform.tfvars` with sensitive values:

```hcl
db_master_username = "admin"
db_master_password = "YourSecurePassword123!"
jwt_secret = "your-super-secret-jwt-key-change-this"
```

### 3. Deploy Infrastructure

```bash
./deploy-aws.sh
```

This script will:
- Create S3 bucket for Terraform state
- Create DynamoDB table for state locking
- Deploy VPC, subnets, NAT gateways
- Create ECR repositories
- Deploy DocumentDB cluster
- Create Application Load Balancer
- Deploy ECS cluster with Fargate
- Setup Prometheus and Grafana

### 4. Configure Jenkins

#### Install Required Plugins
- AWS Steps Plugin
- Docker Pipeline Plugin
- GitHub Integration Plugin

#### Add Credentials in Jenkins
1. Go to Jenkins → Manage Jenkins → Credentials
2. Add the following credentials:
   - `aws-account-id`: Your AWS Account ID
   - `ecr-backend-repo-url`: Backend ECR repository URL (from Terraform output)
   - `ecr-frontend-repo-url`: Frontend ECR repository URL (from Terraform output)

#### Configure AWS Credentials
```bash
# On Jenkins server
aws configure
```

#### Create Jenkins Pipeline Job
1. New Item → Pipeline
2. Pipeline script from SCM
3. SCM: Git
4. Repository URL: Your GitHub repo
5. Script Path: Jenkinsfile

### 5. Setup GitHub Webhook

1. Go to GitHub repository → Settings → Webhooks
2. Add webhook:
   - Payload URL: `http://your-jenkins-url/github-webhook/`
   - Content type: `application/json`
   - Events: Push events

### 6. Initial Docker Image Push

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -f Dockerfile.prod -t <ECR_BACKEND_URL>:latest .
docker push <ECR_BACKEND_URL>:latest

# Build and push frontend
cd ../frontend
docker build -f Dockerfile.prod -t <ECR_FRONTEND_URL>:latest .
docker push <ECR_FRONTEND_URL>:latest
```

### 7. Access Application

After deployment completes:

```bash
# Get ALB DNS name
cd terraform
terraform output alb_dns_name
```

Access your application at: `http://<ALB_DNS_NAME>`

### 8. Configure Monitoring

#### Access Prometheus
1. Go to AWS ECS Console
2. Find `prod-prometheus` service
3. Get the public IP from task details
4. Access: `http://<PROMETHEUS_IP>:9090`

#### Access Grafana
1. Go to AWS ECS Console
2. Find `prod-grafana` service
3. Get the public IP from task details
4. Access: `http://<GRAFANA_IP>:3000`
5. Default credentials: admin/admin

#### Configure Grafana
1. Add Prometheus datasource (already configured in datasource.yml)
2. Import dashboard from `monitoring/grafana/dashboard.json`

## CI/CD Workflow

1. Developer pushes code to GitHub
2. GitHub webhook triggers Jenkins
3. Jenkins builds Docker images
4. Jenkins pushes images to ECR
5. Jenkins updates ECS services
6. ECS pulls new images and deploys
7. Health checks verify deployment

## Monitoring & Alerts

### Key Metrics to Monitor
- CPU utilization
- Memory usage
- Request latency
- Error rates
- Database connections

### CloudWatch Logs
```bash
# View backend logs
aws logs tail /ecs/prod-prayuj-backend --follow

# View frontend logs
aws logs tail /ecs/prod-prayuj-frontend --follow
```

## Scaling

### Auto Scaling (Optional)
Add to `terraform/modules/ecs/main.tf`:

```hcl
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "backend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
```

## Backup & Disaster Recovery

### DocumentDB Backups
- Automated daily backups (7-day retention)
- Manual snapshots available in AWS Console

### Restore from Backup
```bash
aws docdb restore-db-cluster-from-snapshot \
  --db-cluster-identifier prod-prayuj-docdb-restored \
  --snapshot-identifier <snapshot-id>
```

## Security Best Practices

1. **Enable SSL/TLS**: Add ACM certificate to ALB
2. **Secrets Management**: Use AWS Secrets Manager
3. **Network Security**: Review security group rules
4. **IAM Roles**: Follow least privilege principle
5. **Enable WAF**: Add AWS WAF to ALB

## Cost Optimization

### Estimated Monthly Costs
- ECS Fargate: ~$50-100
- DocumentDB: ~$200-300
- ALB: ~$20-30
- Data Transfer: ~$10-50
- **Total: ~$280-480/month**

### Cost Reduction Tips
1. Use Reserved Instances for predictable workloads
2. Enable auto-scaling to match demand
3. Use Spot instances for non-critical tasks
4. Review and delete unused resources

## Troubleshooting

### ECS Tasks Not Starting
```bash
# Check task logs
aws ecs describe-tasks --cluster prod-prayuj-cluster --tasks <task-id>

# Check service events
aws ecs describe-services --cluster prod-prayuj-cluster --services prod-prayuj-backend
```

### DocumentDB Connection Issues
- Verify security group allows traffic from ECS tasks
- Check connection string format
- Ensure TLS certificate is downloaded

### Jenkins Build Failures
- Check AWS credentials in Jenkins
- Verify ECR repository URLs
- Check Docker daemon is running

## Cleanup

To destroy all resources:

```bash
cd terraform
terraform destroy
```

**Warning**: This will delete all resources including databases!

## Support

For issues or questions:
1. Check CloudWatch Logs
2. Review ECS service events
3. Check Prometheus metrics
4. Review Grafana dashboards

## Next Steps

1. **Add HTTPS**: Configure ACM certificate and update ALB listener
2. **Custom Domain**: Add Route53 DNS records
3. **Email Notifications**: Configure SNS for alerts
4. **Enhanced Monitoring**: Add custom CloudWatch metrics
5. **Backup Strategy**: Implement automated backup verification
