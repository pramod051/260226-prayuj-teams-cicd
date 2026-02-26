output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "ecr_backend_repository_url" {
  description = "Backend ECR repository URL"
  value       = module.ecr.repository_urls["prayuj-backend"]
}

output "ecr_frontend_repository_url" {
  description = "Frontend ECR repository URL"
  value       = module.ecr.repository_urls["prayuj-frontend"]
}

output "documentdb_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = module.documentdb.endpoint
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "monitoring_instance_public_ip" {
  description = "Monitoring EC2 instance public IP"
  value       = module.monitoring.instance_public_ip
}

output "prometheus_url" {
  description = "Prometheus URL"
  value       = "http://${module.monitoring.instance_public_ip}:9090"
}

output "grafana_url" {
  description = "Grafana URL"
  value       = "http://${module.monitoring.instance_public_ip}:3001"
}
