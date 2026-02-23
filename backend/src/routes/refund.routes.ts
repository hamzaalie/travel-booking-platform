import express, { Request } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { refundService } from '../services/refund.service';
import { AppError } from '../middleware/error.middleware';

// Extend Request type to include user property
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

/**
 * @route   POST /api/refunds/:bookingId/process
 * @desc    Process refund for a cancelled booking
 * @access  Admin only
 */
router.post(
  '/:bookingId/process',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;
      const adminId = req.user!.id;

      const refund = await refundService.processRefund(bookingId, adminId, reason);

      res.status(200).json({
        success: true,
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/refunds/:id
 * @desc    Get refund by ID
 * @access  Admin, or user who owns the booking
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const refund = await refundService.getRefundById(id);

      // Authorization check
      const isAdmin = req.user!.role === 'SUPER_ADMIN';
      const isOwner = refund.booking.userId === req.user!.id;

      if (!isAdmin && !isOwner) {
        throw new AppError('Not authorized to view this refund', 403);
      }

      res.status(200).json({
        success: true,
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/refunds
 * @desc    Get all refunds with filters (admin only)
 * @access  Admin only
 */
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req, res, next) => {
    try {
      const { status, method, startDate, endDate, page, limit } = req.query;

      const filters: any = {};

      if (status) filters.status = status as string;
      if (method) filters.method = method as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await refundService.getAllRefunds(filters);

      res.status(200).json({
        success: true,
        data: result.refunds,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/refunds/:id/retry
 * @desc    Retry failed refund
 * @access  Admin only
 */
router.post(
  '/:id/retry',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const refund = await refundService.retryRefund(id, adminId);

      res.status(200).json({
        success: true,
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
