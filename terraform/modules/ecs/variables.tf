variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "alb_target_group_arn" {
  type = string
}

variable "frontend_target_group_arn" {
  type = string
}

variable "ecr_repository_urls" {
  type = map(string)
}

variable "documentdb_endpoint" {
  type = string
}

variable "documentdb_username" {
  type      = string
  sensitive = true
}

variable "documentdb_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "alb_security_group_id" {
  type = string
}
