import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { paymentService } from '../services/payment.service';
import { bookingService } from '../services/booking.service';
import { logger } from '../config/logger';

const router = Router();

// POST /api/payments/stripe/create
router.post(
  '/stripe/create',
  asyncHandler(async (req, res) => {
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
  asyncHandler(async (req, res) => {
    const session = await paymentService.createStripeCheckoutSession(req.body);

    res.json({
      success: true,
      data: session,
    });
  })
);

// POST /api/payments/stripe/webhook
router.post(
  '/stripe/webhook',
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;

    const event = paymentService.verifyStripeWebhook(req.body, signature);

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata.bookingId;

      if (bookingId) {
        await bookingService.confirmBooking(bookingId, paymentIntent);
        logger.info(`Stripe payment succeeded for booking: ${bookingId}`);
      }
    }

    res.json({ received: true });
  })
);

// POST /api/payments/khalti/initiate
router.post(
  '/khalti/initiate',
  asyncHandler(async (req, res) => {
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
  asyncHandler(async (req, res) => {
    const { pidx, bookingId } = req.body;

    const result = await paymentService.verifyKhaltiPayment(pidx);

    if (result.isVerified) {
      await bookingService.confirmBooking(bookingId, result.data);
    }

    res.json({
      success: result.isVerified,
      data: result.data,
    });
  })
);

// POST /api/payments/esewa/initiate
router.post(
  '/esewa/initiate',
  asyncHandler(async (req, res) => {
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
  asyncHandler(async (req, res) => {
    const { oid, amt, refId, bookingId } = req.body;

    const isVerified = await paymentService.verifyEsewaPayment(oid, amt, refId);

    if (isVerified) {
      await bookingService.confirmBooking(bookingId, { oid, refId });
    }

    res.json({
      success: isVerified,
    });
  })
);

export default router;
