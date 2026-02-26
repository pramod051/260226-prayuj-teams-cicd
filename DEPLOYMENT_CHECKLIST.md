# Deployment Checklist

## Pre-Deployment

### AWS Setup
- [ ] AWS Account created
- [ ] IAM user with admin permissions created
- [ ] AWS CLI installed
- [ ] AWS credentials configured (`aws configure`)
- [ ] Default region set to us-east-1

### Local Environment
- [ ] Terraform >= 1.0 installed
- [ ] Docker installed and running
- [ ] Git installed
- [ ] Code pushed to GitHub repository

### Jenkins Setup
- [ ] Jenkins server installed
- [ ] Jenkins accessible via browser
- [ ] Required plugins installed:
  - [ ] AWS Steps Plugin
  - [ ] Docker Pipeline Plugin
  - [ ] GitHub Integration Plugin
- [ ] AWS credentials configured on Jenkins server

## Infrastructure Deployment

### Terraform Configuration
- [ ] Created `terraform/terraform.tfvars` with:
  - [ ] db_master_username
  - [ ] db_master_password
  - [ ] jwt_secret
- [ ] Reviewed and updated variables if needed

### Deploy Infrastructure
- [ ] Run `./deploy-aws.sh`
- [ ] Terraform plan reviewed
- [ ] Terraform apply completed successfully
- [ ] Note down outputs:
  - [ ] ALB DNS name: _______________
  - [ ] Backend ECR URL: _______________
  - [ ] Frontend ECR URL: _______________
  - [ ] DocumentDB endpoint: _______________

### Verify Infrastructure
- [ ] VPC created with subnets
- [ ] ECR repositories created
- [ ] DocumentDB cluster running
- [ ] ALB created and healthy
- [ ] ECS cluster created
- [ ] Security groups configured

## Application Deployment

### Build and Push Images
- [ ] Login to ECR successful
- [ ] Backend image built
- [ ] Backend image pushed to ECR
- [ ] Frontend image built
- [ ] Frontend image pushed to ECR

### Verify ECS Services
- [ ] Backend service running
- [ ] Frontend service running
- [ ] Tasks passing health checks
- [ ] CloudWatch logs showing output

## Jenkins Configuration

### Add Credentials
- [ ] aws-account-id added
- [ ] ecr-backend-repo-url added
- [ ] ecr-frontend-repo-url added

### Create Pipeline
- [ ] New pipeline job created
- [ ] GitHub repository URL configured
- [ ] Jenkinsfile path set
- [ ] Pipeline runs successfully

### GitHub Integration
- [ ] Webhook created in GitHub
- [ ] Webhook URL: `http://<jenkins-url>/github-webhook/`
- [ ] Push event triggers pipeline
- [ ] Test push successful

## Monitoring Setup

### Prometheus
- [ ] Prometheus service running
- [ ] Get Prometheus public IP: _______________
- [ ] Access Prometheus UI: `http://<IP>:9090`
- [ ] Targets showing as UP
- [ ] Update prometheus.yml with DocumentDB endpoint

### Grafana
- [ ] Grafana service running
- [ ] Get Grafana public IP: _______________
- [ ] Access Grafana UI: `http://<IP>:3000`
- [ ] Login with admin/admin
- [ ] Change default password
- [ ] Prometheus datasource configured
- [ ] Dashboard imported

### CloudWatch
- [ ] Backend logs visible: `/ecs/prod-prayuj-backend`
- [ ] Frontend logs visible: `/ecs/prod-prayuj-frontend`
- [ ] No error messages in logs

## Application Testing

### Basic Functionality
- [ ] Access application: `http://<ALB_DNS>`
- [ ] Frontend loads successfully
- [ ] Register new user
- [ ] Login successful
- [ ] Create private chat
- [ ] Send message
- [ ] Upload file
- [ ] Create group chat
- [ ] Real-time messaging working
- [ ] Socket.IO connection stable

### API Testing
- [ ] Health endpoint: `http://<ALB_DNS>/api/health`
- [ ] Auth endpoints working
- [ ] Chat endpoints working
- [ ] User endpoints working

### Performance
- [ ] Page load time < 3 seconds
- [ ] Message delivery < 1 second
- [ ] No console errors
- [ ] Mobile responsive

## Security Verification

### Network Security
- [ ] ECS tasks in private subnets
- [ ] DocumentDB in private subnets
- [ ] Security groups properly configured
- [ ] No unnecessary ports open

### Application Security
- [ ] HTTPS ready (optional for now)
- [ ] JWT authentication working
- [ ] Password hashing verified
- [ ] File upload restrictions working

### AWS Security
- [ ] IAM roles follow least privilege
- [ ] DocumentDB encryption enabled
- [ ] ECR image scanning enabled
- [ ] CloudWatch logs encrypted

## Documentation

- [ ] Update README with production URLs
- [ ] Document any custom configurations
- [ ] Save all credentials securely
- [ ] Create runbook for common tasks

## Post-Deployment

### Monitoring
- [ ] Set up CloudWatch alarms
- [ ] Configure Grafana alerts
- [ ] Test alert notifications

### Backup
- [ ] Verify DocumentDB automated backups
- [ ] Create manual snapshot
- [ ] Test restore procedure

### Cost Management
- [ ] Review AWS Cost Explorer
- [ ] Set up billing alerts
- [ ] Optimize unused resources

### Team Handoff
- [ ] Share access credentials
- [ ] Provide documentation
- [ ] Schedule training session
- [ ] Set up on-call rotation

## Rollback Plan

In case of issues:
- [ ] Previous Docker images tagged in ECR
- [ ] Terraform state backed up
- [ ] DocumentDB snapshot available
- [ ] Rollback procedure documented

## Success Metrics

- [ ] Application uptime > 99%
- [ ] Response time < 500ms
- [ ] Zero critical errors
- [ ] All health checks passing
- [ ] Monitoring dashboards green

## Sign-Off

- [ ] Development team approved
- [ ] Operations team approved
- [ ] Security team approved
- [ ] Management approved

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Approved By**: _______________

## Notes

_Add any additional notes or observations here:_

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Failed
