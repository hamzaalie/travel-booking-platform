import { Router } from 'express';
import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { logger } from '../config/logger';

const router = Router();

/**
 * Stripe webhook handler
 * POST /api/webhooks/stripe Stripe done and alsow we need to do the verficataknsasds as welkn
 */
router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'No signature provided' });
  }

  try {
    const event = paymentService.verifyStripeWebhook(req.body, signature);
    await paymentService.handleStripeWebhook(event);
    
    return res.json({ received: true });
  } catch (error: any) {
    logger.error('Stripe webhook error:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * eSewa success callback
 * GET /api/webhooks/esewa/success
 */
router.get('/esewa/success', async (req: Request, res: Response) => {
  try {
    const { oid, amt, refId } = req.query;

    if (!oid || !amt || !refId) {
      return res.status(400).send('<html><body><h1>Invalid payment parameters</h1></body></html>');
    }

    await paymentService.verifyEsewaPayment(
      oid as string,
      parseFloat(amt as string),
      refId as string
    );

    // Redirect to success page - extract booking ID from oid
    const bookingId = (oid as string).replace('BOOKING-', '');
    return res.redirect(`${process.env.FRONTEND_URL}/booking/confirmation/${bookingId}`);
  } catch (error: any) {
    logger.error('eSewa success callback error:', error);
    return res.status(500).send('<html><body><h1>Payment verification failed</h1></body></html>');
  }
});

/**
 * eSewa failure callback
 * GET /api/webhooks/esewa/failure
 */
router.get('/esewa/failure', async (_req: Request, res: Response) => {
  // Redirect to failure page
  return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
});

/**
 * Khalti success callback
 * GET /api/webhooks/khalti/success
 */
router.get('/khalti/success', async (req: Request, res: Response) => {
  try {
    const { pidx } = req.query;

    if (!pidx) {
      return res.status(400).send('<html><body><h1>Invalid payment parameters</h1></body></html>');
    }

    const result = await paymentService.verifyKhaltiPayment(pidx as string);

    // Redirect to success page - extract booking ID from purchase_order_id
    const bookingId = result.data?.purchase_order_id?.replace('BOOKING-', '') || '';
    if (!bookingId) {
      return res.status(400).send('<html><body><h1>Invalid booking reference</h1></body></html>');
    }
    return res.redirect(`${process.env.FRONTEND_URL}/booking/confirmation/${bookingId}`);
  } catch (error: any) {
    logger.error('Khalti success callback error:', error);
    return res.status(500).send('<html><body><h1>Payment verification failed</h1></body></html>');
  }
});

/**
 * Khalti failure callback
 * GET /api/webhooks/khalti/failure
 */
router.get('/khalti/failure', async (_req: Request, res: Response) => {
  // Redirect to failure page
  return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
});

export default router;
