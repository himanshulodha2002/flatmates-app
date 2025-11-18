# Backend Deployment Guide - DigitalOcean (GitHub Education Pack)

This guide will help you deploy the Flatmates backend to DigitalOcean using your **$200 free credit** from the GitHub Education Pack.

## Prerequisites

1. GitHub Education Pack access
2. Google OAuth credentials
3. (Optional) OpenAI or Gemini API key for AI features

---

## Step 1: Claim DigitalOcean Credits

1. Visit: https://education.github.com/pack
2. Search for "DigitalOcean" in the pack
3. Click "Get access to DigitalOcean"
4. Sign up/login to DigitalOcean
5. Verify you have **$200 credit** (valid for 1 year)

---

## Step 2: Create PostgreSQL Database

1. **Go to DigitalOcean Dashboard**
2. Click **"Create"** → **"Databases"**
3. Configure:
   - **Database engine**: PostgreSQL
   - **Version**: PostgreSQL 15 or later
   - **Data center region**: Choose closest to your users
   - **Plan**:
     - Start with **Basic ($15/month)** - 1GB RAM, 10GB storage
     - Your $200 credit covers 13+ months
   - **Database name**: `flatmates-db`
4. Click **"Create Database Cluster"**
5. **Wait 3-5 minutes** for provisioning

### Get Database Connection String

1. In your database dashboard, go to **"Connection Details"**
2. Copy the **"Connection String"** - looks like:
   ```
   postgresql://doadmin:PASSWORD@your-db-host.db.ondigitalocean.com:25060/flatmates-db?sslmode=require
   ```
3. **Save this** - you'll need it later

---

## Step 3: Prepare Environment Variables

Create a `.env.production` file with these values:

```env
# Database (from Step 2)
DATABASE_URL=postgresql://doadmin:PASSWORD@your-db-host.db.ondigitalocean.com:25060/flatmates-db?sslmode=require

# Security (auto-generated)
SECRET_KEY=your-secret-key-will-be-generated
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS (will update after deployment)
BACKEND_CORS_ORIGINS=["https://your-app.ondigitalocean.app"]

# Google OAuth (REQUIRED - you need to provide these)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# AI Features (OPTIONAL but recommended)
OPENAI_API_KEY=sk-your-openai-key-here
# OR
GEMINI_API_KEY=your-gemini-api-key-here
```

---

## Step 4: Get Google OAuth Credentials

### A. Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Click **"Select a Project"** → **"New Project"**
3. Name: `flatmates-app`
4. Click **"Create"**

### B. Enable Google+ API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click **"Enable"**

### C. Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Configure consent screen if prompted:
   - User Type: **External**
   - App name: `Flatmates App`
   - User support email: your email
   - Developer email: your email
   - Click **"Save and Continue"** through all steps
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Flatmates Backend`
   - Authorized redirect URIs: Leave empty for now
   - Click **"Create"**
5. **Copy and save**:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### D. Add Mobile OAuth Client

1. Create another OAuth client ID:
   - Application type: **Android** (for mobile app)
   - Name: `Flatmates Android App`
   - Package name: `com.flatmates.app`
   - SHA-1: You'll get this from Expo (run `eas credentials` later)
2. Save the Web Client ID for the mobile app

---

## Step 5: Deploy Backend to DigitalOcean App Platform

### Option A: Deploy via GitHub (Recommended)

1. **Push code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create App on DigitalOcean**:
   - Go to **"Apps"** → **"Create App"**
   - Choose **"GitHub"**
   - Authorize DigitalOcean to access your repo
   - Select repository: `flatmates-app`
   - Branch: `main`
   - Source Directory: `/backend`
   - Autodeploy: **Enabled** ✓

3. **Configure App**:
   - **Name**: `flatmates-api`
   - **Region**: Same as database
   - **Detected Source**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Run Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8080`
   - **HTTP Port**: 8080
   - **Instance Size**: Basic ($5/month)

