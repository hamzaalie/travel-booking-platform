import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { auditService } from './audit.service';
import emailService from './email.service';

/**
 * Admin Service
 * Handles admin-only operations
 */
export class AdminService {
  /**
   * Get all pending agent applications
   */
  async getPendingAgents() {
    return await prisma.agent.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            createdAt: true,
          },
        },
        wallet: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Approve agent application
   */
  async approveAgent(agentId: string, adminId: string) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    if (agent.status !== 'PENDING') {
      throw new AppError('Agent is not pending approval', 400);
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    await auditService.log({
      userId: adminId,
      action: 'AGENT_APPROVED',
      entity: 'Agent',
      entityId: agentId,
      changes: {
        agencyName: agent.agencyName,
        userEmail: agent.user.email,
      },
    });

    logger.info(`Agent approved: ${agent.agencyName} by admin ${adminId}`);

    // Send approval email
    emailService.sendAgentApprovalEmail(agent.user.email, { ...updatedAgent, user: agent.user }).catch(err =>
      logger.error('Failed to send agent approval email:', err)
    );

    return updatedAgent;
  }

  /**
   * Reject agent application
   */
  async rejectAgent(agentId: string, adminId: string, reason: string) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    if (agent.status !== 'PENDING') {
      throw new AppError('Agent is not pending approval', 400);
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    await auditService.log({
      userId: adminId,
      action: 'AGENT_REJECTED',
      entity: 'Agent',
      entityId: agentId,
      changes: {
        agencyName: agent.agencyName,
        userEmail: agent.user.email,
        reason,
      },
    });

    logger.info(`Agent rejected: ${agent.agencyName} by admin ${adminId}`);

    // Send rejection email
    emailService.sendAgentRejectionEmail(agent.user.email, { ...updatedAgent, user: agent.user }).catch(err =>
      logger.error('Failed to send agent rejection email:', err)
    );

    return updatedAgent;
  }

  /**
   * Suspend agent
   */
  async suspendAgent(agentId: string, adminId: string, reason: string) {
    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'SUSPENDED',
      },
    });

    await auditService.log({
      userId: adminId,
      action: 'AGENT_SUSPENDED',
      entity: 'Agent',
      entityId: agentId,
      changes: { reason },
    });

    logger.warn(`Agent suspended: ${agentId} by admin ${adminId}`);

    return agent;
  }

  /**
   * Reactivate agent
   */
  async reactivateAgent(agentId: string, adminId: string) {
    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'APPROVED',
      },
    });

    await auditService.log({
      userId: adminId,
      action: 'AGENT_REACTIVATED',
      entity: 'Agent',
      entityId: agentId,
    });

    logger.info(`Agent reactivated: ${agentId} by admin ${adminId}`);

    return agent;
  }

  /**
   * Get all agents with filters
   */
  async getAllAgents(filters?: {
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { agencyName: { contains: filters.search, mode: 'insensitive' } },
        {
          user: {
            email: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    return await prisma.agent.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
          },
        },
        wallet: {
          select: {
            balance: true,
            status: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            fundRequests: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all bookings (admin view)
   */
  async getAllBookings(filters?: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;

    if (filters?.fromDate || filters?.toDate) {
      where.departureDate = {};
      if (filters.fromDate) where.departureDate.gte = filters.fromDate;
      if (filters.toDate) where.departureDate.lte = filters.toDate;
    }

    return await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        agent: {
          select: {
            agencyName: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 100,
    });
  }

  /**
   * Get fund requests
   */
  async getFundRequests(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return await prisma.fundRequest.findMany({
      where,
      include: {
        agent: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            wallet: true,
          },
        },
        processor: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  /**
   * Approve fund request
   */
  async approveFundRequest(requestId: string, adminId: string) {
    return await prisma.$transaction(async (tx: any) => {
      const request = await tx.fundRequest.findUnique({
        where: { id: requestId },
        include: {
          agent: {
            include: { 
              wallet: true,
              user: true,
            },
          },
        },
      });

      if (!request) {
        throw new AppError('Fund request not found', 404);
      }

      if (request.status !== 'PENDING') {
        throw new AppError('Fund request already processed', 400);
      }

      if (!request.agent.wallet) {
        throw new AppError('Agent wallet not found', 404);
      }

      // Credit wallet
      const { walletService } = await import('./wallet.service');
      await walletService.creditWallet({
        walletId: request.agent.wallet.id,
        amount: request.amount.toNumber(),
        reason: 'FUND_LOAD',
        referenceId: requestId,
        description: `Fund load request ${requestId}`,
        createdBy: adminId,
      });

      // Update request status
      const updatedRequest = await tx.fundRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          processedBy: adminId,
          processedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'FUND_REQUEST_APPROVED',
          entity: 'FundRequest',
          entityId: requestId,
          changes: {
            amount: request.amount.toString(),
            agentId: request.agentId,
          },
        },
      });

      logger.info(`Fund request approved: ${requestId} | Amount: ${request.amount}`);

      // Send approval email
      emailService.sendFundApprovalEmail(request.agent.user.email, {
        ...updatedRequest,
        agent: request.agent,
      }).catch(err =>
        logger.error('Failed to send fund approval email:', err)
      );

      return updatedRequest;
    });
  }

  /**
   * Reject fund request
   */
  async rejectFundRequest(requestId: string, adminId: string, reason: string) {
    const request = await prisma.fundRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('Fund request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new AppError('Fund request already processed', 400);
    }

    const updatedRequest = await prisma.fundRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        processedBy: adminId,
        processedAt: new Date(),
        rejectionReason: reason,
      },
    });

    await auditService.log({
      userId: adminId,
      action: 'FUND_REQUEST_REJECTED',
      entity: 'FundRequest',
      entityId: requestId,
      changes: { reason },
    });

    logger.info(`Fund request rejected: ${requestId}`);

    return updatedRequest;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalBookings,
      totalAgents,
      pendingAgents,
      activeAgents,
      totalRevenue,
      pendingFundRequests,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.agent.count(),
      prisma.agent.count({ where: { status: 'PENDING' } }),
      prisma.agent.count({ where: { status: 'APPROVED' } }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['CONFIRMED', 'TICKETED'] } },
      }),
      prisma.fundRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      bookings: {
        total: totalBookings,
      },
      agents: {
        total: totalAgents,
        pending: pendingAgents,
        active: activeAgents,
      },
      revenue: {
        total: totalRevenue._sum.totalAmount?.toNumber() || 0,
      },
      fundRequests: {
        pending: pendingFundRequests,
      },
    };
  }

  /**
   * Get all users with filtering
   * Only accessible by Super Admin
   */
  async getAllUsers(filters?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          agent: {
            select: {
              agencyName: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user role
   * Only Super Admin can change roles
   */
  async updateUserRole(userId: string, newRole: string, adminId: string) {
    const validRoles = ['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_TEAM', 'B2B_AGENT', 'B2C_CUSTOMER'];
    
    if (!validRoles.includes(newRole)) {
      throw new AppError('Invalid role', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const oldRole = user.role;

    // Prevent changing role if user is an agent with active bookings
    if (user.role === 'B2B_AGENT' && newRole !== 'B2B_AGENT') {
      const agent = await prisma.agent.findUnique({
        where: { userId },
        include: {
          bookings: {
            where: {
              status: {
                in: ['PENDING', 'CONFIRMED', 'TICKETED'],
              },
            },
          },
        },
      });

      if (agent && agent.bookings.length > 0) {
        throw new AppError(
          'Cannot change role for agent with active bookings',
          400
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    await auditService.log({
      userId: adminId,
      action: 'USER_ROLE_UPDATED',
      entity: 'User',
      entityId: userId,
      changes: {
        oldRole,
        newRole,
        userEmail: user.email,
      },
    });

    logger.info(
      `User role updated: ${user.email} from ${oldRole} to ${newRole} by admin ${adminId}`
    );

    return updatedUser;
  }

  /**
   * Activate or deactivate user
   */
  async toggleUserStatus(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    await auditService.log({
      userId: adminId,
      action: user.isActive ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
      entity: 'User',
      entityId: userId,
      changes: {
        userEmail: user.email,
        newStatus: !user.isActive,
      },
    });

    logger.info(
      `User ${user.isActive ? 'deactivated' : 'activated'}: ${user.email} by admin ${adminId}`
    );

    return updatedUser;
  }

  // ============================================================================
  // AGENT MARKUP & DISCOUNT MANAGEMENT
  // ============================================================================

  /**
   * Get agent details with documents
   */
  async getAgentDetails(agentId: string) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            createdAt: true,
          },
        },
        wallet: true,
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    return agent;
  }

  /**
   * Get agent documents
   */
  async getAgentDocuments(agentId: string) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    return await prisma.agentDocument.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Verify agent document
   */
  async verifyAgentDocument(
    documentId: string,
    adminId: string,
    action: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
  ) {
    const document = await prisma.agentDocument.findUnique({
      where: { id: documentId },
      include: { agent: true },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    const updatedDocument = await prisma.agentDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: action,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: action === 'REJECTED' ? rejectionReason : null,
      },
    });

    await auditService.log({
      userId: adminId,
      action: `DOCUMENT_${action}`,
      entity: 'AgentDocument',
      entityId: documentId,
      changes: {
        agentId: document.agentId,
        documentType: document.documentType,
        rejectionReason,
      },
    });

    logger.info(
      `Document ${action.toLowerCase()}: ${document.documentType} for agent ${document.agentId}`
    );

    return updatedDocument;
  }

  /**
   * Update agent markup and discount settings
   */
  async updateAgentMarkupSettings(
    agentId: string,
    adminId: string,
    settings: {
      markupType?: 'FIXED' | 'PERCENTAGE';
      markupValue?: number;
      discountType?: 'FIXED' | 'PERCENTAGE';
      discountValue?: number;
      commissionType?: 'FIXED' | 'PERCENTAGE';
      commissionValue?: number;
      creditLimit?: number;
    }
  ) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    const previousSettings = {
      markupType: agent.markupType,
      markupValue: agent.markupValue,
      discountType: agent.discountType,
      discountValue: agent.discountValue,
      commissionType: agent.commissionType,
      commissionValue: agent.commissionValue,
      creditLimit: agent.creditLimit,
    };

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        markupType: settings.markupType,
        markupValue: settings.markupValue,
        discountType: settings.discountType,
        discountValue: settings.discountValue,
        commissionType: settings.commissionType,
        commissionValue: settings.commissionValue,
        creditLimit: settings.creditLimit,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await auditService.log({
      userId: adminId,
      action: 'AGENT_MARKUP_UPDATED',
      entity: 'Agent',
      entityId: agentId,
      changes: {
        previous: previousSettings,
        new: settings,
        agencyName: agent.agencyName,
      },
    });

    logger.info(
      `Agent markup settings updated: ${agent.agencyName} by admin ${adminId}`
    );

    return updatedAgent;
  }

  /**
   * Get all agents with their markup settings
   */
  async getAgentsWithMarkupSettings(filters?: {
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { agencyName: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return await prisma.agent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        wallet: {
          select: {
            balance: true,
            status: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            documents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Bulk update markup settings for multiple agents
   */
  async bulkUpdateAgentMarkupSettings(
    agentIds: string[],
    adminId: string,
    settings: {
      markupType?: 'FIXED' | 'PERCENTAGE';
      markupValue?: number;
      discountType?: 'FIXED' | 'PERCENTAGE';
      discountValue?: number;
    }
  ) {
    const result = await prisma.agent.updateMany({
      where: { id: { in: agentIds } },
      data: {
        markupType: settings.markupType,
        markupValue: settings.markupValue,
        discountType: settings.discountType,
        discountValue: settings.discountValue,
      },
    });

    await auditService.log({
      userId: adminId,
      action: 'BULK_AGENT_MARKUP_UPDATED',
      entity: 'Agent',
      changes: {
        agentIds,
        settings,
        updatedCount: result.count,
      },
    });

    logger.info(
      `Bulk markup settings updated for ${result.count} agents by admin ${adminId}`
    );

    return { updatedCount: result.count };
  }
}

export const adminService = new AdminService();
