# Testing Guide: RBAC & Multi-City Flight Search

## 🎯 Test User Setup

Since we're having terminal issues, here's how to create test users:

### Option 1: Register via API and Update Database

1. **Register users via the API:**
   ```bash
   # Finance Admin
   POST http://localhost:5001/api/auth/register
   {
     "email": "finance@travel.com",
     "password": "Finance@123",
     "firstName": "Finance",
     "lastName": "Admin",
     "phoneNumber": "+1234567890"
   }
   
   # Operations Team
   POST http://localhost:5001/api/auth/register
   {
     "email": "operations@travel.com",
     "password": "Operations@123",
     "firstName": "Operations",
     "lastName": "Team",
     "phoneNumber": "+1234567891"
   }
   ```

2. **Update roles in database using Prisma Studio:**
   ```bash
   cd backend
   npx prisma studio
   ```
   - Navigate to the User table
   - Find the users you just created
   - Update their `role` field to `FINANCE_ADMIN` or `OPERATIONS_TEAM`

### Option 2: Use Existing Super Admin

If you already have a SUPER_ADMIN user, you can use the new user management APIs:

```bash
# Update user role
PUT http://localhost:5001/api/admin/users/:userId/role
Authorization: Bearer <super_admin_token>
{
  "newRole": "FINANCE_ADMIN"
}
```

---

## 🧪 Testing the RBAC System

### Test 1: Finance Admin Permissions

**Login as Finance Admin** (finance@travel.com / Finance@123)

**Should Have Access To:**
- ✅ Dashboard route: `/admin/financial`
- ✅ GET `/api/admin/reports/financial` - View financial reports
- ✅ GET `/api/admin/fund-requests` - View fund requests
- ✅ PUT `/api/admin/fund-requests/:id/approve` - Approve fund requests
- ✅ GET `/api/admin/wallet/transactions` - View wallet transactions

**Should NOT Have Access To:**
- ❌ GET `/api/admin/users` - List all users (403 Forbidden)
- ❌ PUT `/api/admin/users/:id/role` - Update user roles (403 Forbidden)
- ❌ GET `/api/admin/settings` - System settings (403 Forbidden)

### Test 2: Operations Team Permissions

**Login as Operations Team** (operations@travel.com / Operations@123)

**Should Have Access To:**
- ✅ Dashboard route: `/admin/operations`
- ✅ GET `/api/bookings` - View all bookings
- ✅ PUT `/api/bookings/:id` - Update booking status
- ✅ GET `/api/admin/reports/bookings` - View booking reports
- ✅ POST `/api/bookings/:id/ssr` - Manage SSR (future feature)

**Should NOT Have Access To:**
- ❌ GET `/api/admin/reports/financial` - Financial reports (403 Forbidden)
- ❌ GET `/api/admin/fund-requests` - Fund requests (403 Forbidden)
- ❌ GET `/api/admin/wallet/transactions` - Wallet operations (403 Forbidden)

### Test 3: UI Navigation

**Finance Admin sees:**
- Financial Reports
- Fund Requests
- Wallet Management
- No "Users" or "Settings" menu items

**Operations Team sees:**
- Bookings
- Customer Support
- Booking Reports
- No financial menu items

---

## ✈️ Testing Multi-City Flight Search

### Test Scenario 1: Simple Multi-City (3 Segments)

**URL:** http://localhost:3000/flights/multi-city

**Test Data:**
```json
{
  "segments": [
    {
      "origin": "DEL",
      "destination": "BKK",
      "date": "2026-03-01"
    },
    {
      "origin": "BKK",
      "destination": "SIN",
      "date": "2026-03-05"
    },
    {
      "origin": "SIN",
      "destination": "DEL",
      "date": "2026-03-10"
    }
  ],
  "adults": 1,
  "children": 0,
  "infants": 0,
  "travelClass": "ECONOMY"
}
```

**Expected Results:**
- ✅ Form validates successfully
- ✅ Auto-fills destination → next origin (BKK → BKK)
- ✅ Date suggestions work (increments by 3 days)
- ✅ Search returns flight combinations
- ✅ Results show total duration, stops, airline combinations
- ✅ Price breakdown includes base + taxes + fees

### Test Scenario 2: Circular Route Detection (Should FAIL)

**Test Data:**
```json
{
  "segments": [
    {
      "origin": "DEL",
      "destination": "BKK",
      "date": "2026-03-01"
    },
    {
      "origin": "BKK",
      "destination": "DEL",
      "date": "2026-03-05"
    },
    {
      "origin": "DEL",
      "destination": "BKK",
      "date": "2026-03-10"
    }
  ]
}
```

**Expected Result:**
- ❌ Form shows validation error: "Circular route detected"
- ❌ Search button disabled
- ⚠️ Red border on duplicate segment

### Test Scenario 3: Invalid Date Sequence (Should FAIL)

