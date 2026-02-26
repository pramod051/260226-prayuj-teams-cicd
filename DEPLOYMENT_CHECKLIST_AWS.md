# AWS Production Deployment Checklist

## Pre-Deployment

### AWS Account Setup
- [ ] AWS account created and verified
- [ ] IAM user with appropriate permissions created
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] AWS region set to `ap-south-1`
- [ ] Billing alerts configured

### Local Environment
- [ ] Terraform >= 1.0 installed
- [ ] Docker installed and running
- [ ] Git installed
- [ ] GitHub account and repository created
- [ ] SSH key generated for EC2 access

### Code Preparation
- [ ] Application tested locally
- [ ] Environment variables documented
- [ ] Dockerfile.prod created for backend
- [ ] Dockerfile.prod created for frontend
- [ ] .gitignore updated (exclude terraform.tfvars, *.pem)

## Infrastructure Deployment

### Terraform Backend Setup
- [ ] S3 bucket created for Terraform state
- [ ] S3 bucket versioning enabled
- [ ] S3 bucket encryption enabled
- [ ] DynamoDB table created for state locking
- [ ] EC2 key pair created and saved securely

### Terraform Configuration
- [ ] terraform/terraform.tfvars created with all variables
- [ ] DocumentDB credentials set (strong password)
- [ ] JWT secret generated (strong random string)
- [ ] terraform init executed successfully
- [ ] terraform validate passed
- [ ] terraform plan reviewed

### Infrastructure Provisioning
- [ ] terraform apply executed
- [ ] VPC and subnets created
- [ ] NAT Gateway and Internet Gateway created
- [ ] ECR repositories created
- [ ] DocumentDB cluster created (2 instances)
- [ ] Application Load Balancer created
- [ ] ECS cluster created
- [ ] Monitoring EC2 instance created
- [ ] All outputs saved

## Docker Images

### Initial Image Build
- [ ] Backend Docker image built
- [ ] Frontend Docker image built
- [ ] ECR login successful
- [ ] Backend image pushed to ECR
- [ ] Frontend image pushed to ECR
- [ ] Images tagged as 'latest'

## Jenkins Setup

### Jenkins EC2 Instance
- [ ] Jenkins EC2 instance launched (t2.medium, 20GB)
- [ ] Security group configured (ports 8080, 22)
- [ ] SSH access verified
- [ ] Java 11 installed
- [ ] Docker installed
- [ ] AWS CLI installed
- [ ] Jenkins installed and running

### Jenkins Configuration
- [ ] Jenkins accessed via browser
- [ ] Initial admin password retrieved
- [ ] Admin user created
- [ ] Suggested plugins installed
- [ ] AWS Steps plugin installed
- [ ] Docker Pipeline plugin installed
- [ ] GitHub Integration plugin installed

### Jenkins Credentials
- [ ] AWS credentials added
- [ ] ECR backend repository URL added
- [ ] ECR frontend repository URL added
- [ ] ECS cluster name added
- [ ] AWS account ID added
- [ ] GitHub credentials added (if private repo)

### Jenkins Pipeline
- [ ] Pipeline job created
- [ ] GitHub repository connected
- [ ] Jenkinsfile path configured
- [ ] Build triggers configured
- [ ] Test build executed successfully

## GitHub Integration

### Repository Setup
- [ ] Code pushed to GitHub
- [ ] Jenkinsfile in repository root
- [ ] Dockerfile.prod files present
- [ ] README updated with deployment info

### Webhook Configuration
- [ ] GitHub webhook created
- [ ] Webhook URL: `http://<JENKINS_IP>:8080/github-webhook/`
- [ ] Content type: application/json
- [ ] Push events enabled
- [ ] Webhook tested and working

## Application Deployment

### ECS Services
- [ ] Backend service running (2 tasks)
- [ ] Frontend service running (2 tasks)
- [ ] Tasks in RUNNING state
- [ ] Health checks passing
- [ ] Load balancer targets healthy

### Application Access
- [ ] ALB DNS name retrieved
- [ ] Frontend accessible via browser
- [ ] Backend API responding
- [ ] WebSocket connections working
- [ ] File uploads working

### Database
- [ ] DocumentDB cluster accessible from ECS
- [ ] Database connection successful
- [ ] Collections created
- [ ] Sample data inserted and retrieved

## Monitoring Setup

