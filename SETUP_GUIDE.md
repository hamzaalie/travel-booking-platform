# Development Setup Guide

## Prerequisites

Ensure you have the following installed:
- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14
- **Redis** >= 6.0
- **npm** >= 9.0.0

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# This will automatically install dependencies in all workspaces (backend, frontend, shared)
```

### 2. Configure Environment Variables

```bash
# Copy the example env file
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/travel_booking?schema=public"

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars

# Amadeus (Sign up at https://developers.amadeus.com)
AMADEUS_API_KEY=your-amadeus-api-key
AMADEUS_API_SECRET=your-amadeus-api-secret

# Payment Gateways (Use test credentials)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
KHALTI_SECRET_KEY=your-khalti-test-key
ESEWA_MERCHANT_ID=your-esewa-merchant-id

# SendGrid (for emails)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### 3. Setup Database

```bash
# Start PostgreSQL (if using Docker)
docker run --name travel_postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=travel_booking -p 5432:5432 -d postgres:15

# Run database migrations
cd backend
npm run prisma:generate
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 4. Start Redis

```bash
# Using Docker
docker run --name travel_redis -p 6379:6379 -d redis:7-alpine

# OR install locally and start
redis-server
```

### 5. Start Development Servers

```bash
# From root directory - starts both backend and frontend
npm run dev

# OR start individually
npm run dev:backend    # Backend on http://localhost:5000
npm run dev:frontend   # Frontend on http://localhost:3000
```

## Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Creating the First Super Admin

After starting the server, register a super admin manually:

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d travel_booking

# Insert super admin user
INSERT INTO users (id, email, password, "firstName", "lastName", role, "isActive", "emailVerified")
VALUES (
  gen_random_uuid(),
  'admin@travelbooking.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lkYPJRFYjr4W',  -- password: Admin123!
  'Super',
  'Admin',
  'SUPER_ADMIN',
  true,
  true
);
```

**Login Credentials:**
- Email: admin@travelbooking.com
- Password: Admin123!

**⚠️ IMPORTANT:** Change this password immediately after first login!

## API Testing

### Using cURL

```bash
# Health check
curl http://localhost:5000/health

# Register B2C customer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "B2C_CUSTOMER"
  }'

# Register B2B agent
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@agency.com",
    "password": "Password123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "B2B_AGENT",
    "agencyName": "Travel Agency Ltd",
    "agencyLicense": "LIC12345",
    "city": "Kathmandu",
    "country": "Nepal"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@travelbooking.com",
    "password": "Admin123!"
  }'
```

### Using Postman

Import the API collection (to be created) or manually test endpoints:

**Base URL:** `http://localhost:5000/api`

**Headers for authenticated requests:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

## Development Workflow

### 1. Admin Workflow
1. Login as super admin
2. Approve pending B2B agent applications
3. Configure global markups
4. Monitor bookings and transactions
5. Approve fund load requests

### 2. B2B Agent Workflow
1. Register and wait for approval
2. Login after approval
3. Submit fund load request
4. Search flights
5. Apply custom markups
6. Book tickets (deducted from wallet)
7. View bookings and reports

### 3. B2C Customer Workflow
1. Register/Login (optional for search)
2. Search flights
3. Select flight
4. Enter passenger details
5. Pay via gateway
6. Receive ticket confirmation

## Database Management

```bash
# Create a new migration
npm run prisma:migrate

# Reset database (CAUTION: Deletes all data)
cd backend
npx prisma migrate reset

# Seed database (if seed file exists)
npx prisma db seed
```

## Troubleshooting

### Port already in use
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 3000 (frontend)
npx kill-port 3000
```

### Database connection issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists: `createdb travel_booking`

### Redis connection issues
- Verify Redis is running: `redis-cli ping` (should return PONG)
- Check REDIS_URL in .env

### Prisma issues
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

## Testing Amadeus Integration

1. **Sign up for Amadeus Test API:**
   - Go to https://developers.amadeus.com
   - Create account and get test credentials
   - Add to `.env`

2. **Test Flight Search:**
```bash
curl -X GET "http://localhost:5000/api/flights/search?origin=KTM&destination=DEL&departureDate=2026-03-01&adults=1"
```

## Testing Payment Gateways

### Stripe Test Mode
- Use test card: 4242 4242 4242 4242
- Any future expiry date
- Any CVC

### Khalti Test Mode
- Use test credentials from Khalti dashboard

### eSewa Test Mode
- Use eSewa UAT environment credentials

## Next Steps

1. ✅ Backend API is running
2. ⏳ Frontend development (React)
3. ⏳ Email service integration
4. ⏳ PDF invoice generation
5. ⏳ Advanced reporting
6. ⏳ Production deployment

## Support

For issues or questions:
- Check logs: `docker-compose logs -f backend`
- Review error messages in terminal
- Check database state: `npm run prisma:studio`

---

**Happy Coding! 🚀**
