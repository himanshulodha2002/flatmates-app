# =============================================================================
# Flatmates App - Azure Container Apps (CHEAPEST Option!)
# Cost: ~$0-3/month with low traffic (pay-per-request pricing!)
# With $100 credits = potentially 30+ months of free usage!
# =============================================================================
# Why Container Apps?
# - Pay only for what you use (per-request + per-vCPU-second)
# - Scale to zero when not in use = $0 when idle
# - No minimum monthly cost unlike App Service
# - FREE: 180K vCPU-sec, 360K GB-sec, 2M requests/month
# =============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# Configure Azure Provider
provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
  subscription_id = var.azure_subscription_id
}

# =============================================================================
# Variables
# =============================================================================

variable "azure_subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "project_name" {
  description = "Project name (lowercase, no spaces)"
  type        = string
  default     = "flatmates"
}

variable "location" {
  description = "Azure region (use cheaper regions!)"
  type        = string
  default     = "eastus"  # East US is typically cheapest
  # Other cheap options: "centralus", "westus2", "northeurope"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "dev"
}

# Neon Database (FREE!) - Keep using this!
variable "neon_database_url" {
  description = "Neon PostgreSQL connection URL (get from neon.tech)"
  type        = string
  sensitive   = true
}

# Sentry (FREE with student pack!)
variable "sentry_dsn" {
  description = "Sentry DSN for error tracking"
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

variable "github_repo" {
  description = "GitHub repository for source code"
  type        = string
  default     = "himanshulodha2002/flatmates-app"
}

# =============================================================================
# Random secrets
# =============================================================================

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
}

# =============================================================================
# Resource Group
# =============================================================================

resource "azurerm_resource_group" "main" {
  name     = "rg-${var.project_name}-${var.environment}"
  location = var.location

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# =============================================================================
# Log Analytics Workspace (Required for Container Apps, minimal cost)
# =============================================================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${var.project_name}-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30  # Minimum retention to save costs

  tags = azurerm_resource_group.main.tags
}

# =============================================================================
# Container Apps Environment (FREE - just the environment itself)
# =============================================================================

resource "azurerm_container_app_environment" "main" {
  name                       = "cae-${var.project_name}-${var.environment}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = azurerm_resource_group.main.tags
}

# =============================================================================
# Container Registry (Basic tier - ~$5/month, or use GitHub Container Registry FREE)
# SKIP THIS - We'll use GitHub Container Registry instead (FREE!)
# =============================================================================

# =============================================================================
# Container App - Backend API (Consumption-based = Pay per request!)
# =============================================================================

resource "azurerm_container_app" "backend" {
  name                         = "ca-${var.project_name}-api-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  template {
    min_replicas = 0  # Scale to ZERO when not in use = $0!
    max_replicas = 2  # Limit max to control costs

    container {
      name   = "api"
      image  = "ghcr.io/${var.github_repo}/backend:latest"
      cpu    = 0.25  # Minimum CPU (0.25 vCPU)
      memory = "0.5Gi"  # Minimum memory

      # Environment variables
      env {
        name  = "DATABASE_URL"
        value = var.neon_database_url
      }

      env {
        name  = "SECRET_KEY"
        value = random_password.jwt_secret.result
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      env {
        name  = "DEBUG"
        value = var.environment == "production" ? "false" : "true"
      }

      env {
        name  = "SENTRY_DSN"
        value = var.sentry_dsn
      }

      env {
        name  = "GOOGLE_CLIENT_ID"
        value = var.google_client_id
      }

      env {
        name  = "GOOGLE_CLIENT_SECRET"
        value = var.google_client_secret
      }

      env {
        name  = "GEMINI_API_KEY"
        value = var.gemini_api_key
      }

      env {
        name  = "LOG_LEVEL"
        value = var.environment == "production" ? "INFO" : "DEBUG"
      }

      # Liveness probe
      liveness_probe {
        transport = "HTTP"
        path      = "/health"
        port      = 8000
        initial_delay    = 30
        interval_seconds = 30
        timeout          = 5
        failure_count_threshold = 3
      }

      # Readiness probe
      readiness_probe {
        transport = "HTTP"
        path      = "/health"
        port      = 8000
        interval_seconds = 10
        timeout          = 5
        failure_count_threshold = 3
      }
    }

    # Scale based on HTTP requests (scale to zero when idle!)
    http_scale_rule {
      name                = "http-scaling"
      concurrent_requests = 50
    }
  }

  ingress {
    external_enabled = true
    target_port      = 8000
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = azurerm_resource_group.main.tags
}

# =============================================================================
# Outputs
# =============================================================================

output "resource_group_name" {
  value       = azurerm_resource_group.main.name
  description = "The name of the resource group"
}

output "app_url" {
  value       = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
  description = "The URL of the deployed backend API"
}

output "container_app_name" {
  value       = azurerm_container_app.backend.name
  description = "The name of the container app"
}

output "environment_name" {
  value       = azurerm_container_app_environment.main.name
  description = "The Container Apps environment name"
}

output "cost_estimate" {
  value = <<-EOT
    
    =========================================
    💰 ESTIMATED MONTHLY COSTS (Azure)
    =========================================
    
    Container Apps (Consumption tier):
    - FREE tier includes:
      • 180,000 vCPU-seconds/month
      • 360,000 GiB-seconds/month  
      • 2 million requests/month
    - With scale-to-zero: $0 when idle!
    - Estimated: $0-3/month for low traffic
    
    Log Analytics:
    - First 5GB/month FREE
    - Estimated: $0-2/month
    
    TOTAL: ~$0-5/month
    With $100 credits: 20-100+ months!
    
    =========================================
    
    TIP: Your app scales to ZERO replicas when 
    not receiving traffic, so you pay nothing 
    during idle periods!
    
  EOT
  description = "Estimated monthly costs"
}
