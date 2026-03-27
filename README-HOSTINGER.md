# Hosting on Hostinger Cloud Startup: Quick Start Guide

This guide provides the necessary steps to deploy the Travel Booking Platform to your Hostinger Cloud Startup hosting.

## 1. Database Setup
Log in to your **hPanel** and go to **Databases** -> **Management**:
1. Create a new **PostgreSQL** or **MySQL** database.
2. Note down the **DB Name**, **User**, and **Password**.
3. Copy the connection string for your `.env` file.

## 2. Setup Node.js Web App
Go to **Websites** -> **Add Website** and select **Node.js Apps**:
1. Connect your **GitHub Repository**.
2. **Framework**: Select "Express" or "None" (Manual).
3. **Node Version**: Select **20.x** or **22.x**.
4. **App Directory**: `/` (root).
5. **Main File**: `backend/dist/backend/src/server.js`.
6. **Environment Variables**: Add all variables from `backend/.env.example` (DATABASE_URL, JWT_SECRET, etc.).

## 3. Environment Variables
In the **Node.js App** configuration in hPanel, add the following key variables:
- `NODE_ENV`: `production`
- `PORT`: `5000` (or whatever Hostinger assigns)
- `DATABASE_URL`: Your hPanel DB connection string.
- `FRONTEND_URL`: `https://yourdomain.com`
- `VITE_API_URL`: `/api` (since it's served from the same domain)

## 4. Deployment & Build
1. Click **Deploy** in hPanel.
2. Hostinger will run `npm install`.
3. Ensure the project root `package.json` has the following script:
   `"postinstall": "npm run prisma:generate && npm run build"`
   Hostinger will run this automatically after installation.

## 5. SSL (Hostinger Managed)
Hostinger Cloud Startup usually provides a free SSL. Go to **Security** -> **SSL** in hPanel to ensure it's active.

## 6. Redis
If your plan supports Redis, enable it under **Advanced** -> **Redis** and add the `REDIS_URL` to your environment variables.
