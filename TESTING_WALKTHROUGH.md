# 🧪 COMPLETE TESTING WALKTHROUGH

**Date:** January 18, 2026  
**Purpose:** End-to-end testing of the Travel Booking Platform

---

## 📋 PRE-REQUISITES

### 1. Start All Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Verify Services Running
- ✅ Backend: http://localhost:5001
- ✅ Frontend: http://localhost:3000
- ✅ Database: PostgreSQL connected
- ✅ Redis: Running (optional)

---

## 👥 TEST USER ACCOUNTS

### Create Test Users via API or Database

**1. Super Admin:**
```
Email: admin@travel.com
Password: Admin@123
Role: SUPER_ADMIN
```

**2. B2B Agent:**
```
Email: agent@travel.com
Password: Agent@123
Role: B2B_AGENT
Company: XYZ Travel Agency
```

**3. B2C Customer:**
```
Email: customer@travel.com
Password: Customer@123
Role: B2C_CUSTOMER
```

---

## 🧪 TEST SCENARIO 1: AGENT REGISTRATION & APPROVAL

### Step 1: Register as Agent
1. Go to http://localhost:3000/register
2. Select **"B2B Agent (Travel Agency)"**
3. Fill in details:
   - Email: agent@travel.com
   - Password: Agent@123
   - First Name: John
   - Last Name: Agent
   - Company Name: XYZ Travel Agency
   - Business License: TL123456
   - Tax ID: TAX987654
   - Phone: +1234567890
   - Address: 123 Main St, City
4. Click **"Register"**
5. **Expected:** Registration successful, waiting for approval

### Step 2: Admin Approves Agent
1. Logout from agent account
2. Login as **admin@travel.com** / **Admin@123**
3. Go to **Agent Management** page
4. Find **agent@travel.com** with status **PENDING**
5. Click **"Approve"**
6. **Expected:** Agent status changes to APPROVED
7. **Expected:** Agent receives approval email

### Step 3: Verify Agent Can Login
1. Logout from admin
2. Login as **agent@travel.com** / **Agent@123**
3. **Expected:** Redirected to Agent Dashboard
4. **Expected:** Shows wallet balance = $0.00

---

## 🧪 TEST SCENARIO 2: WALLET FUNDING WORKFLOW

### Step 1: Agent Requests Funds
1. Login as **agent@travel.com**
2. Go to **Wallet** page
3. Click **"Request Funds"**
4. Enter amount: **$10,000**
5. Upload payment proof (any image file)
6. Add note: "Initial wallet loading via bank transfer"
7. Click **"Submit Request"**
8. **Expected:** Request submitted successfully
9. **Expected:** Status shows "PENDING"

### Step 2: Admin Approves Fund Request
1. Logout and login as **admin@travel.com**
2. Go to **Fund Requests** page
3. Find agent's request for $10,000
4. Review payment proof
5. Click **"Approve"**
6. **Expected:** Request status changes to APPROVED
7. **Expected:** Agent wallet credited with $10,000
8. **Expected:** Agent receives approval email

### Step 3: Verify Wallet Balance
1. Logout and login as **agent@travel.com**
2. Go to **Wallet** page
3. **Expected:** Balance shows $10,000.00
4. **Expected:** Transaction history shows credit entry
5. **Expected:** balanceBefore: $0, balanceAfter: $10,000

---

## 🧪 TEST SCENARIO 3: AGENT SETS CUSTOM MARKUP

### Step 1: Configure Markup
1. Login as **agent@travel.com**
2. Go to **Markups** page
3. Click **"Add New Markup"**
4. Fill in:
   - Service Type: FLIGHT
   - Markup Type: PERCENTAGE
   - Value: 5 (5%)
   - Description: Standard commission
   - Status: ACTIVE
5. Click **"Save"**
6. **Expected:** Markup created successfully

