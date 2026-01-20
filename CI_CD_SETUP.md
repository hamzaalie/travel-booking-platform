# CI/CD Pipeline Configuration

## Overview

This document provides complete CI/CD setup for automated testing, building, and deployment of the Travel Booking Platform.

## GitHub Actions Configuration

### File: `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Job 1: Backend Tests
  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Generate Prisma Client
        working-directory: backend
        run: npx prisma generate

      - name: Run tests
        working-directory: backend
        run: npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          JWT_SECRET: test-jwt-secret
          JWT_REFRESH_SECRET: test-refresh-secret
          NODE_ENV: test

      - name: Run tests with coverage
        working-directory: backend
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: backend/coverage/lcov.info
          flags: backend
          name: backend-coverage

  # Job 2: Backend Build
  backend-build:
    name: Backend Build
    runs-on: ubuntu-latest
    needs: backend-test

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Generate Prisma Client
        working-directory: backend
        run: npx prisma generate

      - name: Build TypeScript
        working-directory: backend
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: backend-build
          path: backend/dist

  # Job 3: Frontend Build
  frontend-build:
    name: Frontend Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build production
        working-directory: frontend
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}

      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: frontend-build
          path: frontend/build

  # Job 4: Docker Build
  docker-build:
    name: Docker Build
    runs-on: ubuntu-latest
    needs: [backend-build, frontend-build]
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ secrets.DOCKER_USERNAME }}/travel-booking-backend
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-

      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/travel-booking-frontend:${{ github.sha }}

  # Job 5: Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.travelbooking.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy to staging server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /var/www/travel-booking
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T backend npx prisma migrate deploy

      - name: Health check
        run: |
          sleep 10
          curl -f https://staging.travelbooking.com/api/health || exit 1

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # Job 6: Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://travelbooking.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy to production server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /var/www/travel-booking
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T backend npx prisma migrate deploy

      - name: Health check
        run: |
          sleep 10
          curl -f https://travelbooking.com/api/health || exit 1

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # Job 7: Security Scan
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Run npm audit
        working-directory: backend
        run: npm audit --audit-level=high

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

## Required GitHub Secrets

### Repository Secrets

Configure in: `Settings → Secrets and variables → Actions`

```
DOCKER_USERNAME             # Docker Hub username
DOCKER_PASSWORD             # Docker Hub password or token
STAGING_HOST                # Staging server IP/domain
STAGING_USER                # SSH username for staging
STAGING_SSH_KEY             # Private SSH key for staging
PRODUCTION_HOST             # Production server IP/domain
PRODUCTION_USER             # SSH username for production
PRODUCTION_SSH_KEY          # Private SSH key for production
SLACK_WEBHOOK               # Slack webhook URL for notifications
SNYK_TOKEN                  # Snyk API token (optional)
REACT_APP_API_URL           # Frontend API URL
```

## Environment Setup

### Development Environment

```yaml
# .github/workflows/dev.yml
name: Development
on:
  push:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm test
```

### Staging Environment

- **Branch**: `develop`
- **URL**: `https://staging.travelbooking.com`
- **Database**: Staging PostgreSQL instance
- **Auto-deploy**: On push to develop

### Production Environment

- **Branch**: `main`
- **URL**: `https://travelbooking.com`
- **Database**: Production PostgreSQL instance
- **Manual approval**: Required before deployment

## Deployment Process

### Automatic Deployments

```mermaid
graph LR
    A[Push to develop] --> B[Run tests]
    B --> C[Build Docker]
    C --> D[Deploy to Staging]
    
    E[Push to main] --> F[Run tests]
    F --> G[Build Docker]
    G --> H[Manual Approval]
    H --> I[Deploy to Production]
```

### Manual Deployment

```bash
# Deploy to staging manually
gh workflow run ci-cd.yml --ref develop

# Deploy to production manually
gh workflow run ci-cd.yml --ref main
```

## Docker Deployment

### Dockerfile (Backend)

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

CMD ["npm", "start"]
```

### Dockerfile (Frontend)

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7
    restart: always

  backend:
    image: ${DOCKER_USERNAME}/travel-booking-backend:${VERSION}
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
    depends_on:
      - postgres
      - redis
    restart: always

  frontend:
    image: ${DOCKER_USERNAME}/travel-booking-frontend:${VERSION}
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
```

