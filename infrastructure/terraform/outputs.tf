# Flatmates App - Terraform Outputs

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

# Database Outputs
output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.database.endpoint
}

output "database_port" {
  description = "RDS database port"
  value       = module.database.port
}

output "database_name" {
  description = "RDS database name"
  value       = module.database.db_name
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.ecs.service_name
}

output "api_endpoint" {
  description = "API endpoint URL (ALB DNS name)"
  value       = "https://${module.ecs.alb_dns_name}"
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.ecs.alb_dns_name
}

# Redis Outputs (conditional)
output "redis_endpoint" {
  description = "Redis endpoint"
  value       = var.enable_redis ? module.redis[0].endpoint : null
}

# Secrets (for reference, marked sensitive)
output "database_password" {
  description = "Database password (store securely)"
  value       = random_password.db_password.result
  sensitive   = true
}

output "jwt_secret" {
  description = "JWT secret key (store securely)"
  value       = random_password.jwt_secret.result
  sensitive   = true
}
