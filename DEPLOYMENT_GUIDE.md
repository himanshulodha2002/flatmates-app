# Flatmates App - Deployment Guide 🚀

**Deploy your app in 15 minutes - FREE for 20-100+ months!**

## 💰 Cost Summary (Azure - Recommended!)

| Service | Monthly Cost | Free Duration |
|---------|--------------|---------------|
| **Azure Container Apps** | **$0-5/mo** | **20-100+ months** ($100 credits) |
| Neon PostgreSQL | FREE | Forever |
| Sentry Monitoring | FREE | Forever (500K events/mo) |
| Expo APK Builds | FREE | Forever (15 builds/mo) |
| Gemini AI | FREE | Forever (60 req/min) |
| **Total** | **~$0-5/mo** | **FREE for 20-100+ months!** |

### Why Azure Container Apps is the cheapest:
- ✅ **Scale to zero** = Pay $0 when idle (no traffic = no cost!)
- ✅ **Pay per request** pricing
- ✅ FREE tier: 180K vCPU-sec, 360K GiB-sec, 2M requests/month
- ✅ Perfect for apps with intermittent usage

---

## Part 1: Free Services Setup (5 min)

### Step 1: Neon Database (FREE)

1. Go to **https://neon.tech**
2. Click **"Sign in with GitHub"**
3. Create a new project:
   - Name: `flatmates`
   - Region: Choose closest to you
4. Copy the **Connection String** from the dashboard
   ```
   postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. ✅ Save this as your `DATABASE_URL`

### Step 2: Sentry Monitoring (FREE with Student Pack)

1. Go to **https://sentry.io/signup/**
2. Sign up with GitHub (uses Student Pack benefits)
3. Create a new project:
   - Platform: **Python**
   - Framework: **FastAPI**
4. Copy the **DSN** from the setup page
   ```
   https://xxx@xxx.ingest.sentry.io/xxx
   ```
5. ✅ Save this as your `SENTRY_DSN`

### Step 3: Azure Account ($100 FREE credits)

1. Go to **https://portal.azure.com**
2. Sign up / Log in with your Microsoft account
3. If you have Azure for Students or credits:
   - Verify at: **Cost Management + Billing → Credits**
4. Get your Subscription ID:
   ```bash
   # Install Azure CLI
   brew install azure-cli
   
   # Login
   az login
   
   # Get subscription ID
   az account show --query id -o tsv
   ```
5. ✅ Save this as your `AZURE_SUBSCRIPTION_ID`

### Step 4: Expo Account (FREE)

1. Go to **https://expo.dev/signup**
2. Create account (use GitHub)
3. Create an access token:
   - Go to **Account Settings → Access Tokens**
   - Create new token
4. ✅ Save this as your `EXPO_TOKEN`

---

## Part 2: Deploy Backend to Azure (5 min)

### Prerequisites

```bash
# Install Terraform and Azure CLI (if not installed)
brew install terraform azure-cli

# Login to Azure
az login

# Verify
terraform --version
az account show
```

### Step 1: Build & Push Docker Image (FREE with GitHub Container Registry!)

```bash
# Set your GitHub username
export GITHUB_USER="your-github-username"

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin

# Build the backend image
cd backend
docker build -t ghcr.io/$GITHUB_USER/flatmates-app/backend:latest --target production .

# Push to GHCR (FREE!)
docker push ghcr.io/$GITHUB_USER/flatmates-app/backend:latest
cd ..
```

### Step 2: Deploy with Terraform

```bash
# 1. Navigate to terraform directory
cd infrastructure/terraform-azure

# 2. Copy example config
cp terraform.tfvars.example terraform.tfvars

# 3. Edit with your values
nano terraform.tfvars  # or: code terraform.tfvars
```

**Fill in these values:**
```hcl
# Required
azure_subscription_id = "your-subscription-id-from-az-account-show"
neon_database_url     = "postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# Update with your GitHub username
github_repo = "YOUR_USERNAME/flatmates-app"

# Optional but recommended
sentry_dsn           = "https://xxx@xxx.ingest.sentry.io/xxx"
google_client_id     = "your-google-oauth-client-id"
google_client_secret = "your-google-oauth-secret"
gemini_api_key       = "your-gemini-api-key"
```

```bash
# 4. Initialize Terraform
terraform init

# 5. Preview what will be created
terraform plan

# 6. Deploy! (type 'yes' when prompted)
terraform apply

# 7. Get your API URL
terraform output app_url
```

🎉 **Your backend is now live!**

Example output:
```
app_url = "https://ca-flatmates-api-dev.bluewater-abc123.eastus.azurecontainerapps.io"
```

### Verify Deployment

```bash
# Check health endpoint (replace with your URL)
curl https://ca-flatmates-api-dev.xxx.azurecontainerapps.io/health