**Test Data:**
```json
{
  "segments": [
    {
      "origin": "DEL",
      "destination": "BKK",
      "date": "2026-03-10"
    },
    {
      "origin": "BKK",
      "destination": "SIN",
      "date": "2026-03-05"  // Earlier than previous segment!
    }
  ]
}
```

**Expected Result:**
- ❌ Form shows validation error: "Segments must be in chronological order"
- ❌ Search button disabled

### Test Scenario 4: Too Many Infants (Should FAIL)

**Test Data:**
```json
{
  "adults": 2,
  "infants": 3  // More infants than adults!
}
```

**Expected Result:**
- ❌ Form shows validation error: "Number of infants cannot exceed number of adults"

### Test Scenario 5: Complex Itinerary (6 Segments)

**Test Data:**
```json
{
  "segments": [
    {"origin": "NYC", "destination": "LON", "date": "2026-04-01"},
    {"origin": "LON", "destination": "PAR", "date": "2026-04-05"},
    {"origin": "PAR", "destination": "ROM", "date": "2026-04-10"},
    {"origin": "ROM", "destination": "ATH", "date": "2026-04-15"},
    {"origin": "ATH", "destination": "IST", "date": "2026-04-20"},
    {"origin": "IST", "destination": "NYC", "date": "2026-04-25"}
  ],
  "adults": 2,
  "travelClass": "BUSINESS"
}
```

**Expected Results:**
- ✅ All 6 segments accepted
- ✅ Long itinerary displayed properly
- ✅ Total trip duration calculated
- ✅ Complex airline combinations shown

---

## 🎨 UI/UX Testing Checklist

### Multi-City Search Form
- [ ] Add/remove segment buttons work
- [ ] Min 2 segments, max 6 segments enforced
- [ ] IATA code validation (3 uppercase letters)
- [ ] Date picker shows valid dates only
- [ ] Passenger count buttons (+ / -) work
- [ ] Travel class dropdown works
- [ ] Real-time validation messages appear
- [ ] Form is responsive on mobile

### Multi-City Results
- [ ] Results display in cards
- [ ] Expandable details work (click to expand)
- [ ] Airline logos/names shown
- [ ] Duration formatted correctly (e.g., "25h 30m")
- [ ] Layover times displayed
- [ ] Price breakdown visible
- [ ] "Select" button navigates to booking
- [ ] Loading state shows skeleton
- [ ] Empty state shows helpful message

### Role-Based Navigation
- [ ] Navigation items change based on role
- [ ] Unauthorized routes redirect
- [ ] Role badge shows correct color
- [ ] Permissions properly restrict API calls

---

## 🚀 Quick Test Commands

```bash
# Check if backend is running
curl http://localhost:5001/health

# Test multi-city search endpoint
curl -X POST http://localhost:5001/api/flights/search/multi-city \
  -H "Content-Type: application/json" \
  -d '{
    "segments": [
      {"origin": "DEL", "destination": "BKK", "date": "2026-03-01"},
      {"origin": "BKK", "destination": "SIN", "date": "2026-03-05"}
    ],
    "adults": 1,
    "travelClass": "ECONOMY"
  }'

# Test protected endpoint (should get 401 without auth)
curl http://localhost:5001/api/admin/users

# Test with auth token
curl http://localhost:5001/api/admin/users \
  -H "Authorization: Bearer <your_token>"
```

---

## ✅ Success Criteria

**RBAC System:**
- [ ] Finance Admin can access financial endpoints
- [ ] Finance Admin CANNOT access user management
- [ ] Operations Team can access booking endpoints
- [ ] Operations Team CANNOT access financial endpoints
- [ ] UI navigation reflects role permissions
- [ ] Unauthorized API calls return 403 Forbidden

**Multi-City Search:**
- [ ] Can search 2-6 flight segments
- [ ] Circular route detection works
- [ ] Date sequence validation works
- [ ] Passenger validation works
- [ ] Results display correctly
- [ ] Booking flow integration works

---

## 📊 Performance Benchmarks

- Multi-city search response: < 3 seconds
- Form validation: < 100ms
- Role-based navigation render: < 50ms
- API authorization check: < 10ms

---

## 🐛 Known Issues

1. **Terminal Interruption**: Scripts getting interrupted - use Prisma Studio or direct SQL
2. **Vite Warning**: "Module type not specified" in postcss.config.js - non-breaking

---

## 📝 Next Steps After Testing

Once testing is complete, we'll implement:
1. **SSR Module** - Seat selection, meals, baggage
2. **Enhanced Hotel Features** - Advanced filters, voucher generation
3. **Car Rental Enhancements** - Insurance, add-ons

---

**Need Help?**
- Backend logs: Check terminal running `npm run dev`
- Frontend errors: Check browser console (F12)
- Database issues: Use `npx prisma studio` to inspect data
