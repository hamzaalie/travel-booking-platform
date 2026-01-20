import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAgentStatus() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'testagent@travel.com' },
      include: { agent: true },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Is Active:', user.isActive);
    console.log('   Agent Status:', user.agent?.status);
    console.log('   Approved At:', user.agent?.approvedAt);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgentStatus();
