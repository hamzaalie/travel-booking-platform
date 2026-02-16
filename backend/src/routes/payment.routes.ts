import { Router, raw } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { paymentService } from '../services/payment.service';
import { bookingService } from '../services/booking.service';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

const router = Router();

// ============================================================================
// STRIPE ROUTES
// ============================================================================

// POST /api/payments/stripe/create
router.post(
  '/stripe/create',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const payment = await paymentService.createStripePayment(req.body);

    res.json({
      success: true,
      data: payment,
    });
  })
);

// POST /api/payments/stripe/checkout
router.post(
  '/stripe/checkout',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const session = await paymentService.createStripeCheckoutSession(req.body);

    res.json({
      success: true,
      data: session,
    });
  })
);

// POST /api/payments/stripe/webhook - NO auth (Stripe sends this directly)
// Uses raw body for signature verification
router.post(
  '/stripe/webhook',
  raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;

    const event = paymentService.verifyStripeWebhook(req.body, signature);

    // Handle the event with idempotency check
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata.bookingId;

      if (bookingId) {
        // Idempotency: check if booking is already confirmed
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { status: true },
        });

        if (booking && booking.status !== 'CONFIRMED') {
          await bookingService.confirmBooking(bookingId, paymentIntent);
          logger.info(`Stripe payment succeeded for booking: ${bookingId}`);
        } else {
          logger.info(`Stripe webhook: booking ${bookingId} already confirmed, skipping`);
        }
      }
    }

    res.json({ received: true });
  })
);

// ============================================================================
// KHALTI ROUTES
// ============================================================================

// POST /api/payments/khalti/initiate
router.post(
  '/khalti/initiate',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const payment = await paymentService.initiateKhaltiPayment(req.body);

    res.json({
      success: true,
      data: payment,
    });
  })
);

// POST /api/payments/khalti/verify
router.post(
  '/khalti/verify',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { pidx, bookingId } = req.body;

    if (!pidx || !bookingId) {
      res.status(400).json({
        success: false,
        error: 'pidx and bookingId are required',
      });
      return;
    }

    const result = await paymentService.verifyKhaltiPayment(pidx);

    if (result.isVerified && bookingId) {
      // Idempotency: check if booking is already confirmed
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { status: true },
      });

      if (booking && booking.status !== 'CONFIRMED') {
        await bookingService.confirmBooking(bookingId, {
          pidx,
          transactionId: result.transactionId,
          status: result.status,
        });
      } else {
        logger.info(`Khalti verify: booking ${bookingId} already confirmed, skipping`);
      }
    }

    if (!result.isVerified) {
      res.status(400).json({
        success: false,
        status: result.status,
        error: 'Payment verification failed',
        data: result.data,
      });
      return;
    }

    res.json({
      success: true,
      status: result.status,
      transactionId: result.transactionId,
      data: result.data,
    });
  })
);

// ============================================================================
// ESEWA ROUTES
// ============================================================================

// POST /api/payments/esewa/initiate
router.post(
  '/esewa/initiate',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const payment = await paymentService.initiateEsewaPayment(req.body);

    res.json({
      success: true,
      data: payment,
    });
  })
);

// POST /api/payments/esewa/verify
router.post(
  '/esewa/verify',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { transactionUuid, totalAmount, encodedResponse, bookingId } = req.body;

    if (!transactionUuid) {
      res.status(400).json({
        success: false,
        error: 'transactionUuid is required',
      });
      return;
    }

    const result = await paymentService.verifyEsewaPayment(transactionUuid, totalAmount, encodedResponse);

    if (result.isVerified && bookingId && !bookingId.startsWith('TEMP-')) {
      // Only confirm booking if a real bookingId is provided (not a temp one)
      try {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { status: true },
        });

        if (booking && booking.status !== 'CONFIRMED') {
          await bookingService.confirmBooking(bookingId, { 
            transactionUuid, 
            transactionCode: result.transactionCode,
            status: result.status 
          });
        } else if (booking) {
          logger.info(`eSewa verify: booking ${bookingId} already confirmed, skipping`);
        }
      } catch (err) {
        logger.warn(`eSewa verify: could not find/confirm booking ${bookingId}, payment still verified`);
      }
    }

    if (!result.isVerified) {
      res.status(400).json({
        success: false,
        error: 'eSewa payment verification failed',
        data: result,
      });
      return;
    }

    res.json({
      success: true,
      data: result,
    });
  })
);

// ============================================================================
// PAYPAL ROUTES
// ============================================================================

// POST /api/payments/paypal/create
router.post(
  '/paypal/create',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const order = await paymentService.createPayPalOrder(req.body);

    res.json({
      success: true,
      data: order,
    });
  })
);

// POST /api/payments/paypal/capture
router.post(
  '/paypal/capture',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { orderId, bookingId } = req.body;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'orderId is required',
      });
      return;
    }

    const captureResult = await paymentService.capturePayPalPayment(orderId);

    if (captureResult.status === 'COMPLETED' && bookingId) {
      // Idempotency: check if booking is already confirmed
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { status: true },
      });

      if (booking && booking.status !== 'CONFIRMED') {
        await bookingService.confirmBooking(bookingId, {
          paypalOrderId: orderId,
          captureId: captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id,
          status: captureResult.status,
        });
      }
    }

    res.json({
      success: true,
      data: captureResult,
    });
  })
);

export default router;
