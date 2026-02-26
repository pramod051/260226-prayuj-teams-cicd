# Prayuj Teams - Infrastructure as Code

## Overview

This directory contains Terraform configurations for deploying Prayuj Teams chat application to AWS.

## Architecture

```
┌─────────────┐
│   GitHub    │
└──────┬──────┘
       │ webhook
       ▼
┌─────────────┐
│   Jenkins   │
└──────┬──────┘
       │ build & push
       ▼
┌─────────────┐
│   AWS ECR   │
└──────┬──────┘
       │ pull images
       ▼
┌─────────────────────────────────────┐
│           AWS ECS (Fargate)         │
│  ┌──────────┐      ┌──────────┐   │
│  │ Backend  │      │ Frontend │   │
│  │ Service  │      │ Service  │   │
│  └──────────┘      └──────────┘   │
└─────────────────────────────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│     ALB     │      │ DocumentDB  │
└─────────────┘      └─────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│          Monitoring Stack           │
│  ┌──────────┐      ┌──────────┐   │
│  │Prometheus│      │ Grafana  │   │
│  └──────────┘      └──────────┘   │
└─────────────────────────────────────┘
```

## Modules

### VPC Module
- Creates VPC with public and private subnets across 2 AZs
- NAT Gateways for private subnet internet access
- Internet Gateway for public subnets

### ECR Module
- Creates repositories for backend and frontend images
- Lifecycle policies to keep last 10 images
- Image scanning enabled

### DocumentDB Module
- Managed MongoDB-compatible database
- 2 instances for high availability
- Automated backups with 7-day retention
- Encrypted at rest

### ALB Module
- Application Load Balancer in public subnets
- Target groups for backend and frontend
- Path-based routing (/api/* → backend)

### ECS Module
- Fargate cluster for serverless containers
- Backend service (2 tasks, 512 CPU, 1024 MB)
- Frontend service (2 tasks, 256 CPU, 512 MB)
- CloudWatch Logs integration

### Monitoring Module
- Prometheus for metrics collection
- Grafana for visualization
- Container Insights enabled

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured
- AWS Account with appropriate permissions

## Usage

```bash
# Initialize
terraform init

# Plan
terraform plan -var-file=environments/prod/terraform.tfvars

# Apply
terraform apply -var-file=environments/prod/terraform.tfvars

# Destroy
terraform destroy -var-file=environments/prod/terraform.tfvars
```

## Variables

| Variable | Description | Required |
|----------|-------------|----------|
| aws_region | AWS region | No (default: us-east-1) |
| environment | Environment name | No (default: prod) |
| vpc_cidr | VPC CIDR block | No (default: 10.0.0.0/16) |
| db_master_username | DocumentDB username | Yes |
| db_master_password | DocumentDB password | Yes |
| jwt_secret | JWT secret key | Yes |

## Outputs

| Output | Description |
|--------|-------------|
| alb_dns_name | Application Load Balancer DNS |
| ecr_backend_repository_url | Backend ECR repository |
| ecr_frontend_repository_url | Frontend ECR repository |
| documentdb_endpoint | DocumentDB cluster endpoint |
| prometheus_endpoint | Prometheus service endpoint |
| grafana_endpoint | Grafana service endpoint |

## State Management

- **Backend**: S3 bucket `prayuj-teams-terraform-state`
- **Locking**: DynamoDB table `terraform-state-lock`
- **Encryption**: Enabled

## Security

- All resources in private subnets (except ALB)
- Security groups with minimal required access
- DocumentDB encrypted at rest
- TLS enabled for DocumentDB connections
- IAM roles follow least privilege

## Cost Estimation

Monthly costs (approximate):
- ECS Fargate: $50-100
- DocumentDB: $200-300
- ALB: $20-30
- NAT Gateway: $30-60
- Data Transfer: $10-50
- **Total: ~$310-540/month**

## Maintenance

### Update ECS Task Definitions
```bash
terraform apply -target=module.ecs.aws_ecs_task_definition.backend
```

### Scale Services
Modify `desired_count` in `modules/ecs/main.tf`

### Backup DocumentDB
Automated daily backups enabled. Manual snapshot:
```bash
aws docdb create-db-cluster-snapshot \
  --db-cluster-identifier prod-prayuj-docdb \
  --db-cluster-snapshot-identifier manual-snapshot-$(date +%Y%m%d)
```

## Troubleshooting

### Terraform State Lock
```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### ECS Service Not Starting
Check CloudWatch Logs:
```bash
aws logs tail /ecs/prod-prayuj-backend --follow
```

### DocumentDB Connection Issues
Verify security group allows traffic from ECS tasks subnet.

## Contributing

1. Create feature branch
2. Make changes
3. Test with `terraform plan`
4. Submit pull request

## License

MIT
