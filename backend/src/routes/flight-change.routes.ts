import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorizeAdmin, authorizePermission } from '../middleware/authorization.middleware';
import { Permission } from '../middleware/permissions';
import { flightChangeService } from '../services/flight-change.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// USER ROUTES
// ============================================================================

// POST /api/flight-change - Create a change request
router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { bookingId, requestType, reason, requestedChanges } = req.body;

    if (!bookingId || !requestType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookingId, requestType',
      });
    }

    const validTypes = [
      'DATE_CHANGE', 'NAME_CORRECTION', 'ROUTE_CHANGE', 'CLASS_UPGRADE',
      'CANCELLATION', 'REFUND', 'ADD_PASSENGER', 'REMOVE_PASSENGER'
    ];

    if (!validTypes.includes(requestType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid request type. Valid types: ${validTypes.join(', ')}`,
      });
    }

    const request = await flightChangeService.createChangeRequest({
      bookingId,
      userId: req.user!.id,
      requestType,
      reason,
      requestedChanges,
    });

    res.status(201).json({
      success: true,
      message: 'Change request submitted successfully',
      data: request,
    });
  })
);

// GET /api/flight-change - Get user's change requests
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { status, requestType, limit, page } = req.query;

    const result = await flightChangeService.getUserChangeRequests(req.user!.id, {
      status: status as string,
      requestType: requestType as string,
      limit: limit ? parseInt(limit as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// GET /api/flight-change/:id - Get change request by ID
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const request = await flightChangeService.getChangeRequestById(
      req.params.id,
      req.user!.id
    );

    res.json({
      success: true,
      data: request,
    });
  })
);

// POST /api/flight-change/:id/cancel - Cancel a pending change request
router.post(
  '/:id/cancel',
  asyncHandler(async (req: AuthRequest, res) => {
    const request = await flightChangeService.cancelChangeRequest(
      req.params.id,
      req.user!.id
    );

    res.json({
      success: true,
      message: 'Change request cancelled',
      data: request,
    });
  })
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// GET /api/flight-change/admin/all - Get all change requests (admin)
router.get(
  '/admin/all',
  authorizePermission(Permission.VIEW_ALL_BOOKINGS),
  asyncHandler(async (req: AuthRequest, res) => {
    const { status, requestType, limit, page } = req.query;

    const result = await flightChangeService.getAllChangeRequests({
      status: status as string,
      requestType: requestType as string,
      limit: limit ? parseInt(limit as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// GET /api/flight-change/admin/stats - Get change request statistics
router.get(
  '/admin/stats',
  authorizeAdmin(),
  asyncHandler(async (_req: AuthRequest, res) => {
    const stats = await flightChangeService.getRequestStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

// PUT /api/flight-change/admin/:id/review - Mark request as under review
router.put(
  '/admin/:id/review',
  authorizePermission(Permission.VIEW_ALL_BOOKINGS),
  asyncHandler(async (req: AuthRequest, res) => {
    const request = await flightChangeService.markUnderReview(
      req.params.id,
      req.user!.id
    );

    res.json({
      success: true,
      message: 'Request marked as under review',
      data: request,
    });
  })
);

// POST /api/flight-change/admin/:id/approve - Approve change request
router.post(
  '/admin/:id/approve',
  authorizePermission(Permission.APPROVE_FUND_REQUESTS, Permission.VIEW_ALL_BOOKINGS),
  asyncHandler(async (req: AuthRequest, res) => {
    const { adminNotes, penaltyAmount, additionalAmount } = req.body;

    const request = await flightChangeService.processChangeRequest(
      req.params.id,
      req.user!.id,
      {
        status: 'APPROVED',
        adminNotes,
        penaltyAmount,
        additionalAmount,
      }
    );

    res.json({
      success: true,
      message: 'Change request approved',
      data: request,
    });
  })
);

// POST /api/flight-change/admin/:id/reject - Reject change request
router.post(
  '/admin/:id/reject',
  authorizePermission(Permission.VIEW_ALL_BOOKINGS),
  asyncHandler(async (req: AuthRequest, res) => {
    const { adminNotes } = req.body;

    const request = await flightChangeService.processChangeRequest(
      req.params.id,
      req.user!.id,
      {
        status: 'REJECTED',
        adminNotes,
      }
    );

    res.json({
      success: true,
      message: 'Change request rejected',
      data: request,
    });
  })
);

export default router;
