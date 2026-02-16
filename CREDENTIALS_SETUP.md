# 🔑 Credentials Setup Guide

## Current Status: ✅ All Payment Gateways & APIs Pre-configured

Your Travel Booking Platform is ready for the following services. Just provide the credentials!

---

## 📋 Required Credentials Checklist

### 🗄️ **1. Database (REQUIRED)**

**Neon PostgreSQL - FREE Tier**
- **Sign up:** https://neon.tech/
- **Steps:**
  1. Create account
  2. Create new project
  3. Copy connection string
  
**Format needed:**
```env
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

---

### 🔄 **2. Redis Cache (REQUIRED)**

**Upstash Redis - FREE Tier**
- **Sign up:** https://upstash.com/
- **Steps:**
  1. Create account
  2. Create Redis database
  3. Copy REST URL and Token

**Format needed:**
```env
REDIS_URL="https://xxx-xxx.upstash.io"
REDIS_TOKEN="your-redis-token"
```

---

### ✈️ **3. Flight API (REQUIRED) - Choose One:**

#### **Option A: Amadeus (RECOMMENDED - Already Integrated)**
- **Sign up:** https://developers.amadeus.com/
- **Free tier:** 2,000 transactions/month
- **Steps:**
  1. Create account
  2. Create self-service app
  3. Copy API Key & API Secret

**Format needed:**
```env
AMADEUS_API_KEY="your-api-key"
AMADEUS_API_SECRET="your-api-secret"
AMADEUS_BASE_URL="https://test.api.amadeus.com"
```

#### **Option B: Travelport (Optional - Future Integration)**
- **Sign up:** https://developer.travelport.com/home
- **Note:** Not yet integrated in codebase
- Can be added later if needed

---

### 💳 **4. Payment Gateways**

#### **A. Esewa (Nepal) - Already Configured**
- **Test credentials:** https://developer.esewa.com.np/pages/Test-credentials
- **Docs:** https://developer.esewa.com.np/

**Test Credentials Available:**
```env
ESEWA_MERCHANT_ID="EPAYTEST"
ESEWA_SECRET_KEY="8gBm/:&EnhH.1/q"
ESEWA_URL="https://rc-epay.esewa.com.np"
# Production: https://epay.esewa.com.np
```

#### **B. Khalti (Nepal) - Already Configured**
- **Docs:** https://docs.khalti.com/khalti-epayment/
- **Sandbox Admin:** https://test-admin.khalti.com
- **Production Admin:** https://admin.khalti.com

**Sandbox Credentials (from Khalti docs):**
```env
KHALTI_SECRET_KEY="05bf95cc57244045b8df5fad06748dab"
KHALTI_PUBLIC_KEY=""  # Not needed for ePayment v2
KHALTI_URL="https://dev.khalti.com/api/v2"
# Production URL: https://khalti.com/api/v2
# Test Khalti ID: 9800000001 | MPIN: 1111 | OTP: 987654
```

#### **C. Stripe - Already Configured**
- **Sign up:** https://stripe.com/
- **Free:** Unlimited test transactions
- **Steps:**
  1. Create account
  2. Get test API keys from Dashboard > Developers > API keys

**Format needed:**
```env
STRIPE_SECRET_KEY="sk_test_51xxxxx"
STRIPE_PUBLISHABLE_KEY="pk_test_51xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
```

**Test Card:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

#### **D. PayPal - Already Configured**
- **Sign up:** https://developer.paypal.com/
- **Free:** Sandbox testing
- **Steps:**
  1. Create account
  2. Create Sandbox app
  3. Get Client ID and Secret

**Format needed:**
```env
PAYPAL_CLIENT_ID="your-client-id"
PAYPAL_SECRET="your-secret"
PAYPAL_MODE="sandbox"
```

---

### 📧 **5. Email Service (OPTIONAL)**

**SendGrid - FREE Tier**
- **Sign up:** https://sendgrid.com/
- **Free:** 100 emails/day
- **Steps:**
  1. Create account
  2. Verify sender email
  3. Create API key

**Format needed:**
```env
SENDGRID_API_KEY="SG.xxxxx"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="Travel Booking Platform"
```

**Note:** If not provided, emails will log to console (dev mode)

---

## 🚀 Quick Start Configuration

### **Minimum Required to Run:**

1. ✅ **Neon Database URL**
2. ✅ **Upstash Redis URL + Token**
3. ✅ **Amadeus API Key + Secret**
4. ✅ **At least ONE payment gateway** (Stripe recommended for testing)

### **Optional (Can add later):**
- SendGrid for real emails
- PayPal for additional payment option
- Multiple payment gateways

---

## 📝 Example .env File

Once you have credentials, update `.env` file:

```env
# Environment
NODE_ENV=development
PORT=5000

