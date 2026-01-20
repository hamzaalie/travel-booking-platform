import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestAdmin() {
  try {
    console.log('Creating test admin user...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@travel.com' }
    });

    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    await prisma.user.create({
      data: {
        email: 'admin@travel.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        emailVerified: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@travel.com');
    console.log('🔑 Password: Admin@123');
    console.log('👤 Role: SUPER_ADMIN');
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAdmin();
