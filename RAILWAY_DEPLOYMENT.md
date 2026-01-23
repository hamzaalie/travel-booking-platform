# Travel Booking Platform - Railway Deployment Guide

Deploy both **frontend** and **backend** as separate services on Railway.

## Project Structure

This is a **Shared Monorepo** using npm workspaces:
```
├── package.json          # Root package.json with workspaces
├── backend/
│   ├── package.json
│   └── railway.json      # Backend config
├── frontend/
│   ├── package.json
│   └── railway.json      # Frontend config
└── shared/
    └── package.json
```

---

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

GitHub Repo: https://github.com/hamzaalie/travel-booking-platform

---

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Choose `hamzaalie/travel-booking-platform`
4. Railway auto-detects the monorepo and creates services!

---

## Step 3: Configure Backend Service

### Service Settings
Go to **Settings** tab:

| Setting | Value |
|---------|-------|
| **Config Path** | `/backend/railway.json` |
| **Watch Paths** | `backend/**`, `shared/**`, `package.json` |

### Backend Environment Variables

Go to **Variables** tab → **Raw Editor** and paste:

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long
AMADEUS_API_KEY=your-amadeus-api-key
AMADEUS_API_SECRET=your-amadeus-api-secret
NODE_ENV=production
FRONTEND_URL=https://your-frontend.up.railway.app
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
```

### Generate Backend Domain
Go to **Settings** → **Networking** → **"Generate Domain"**

---

## Step 4: Configure Frontend Service

### Service Settings
Go to **Settings** tab:

| Setting | Value |
|---------|-------|
| **Config Path** | `/frontend/railway.json` |
| **Watch Paths** | `frontend/**`, `shared/**`, `package.json` |

### Frontend Environment Variables

```env
VITE_API_URL=https://your-backend.up.railway.app/api
```

### Generate Frontend Domain
Go to **Settings** → **Networking** → **"Generate Domain"**

---

## Step 5: Add PostgreSQL (if needed)

**Option A: Railway PostgreSQL**
1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Copy `DATABASE_URL` from database Variables
3. Add to backend service

**Option B: Neon (Free)**
1. Go to [neon.tech](https://neon.tech) → Create database
2. Copy connection string → Add as `DATABASE_URL`

---

## Configuration Files

### Backend: `/backend/railway.json`
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build:backend"
  },
  "deploy": {
    "preDeployCommand": ["npm run prisma:migrate:deploy"],
    "startCommand": "node backend/dist/src/server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Frontend: `/frontend/railway.json`
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build:frontend"
  },
  "deploy": {
    "startCommand": "npx serve -s frontend/dist -l $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 32 chars for token signing |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars for refresh tokens |
| `AMADEUS_API_KEY` | ✅ | Amadeus GDS API key |
| `AMADEUS_API_SECRET` | ✅ | Amadeus GDS API secret |
| `NODE_ENV` | ✅ | Set to `production` |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS |
| `STRIPE_SECRET_KEY` | ⚠️ | For card payments |
| `SMTP_HOST` | ⚠️ | Email server host |
| `SMTP_USER` | ⚠️ | Email username |
| `SMTP_PASS` | ⚠️ | Email password |

### Frontend

| Variable | Required | Description |
|----------|:--------:|-------------|
| `VITE_API_URL` | ✅ | Backend API URL with `/api` suffix |

---

## Verify Deployment

### Backend
```bash
curl https://your-backend.up.railway.app/health
# Expected: {"status": "ok", "timestamp": "..."}
```

### Frontend
- ✅ Homepage loads
- ✅ Login works  
- ✅ Flight search returns results

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check logs, verify `npm run build` works locally |
| DB connection error | Verify `DATABASE_URL` includes `?sslmode=require` |
| CORS errors | Ensure `FRONTEND_URL` matches exact frontend domain |
| API not responding | Check `/health` endpoint, verify `VITE_API_URL` has `/api` |

---

## Costs

| Platform | Free Tier |
|----------|-----------|
| Railway | $5 credit/month |
| Neon DB | 0.5GB free |
