import { Router } from 'express';
import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { uploadSingle, getFileUrl } from '../config/upload';
import { walletService } from '../services/wallet.service';
import { logger } from '../config/logger';
import emailService from '../services/email.service';

const router = Router();

/**
 * Submit fund load request (Agent only)
 * POST /api/fund-requests
 */
router.post(
  '/',
  authenticate,
  authorize('B2B_AGENT'),
  uploadSingle,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { amount, paymentMethod } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Payment proof is required' });
      }

      // Get agent
      const agent = await prisma.agent.findUnique({
        where: { userId },
        include: { wallet: true },
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      if (!agent.wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // Create fund request
      const fundRequest = await prisma.fundRequest.create({
        data: {
          agentId: agent.id,
          amount: parseFloat(amount),
          paymentMethod,
          paymentProofUrl: getFileUrl(req, req.file.filename),
        },
      });

      logger.info(`Fund request created: ${fundRequest.id} by agent ${agent.id}`);

      // Send email to admin
      await emailService.sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@travelplatform.com',
        subject: 'New Fund Load Request',
        html: `
          <h2>New Fund Load Request</h2>
          <p><strong>Agent:</strong> ${agent.agencyName || req.user!.email}</p>
          <p><strong>Amount:</strong> $${amount}</p>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          <p>Please review and approve in the admin panel.</p>
        `,
      });

      return res.status(201).json({
        success: true,
        message: 'Fund request submitted successfully',
        data: fundRequest,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Get all fund requests (Admin only)
 * GET /api/fund-requests
 */
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [fundRequests, total] = await Promise.all([
        prisma.fundRequest.findMany({
          skip,
          take: limit,
          include: {
            agent: {
              select: {
                id: true,
                agencyName: true,
              },
            },
          },
          orderBy: { requestedAt: 'desc' },
        }),
        prisma.fundRequest.count(),
      ]);

      return res.json({
        success: true,
        data: fundRequests,
        pagination: {
          page,
          totalPages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Get my fund requests (Agent only)
 * GET /api/fund-requests/my-requests
 */
router.get(
  '/my-requests',
  authenticate,
  authorize('B2B_AGENT'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const agentId = req.user!.agentId;

      if (!agentId) {
        return res.status(403).json({ error: 'Agent ID not found' });
      }

      const fundRequests = await prisma.fundRequest.findMany({
        where: { agentId },
        orderBy: { requestedAt: 'desc' },
      });

      return res.json({
        success: true,
        data: fundRequests,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Approve/Reject fund request (Admin only)
 * PUT /api/fund-requests/:id/process
 */
router.put(
  '/:id/process',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { action, adjustedAmount, rejectionReason } = req.body;

      if (!['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }

      // Get fund request
      const fundRequest = await prisma.fundRequest.findUnique({
        where: { id },
        include: {
          agent: {
            select: {
              id: true,
              agencyName: true,
              userId: true,
              wallet: true,
            },
          },
        },
      });

      if (!fundRequest) {
        return res.status(404).json({ error: 'Fund request not found' });
      }

      if (fundRequest.status !== 'PENDING') {
        return res.status(400).json({ error: 'Request already processed' });
      }

      if (action === 'APPROVE') {
        const finalAmount = adjustedAmount ? parseFloat(adjustedAmount) : fundRequest.amount.toNumber();

        if (!fundRequest.agent?.wallet) {
          return res.status(400).json({ error: 'Agent wallet not found' });
        }

        // Update fund request
        await prisma.fundRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            processedBy: req.user!.id,
            processedAt: new Date(),
          },
        });

        // Credit wallet
        await walletService.creditWallet({
          walletId: fundRequest.agent.wallet.id,
          amount: finalAmount,
          reason: 'FUND_LOAD' as any,
          referenceId: id,
          description: `Fund load approved: $${finalAmount}`,
          createdBy: req.user!.id,
        });

        logger.info(`Fund request approved: ${id}, amount: ${finalAmount}`);

        // Get agent user email
        const agentUser = await prisma.user.findUnique({
          where: { id: fundRequest.agent.userId },
          select: { email: true },
        });

        if (agentUser) {
          await emailService.sendEmail({
            to: agentUser.email,
            subject: 'Fund Load Request Approved',
            html: `
              <h2>Fund Load Approved</h2>
              <p>Your fund load request of <strong>$${finalAmount}</strong> has been approved!</p>
              <p>Your wallet has been credited and you can start making bookings.</p>
            `,
          });
        }

        return res.json({
          success: true,
          message: 'Fund request approved successfully',
        });
      } else {
        // Reject
        await prisma.fundRequest.update({
          where: { id },
          data: {
            status: 'REJECTED',
            processedBy: req.user!.id,
            processedAt: new Date(),
            rejectionReason: rejectionReason || 'Request rejected by admin',
          },
        });

        logger.info(`Fund request rejected: ${id}`);

        // Get agent user email
        const agentUser = await prisma.user.findUnique({
          where: { id: fundRequest.agent!.userId },
          select: { email: true },
        });

        if (agentUser) {
          await emailService.sendEmail({
            to: agentUser.email,
            subject: 'Fund Load Request Rejected',
            html: `
              <h2>Fund Load Request Rejected</h2>
              <p>Unfortunately, your fund load request of <strong>$${fundRequest.amount.toNumber()}</strong> has been rejected.</p>
              <p><strong>Reason:</strong> ${rejectionReason || 'Please contact support for more information.'}</p>
            `,
          });
        }

        return res.json({
          success: true,
          message: 'Fund request rejected successfully',
        });
      }
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
