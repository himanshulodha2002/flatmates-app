# Flatmates App - Infrastructure as Code

This directory contains Terraform configurations for deploying the Flatmates App.

## 🎯 Recommended: Azure Container Apps (Budget-Friendly!)

**For users with Azure credits - potentially FREE for 20-100+ months!**

| Option | Monthly Cost | Best For |
|--------|--------------|----------|
| **[Azure Container Apps](terraform-azure/)** | **~$0-5/mo** | $100 credits = 20-100+ months! |
| [DigitalOcean + Neon](terraform-digitalocean/) | ~$5/mo | Students with DO credits |
| [AWS Full Setup](terraform/) | ~$75-200/mo | Enterprise/Production |

### Quick Start (Azure - Cheapest!)

```bash
cd infrastructure/terraform-azure
cp terraform.tfvars.example terraform.tfvars
# Fill in: azure_subscription_id, neon_database_url, github_repo
terraform init && terraform apply
```

**Why Azure Container Apps is cheapest:**
- ✅ **Scale to zero** = Pay $0 when idle!
- ✅ **Pay per request** pricing
- ✅ FREE tier: 180K vCPU-sec, 360K GiB-sec, 2M requests/month

**Free Services Stack:**
- 🗄️ **Neon PostgreSQL**: FREE (https://neon.tech)
- 📊 **Sentry Monitoring**: FREE with Student Pack (https://sentry.io)
- 🐳 **GitHub Container Registry**: FREE (for Docker images)
- 🤖 **Gemini AI**: FREE tier (60 req/min)

---

## Architecture Options

### Option A: Azure Container Apps + Neon (Recommended - Cheapest!)

```
┌───────────────────────────────────────────────────────────────┐
│                       Azure Cloud                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │      Container Apps Environment (Consumption tier)       │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │        FastAPI Backend (Docker Container)         │  │  │
│  │  │  • Scale to zero  • Pay per request  • HTTPS      │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│    Neon PostgreSQL      │    │       Sentry.io         │
│        (FREE!)          │    │   Error Monitoring      │
│  • Serverless           │    │   (FREE with Student)   │
│  • Auto-scaling         │    │   • 500K events/mo      │
│  • Branching            │    │   • Performance         │
└─────────────────────────┘    └─────────────────────────┘
```

### Option B: AWS Full Setup (Enterprise)

```
┌──────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                        VPC (10.0.0.0/16)                       │  │
│  │  ┌─────────────────────────┐  ┌─────────────────────────────┐  │  │
│  │  │     Public Subnets      │  │      Private Subnets        │  │  │
│  │  │  ┌───────────────────┐  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │   ALB (Internet)  │  │  │  │    ECS Fargate Tasks  │  │  │  │
│  │  │  │                   │  │  │  │    (Backend API)      │  │  │  │
│  │  │  └─────────┬─────────┘  │  │  └───────────┬───────────┘  │  │  │
│  │  │            │            │  │              │              │  │  │
│  │  │            └────────────┼──┼──────────────┘              │  │  │
│  │  │                         │  │                             │  │  │
│  │  └─────────────────────────┘  │  ┌───────────────────────┐  │  │  │
│  │                               │  │   RDS PostgreSQL 16   │  │  │  │
│  │                               │  │   (Multi-AZ in prod)  │  │  │  │
│  │                               │  └───────────────────────┘  │  │  │
│  │                               │                             │  │  │
│  │                               │  ┌───────────────────────┐  │  │  │
│  │                               │  │   ElastiCache Redis   │  │  │  │
│  │                               │  │   (Optional)          │  │  │  │
│  │                               │  └───────────────────────┘  │  │  │
│  │                               └─────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │   CloudWatch Logs   │  │   SSM Parameters │  │   CloudWatch    │  │
│  │   & Metrics         │  │   (Secrets)      │  │   Alarms        │  │
│  └─────────────────────┘  └──────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Terraform** >= 1.5.0 (`brew install terraform`)
2. **Docker** (for building container images)
3. For AWS: **AWS CLI** configured
4. For DigitalOcean: **doctl CLI** (optional)

## Quick Start

### DigitalOcean (Recommended)

```bash
cd infrastructure/terraform-digitalocean
terraform init
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars
terraform apply
```

### AWS

```bash
cd infrastructure/terraform
terraform init
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars
terraform apply
```

## Directory Structure

```
infrastructure/
├── README.md                    # This file
├── terraform-digitalocean/      # 🌟 Recommended for students
│   ├── main.tf                  # DO App Platform + Neon
│   ├── terraform.tfvars.example
│   └── README.md
└── terraform/                   # AWS full setup
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    └── modules/
        ├── vpc/
        ├── security/
        ├── rds/
        ├── ecs/
        ├── redis/
        └── monitoring/
```

## Modules

### VPC Module
- Creates VPC with public and private subnets
- NAT Gateway for private subnet internet access
- Route tables and internet gateway

### Security Module
- ALB security group (HTTP/HTTPS from internet)
- ECS security group (traffic from ALB only)
- RDS security group (traffic from ECS only)
- Redis security group (traffic from ECS only)

### RDS Module
- PostgreSQL 16 on RDS
- Multi-AZ deployment in production
- Automated backups and encryption

### ECS Module
- Fargate cluster with capacity providers
- Task definition with secrets from SSM
- Application Load Balancer
- Auto-scaling in production

### Redis Module (Optional)
- ElastiCache Redis 7
- For session storage and caching

### Monitoring Module
- CloudWatch dashboard
- CPU/Memory alarms
- Error rate alarms
- Unhealthy host detection

## Environment Variables

Sensitive variables should be set via environment:

```bash
export TF_VAR_google_client_id="your-client-id"
export TF_VAR_google_client_secret="your-client-secret"
export TF_VAR_gemini_api_key="your-gemini-key"
export TF_VAR_openai_api_key="your-openai-key"
```

## Outputs

After applying, Terraform will output:

- `api_endpoint` - The API endpoint URL
- `database_endpoint` - RDS endpoint (internal)
- `ecs_cluster_name` - Name of the ECS cluster
- `database_password` - Generated database password (sensitive)

## Cost Estimation

### Development (us-west-2)
- ECS Fargate: ~$5-10/month (256 CPU, 512 MB)
- RDS t3.micro: ~$15/month
- NAT Gateway: ~$35/month
- **Total: ~$50-60/month**

### Production (us-west-2)
- ECS Fargate: ~$30-50/month (512 CPU, 1024 MB, 2 tasks)
- RDS t3.small (Multi-AZ): ~$50/month
- ElastiCache: ~$15/month
- NAT Gateway: ~$35/month
- ALB: ~$20/month
- **Total: ~$150-200/month**

## Cleanup

To destroy all resources:

```bash
terraform destroy -var-file=terraform.tfvars
```

## Security Considerations

1. All secrets stored in AWS SSM Parameter Store
2. Database in private subnet only
3. ECS tasks run as non-root user
4. All data encrypted at rest
5. HTTPS enforced via ALB (add ACM certificate)
6. Security groups follow least-privilege principle

## Next Steps

1. Add ACM certificate for HTTPS
2. Configure custom domain with Route53
3. Set up AWS Secrets Manager for rotation
4. Add WAF for additional protection
5. Configure backup retention policies
