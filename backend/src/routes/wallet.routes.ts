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

// GET /api/wallet/transactions - Get transaction history
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

    const transactions = await walletService.getTransactionHistory(agent.wallet.id, {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });

    res.json({
      success: true,
      data: transactions,
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

    const fundRequest = await prisma.fundRequest.create({
      data: {
        agentId: agent.id,
        amount: req.body.amount,
        paymentProofUrl: req.body.paymentProofUrl,
        paymentMethod: req.body.paymentMethod,
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
