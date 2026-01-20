# Travel Booking Platform - Railway Deployment

## Quick Deploy (Single Service)

Your entire app (frontend + backend) deploys as **ONE service**!

### Step 1: Push to GitHub

```bash
# Initialize git if not done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/travel-booking-platform.git

# Push
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `travel-booking-platform` repository
5. Railway auto-detects `railway.toml` and configures everything!

### Step 3: Set Environment Variables

Go to your service → **Variables** tab → **Raw Editor** and paste:

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-at-least-32-characters-long
AMADEUS_API_KEY=your-amadeus-api-key
AMADEUS_API_SECRET=your-amadeus-api-secret
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
FRONTEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production
```

### Step 4: Generate Public Domain

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Your app will be live at `https://your-app.up.railway.app`

### Step 5: Verify Deployment

Visit your domain and check:
- ✅ Homepage loads
- ✅ `/health` returns OK
- ✅ Login works
- ✅ Flight search works

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | ✅ | Neon PostgreSQL connection string |
| JWT_SECRET | ✅ | Min 32 chars for token signing |
| JWT_REFRESH_SECRET | ✅ | Min 32 chars for refresh tokens |
| AMADEUS_API_KEY | ✅ | Amadeus GDS API key |
| AMADEUS_API_SECRET | ✅ | Amadeus GDS API secret |
| STRIPE_SECRET_KEY | ⚠️ | For card payments |
| KHALTI_SECRET_KEY | ⚠️ | For Khalti payments (Nepal) |
| ESEWA_MERCHANT_ID | ⚠️ | For eSewa payments (Nepal) |
| SMTP_HOST | ⚠️ | Email server host |
| SMTP_USER | ⚠️ | Email username |
| SMTP_PASS | ⚠️ | Email password |
| FRONTEND_URL | ✅ | Frontend URL for CORS |
| NODE_ENV | ✅ | Set to `production` |

## Alternative: Render.com

If Railway doesn't work, use Render.com with similar setup.

## Costs

| Platform | Free Tier |
|----------|-----------|
| Railway | $5 credit/month (enough for small apps) |
| Render | 750 hours/month free |
| Neon DB | 0.5GB free |
