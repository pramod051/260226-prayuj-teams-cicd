terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "prayuj-teams-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "prayuj-terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Prayuj-Teams"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

module "vpc" {
  source               = "./modules/vpc"
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "ecr" {
  source       = "./modules/ecr"
  environment  = var.environment
  repositories = ["prayuj-frontend", "prayuj-backend"]
}

module "documentdb" {
  source              = "./modules/documentdb"
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  master_username     = var.documentdb_master_username
  master_password     = var.documentdb_master_password
  instance_class      = var.documentdb_instance_class
}

module "alb" {
  source            = "./modules/alb"
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
}

module "ecs" {
  source                    = "./modules/ecs"
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  alb_target_group_arn      = module.alb.backend_target_group_arn
  frontend_target_group_arn = module.alb.frontend_target_group_arn
  ecr_repository_urls       = module.ecr.repository_urls
  documentdb_endpoint       = module.documentdb.endpoint
  documentdb_username       = var.documentdb_master_username
  documentdb_password       = var.documentdb_master_password
  jwt_secret                = var.jwt_secret
  alb_security_group_id     = module.alb.alb_security_group_id
}

module "monitoring" {
  source           = "./modules/monitoring"
  environment      = var.environment
  vpc_id           = module.vpc.vpc_id
  public_subnet_id = module.vpc.public_subnet_ids[0]
  key_name         = var.key_name
  ecs_cluster_name = module.ecs.cluster_name
}
