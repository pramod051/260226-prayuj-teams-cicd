# Troubleshooting Guide - Prayuj Teams AWS Deployment

## Common Issues and Solutions

### 1. Terraform Issues

#### Issue: "Error acquiring the state lock"
**Cause**: Previous Terraform run didn't complete properly

**Solution**:
```bash
# Check who has the lock
aws dynamodb get-item --table-name terraform-state-lock --key '{"LockID":{"S":"prayuj-teams-terraform-state/prod/terraform.tfstate"}}'

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

#### Issue: "Error creating VPC: VpcLimitExceeded"
**Cause**: AWS account VPC limit reached

**Solution**:
```bash
# Check current VPCs
aws ec2 describe-vpcs

# Delete unused VPCs or request limit increase
aws service-quotas request-service-quota-increase \
  --service-code vpc \
  --quota-code L-F678F1CE \
  --desired-value 10
```

#### Issue: "Error: InvalidParameterException: The new password does not conform to the policy"
**Cause**: DocumentDB password doesn't meet requirements

**Solution**:
Update `terraform/terraform.tfvars`:
- Minimum 8 characters
- Must contain uppercase, lowercase, and numbers
- No special characters like @, /, "

Example: `db_master_password = "SecurePass123"`

---

### 2. Docker/ECR Issues

#### Issue: "denied: Your authorization token has expired"
**Cause**: ECR login token expired (valid for 12 hours)

**Solution**:
```bash
# Re-login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

#### Issue: "Error: Cannot connect to the Docker daemon"
**Cause**: Docker service not running

**Solution**:
```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker
sudo systemctl enable docker
```

#### Issue: "no space left on device"
**Cause**: Docker disk space full

**Solution**:
```bash
# Clean up Docker
docker system prune -a --volumes

# Check disk space
df -h
```

---

### 3. ECS Issues

#### Issue: ECS tasks keep stopping
**Cause**: Multiple possible reasons

**Solution**:
```bash
# Check task logs
aws ecs describe-tasks \
  --cluster prod-prayuj-cluster \
  --tasks <TASK_ARN> \
  --query 'tasks[0].stoppedReason'

# Check CloudWatch logs
aws logs tail /ecs/prod-prayuj-backend --follow

# Common fixes:
# 1. Check environment variables in task definition
# 2. Verify security group allows outbound traffic
# 3. Check if image exists in ECR
# 4. Verify IAM role permissions
```

#### Issue: "CannotPullContainerError"
**Cause**: ECS can't pull image from ECR

**Solution**:
```bash
# Verify image exists
aws ecr describe-images \
  --repository-name prod-prayuj-backend

# Check task execution role has ECR permissions
aws iam get-role-policy \
  --role-name prod-ecs-task-execution-role \
  --policy-name AmazonECSTaskExecutionRolePolicy

# Ensure task is in private subnet with NAT gateway
```

#### Issue: Tasks running but health checks failing
**Cause**: Health check endpoint not responding

**Solution**:
```bash
# Test health endpoint locally
curl http://<TASK_IP>:5000/api/health

# Check security group allows ALB to reach tasks
aws ec2 describe-security-groups \
  --group-ids <ECS_SECURITY_GROUP_ID>

# Verify health check path in target group
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN>
```

---

### 4. DocumentDB Issues

#### Issue: "Connection timeout" to DocumentDB
**Cause**: Network or security group issue

**Solution**:
```bash
# Verify security group allows traffic from ECS
aws ec2 describe-security-groups \
  --group-ids <DOCDB_SECURITY_GROUP_ID>

# Should allow port 27017 from ECS security group

# Test from ECS task (exec into container)
aws ecs execute-command \
  --cluster prod-prayuj-cluster \
  --task <TASK_ID> \
  --container backend \
  --interactive \
  --command "/bin/sh"

# Then inside container:
nc -zv <DOCDB_ENDPOINT> 27017
```

#### Issue: "SSL/TLS certificate error"
**Cause**: Missing or incorrect TLS certificate

**Solution**:
```bash
# Verify certificate downloaded in Dockerfile
# Should be in backend/Dockerfile.prod:
# RUN wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Check connection string includes TLS parameters:
# mongodb://user:pass@endpoint:27017/db?tls=true&tlsCAFile=rds-combined-ca-bundle.pem
```

---

### 5. ALB Issues

#### Issue: "502 Bad Gateway"
**Cause**: Backend not responding or health checks failing

**Solution**:
```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN>

# Check backend logs
aws logs tail /ecs/prod-prayuj-backend --follow

# Verify security group allows ALB to reach ECS
# ALB SG → ECS SG on port 5000
```

#### Issue: "504 Gateway Timeout"
**Cause**: Backend taking too long to respond

**Solution**:
```bash
# Increase ALB timeout (default 60s)
aws elbv2 modify-target-group-attributes \
  --target-group-arn <TARGET_GROUP_ARN> \
  --attributes Key=deregistration_delay.timeout_seconds,Value=120

# Check backend performance
# Look for slow database queries or API calls
```

