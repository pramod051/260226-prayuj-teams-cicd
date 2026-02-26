# Prayuj Teams - AWS Production Deployment

## 📁 Project Structure

```
main-prayuj-teams-app/
├── backend/
│   ├── Dockerfile.prod              # Production backend Dockerfile
│   └── server.js                    # Added /api/health endpoint
├── frontend/
│   ├── Dockerfile.prod              # Production frontend Dockerfile
│   └── nginx.prod.conf              # Production nginx config
├── terraform/
│   ├── main.tf                      # Main Terraform config
│   ├── variables.tf                 # Input variables
│   ├── outputs.tf                   # Output values
│   ├── modules/
│   │   ├── vpc/                     # VPC, subnets, NAT gateways
│   │   ├── ecr/                     # Container registries
│   │   ├── documentdb/              # MongoDB-compatible database
│   │   ├── alb/                     # Application Load Balancer
│   │   ├── ecs/                     # ECS Fargate services
│   │   └── monitoring/              # Prometheus & Grafana
│   └── environments/
│       └── prod/
│           └── terraform.tfvars     # Production variables
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml           # Prometheus configuration
│   └── grafana/
│       ├── dashboard.json           # Grafana dashboard
│       └── datasource.yml           # Grafana datasource
├── Jenkinsfile                      # CI/CD pipeline
├── deploy-aws.sh                    # Automated deployment script
├── AWS_DEPLOYMENT_GUIDE.md          # Comprehensive guide
├── QUICK_START.md                   # Quick reference
└── .gitignore                       # Git ignore patterns
```

## 🚀 Deployment Flow

1. **Infrastructure Setup** (Terraform)
   - VPC with public/private subnets
   - ECR repositories
   - DocumentDB cluster
   - Application Load Balancer
   - ECS Fargate cluster
   - Prometheus & Grafana

2. **CI/CD Pipeline** (Jenkins)
   - Checkout code from GitHub
   - Build Docker images
   - Push to ECR
   - Deploy to ECS
   - Wait for health checks

3. **Monitoring** (Prometheus + Grafana)
   - Collect metrics from ECS
   - Visualize in Grafana dashboards
   - CloudWatch Logs integration

## 📋 Prerequisites Checklist

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured
- [ ] Terraform >= 1.0 installed
- [ ] Docker installed
- [ ] Jenkins server setup
- [ ] GitHub repository created

## 🎯 Quick Deployment Steps

### 1. Configure AWS
```bash
aws configure
```

### 2. Set Sensitive Variables
Create `terraform/terraform.tfvars`:
```hcl
db_master_username = "admin"
db_master_password = "YourSecurePassword123!"
jwt_secret = "your-super-secret-jwt-key"
```

### 3. Deploy Infrastructure
```bash
./deploy-aws.sh
```

### 4. Push Initial Images
```bash
# Get ECR URLs from Terraform output
cd terraform
terraform output

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
cd ../backend
docker build -f Dockerfile.prod -t <ECR_BACKEND_URL>:latest .
docker push <ECR_BACKEND_URL>:latest

cd ../frontend
docker build -f Dockerfile.prod -t <ECR_FRONTEND_URL>:latest .
docker push <ECR_FRONTEND_URL>:latest
```

### 5. Configure Jenkins
- Install plugins: AWS Steps, Docker Pipeline, GitHub Integration
- Add credentials: aws-account-id, ecr-backend-repo-url, ecr-frontend-repo-url
- Create pipeline job pointing to Jenkinsfile
- Configure GitHub webhook

### 6. Access Application
```bash
# Get ALB DNS
terraform output alb_dns_name

# Access at: http://<ALB_DNS>
```

## 🔧 Key Configuration Files

### Backend Production Dockerfile
- Multi-stage build for optimization
- Downloads DocumentDB TLS certificate
- Production dependencies only

### Frontend Production Dockerfile
- React build optimization
- Nginx for serving static files
- Gzip compression enabled

### Terraform Modules
- **VPC**: 2 AZs, public/private subnets, NAT gateways
- **ECR**: Image repositories with lifecycle policies
- **DocumentDB**: 2-instance cluster, encrypted, automated backups
- **ALB**: Path-based routing, health checks
- **ECS**: Fargate tasks, auto-scaling ready
- **Monitoring**: Prometheus + Grafana on ECS

