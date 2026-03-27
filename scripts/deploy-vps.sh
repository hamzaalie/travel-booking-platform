#!/bin/bash

# Travel Booking Platform - VPS Deployment Script
# This script automates the deployment process on the server.

set -e # Exit on any error

LOG_FILE="/var/log/travel-deploy.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🚀 Starting Deployment at $(date)..."

# 1. Pull latest changes
echo "📥 Pulling latest code from origin main..."
git pull origin main

# 2. Install Root Dependencies
echo "📦 Installing root dependencies..."
npm install

# 3. Setup Shared Module (if applicable)
if [ -d "shared" ]; then
    echo "🔗 Setting up Shared module..."
    cd shared && npm install && npm run build && cd ..
fi

# 4. Setup Backend
echo "⚙️ Setting up Backend..."
cd backend
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run build
cd ..

# 5. Setup Frontend
echo "🎨 Setting up Frontend..."
cd frontend
npm install
npm run build
cd ..

# 6. Restart Application
echo "🔄 Restarting PM2 process..."
pm2 restart travel-backend || pm2 start backend/dist/backend/src/server.js --name "travel-backend"

# 7. Reload Nginx (Optional)
# sudo service nginx reload

echo "✅ Deployment Complete at $(date)!"
echo "Check logs at /var/log/travel-deploy.log"
