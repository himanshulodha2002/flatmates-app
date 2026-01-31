# DigitalOcean + Free Services Deployment 🚀

**Total Cost: ~$5/month** (with $200 GitHub Student credits = **40 months FREE!**)

## 💰 Cost Breakdown (Student Edition)

| Service | Cost | Notes |
|---------|------|-------|
| **DigitalOcean App Platform** | $5/mo | $200 credits = 40 months! |
| **Neon PostgreSQL** | FREE | Generous free tier |
| **Sentry Monitoring** | FREE | 500K events/month with Student Pack |
| **Gemini AI** | FREE | 60 requests/minute free tier |
| **Total** | **~$5/mo** | **FREE for 40 months with credits!** |

## 📋 Prerequisites

1. **GitHub Student Developer Pack** (if you're a student)
   - Sign up: https://education.github.com/pack

2. **DigitalOcean Account**
   - Sign up: https://digitalocean.com
   - Redeem Student credits ($200): Account > Billing > Promo Code

3. **Neon Account** (FREE PostgreSQL)
   - Sign up: https://neon.tech (use GitHub login)

4. **Sentry Account** (FREE Error Monitoring)
   - Sign up: https://sentry.io/signup/
   - Use GitHub Student Pack for premium features

5. **Terraform CLI**
   ```bash
   brew install terraform
   ```

## 🚀 Quick Deploy (5 minutes!)

### Step 1: Set up Free Services

#### Neon Database (FREE)
1. Go to https://neon.tech and sign in with GitHub
2. Create a new project (name: "flatmates")
3. Copy the **Connection String** from the dashboard
   - Looks like: `postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

#### Sentry Monitoring (FREE with Student Pack)
1. Go to https://sentry.io/signup/
2. Create organization and project (Python > FastAPI)
3. Copy the **DSN** from Project Settings > Client Keys
   - Looks like: `https://xxx@xxx.ingest.sentry.io/xxx`

### Step 2: Configure Terraform

```bash
cd infrastructure/terraform-digitalocean

# Copy example and fill in your values
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

Fill in these required values:
```hcl
do_token          = "dop_v1_..."          # From DO dashboard
neon_database_url = "postgres://..."       # From Neon
sentry_dsn        = "https://...sentry..." # From Sentry
```

### Step 3: Deploy!

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy (takes ~5 minutes)
terraform apply
```

### Step 4: Get Your URLs

```bash
# Show all outputs
terraform output

# Get your live API URL
terraform output app_url
```

## 🔧 Post-Deploy Setup

### Run Database Migrations
The migrations run automatically on deploy! But if needed:
```bash
# Check logs
doctl apps logs <app-id>
```

### Verify Everything Works
```bash
# Check API health
curl https://your-app.ondigitalocean.app/health

# Check API docs (dev mode only)
open https://your-app.ondigitalocean.app/docs
```

### Connect Mobile App
Update your mobile app's API URL:
```typescript
// In mobile/src/config/api.ts
export const API_URL = "https://your-app.ondigitalocean.app";
```

## 📊 Monitoring Setup

### Sentry Dashboard
- Go to https://sentry.io
- View errors, performance, and releases
- Set up alerts for critical errors

### DigitalOcean Monitoring
- App Platform has built-in metrics
- View in: Apps > Your App > Insights

## 🔄 Auto-Deploy Setup

The Terraform config enables auto-deploy on push to `main`:
1. Push code to GitHub
2. DigitalOcean automatically builds and deploys
3. Zero-downtime deployments!

## 💡 Tips

### Scale Up Later
When you need more power:
```hcl
# In main.tf, change:
instance_size_slug = "basic-xs"   # $10/mo - 1GB RAM
instance_size_slug = "basic-s"    # $20/mo - 2GB RAM
```

### Add Custom Domain
```hcl
# Add to the app spec:
domain {
  name = "api.yourdomain.com"
  type = "PRIMARY"
}
```

### Add Redis Cache
Use Upstash Redis (FREE tier!):
- Sign up: https://upstash.com
- 10K commands/day free

## 🧹 Cleanup

To destroy all resources:
```bash
terraform destroy
```

## 🆘 Troubleshooting

### "Database connection failed"
- Check your Neon connection string has `?sslmode=require`
- Make sure the Neon project is active (free tier pauses after 5 days of inactivity)

### "Build failed"  
- Check DigitalOcean build logs: `doctl apps logs <app-id> --type=BUILD`
- Ensure Dockerfile is correct

### "Health check failed"
- Wait 2-3 minutes for app to start
- Check `/health` endpoint manually

### "Neon database sleeping"
- Free tier pauses after 5 days of inactivity
- Just access it once to wake it up (automatic)
