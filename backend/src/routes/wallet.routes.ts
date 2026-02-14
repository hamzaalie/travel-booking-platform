import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { walletService } from '../services/wallet.service';
import { prisma } from '../config/database';

const router = Router();

// GET /api/wallet - Get my wallet
router.get(
  '/',
  authenticate,
  authorize('B2B_AGENT'),
  asyncHandler(async (req: AuthRequest, res) => {
    const wallet = await walletService.getWalletByAgentId(req.user!.agentId!);

    res.json({
      success: true,
      data: wallet,
    });
  })
);

// GET /api/wallet/transactions - Get transaction history with pagination
router.get(
  '/transactions',
  authenticate,
  authorize('B2B_AGENT'),
  asyncHandler(async (req: AuthRequest, res) => {
    const agent = await prisma.agent.findUnique({
      where: { userId: req.user!.id },
      include: { wallet: true },
    });

    if (!agent || !agent.wallet) {
      res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const type = req.query.type as string | undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

    // Get total count for pagination
    const where: any = { walletId: agent.wallet.id };
    if (type === 'CREDIT' || type === 'DEBIT') where.type = type;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const totalCount = await prisma.walletTransaction.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    const transactions = await prisma.walletTransaction.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      success: true,
      data: {
        transactions,
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  })
);

// POST /api/wallet/fund-request - Request fund load
router.post(
  '/fund-request',
  authenticate,
  authorize('B2B_AGENT'),
  asyncHandler(async (req: AuthRequest, res) => {
    const agent = await prisma.agent.findUnique({
      where: { userId: req.user!.id },
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
      return;
    }

    // Input validation
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({
        success: false,
        error: 'Amount must be a positive number',
      });
      return;
    }
    if (amount < 100) {
      res.status(400).json({
        success: false,
        error: 'Minimum fund request amount is $100',
      });
      return;
    }
    if (amount > 1000000) {
      res.status(400).json({
        success: false,
        error: 'Maximum fund request amount is $1,000,000',
      });
      return;
    }

    const validPaymentMethods = ['BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'OTHER'];
    const paymentMethod = req.body.paymentMethod || 'OTHER';
    if (!validPaymentMethods.includes(paymentMethod)) {
      res.status(400).json({
        success: false,
        error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`,
      });
      return;
    }

    const fundRequest = await prisma.fundRequest.create({
      data: {
        agentId: agent.id,
        amount,
        paymentProofUrl: req.body.paymentProofUrl || null,
        paymentMethod,
        notes: req.body.notes || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Fund request submitted successfully',
      data: fundRequest,
    });
  })
);

// GET /api/wallet/fund-requests - Get my fund requests
router.get(
  '/fund-requests',
  authenticate,
  authorize('B2B_AGENT'),
  asyncHandler(async (req: AuthRequest, res) => {
    const agent = await prisma.agent.findUnique({
      where: { userId: req.user!.id },
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
      return;
    }

    const requests = await prisma.fundRequest.findMany({
      where: { agentId: agent.id },
      orderBy: { requestedAt: 'desc' },
    });

    res.json({
      success: true,
      data: requests,
    });
  })
);

export default router;
