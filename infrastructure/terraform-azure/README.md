# Flatmates App - Azure Deployment (Budget-Friendly!)

## 💰 Cost Comparison: Why Azure Container Apps?

| Option | Monthly Cost | With $100 Credits |
|--------|--------------|-------------------|
| **Azure Container Apps (Consumption)** | **$0-5** | **20-100+ months!** |
| Azure App Service (B1) | $13 | ~7 months |
| Azure Container Instances | $15+ | ~6 months |
| DigitalOcean App Platform | $5 | ~20 months |

### Why Container Apps is cheapest:
- ✅ **Scale to zero** - Pay $0 when no one is using the app
- ✅ **Pay per request** - Only charged for actual usage
- ✅ **FREE tier includes**: 180K vCPU-sec, 360K GiB-sec, 2M requests/month
- ✅ Uses FREE Neon database (no Azure SQL costs!)

---

## Prerequisites

### 1. Install Azure CLI
```bash
# macOS
brew install azure-cli

# Verify
az --version
```

### 2. Login to Azure
```bash
# Login (opens browser)
az login

# Verify subscription
az account show

# If you have multiple subscriptions, set the one with credits:
az account list --output table
az account set --subscription "Your Subscription Name"
```

### 3. Get your Subscription ID
```bash
az account show --query id -o tsv
# Copy this value for terraform.tfvars
```

---

## Deployment Steps

### Step 1: Configure Variables

```bash
cd infrastructure/terraform-azure

# Copy example config
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars  # or: code terraform.tfvars
```

Fill in:
- `azure_subscription_id` - From `az account show`
- `neon_database_url` - Your Neon connection string
- Other optional values

### Step 2: Build & Push Docker Image to GitHub Container Registry (FREE!)

First, enable GitHub Container Registry and push your image:

```bash
# 1. Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 2. Build the image
cd backend
docker build -t ghcr.io/YOUR_USERNAME/flatmates-app/backend:latest .

# 3. Push to GHCR (FREE!)
docker push ghcr.io/YOUR_USERNAME/flatmates-app/backend:latest
```

Or use GitHub Actions (see `.github/workflows/azure-deploy.yml`).

### Step 3: Deploy with Terraform

```bash
cd infrastructure/terraform-azure

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy! (type 'yes' when prompted)
terraform apply
```

### Step 4: Verify Deployment

```bash
# Get the app URL
terraform output app_url

# Test health endpoint
curl https://ca-flatmates-api-dev.xxx.azurecontainerapps.io/health
```

---

## GitHub Actions Workflow (Recommended)

For automatic deployments, add this secret to your GitHub repo:
- `AZURE_CREDENTIALS` - Service principal JSON (see below)

### Create Service Principal

```bash
# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "flatmates-github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth

# Copy the entire JSON output and save as GitHub secret AZURE_CREDENTIALS
```

---

## Cost Monitoring

### Check your spending:
```bash
# View current costs
az consumption usage list --output table

# Or use Azure Portal:
# Portal > Cost Management + Billing > Cost analysis
```

### Set up budget alerts:
```bash
# Create a budget alert at $10
az consumption budget create \
  --budget-name "flatmates-budget" \
  --amount 10 \
  --time-grain Monthly \
  --category Cost
```

---

## Useful Commands

### View Logs
```bash
# Stream logs
az containerapp logs show \
  --name ca-flatmates-api-dev \
  --resource-group rg-flatmates-dev \
  --follow

# View recent logs
az containerapp logs show \
  --name ca-flatmates-api-dev \
  --resource-group rg-flatmates-dev \
  --tail 100
```

### Restart App
```bash
az containerapp revision restart \
  --name ca-flatmates-api-dev \
  --resource-group rg-flatmates-dev \
  --revision <revision-name>
```

### Force Redeploy
```bash
# Update to trigger new deployment
az containerapp update \
  --name ca-flatmates-api-dev \
  --resource-group rg-flatmates-dev \
  --image ghcr.io/YOUR_USERNAME/flatmates-app/backend:latest
```

---

## Cleanup

To destroy all resources:
```bash
terraform destroy
# Type 'yes' to confirm
```

Or delete resource group directly:
```bash
az group delete --name rg-flatmates-dev --yes
```

---

## Troubleshooting

### "Container failed to start"
- Check logs: `az containerapp logs show ...`
- Verify DATABASE_URL is correct
- Ensure Docker image is built and pushed

### "Image pull failed"
- Make sure GHCR image is public or configure credentials
- Verify image name matches in Terraform

### "Out of credits"
- Check Azure Portal > Cost Management
- Scale down or destroy unused resources
- Container Apps scales to zero automatically when idle

### Database connection issues
- Verify Neon connection string includes `?sslmode=require`
- Check if Neon project is active (wakes up automatically on first request)