## Monitoring & Alerts

### Health Check Endpoint

```typescript
// backend/src/routes/health.ts
router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    database: 'connected',
    redis: 'connected',
  };
  
  res.status(200).json(health);
});
```

### Uptime Monitoring

**Recommended Services:**
- UptimeRobot (Free)
- Pingdom
- StatusCake

**Configuration:**
- Check interval: 5 minutes
- Timeout: 30 seconds
- Alert on 3 consecutive failures

### Log Aggregation

**Options:**
1. **Datadog** - Full observability
2. **LogDNA** - Log management
3. **Papertrail** - Simple logging
4. **ELK Stack** - Self-hosted

## Rollback Procedures

### Automatic Rollback

```yaml
# In deployment job
- name: Health check with rollback
  run: |
    if ! curl -f https://travelbooking.com/api/health; then
      docker-compose down
      docker-compose -f docker-compose.previous.yml up -d
      exit 1
    fi
```

### Manual Rollback

```bash
# SSH to server
ssh user@production-server

# Check previous versions
docker images | grep travel-booking

# Rollback to previous version
docker-compose down
docker tag travel-booking-backend:previous travel-booking-backend:latest
docker-compose up -d
```

## Database Migrations

### Automatic Migrations (Staging)

```yaml
- name: Run migrations
  run: docker-compose exec -T backend npx prisma migrate deploy
```

### Manual Migrations (Production)

```bash
# 1. Backup database
pg_dump -U postgres travel_booking > backup_$(date +%Y%m%d).sql

# 2. Test migration on staging
npx prisma migrate deploy --preview-feature

# 3. Apply to production
npx prisma migrate deploy
```

## Performance Testing

### Load Testing with Artillery

```yaml
# artillery.yml
config:
  target: 'https://travelbooking.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Load test

scenarios:
  - name: "Search and book"
    flow:
      - get:
          url: "/api/flights/search?origin=JFK&destination=LAX"
      - post:
          url: "/api/bookings"
          json:
            flightId: "{{ flightId }}"
```

### Run Load Tests

```bash
artillery run artillery.yml
```

## Cost Optimization

### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Auto-Scaling (AWS ECS)

```yaml
services:
  backend:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      placement:
        constraints:
          - node.role == worker
```

## Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres travel_booking | gzip > backups/db_$DATE.sql.gz

# Keep last 30 days
find backups/ -name "db_*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp backups/db_$DATE.sql.gz s3://travel-booking-backups/
```

### Automated Backups

```yaml
# backup job in ci-cd.yml
backup-database:
  runs-on: ubuntu-latest
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  steps:
    - name: Backup database
      run: |
        pg_dump $DATABASE_URL | gzip > backup.sql.gz
        aws s3 cp backup.sql.gz s3://backups/
```

## Security Scanning

### Dependency Scanning

```yaml
- name: Scan dependencies
  run: |
    npm audit
    npm audit fix --audit-level=moderate
```

### Container Scanning

```yaml
- name: Scan Docker image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'travel-booking-backend:latest'
    severity: 'HIGH,CRITICAL'
```

## Notification Channels

### Slack Integration

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to ${{ github.ref }} completed'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

### Email Notifications

Configure in GitHub Settings → Notifications

## Maintenance Mode

### Enable Maintenance

```nginx
# nginx maintenance config
server {
    listen 80;
    location / {
        return 503;
    }
    error_page 503 /maintenance.html;
    location = /maintenance.html {
        root /var/www/html;
    }
}
```

## Summary

This CI/CD pipeline provides:

✅ **Automated Testing** - All tests run on every commit
✅ **Docker Builds** - Containerized deployments
✅ **Staging Environment** - Test before production
✅ **Production Deployment** - Automated with approval
✅ **Health Checks** - Verify deployments work
✅ **Rollback Support** - Quick recovery from failures
✅ **Security Scanning** - Catch vulnerabilities early
✅ **Monitoring** - Track uptime and performance
✅ **Backup Strategy** - Protect data
✅ **Notifications** - Stay informed

**Setup Time**: ~2 hours
**Maintenance**: Minimal after initial setup
**Cost**: Free (GitHub Actions free tier) + hosting costs

---

*Configure secrets and push to trigger your first automated deployment!*
