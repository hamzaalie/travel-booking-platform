import express from 'express';
import { z } from 'zod';
import ssrService from '../services/ssr.service';
import { optionalAuth } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorization.middleware';
import { Permission } from '../middleware/permissions';
import { asyncHandler } from '../middleware/error.middleware';
import { SSRRequest } from '../../../shared/src/ssrTypes';

const router = express.Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const ssrRequestSchema = z.object({
  bookingId: z.string().uuid(),
  passengers: z.array(z.object({
    passengerId: z.string(),
    seats: z.array(z.any()).optional(),
    meals: z.array(z.any()).optional(),
    baggage: z.any().optional(),
    assistance: z.any().optional(),
  })),
  totalPrice: z.number().min(0),
  currency: z.string().length(3),
});

// ============================================================================
// Public Routes (Availability Checks)
// ============================================================================

/**
 * GET /api/ssr/availability/:flightOfferId
 * Get all SSR availability for a flight offer
 * Public endpoint - anyone can check what SSRs are available
 */
router.get(
  '/availability/:flightOfferId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { flightOfferId } = req.params;

    const availability = await ssrService.getSSRAvailability(flightOfferId);

    res.json({
      success: true,
      data: availability,
    });
  })
);

/**
 * GET /api/ssr/seatmap/:flightSegmentId
 * Get seat map for a specific flight segment
 * Query params:
 * - aircraftType: Optional aircraft type (e.g., "Boeing 777-300ER")
 */
router.get(
  '/seatmap/:flightSegmentId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { flightSegmentId } = req.params;
    const { aircraftType } = req.query;

    const seatMap = await ssrService.getSeatMap(
      flightSegmentId,
      aircraftType as string | undefined
    );

    res.json({
      success: true,
      data: seatMap,
    });
  })
);

/**
 * GET /api/ssr/meals/:flightSegmentId
 * Get available meals for a flight segment
 * Query params:
 * - travelClass: Travel class (ECONOMY, BUSINESS, FIRST)
 */
router.get(
  '/meals/:flightSegmentId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { flightSegmentId } = req.params;
    const { travelClass } = req.query;

    const meals = await ssrService.getAvailableMeals(
      flightSegmentId,
      travelClass as string | undefined
    );

    res.json({
      success: true,
      data: meals,
    });
  })
);

/**
 * GET /api/ssr/baggage/:flightOfferId
 * Get baggage options for a flight
 * Query params:
 * - travelClass: Travel class (ECONOMY, BUSINESS, FIRST)
 */
router.get(
  '/baggage/:flightOfferId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { flightOfferId } = req.params;
    const { travelClass } = req.query;

    const baggage = await ssrService.getBaggageOptions(
      flightOfferId,
      travelClass as string | undefined
    );

    res.json({
      success: true,
      data: baggage,
    });
  })
);

/**
 * GET /api/ssr/assistance/:flightOfferId
 * Get available special assistance options
 */
router.get(
  '/assistance/:flightOfferId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { flightOfferId } = req.params;

    const assistance = await ssrService.getAssistanceOptions(flightOfferId);

    res.json({
      success: true,
      data: assistance,
    });
  })
);

// ============================================================================
// Protected Routes (Booking SSRs)
// ============================================================================

/**
 * POST /api/ssr/request
 * Submit SSR request for a booking
 * Requires authentication
 * Body: SSRRequest object
 */
router.post(
  '/request',
  authorizePermission(Permission.MANAGE_BOOKINGS),
  asyncHandler(async (req, res) => {
    // Validate request body
    const validationResult = ssrRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SSR request data',
        details: validationResult.error.errors,
      });
    }

    const ssrRequest: SSRRequest = req.body;

    // Verify user owns the booking or is an agent
    const booking = await req.app.locals.prisma.booking.findUnique({
      where: { id: ssrRequest.bookingId },
      include: { user: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Authorization check
    if (booking.userId !== (req as any).user.id && 
        !['B2B_AGENT', 'SUPER_ADMIN', 'OPERATIONS_TEAM'].includes((req as any).user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to add SSRs to this booking',
      });
    }

    await ssrService.submitSSRRequest(ssrRequest.bookingId, ssrRequest);

    return res.status(201).json({
      success: true,
      message: 'SSR request submitted successfully',
      data: {
        bookingId: ssrRequest.bookingId,
        totalPrice: ssrRequest.totalPrice,
        currency: ssrRequest.currency,
      },
    });
  })
);

/**
 * GET /api/ssr/booking/:bookingId
 * Get SSR summary for a booking
 * Requires authentication and booking ownership
 */
router.get(
  '/booking/:bookingId',
  authorizePermission(Permission.VIEW_ALL_BOOKINGS, Permission.MANAGE_BOOKINGS),
  asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    // Verify user owns the booking or is authorized
    const booking = await req.app.locals.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    if (booking.userId !== (req as any).user.id && 
        !['B2B_AGENT', 'SUPER_ADMIN', 'OPERATIONS_TEAM'].includes((req as any).user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view SSRs for this booking',
      });
    }

    const summary = await ssrService.getBookingSSRSummary(bookingId);

    return res.json({
      success: true,
      data: summary,
    });
  })
);

/**
 * DELETE /api/ssr/:ssrId
 * Cancel SSR request
 * Requires authentication and booking ownership
 */
router.delete(
  '/:ssrId',
  authorizePermission(Permission.MANAGE_BOOKINGS),
  asyncHandler(async (req, res) => {
    const { ssrId } = req.params;
    const { reason } = req.body;

    // Get SSR and verify ownership
    const ssr = await req.app.locals.prisma.sSR.findUnique({
      where: { id: ssrId },
      include: { booking: true },
    });

    if (!ssr) {
      return res.status(404).json({
        success: false,
        error: 'SSR not found',
      });
    }

    if (ssr.booking.userId !== (req as any).user.id && 
        !['B2B_AGENT', 'SUPER_ADMIN', 'OPERATIONS_TEAM'].includes((req as any).user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to cancel this SSR',
      });
    }

    await ssrService.cancelSSR(ssrId, reason);

    return res.json({
      success: true,
      message: 'SSR cancelled successfully',
    });
  })
);

export default router;
