# =============================================================================
# Flatmates App - DigitalOcean + Neon (FREE Database!)
# Cost: ~$5/month (just App Platform!) - $200 credits = 40 months!
# =============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.34"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# Configure the DigitalOcean Provider
provider "digitalocean" {
  token = var.do_token
}

# =============================================================================
# Variables
# =============================================================================

variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "flatmates"
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc1"  # New York, or use: sfo3, lon1, sgp1, blr1
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "dev"
}

# Neon Database (FREE!)
variable "neon_database_url" {
  description = "Neon PostgreSQL connection URL (get from neon.tech)"
  type        = string
  sensitive   = true
}

# Sentry (FREE with student pack!)
variable "sentry_dsn" {
  description = "Sentry DSN for error tracking (get from sentry.io)"
  type        = string
  sensitive   = true
  default     = ""
}

# App secrets
variable "google_client_id" {
  type      = string
  sensitive = true
  default   = ""
}

variable "google_client_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "gemini_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

# =============================================================================
# Random secrets
# =============================================================================

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

# =============================================================================
# DigitalOcean Project (for organizing resources)
# =============================================================================

resource "digitalocean_project" "main" {
  name        = "${var.project_name}-${var.environment}"
  description = "Flatmates App - ${var.environment} environment"
  purpose     = "Web Application"
  environment = var.environment == "production" ? "Production" : "Development"
}

# =============================================================================
# App Platform - Backend API - $5/month (or FREE with basic tier)
# =============================================================================

resource "digitalocean_app" "backend" {
  spec {
    name   = "${var.project_name}-${var.environment}-api"
    region = var.region

    # Backend Service
    service {
      name               = "api"
      instance_count     = 1
      instance_size_slug = "basic-xxs"  # $5/month - 512MB RAM

      # GitHub source (auto-deploy on push)
      github {
        repo           = "himanshulodha2002/flatmates-app"
        branch         = "main"
        deploy_on_push = true
      }
      source_dir      = "backend"
      dockerfile_path = "backend/Dockerfile"

      http_port = 8000

      health_check {
        http_path             = "/health"
        initial_delay_seconds = 30
        period_seconds        = 10
        timeout_seconds       = 5
        success_threshold     = 1
        failure_threshold     = 3
      }

      # Environment variables - Using FREE Neon database!
      env {
        key   = "DATABASE_URL"
        value = var.neon_database_url
        type  = "SECRET"
      }

      env {
        key   = "SECRET_KEY"
        value = random_password.jwt_secret.result
        type  = "SECRET"
      }

      env {
        key   = "ENVIRONMENT"
        value = var.environment
      }

      env {
        key   = "LOG_LEVEL"
        value = var.environment == "production" ? "INFO" : "DEBUG"
      }

      env {
        key   = "BACKEND_CORS_ORIGINS"
        value = "[\"https://${var.project_name}-${var.environment}-api.ondigitalocean.app\", \"*\"]"
      }

      env {
        key   = "GOOGLE_CLIENT_ID"
        value = var.google_client_id
        type  = "SECRET"
      }

      env {
        key   = "GOOGLE_CLIENT_SECRET"
        value = var.google_client_secret
        type  = "SECRET"
      }

      env {
        key   = "GEMINI_API_KEY"
        value = var.gemini_api_key
        type  = "SECRET"
      }

      # Sentry for FREE error monitoring!
      env {
        key   = "SENTRY_DSN"
        value = var.sentry_dsn
        type  = "SECRET"
      }

      # Enable metrics
      env {
        key   = "ENABLE_METRICS"
        value = "true"
      }

      # Run migrations on deploy
      run_command = "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"
    }

    # Alert on deploy failures
    alert {
      rule = "DEPLOYMENT_FAILED"
    }

    alert {
      rule = "DOMAIN_FAILED"
    }
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "app_url" {
  description = "Backend API URL"
  value       = digitalocean_app.backend.live_url
}

output "jwt_secret" {
  description = "Generated JWT secret"
  value       = random_password.jwt_secret.result
  sensitive   = true
}

output "monthly_cost_estimate" {
  description = "Estimated monthly cost"
  value       = "$5/month (App only - Database is FREE on Neon!)"
}

output "setup_checklist" {
  description = "Free services to set up"
  value       = <<-EOT
    
    ✅ FREE Services Checklist:
    
    1. Neon Database (FREE): https://neon.tech
       - Sign up with GitHub
       - Create project, copy DATABASE_URL
    
    2. Sentry Monitoring (FREE): https://sentry.io
       - Sign up with GitHub Student Pack
       - Create project, copy DSN
    
    3. DigitalOcean ($200 credits): https://digitalocean.com
       - Redeem GitHub Student Pack credits
       - $5/month = 40 months of hosting!
    
  EOT
}