# Database (REQUIRED - From Neon)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# JWT Secrets (Auto-generated or custom)
JWT_SECRET="generate-random-32-char-string-here"
JWT_REFRESH_SECRET="generate-different-32-char-string"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Redis (REQUIRED - From Upstash)
REDIS_URL="https://xxx.upstash.io"
REDIS_TOKEN="your-token-here"

# Amadeus GDS (REQUIRED - From Amadeus Self-Service)
AMADEUS_API_KEY="your-api-key"
AMADEUS_API_SECRET="your-api-secret"
AMADEUS_BASE_URL="https://test.api.amadeus.com"

# Esewa (Test Mode) — URL auto-selected: EPAYTEST → sandbox, real ID → production
ESEWA_MERCHANT_ID="EPAYTEST"
ESEWA_SECRET_KEY="8gBm/:&EnhH.1/q"
ESEWA_URL="https://rc-epay.esewa.com.np"
# IMPORTANT: Only these domains are valid:
#   Sandbox: https://rc-epay.esewa.com.np  (use with EPAYTEST)
#   Production: https://epay.esewa.com.np  (use with real merchant ID)
#   NEVER use uat.esewa.com.np — that domain does NOT exist

# Khalti — Sandbox: dev.khalti.com | Production: khalti.com
# Get sandbox key from: https://test-admin.khalti.com
KHALTI_SECRET_KEY="05bf95cc57244045b8df5fad06748dab"
KHALTI_PUBLIC_KEY=""
KHALTI_URL="https://dev.khalti.com/api/v2"
# Test Khalti ID: 9800000001 | MPIN: 1111 | OTP: 987654

# Stripe (Get from Stripe Dashboard)
STRIPE_SECRET_KEY="sk_test_your-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-key"
STRIPE_WEBHOOK_SECRET="whsec_your-secret"

# PayPal (Optional)
PAYPAL_CLIENT_ID="your-client-id"
PAYPAL_SECRET="your-secret"
PAYPAL_MODE="sandbox"

# SendGrid (Optional)
SENDGRID_API_KEY="SG.xxxxx"
EMAIL_FROM="noreply@travelbooking.com"
EMAIL_FROM_NAME="Travel Booking Platform"

# Application
DEFAULT_CURRENCY=USD
```

---

## 🎯 Next Steps

### **Once You Provide Credentials:**

1. ✅ Update `.env` file with your credentials
2. ✅ Run database migrations: `npx prisma migrate dev`
3. ✅ Start backend: `npm run dev`
4. ✅ Start frontend: `npm run dev` (in frontend folder)
5. ✅ Create test accounts (admin, agent, customer)

---

## 🆘 Need Help?

**Test Credentials Available Now:**
- ✅ **Esewa:** Test mode credentials in docs
- ✅ **Khalti:** Test credentials in docs
- ✅ **Stripe:** Free test mode available
- ✅ **PayPal:** Sandbox mode available

**Just Need from You:**
1. 🔴 **Neon Database URL** (5 minutes to get)
2. 🔴 **Upstash Redis URL** (5 minutes to get)
3. 🔴 **Amadeus API Keys** (10 minutes to get)
4. 🟡 **Stripe Test Keys** (5 minutes to get)

**Total setup time: ~25 minutes to get platform fully running!**

---

## 📞 Ready to Configure?

**Send me these details and I'll configure everything:**

```
DATABASE_URL=postgresql://...
REDIS_URL=https://...
REDIS_TOKEN=...
AMADEUS_API_KEY=...
AMADEUS_API_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**I'll handle:**
- ✅ Environment configuration
- ✅ Database migrations
- ✅ Initial admin account creation
- ✅ System testing
- ✅ Starting both frontend & backend

**Platform Status:** 🟢 Ready to deploy with your credentials!