### Jenkins Pipeline
- Automated build on GitHub push
- Docker image build and push to ECR
- ECS service update with zero-downtime
- Health check verification

## 📊 Monitoring Setup

### Prometheus
- Scrapes ECS metrics
- Monitors CPU, memory, network
- Custom application metrics

### Grafana
- Pre-configured dashboards
- Real-time visualization
- Alert configuration ready

### CloudWatch
- Container logs
- ECS metrics
- DocumentDB metrics

## 💰 Cost Breakdown

| Service | Monthly Cost |
|---------|--------------|
| ECS Fargate (4 tasks) | $50-100 |
| DocumentDB (2 instances) | $200-300 |
| Application Load Balancer | $20-30 |
| NAT Gateway (2) | $30-60 |
| Data Transfer | $10-50 |
| CloudWatch Logs | $5-10 |
| **Total** | **$315-550** |

## 🔒 Security Features

- ✅ Private subnets for all compute resources
- ✅ Security groups with minimal access
- ✅ DocumentDB encryption at rest
- ✅ TLS for database connections
- ✅ IAM roles with least privilege
- ✅ ECR image scanning
- ✅ VPC flow logs (optional)
- ✅ AWS WAF ready (optional)

## 🎓 Learning Resources

### Terraform
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)

### AWS ECS
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Fargate Pricing](https://aws.amazon.com/fargate/pricing/)

### Jenkins
- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [AWS Steps Plugin](https://plugins.jenkins.io/aws-java-sdk/)

## 🆘 Common Issues & Solutions

### Issue: Terraform state locked
**Solution**: 
```bash
terraform force-unlock <LOCK_ID>
```

### Issue: ECS tasks failing health checks
**Solution**: 
- Check CloudWatch logs
- Verify security group rules
- Test health endpoint locally

### Issue: DocumentDB connection timeout
**Solution**:
- Verify ECS tasks in same VPC
- Check security group allows port 27017
- Ensure TLS certificate downloaded

### Issue: Jenkins can't push to ECR
**Solution**:
- Verify AWS credentials in Jenkins
- Check ECR repository permissions
- Ensure Docker daemon running

## 📞 Support & Maintenance

### Daily Tasks
- Monitor Grafana dashboards
- Check CloudWatch alarms
- Review application logs

### Weekly Tasks
- Review cost reports
- Check for security updates
- Verify backup completion

### Monthly Tasks
- Update dependencies
- Review and optimize costs
- Test disaster recovery

## 🔄 CI/CD Workflow

```
Developer Push → GitHub → Webhook → Jenkins
                                      ↓
                                   Build Images
                                      ↓
                                   Push to ECR
                                      ↓
                                Update ECS Services
                                      ↓
                                 Health Checks
                                      ↓
                              Deployment Complete
```

## 📈 Scaling Strategy

### Horizontal Scaling
Add auto-scaling to ECS services:
```hcl
resource "aws_appautoscaling_target" "backend" {
  max_capacity = 10
  min_capacity = 2
  # ... configuration
}
```

### Vertical Scaling
Increase task CPU/memory in task definitions.

### Database Scaling
Add more DocumentDB instances or upgrade instance class.

## 🎉 Success Criteria

- [ ] Infrastructure deployed successfully
- [ ] Application accessible via ALB
- [ ] Jenkins pipeline running
- [ ] Monitoring dashboards showing data
- [ ] Health checks passing
- [ ] Logs visible in CloudWatch
- [ ] Database connections working

## 📝 Next Steps

1. **Add HTTPS**: Configure ACM certificate
2. **Custom Domain**: Setup Route53
3. **Auto Scaling**: Implement ECS auto-scaling
4. **Alerts**: Configure SNS notifications
5. **Backup Testing**: Verify restore procedures
6. **Load Testing**: Test application under load
7. **Security Audit**: Run AWS Security Hub
8. **Cost Optimization**: Review and optimize resources

---

**Congratulations!** You now have a production-ready AWS deployment for Prayuj Teams! 🎊