---

### 6. Jenkins Issues

#### Issue: Jenkins can't connect to AWS
**Cause**: AWS credentials not configured

**Solution**:
```bash
# On Jenkins server
aws configure

# Or add credentials in Jenkins UI:
# Manage Jenkins → Credentials → Add Credentials
# Kind: AWS Credentials
```

#### Issue: "docker: command not found" in Jenkins
**Cause**: Docker not installed or Jenkins user doesn't have permission

**Solution**:
```bash
# Add Jenkins user to docker group
sudo usermod -aG docker jenkins

# Restart Jenkins
sudo systemctl restart jenkins
```

#### Issue: Pipeline fails at "Push to ECR"
**Cause**: ECR permissions or credentials issue

**Solution**:
```bash
# Verify ECR repository exists
aws ecr describe-repositories

# Check IAM permissions for Jenkins user
# Needs: ecr:GetAuthorizationToken, ecr:BatchCheckLayerAvailability,
#        ecr:PutImage, ecr:InitiateLayerUpload, ecr:UploadLayerPart,
#        ecr:CompleteLayerUpload
```

---

### 7. Monitoring Issues

#### Issue: Can't access Prometheus/Grafana
**Cause**: Tasks don't have public IPs or security group blocks access

**Solution**:
```bash
# Get task public IP
aws ecs list-tasks \
  --cluster prod-prayuj-cluster \
  --service-name prod-prometheus

aws ecs describe-tasks \
  --cluster prod-prayuj-cluster \
  --tasks <TASK_ARN> \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text

# Get public IP from network interface
aws ec2 describe-network-interfaces \
  --network-interface-ids <ENI_ID> \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text

# Verify security group allows your IP
# Add your IP to monitoring security group on ports 9090 and 3000
```

---

### 8. Cost Issues

#### Issue: Unexpected high costs
**Cause**: Resources running when not needed or over-provisioned

**Solution**:
```bash
# Check cost breakdown
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Common cost optimizations:
# 1. Reduce ECS task count during off-hours
# 2. Use smaller DocumentDB instance class
# 3. Delete old ECR images (lifecycle policy should handle this)
# 4. Remove unused NAT gateways (need at least 1 for HA)
# 5. Use Fargate Spot for non-critical workloads
```

---

### 9. Networking Issues

#### Issue: ECS tasks can't reach internet
**Cause**: NAT Gateway not configured or route table issue

**Solution**:
```bash
# Verify NAT Gateway exists and is available
aws ec2 describe-nat-gateways

# Check route table for private subnets
aws ec2 describe-route-tables \
  --filters "Name=tag:Name,Values=prod-private-rt*"

# Should have route: 0.0.0.0/0 → NAT Gateway
```

---

### 10. Deployment Issues

#### Issue: Zero-downtime deployment not working
**Cause**: Not enough capacity or health checks failing

**Solution**:
```bash
# Increase desired count temporarily
aws ecs update-service \
  --cluster prod-prayuj-cluster \
  --service prod-prayuj-backend \
  --desired-count 4

# After deployment completes, scale back down
aws ecs update-service \
  --cluster prod-prayuj-cluster \
  --service prod-prayuj-backend \
  --desired-count 2
```

---

## Debugging Commands

### Check Everything
```bash
# Infrastructure
terraform show

# ECS Services
aws ecs describe-services \
  --cluster prod-prayuj-cluster \
  --services prod-prayuj-backend prod-prayuj-frontend

# Tasks
aws ecs list-tasks --cluster prod-prayuj-cluster
aws ecs describe-tasks --cluster prod-prayuj-cluster --tasks <TASK_ARN>

# Logs
aws logs tail /ecs/prod-prayuj-backend --follow
aws logs tail /ecs/prod-prayuj-frontend --follow

# Target Health
aws elbv2 describe-target-health --target-group-arn <ARN>

# DocumentDB
aws docdb describe-db-clusters --db-cluster-identifier prod-prayuj-docdb
```

### Emergency Rollback
```bash
# List previous task definitions
aws ecs list-task-definitions \
  --family-prefix prod-prayuj-backend \
  --sort DESC

# Rollback to previous version
aws ecs update-service \
  --cluster prod-prayuj-cluster \
  --service prod-prayuj-backend \
  --task-definition prod-prayuj-backend:PREVIOUS_VERSION
```

---

## Getting Help

1. **Check CloudWatch Logs first** - Most issues show up in logs
2. **Review ECS service events** - Shows deployment and health check issues
3. **Check AWS Service Health Dashboard** - Might be AWS-wide issue
4. **Review Terraform state** - Shows what's actually deployed
5. **Test components individually** - Isolate the problem

## Prevention

- Set up CloudWatch alarms for critical metrics
- Enable AWS Config for compliance monitoring
- Regular backup testing
- Document all custom changes
- Keep Terraform state backed up
- Monitor costs daily
- Review security groups regularly

---

**Remember**: Most issues are related to networking (security groups, subnets) or permissions (IAM roles). Start there!
