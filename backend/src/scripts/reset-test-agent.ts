import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetTestAgent() {
  try {
    console.log('Resetting test agent to PENDING status...');
    
    // Find agent by email
    const user = await prisma.user.findUnique({
      where: { email: 'testagent@travel.com' },
      include: { agent: true }
    });

    if (!user) {
      console.log('❌ Agent not found with email: testagent@travel.com');
      return;
    }

    if (!user.agent) {
      console.log('❌ No agent profile found for this user');
      return;
    }

    // Update agent status to PENDING
    await prisma.agent.update({
      where: { id: user.agent.id },
      data: { status: 'PENDING' }
    });

    console.log('✅ Agent status reset to PENDING');
    console.log('📧 Email: testagent@travel.com');
    console.log('🔄 Status: PENDING (awaiting admin approval)');
    
  } catch (error) {
    console.error('Error resetting agent:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestAgent();
