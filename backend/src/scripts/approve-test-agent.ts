import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function approveTestAgent() {
  try {
    console.log('Approving test agent...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'testagent@travel.com' },
      include: { agent: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    if (!user.agent) {
      console.log('❌ No agent profile found');
      return;
    }

    console.log(`Current agent status: ${user.agent.status}`);

    await prisma.agent.update({
      where: { id: user.agent.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date()
      }
    });

    console.log('✅ Agent approved successfully!');
    console.log('📧 Email: testagent@travel.com');
    console.log('🔑 Password: Agent@123');
    console.log('✅ Status: APPROVED');
    console.log('🎉 Agent can now login and access dashboard!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

approveTestAgent();
