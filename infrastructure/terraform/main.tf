# Flatmates App - Infrastructure as Code
# Terraform configuration for multi-cloud deployment

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Backend configuration for state management
  # Uncomment and configure for production use
  # backend "s3" {
  #   bucket         = "flatmates-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-west-2"
  #   encrypt        = true
  #   dynamodb_table = "flatmates-terraform-locks"
  # }
}

# AWS Provider Configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "flatmates-app"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
  
  availability_zones = var.availability_zones
  
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# RDS PostgreSQL Module
module "database" {
  source = "./modules/rds"

  project_name = var.project_name
  environment  = var.environment

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.security_groups.rds_security_group_id

  db_name     = var.db_name
  db_username = var.db_username
  db_password = random_password.db_password.result

  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
}

# ECS Fargate Module for Backend
module "ecs" {
  source = "./modules/ecs"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  
  ecs_security_group_id = module.security_groups.ecs_security_group_id
  alb_security_group_id = module.security_groups.alb_security_group_id

  # Application configuration
  container_image = var.container_image
  container_port  = 8000
  cpu             = var.ecs_cpu
  memory          = var.ecs_memory
  desired_count   = var.ecs_desired_count

  # Database connection
  database_url = module.database.database_url

  # Secrets
  jwt_secret    = random_password.jwt_secret.result
  
  # Environment variables
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  gemini_api_key       = var.gemini_api_key
  openai_api_key       = var.openai_api_key
}

# ElastiCache Redis (Optional - for caching and session storage)
module "redis" {
  source = "./modules/redis"
  count  = var.enable_redis ? 1 : 0

  project_name = var.project_name
  environment  = var.environment

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.security_groups.redis_security_group_id

  node_type       = var.redis_node_type
  num_cache_nodes = var.redis_num_cache_nodes
}

# CloudWatch Monitoring
module "monitoring" {
  source = "./modules/monitoring"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  ecs_cluster_name = module.ecs.cluster_name
  ecs_service_name = module.ecs.service_name
  
  alb_arn_suffix         = module.ecs.alb_arn_suffix
  target_group_arn_suffix = module.ecs.target_group_arn_suffix
  
  alarm_email = var.alarm_email
}
