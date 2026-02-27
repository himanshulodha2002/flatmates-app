# Flatmates App - Infrastructure as Code

This directory contains Terraform configuration for deploying the Flatmates App backend to **Azure Container Apps**.

## Azure Container Apps (Budget-Friendly!)

**With Azure credits - potentially FREE for 20-100+ months!**

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| **Azure Container Apps** | **~$0-3/mo** | Scale to zero, pay per request |
| **Neon PostgreSQL** | **FREE** | Serverless, auto-scaling |
| **GitHub Container Registry** | **FREE** | Docker image hosting |
| **Sentry Monitoring** | **FREE** | With Student Pack |

### Quick Start

```bash
cd infrastructure/terraform-azure
cp terraform.tfvars.example terraform.tfvars
# Fill in: azure_subscription_id, neon_database_url, github_repo
terraform init && terraform apply
```

**Why Azure Container Apps:**
- Scale to zero = Pay $0 when idle!
- Pay per request pricing
- FREE tier: 180K vCPU-sec, 360K GiB-sec, 2M requests/month

## Architecture

```
Azure Cloud
  Container Apps Environment (Consumption tier)
    FastAPI Backend (Docker Container)
    - Scale to zero
    - Pay per request
    - HTTPS
          |
          v
  Neon PostgreSQL (FREE!)        Sentry.io (FREE with Student Pack)
  - Serverless                   - Error Monitoring
  - Auto-scaling                 - 500K events/mo
  - Branching                    - Performance
```

## Prerequisites

1. **Terraform** >= 1.5.0 (`brew install terraform`)
2. **Docker** (for building container images)
3. **Azure CLI** configured (`az login`)

## Directory Structure

```
infrastructure/
├── README.md                    # This file
└── terraform-azure/             # Azure Container Apps deployment
    ├── main.tf                  # Container Apps + Log Analytics
    ├── terraform.tfvars.example
    └── README.md
```

## Environment Variables

Sensitive variables should be set via environment:

```bash
export TF_VAR_azure_subscription_id="your-subscription-id"
export TF_VAR_neon_database_url="your-neon-url"
export TF_VAR_google_client_id="your-client-id"
export TF_VAR_google_client_secret="your-client-secret"
export TF_VAR_gemini_api_key="your-gemini-key"
```

## Outputs

After applying, Terraform will output:

- `app_url` - The deployed backend API URL
- `container_app_name` - Name of the container app
- `environment_name` - Container Apps environment name
- `cost_estimate` - Estimated monthly costs

## Cleanup

```bash
cd infrastructure/terraform-azure
terraform destroy -var-file=terraform.tfvars
```

## Security Considerations

1. Secrets passed via environment variables to Container Apps
2. Non-root user in Docker container
3. HTTPS enforced via Container Apps ingress
4. Health checks with generous timeouts for cold starts
5. Scale-to-zero with consumption-based billing
