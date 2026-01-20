// Quick test user creation guide
// Run these commands in your database client or use the API

export const testUsers = {
  financeAdmin: {
    email: 'finance@travel.com',
    password: 'Finance@123',
    role: 'FINANCE_ADMIN',
    permissions: [
      '✅ View financial reports',
      '✅ Approve fund requests', 
      '✅ Manage wallet operations',
      '❌ Cannot manage users',
      '❌ Cannot access system settings'
    ]
  },
  operationsTeam: {
    email: 'operations@travel.com',
    password: 'Operations@123',
    role: 'OPERATIONS_TEAM',
    permissions: [
      '✅ Manage bookings',
      '✅ Handle customer support',
      '✅ Process SSR requests',
      '❌ Cannot view financial reports',
      '❌ Cannot approve fund requests'
    ]
  },
  agent: {
    email: 'agent@travel.com',
    password: 'Agent@123',
    role: 'B2B_AGENT',
    permissions: [
      '✅ Create bookings',
      '✅ Manage clients',
      '✅ Track commissions',
      '✅ Access agent portal'
    ]
  },
  customer: {
    email: 'customer@travel.com',
    password: 'Customer@123',
    role: 'B2C_CUSTOMER',
    permissions: [
      '✅ Search flights/hotels/cars',
      '✅ Create bookings',
      '✅ View own bookings',
      '✅ Manage profile'
    ]
  }
};

// To create users, use the registration API:
// POST http://localhost:5001/api/auth/register
// Then manually update the role in the database or create a super admin endpoint