### Prometheus
- [ ] Prometheus accessible at port 9090
- [ ] Targets configured
- [ ] Metrics being collected
- [ ] Alerts configured (optional)

### Grafana
- [ ] Grafana accessible at port 3001
- [ ] Default credentials changed
- [ ] Prometheus datasource added
- [ ] Dashboards imported
- [ ] ECS metrics visible
- [ ] Alerts configured (optional)

### CloudWatch
- [ ] Log groups created
- [ ] Backend logs streaming
- [ ] Frontend logs streaming
- [ ] Log retention set (7 days)
- [ ] CloudWatch alarms created (optional)

## Security Hardening

### Network Security
- [ ] Security groups reviewed and minimized
- [ ] Private subnets for ECS tasks
- [ ] Public subnets only for ALB and monitoring
- [ ] DocumentDB in private subnet
- [ ] VPC Flow Logs enabled (optional)

### Access Control
- [ ] IAM roles follow least privilege
- [ ] No hardcoded credentials in code
- [ ] Secrets stored in AWS Secrets Manager (optional)
- [ ] MFA enabled on AWS account
- [ ] SSH keys secured

### Application Security
- [ ] HTTPS configured (if domain available)
- [ ] SSL certificate installed
- [ ] CORS configured properly
- [ ] Rate limiting implemented (optional)
- [ ] Input validation in place

## Testing

### Functional Testing
- [ ] User registration working
- [ ] User login working
- [ ] Private chat working
- [ ] Group chat working
- [ ] File upload working
- [ ] Real-time messaging working
- [ ] Typing indicators working

### Performance Testing
- [ ] Load testing performed
- [ ] Response times acceptable
- [ ] Auto-scaling tested (if configured)
- [ ] Database performance verified

### CI/CD Testing
- [ ] Code push triggers build
- [ ] Build completes successfully
- [ ] Images pushed to ECR
- [ ] ECS services updated
- [ ] Zero-downtime deployment verified
- [ ] Rollback tested

## Documentation

### Technical Documentation
- [ ] Architecture diagram created
- [ ] Deployment guide completed
- [ ] Troubleshooting guide created
- [ ] API documentation updated
- [ ] Environment variables documented

### Operational Documentation
- [ ] Monitoring guide created
- [ ] Backup and restore procedures documented
- [ ] Incident response plan created
- [ ] Scaling procedures documented
- [ ] Cost optimization notes added

## Post-Deployment

### Monitoring
- [ ] CloudWatch dashboard created
- [ ] Grafana dashboards configured
- [ ] Alert notifications configured
- [ ] Log aggregation working
- [ ] Performance metrics tracked

### Backup
- [ ] DocumentDB automated backups enabled
- [ ] Backup retention period set (7 days)
- [ ] Backup restore tested
- [ ] Disaster recovery plan documented

### Optimization
- [ ] Cost analysis performed
- [ ] Resource utilization reviewed
- [ ] Auto-scaling policies configured (optional)
- [ ] Reserved instances considered (for long-term)

### Maintenance
- [ ] Update schedule defined
- [ ] Maintenance window communicated
- [ ] Rollback procedure tested
- [ ] Team trained on deployment process

## Optional Enhancements

### Domain and SSL
- [ ] Domain purchased
- [ ] Route53 hosted zone created
- [ ] SSL certificate requested (ACM)
- [ ] DNS records configured
- [ ] HTTPS listener added to ALB
- [ ] HTTP to HTTPS redirect configured

### Advanced Monitoring
- [ ] AWS X-Ray integrated
- [ ] Custom CloudWatch metrics
- [ ] Application Performance Monitoring (APM)
- [ ] Distributed tracing enabled

### High Availability
- [ ] Multi-AZ deployment verified
- [ ] Auto-scaling configured
- [ ] Health checks optimized
- [ ] Circuit breakers implemented

### Security Enhancements
- [ ] AWS WAF configured
- [ ] AWS Shield enabled
- [ ] GuardDuty enabled
- [ ] Security Hub enabled
- [ ] CloudTrail logging enabled

## Sign-off

- [ ] Development team approval
- [ ] Operations team approval
- [ ] Security team approval
- [ ] Stakeholder approval
- [ ] Production deployment completed

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Verified By:** _______________

**Notes:**
_______________________________________
_______________________________________
_______________________________________
