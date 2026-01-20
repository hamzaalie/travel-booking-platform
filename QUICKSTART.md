# ⚡ Quick Start - Travel Booking Platform

Get the platform running in 5 minutes!

---

## 🚀 Docker Setup (Easiest)

```bash
# 1. Start all services
docker-compose up -d

# 2. Wait 30 seconds for initialization

# 3. Open your browser
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000/health
```

**Done!** Platform is ready to use.

---

## 🔑 Default Login

After Docker starts, create admin account:

```bash
cd backend
npm run prisma:seed
```

**Admin Credentials:**
- Email: `admin@travelbooking.com`
- Password: `Admin123!`

Login at: http://localhost:3000/login

---

## 🛠️ Manual Setup (Development)

### 1. Prerequisites
```bash
# Check versions
node --version  # Need 18+
psql --version  # Need 14+
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run prisma:migrate
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 📍 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |
| Health Check | http://localhost:5000/health |

---

## 🧪 Test It Works

```bash
# Test backend health
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@travelbooking.com","password":"Admin123!"}'
```

---

## 🐛 Issues?

**Backend won't start:**
```bash
docker logs travel-booking-backend
```

**Database connection failed:**
```bash
docker ps | grep postgres
```

**Port already in use:**
```bash
# On Windows
netstat -ano | findstr :5000
```

**Reset everything:**
```bash
docker-compose down -v
docker-compose up -d --build
```

---

## 📚 Full Documentation

- [Complete Setup Guide](SETUP_GUIDE.md)
- [Project Status](PROJECT_STATUS.md)
- [Backend Docs](backend/README.md)
- [Frontend Docs](frontend/README.md)

---

## 🎯 What's Next?

1. ✅ Login as admin → http://localhost:3000/login
2. ✅ View admin dashboard → http://localhost:3000/admin
3. ✅ Approve test agents
4. ✅ Search flights (requires Amadeus API key)
5. ✅ Make test booking

**Need Amadeus API key?** Get free test account: https://developers.amadeus.com/register

---

**Platform Status:** Backend 100% complete, Frontend 60% complete (pages need implementation)

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed progress.