# Should return:
# {"status":"healthy","version":"1.0.0"}
```

---

## Part 3: Setup Mobile Builds (3 min)

### Add Expo Token to GitHub

1. Go to your GitHub repo
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Add:
   - Name: `EXPO_TOKEN`
   - Value: Your Expo token from Step 4

### Trigger First Build

```bash
# Commit and push to trigger automated build
git add .
git commit -m "chore: configure deployment"
git push origin main
```

### Manual Build (on-demand)

1. Go to GitHub → **Actions** tab
2. Select **Mobile CI/CD** workflow
3. Click **Run workflow**
4. Choose build type: `preview` (recommended for testing)
5. Click **Run workflow**

📱 **APK will be available on Expo dashboard in ~10-15 min**

---

## Part 4: Connect Mobile to Backend (2 min)

Update your mobile app to point to the deployed backend:

```bash
cd mobile
```

Create or edit environment config:

```typescript
// src/config/api.ts
export const API_URL = "https://ca-flatmates-api-dev.xxx.azurecontainerapps.io";
```

Or use environment variables:

```bash
# .env
API_URL=https://ca-flatmates-api-dev.xxx.azurecontainerapps.io
```

---

## ✅ Deployment Complete!

Your stack is now live:

| Component | URL | Status |
|-----------|-----|--------|
| **API** | `https://ca-flatmates-xxx.azurecontainerapps.io` | ✅ Live |
| **Database** | Neon PostgreSQL | ✅ Connected |
| **Monitoring** | sentry.io | ✅ Tracking errors |
| **APK Builds** | expo.dev | ✅ Automated |

---

## 📱 Useful Commands

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

### Redeploy

```bash
# Auto-redeploy on push (with GitHub Actions)
git push origin main

# Manual redeploy
az containerapp update \
  --name ca-flatmates-api-dev \
  --resource-group rg-flatmates-dev \
  --image ghcr.io/YOUR_USERNAME/flatmates-app/backend:latest

# Force redeploy via Terraform
terraform apply -replace=azurerm_container_app.backend
```

### Build APK Manually

```bash
cd mobile

# Preview build (for testing)
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### Check Build Status

- Expo Dashboard: https://expo.dev
- GitHub Actions: Your repo → Actions tab

---

## 🔧 Troubleshooting

### "Database connection failed"

- Verify Neon connection string has `?sslmode=require`
- Check if Neon project is active (free tier pauses after 5 days of inactivity)
- Wake it up by visiting the Neon dashboard

### "Container failed to start" on Azure

```bash
# Check logs
az containerapp logs show \
  --name ca-flatmates-api-dev \
  --resource-group rg-flatmates-dev \
  --tail 200
```

### "Image pull failed"

- Make sure your GHCR image is public, or configure registry credentials
- Verify the image name matches in Terraform config

### "Health check failed"

- Wait 2-3 minutes for the app to start
- Check the `/health` endpoint manually
- Review app logs for errors

### "EXPO_TOKEN not found"

- Verify the secret is added in GitHub Settings → Secrets → Actions
- Make sure the secret name is exactly `EXPO_TOKEN`

### Neon database sleeping

- Free tier pauses after 5 days of inactivity
- Just access the API once to wake it up (automatic)

### Monitor Azure Costs

```bash
# Check current spending
az consumption usage list --output table

# Set budget alert
az consumption budget create \
  --budget-name "flatmates-budget" \
  --amount 10 \
  --time-grain Monthly \
  --category Cost
```

---

## 🔄 Updating Your App

### Backend Changes

```bash
# Make changes, then:
git add .
git commit -m "feat: your changes"
git push origin main
# GitHub Actions auto-deploys in ~3-5 minutes
```

### Mobile Changes

```bash
# Changes auto-build APK on push to main
git push origin main

# Or trigger manual build:
# GitHub → Actions → Mobile CI/CD → Run workflow
```

---

## 🧹 Cleanup (if needed)

To destroy all resources and stop billing:

```bash
cd infrastructure/terraform-azure
terraform destroy
# Type 'yes' to confirm
```

Or delete resource group directly:
```bash
az group delete --name rg-flatmates-dev --yes
```

---

## 📞 Support

- **Azure**: https://docs.microsoft.com/azure
- **Neon**: https://neon.tech/docs
- **Expo**: https://docs.expo.dev
- **Sentry**: https://docs.sentry.io

---

## 💡 Cost-Saving Tips

1. **Scale to Zero**: Container Apps automatically scales to 0 replicas when idle = $0!
2. **Use East US region**: Typically the cheapest Azure region
3. **Keep FREE services**: Neon DB, Sentry, GHCR are all free
4. **Set budget alerts**: Get notified before running out of credits
5. **Check usage weekly**: `az consumption usage list`

---

**Happy deploying! 🎉**
