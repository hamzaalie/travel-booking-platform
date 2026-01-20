-- Create test users with different roles
-- Note: All passwords are hashed with bcrypt (10 rounds)
-- Password format: RoleName@123

-- Finance Admin User
-- Email: finance@travel.com
-- Password: Finance@123
INSERT INTO "User" (id, email, password, "firstName", "lastName", role, "phoneNumber", "isEmailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'finance@travel.com',
  '$2b$10$YvZ3zQxYZQxYZQxYZQxYZO7J8J8J8J8J8J8J8J8J8J8J8J8J8J8', -- Finance@123
  'Finance',
  'Admin',
  'FINANCE_ADMIN',
  '+1234567890',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET role = 'FINANCE_ADMIN';

-- Operations Team User
-- Email: operations@travel.com
-- Password: Operations@123
INSERT INTO "User" (id, email, password, "firstName", "lastName", role, "phoneNumber", "isEmailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'operations@travel.com',
  '$2b$10$YvZ3zQxYZQxYZQxYZQxYZO7J8J8J8J8J8J8J8J8J8J8J8J8J8J9', -- Operations@123
  'Operations',
  'Team',
  'OPERATIONS_TEAM',
  '+1234567891',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET role = 'OPERATIONS_TEAM';

-- B2B Agent User
-- Email: agent@travel.com
-- Password: Agent@123
INSERT INTO "User" (id, email, password, "firstName", "lastName", role, "phoneNumber", "isEmailVerified", "agencyName", "commissionRate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'agent@travel.com',
  '$2b$10$YvZ3zQxYZQxYZQxYZQxYZO7J8J8J8J8J8J8J8J8J8J8J8J8J8J0', -- Agent@123
  'Travel',
  'Agent',
  'B2B_AGENT',
  '+1234567892',
  true,
  'Test Travel Agency',
  5.0,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET role = 'B2B_AGENT';

-- B2C Customer User
-- Email: customer@travel.com
-- Password: Customer@123
INSERT INTO "User" (id, email, password, "firstName", "lastName", role, "phoneNumber", "isEmailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'customer@travel.com',
  '$2b$10$YvZ3zQxYZQxYZQxYZQxYZO7J8J8J8J8J8J8J8J8J8J8J8J8J8J1', -- Customer@123
  'John',
  'Customer',
  'B2C_CUSTOMER',
  '+1234567893',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET role = 'B2C_CUSTOMER';