### Step 2: Verify Markup in Pricing
1. Search for a flight
2. View flight price
3. **Expected:** Price includes 5% agent markup
4. **Example:**
   ```
   Base Fare: $500
   Global Markup (Admin): $20 (4%)
   Agent Markup: $25 (5%)
   ----------------------------
   Total: $545
   ```

---

## 🧪 TEST SCENARIO 4: AGENT BOOKS FLIGHT FOR CUSTOMER

### Step 1: Search Flights
1. Login as **agent@travel.com**
2. Go to **Search Flights**
3. Enter:
   - From: New York (JFK)
   - To: London (LHR)
   - Date: Tomorrow
   - Passengers: 1 Adult
4. Click **"Search"**
5. **Expected:** Flight results displayed

### Step 2: Select Flight & Enter Customer Details
1. Select a flight
2. Click **"Book Now"**
3. Enter **customer information** (not agent's):
   - Title: MR
   - First Name: David
   - Last Name: Customer
   - Date of Birth: 1990-01-01
   - Email: david.customer@example.com
   - Phone: +1234567890
   - Passport: AB1234567
4. Review price breakdown
5. Click **"Proceed to Payment"**

### Step 3: Complete Booking (Wallet Payment)
1. **Payment Method:** Wallet
2. Click **"Confirm Booking"**
3. **Expected:** 
   - Booking created successfully
   - Wallet balance deducted
   - PNR generated
   - E-ticket sent to customer email
   - Agent sees booking in their dashboard

### Step 4: Verify Wallet Deduction
1. Go to **Wallet** page
2. **Expected:** 
   - Balance reduced by booking amount
   - Transaction history shows debit entry
   - balanceBefore: $10,000
   - balanceAfter: $9,455 (example)
   - Amount: -$545

### Step 5: Verify Booking Details
1. Go to **My Bookings**
2. Find the booking
3. Click to view details
4. **Expected:**
   - PNR number displayed
   - Flight details correct
   - Passenger name: David Customer
   - Booking status: CONFIRMED
   - Download ticket button available

---

## 🧪 TEST SCENARIO 5: CUSTOMER DIRECT BOOKING

### Step 1: Customer Registration
1. Logout from agent account
2. Go to **Register**
3. Select **"B2C Customer"**
4. Fill in:
   - Email: customer@travel.com
   - Password: Customer@123
   - First Name: Sarah
   - Last Name: Customer
5. Click **"Register"**
6. **Expected:** Account created (no approval needed)

### Step 2: Customer Books Hotel
1. Login as **customer@travel.com**
2. Go to **Hotels** tab
3. Search:
   - City: London
   - Check-in: 2 days from now
   - Check-out: 5 days from now
   - Guests: 2 Adults
4. Click **"Search"**
5. Select a hotel
6. Click **"Book Now"**

### Step 3: Customer Payment via Stripe
1. Enter guest details
2. Click **"Proceed to Payment"**
3. Select **Stripe** payment
4. Click **"Pay"**
5. **Expected:** Redirected to Stripe Checkout
6. Use test card:
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: Any future date
   CVC: Any 3 digits
   ```
7. Click **"Pay"**
8. **Expected:** 
   - Redirected to success page
   - Booking confirmed
   - Confirmation email sent

---

## 🧪 TEST SCENARIO 6: CAR RENTAL BOOKING

### Step 1: Search Cars
1. Login as **customer@travel.com**
2. Go to **Car Rental** tab
3. Enter:
   - Pick-up: Los Angeles Airport (LAX)
   - Drop-off: Los Angeles Airport (LAX)
   - Pick-up Date: Tomorrow
   - Pick-up Time: 10:00 AM
   - Drop-off Date: 3 days later
   - Drop-off Time: 10:00 AM
   - Driver Age: 25-64 years
4. Click **"Search Cars"**
5. **Expected:** Car results with realistic pricing

### Step 2: Verify Pricing
1. Check displayed prices
2. **Expected:** 
   - Economy: ~$35-40/day
   - Standard: ~$50-60/day
   - SUV: ~$75-85/day
   - Luxury: ~$120-140/day
3. **Total price** = daily rate × number of days

### Step 3: Book Car (Optional)
1. Select a car
2. Click **"Book Now"**
3. Fill in driver details
4. Complete payment
5. **Expected:** Booking confirmed

---

## 🧪 TEST SCENARIO 7: REFUND PROCESSING

### Step 1: Customer Requests Cancellation
1. Login as **customer@travel.com**
2. Go to **My Bookings**
3. Select a booking
4. Click **"Cancel Booking"**
5. Confirm cancellation
6. **Expected:** Cancellation request submitted

### Step 2: Admin Processes Refund
1. Login as **admin@travel.com**
2. Go to **Refunds** page (if available) or **All Bookings**
3. Find cancelled booking
4. Review refund calculation:
   ```
   Original Amount: $545
   Cancellation Penalty: 10% = $54.50
   Refund Amount: $490.50
   ```
5. Click **"Approve Refund"**
6. **Expected:**
   - Refund processed
   - Customer/Agent wallet credited
   - Refund email sent

---

## 🧪 TEST SCENARIO 8: ADMIN REPORTING & ANALYTICS

### Step 1: View Dashboard
1. Login as **admin@travel.com**
2. Go to **Dashboard**
3. **Expected:** See statistics:
   - Total bookings
   - Total revenue
   - Active agents
   - Pending fund requests
   - Recent bookings

### Step 2: Generate Revenue Report
1. Go to **Reports** page
2. Select **Revenue Analytics**
3. Choose date range: Last 30 days
4. Click **"Generate"**
5. **Expected:**
   - Daily breakdown of revenue
   - Total bookings per day
   - Average booking value
   - Charts and graphs

### Step 3: Export Report
1. Click **"Export CSV"**
2. **Expected:** CSV file downloads
3. Click **"Export PDF"**
4. **Expected:** PDF report generates

### Step 4: Agent Performance Report
1. Select **Agent Performance**
2. View all agents
3. **Expected:** Shows:
   - Agent name
   - Total bookings
   - Total revenue
   - Commission earned
   - Wallet balance

---

## 🧪 TEST SCENARIO 9: MULTI-CITY FLIGHT BOOKING

### Step 1: Search Multi-City
1. Login as **agent@travel.com** or **customer@travel.com**
2. Go to **Flights**
3. Select **"Multi-City"** trip type
4. Add multiple segments:
   - Flight 1: New York → London (Jan 20)
   - Flight 2: London → Paris (Jan 25)
   - Flight 3: Paris → New York (Jan 30)
5. Click **"Search"**
6. **Expected:** Multi-city results displayed

### Step 2: Complete Multi-City Booking
1. Select flights for each segment
2. Enter passenger details
3. Proceed to payment
4. Complete booking
5. **Expected:**
   - All segments booked together
   - Single PNR for entire itinerary
   - E-ticket includes all flights

---

## 🧪 TEST SCENARIO 10: WALLET TRANSACTION AUDIT

### Step 1: View Transaction History
1. Login as **agent@travel.com**
2. Go to **Wallet** → **Transaction History**
3. **Expected:** See all transactions:
   - Credit: $10,000 (Fund Request Approved)
   - Debit: -$545 (Booking #12345)
   - Debit: -$320 (Booking #12346)
   - Credit: $490.50 (Refund for Booking #12345)

### Step 2: Verify Immutable Ledger
1. Each transaction shows:
   - ✅ Transaction ID
   - ✅ Date & Time
   - ✅ Type (CREDIT/DEBIT)
   - ✅ Amount
   - ✅ Balance Before
   - ✅ Balance After
   - ✅ Reference (Booking ID or Fund Request ID)
   - ✅ Description

### Step 3: Export Ledger
1. Click **"Export Transactions"**
2. **Expected:** CSV with complete transaction history

---

## ✅ TESTING CHECKLIST

### Authentication & Authorization
- [ ] Super Admin can login
- [ ] B2B Agent can login (after approval)
- [ ] B2C Customer can login
- [ ] Invalid credentials rejected
- [ ] JWT token refresh works
- [ ] Role-based access enforced

### Agent Management
- [ ] Agent can register
- [ ] Admin can approve/reject agents
- [ ] Approved agents can access platform
- [ ] Rejected agents cannot login
- [ ] Agent status changes reflected

### Wallet Operations
- [ ] Agent can request funds
- [ ] Admin can approve fund requests
- [ ] Wallet balance updates correctly
- [ ] Transaction ledger is immutable
- [ ] balanceBefore/balanceAfter accurate
- [ ] Insufficient balance prevents booking
- [ ] Refunds credit wallet correctly

### Booking Flow
- [ ] Flight search returns results
- [ ] Hotel search returns results
- [ ] Car rental search returns results
- [ ] Price calculation correct (with markups)
- [ ] Booking creates PNR
- [ ] E-tickets sent via email
- [ ] Booking status tracked
- [ ] Cancellation works

### Payment Integration
- [ ] Stripe Checkout redirects correctly
- [ ] Payment success page loads
- [ ] Booking completed after payment
- [ ] PayPal integration works
- [ ] Esewa/Khalti (if tested)
- [ ] Wallet payment for agents

### Markup System
- [ ] Admin can set global markup
- [ ] Agent can set custom markup
- [ ] Prices include all markups
- [ ] Markup calculation accurate

### Reporting
- [ ] Admin dashboard loads
- [ ] Revenue report generates
- [ ] Agent performance report works
- [ ] CSV export downloads
- [ ] PDF export generates
- [ ] Date filters work

### Email Notifications
- [ ] Welcome email sent
- [ ] Agent approval email sent
- [ ] Booking confirmation sent- [ ] Welcome email sent
- [ ] Agent Work done email sent and working. Now we need to work on the admin panel as well
- [ ] E-ticket sent
- [ ] Fund approval email sent
- [ ] Refund notification sent

### Security
- [ ] Cannot access routes without login
- [ ] Cannot access admin routes as agent
- [ ] Cannot access agent routes as customer
- [ ] Cannot view other users' data
- [ ] SQL injection prevented
- [ ] XSS protection works

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: Backend not starting
**Solution:**
```bash
# Check if port is in use
netstat -ano | findstr :5001
# Kill process if needed
Stop-Process -Id <PID> -Force
```

### Issue: Frontend white screen
**Solution:**
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Issue: Database connection error
**Solution:**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Run migrations: `npm run prisma:migrate`

### Issue: Amadeus API 401 errors
**Solution:**
- Token expired - auto-refresh should handle it
- Mock fallback activates for hotel/car rentals

### Issue: Stripe Checkout not redirecting
**Solution:**
- Check STRIPE_SECRET_KEY in backend .env
- Check success_url includes correct domain
- Verify pending booking in sessionStorage

---

## 📊 SUCCESS CRITERIA

### Platform is working correctly if:
1. ✅ All user roles can login
2. ✅ Agent registration → approval → wallet funding works
3. ✅ Bookings can be created via wallet or Stripe
4. ✅ Wallet transactions are recorded correctly
5. ✅ Markups are applied to prices
6. ✅ Refunds process successfully
7. ✅ Reports generate and export
8. ✅ Emails are sent (check logs if SendGrid not configured)
9. ✅ No console errors in browser
10. ✅ No server crashes in terminal

---

## 🎯 NEXT STEPS

After completing all tests:
1. Document any bugs found
2. Test edge cases (insufficient wallet balance, expired tokens, etc.)
3. Performance testing (load 100+ bookings)
4. Security testing (try unauthorized access)
5. Mobile responsiveness testing
6. Browser compatibility testing

---

**Happy Testing! 🚀**
