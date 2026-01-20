import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { bookingService } from '../services/booking.service';
import { pricingService } from '../services/pricing.service';

const router = Router();

// All routes require B2B agent authentication
router.use(authenticate);
router.use(authorize('B2B_AGENT'));

// GET /api/agent/bookings
router.get(
  '/bookings',
  asyncHandler(async (req: AuthRequest, res) => {
    const bookings = await bookingService.getAgentBookings(req.user!.agentId!, {
      status: req.query.status as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });

    res.json({
      success: true,
      data: bookings,
    });
  })
);

// GET /api/agent/markups
router.get(
  '/markups',
  asyncHandler(async (req: AuthRequest, res) => {
    const markups = await pricingService.getMarkups({
      agentId: req.user!.agentId,
      isActive: true,
    });

    res.json({
      success: true,
      data: markups,
    });
  })
);

// POST /api/agent/markups
router.post(
  '/markups',
  asyncHandler(async (req: AuthRequest, res) => {
    const markup = await pricingService.createMarkup({
      ...req.body,
      agentId: req.user!.agentId,
      isGlobal: false,
    });

    res.status(201).json({
      success: true,
      message: 'Markup created successfully',
      data: markup,
    });
  })
);

export default router;
