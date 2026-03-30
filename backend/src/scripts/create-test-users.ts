import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('Creating test users...');

    // Finance Admin user
    const financeAdminPassword = await bcrypt.hash('Finance@123', 10);
    const financeAdmin = await prisma.user.upsert({
      where: { email: 'finance@travel.com' },
      update: {
        role: UserRole.FINANCE_ADMIN,
      },
      create: {
        email: 'finance@travel.com',
        password: financeAdminPassword,
        firstName: 'Finance',
        lastName: 'Admin',
        role: UserRole.FINANCE_ADMIN,
        phone: '+1234567890',
        emailVerified: true,
      },
    });
    console.log('✅ Finance Admin created:', financeAdmin.email);

    // Operations Team user
    const operationsPassword = await bcrypt.hash('Operations@123', 10);
    const operationsUser = await prisma.user.upsert({
      where: { email: 'operations@travel.com' },
      update: {
        role: UserRole.OPERATIONS_TEAM,
      },
      create: {
        email: 'operations@travel.com',
        password: operationsPassword,
        firstName: 'Operations',
        lastName: 'Team',
        role: UserRole.OPERATIONS_TEAM,
        phone: '+1234567891',
        emailVerified: true,
      },
    });
    console.log('✅ Operations Team created:', operationsUser.email);

    // B2B Agent user (for comparison)
    const agentPassword = await bcrypt.hash('Agent@123', 10);
    const agent = await prisma.user.upsert({
      where: { email: 'agent@travel.com' },
      update: {},
      create: {
        email: 'agent@travel.com',
        password: agentPassword,
        firstName: 'Travel',
        lastName: 'Agent',
        role: UserRole.B2B_AGENT,
        phone: '+1234567892',
        emailVerified: true,
      },
    });
    console.log('✅ B2B Agent created:', agent.email);

    // B2C Customer user
    const customerPassword = await bcrypt.hash('Customer@123', 10);
    const customer = await prisma.user.upsert({
      where: { email: 'customer@travel.com' },
      update: {},
      create: {
        email: 'customer@travel.com',
        password: customerPassword,
        firstName: 'John',
        lastName: 'Customer',
        role: UserRole.B2C_CUSTOMER,
        phone: '+1234567893',
        emailVerified: true,
      },
    });
    console.log('✅ B2C Customer created:', customer.email);

    console.log('\n📋 Test User Credentials:\n');
    console.log('Finance Admin:');
    console.log('  Email: finance@travel.com');
    console.log('  Password: Finance@123');
    console.log('  Access: Financial reports, fund requests, wallet operations\n');

    console.log('Operations Team:');
    console.log('  Email: operations@travel.com');
    console.log('  Password: Operations@123');
    console.log('  Access: Booking management, customer support, SSR handling\n');

    console.log('B2B Agent:');
    console.log('  Email: agent@travel.com');
    console.log('  Password: Agent@123');
    console.log('  Access: Create bookings, manage clients, commission tracking\n');

    console.log('B2C Customer:');
    console.log('  Email: customer@travel.com');
    console.log('  Password: Customer@123');
    console.log('  Access: Search and book flights/hotels/cars\n');

  } catch (error) {
    console.error('Error creating test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers()
  .then(() => {
    console.log('✅ All test users created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to create test users:', error);
    process.exit(1);
  });