4. **Add Environment Variables**:
   Click **"Environment Variables"** and add:

   | Key | Value | Type |
   |-----|-------|------|
   | DATABASE_URL | (from Step 2) | Secret |
   | SECRET_KEY | (generate random 32 chars) | Secret |
   | ALGORITHM | HS256 | Plain Text |
   | ACCESS_TOKEN_EXPIRE_MINUTES | 10080 | Plain Text |
   | GOOGLE_CLIENT_ID | (from Step 4) | Secret |
   | GOOGLE_CLIENT_SECRET | (from Step 4) | Secret |
   | BACKEND_CORS_ORIGINS | `["*"]` (temporary) | Plain Text |
   | OPENAI_API_KEY | (optional) | Secret |
   | GEMINI_API_KEY | (optional) | Secret |

   To generate SECRET_KEY:
   ```bash
   openssl rand -hex 32
   ```

5. **Review and Create**:
   - Review all settings
   - Click **"Create Resources"**
   - Wait 5-10 minutes for deployment

6. **Get Your Backend URL**:
   - Once deployed, you'll see your app URL like:
   - `https://flatmates-api-xxxxx.ondigitalocean.app`
   - **Save this URL**

---

## Step 6: Run Database Migrations

1. **Open App Console**:
   - In DigitalOcean App dashboard
   - Click **"Console"** tab
   - Click **"Run Command"**

2. **Run migration**:
   ```bash
   alembic upgrade head
   ```

3. Verify: You should see migration output without errors

---

## Step 7: Update Mobile App with Backend URL

1. **Update mobile/.env.production**:
   ```env
   EXPO_PUBLIC_API_URL=https://flatmates-api-xxxxx.ondigitalocean.app/api/v1
   EXPO_PUBLIC_ENVIRONMENT=production
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID
   ```

2. **Rebuild the APK**:
   ```bash
   cd mobile
   eas build --platform android --profile production
   ```

---

## Step 8: Update CORS Settings

1. Update `BACKEND_CORS_ORIGINS` environment variable:
   ```json
   ["https://flatmates-api-xxxxx.ondigitalocean.app", "*"]
   ```
   (The `*` allows the mobile app to connect)

---

## Step 9: Test Your Backend

1. **Visit API docs**:
   ```
   https://flatmates-api-xxxxx.ondigitalocean.app/docs
   ```
   You should see the FastAPI interactive documentation

2. **Test health endpoint**:
   ```
   https://flatmates-api-xxxxx.ondigitalocean.app/health
   ```
   Should return: `{"status":"healthy"}`

3. **Test from mobile app**:
   - Install the APK on your phone
   - Try logging in with Google

---

## Cost Breakdown (with $200 credit)

| Service | Cost/Month | Duration |
|---------|-----------|----------|
| PostgreSQL Basic (1GB) | $15 | 13 months |
| App Platform Basic | $5 | 40 months |
| **Total** | **$20/month** | **~10 months free** |

Your $200 credit covers approximately **10 months** of operation!

---

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL includes `?sslmode=require`
- Check database is in same region as app
- Verify database firewall allows app access

### Migration Errors
- Check DATABASE_URL is correct
- Ensure database is running
- Check app console for detailed errors

### Google OAuth Not Working
- Verify GOOGLE_CLIENT_ID and SECRET are correct
- Check OAuth consent screen is configured
- Ensure redirect URIs are correct

### CORS Errors from Mobile App
- Temporarily set CORS to `["*"]` for testing
- Check mobile app is using correct API URL

---

## Next Steps

1. Set up monitoring and alerts in DigitalOcean
2. Configure custom domain (optional)
3. Set up backups for PostgreSQL database
4. Review and tighten CORS settings for production
5. Set up CI/CD for automatic deployments

---

## Security Checklist

- [ ] Use strong SECRET_KEY (32+ random characters)
- [ ] Keep all API keys as "Secret" environment variables
- [ ] Enable database backups
- [ ] Set proper CORS origins (no wildcards in production)
- [ ] Review database access permissions
- [ ] Enable 2FA on DigitalOcean account
- [ ] Regularly update dependencies

---

## Alternative: Deploy via Docker

If you prefer Docker:

1. Build image:
   ```bash
   docker build -t flatmates-backend ./backend
   ```

2. Push to DigitalOcean Container Registry
3. Deploy from container registry

See DigitalOcean docs: https://docs.digitalocean.com/products/app-platform/

---

## Support Resources

- DigitalOcean Docs: https://docs.digitalocean.com/
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/
- GitHub Education Pack: https://education.github.com/pack

---

**Your backend will be live at**: `https://flatmates-api-[random].ondigitalocean.app`

Remember to save all credentials securely!
