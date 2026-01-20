import Stripe from 'stripe';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error.middleware';

interface PaymentIntentData {
  amount: number;
  currency: string;
  bookingId: string;
  customerEmail: string;
  customerName: string;
  metadata?: Record<string, string>;
}

/**
 * Payment Gateway Service
 * Handles integration with multiple payment gateways
 */
export class PaymentService {
  private stripe: Stripe;
  private paypalBaseUrl: string;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-10-16',
    });
    this.paypalBaseUrl = config.paypal.mode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Get PayPal access token
   */
  private async getPayPalAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(
        `${config.paypal.clientId}:${config.paypal.secret}`
      ).toString('base64');

      const response = await axios.post(
        `${this.paypalBaseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      logger.error('PayPal authentication error:', error);
      throw new AppError('Failed to authenticate with PayPal', 500);
    }
  }

  /**
   * STRIPE: Create payment intent
   */
  async createStripePayment(data: PaymentIntentData) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        metadata: {
          bookingId: data.bookingId,
          ...data.metadata,
        },
        receipt_email: data.customerEmail,
        description: `Flight booking: ${data.bookingId}`,
      });

      logger.info(`Stripe payment intent created: ${paymentIntent.id}`);

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: data.amount,
        currency: data.currency,
      };
    } catch (error: any) {
      logger.error('Stripe payment creation error:', error);
      throw new AppError('Failed to create Stripe payment', 500);
    }
  }

  /**
   * STRIPE: Create checkout session (for hosted checkout page)
   */
  async createStripeCheckoutSession(data: PaymentIntentData & { 
    successUrl: string; 
    cancelUrl: string;
    bookingType?: string;
  }) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: data.currency.toLowerCase(),
              product_data: {
                name: `${data.bookingType || 'Hotel'} Booking`,
                description: `Booking ID: ${data.bookingId}`,
              },
              unit_amount: Math.round(data.amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        customer_email: data.customerEmail,
        metadata: {
          bookingId: data.bookingId,
          customerName: data.customerName,
          ...data.metadata,
        },
      });

      logger.info(`Stripe checkout session created: ${session.id}`);

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error: any) {
      logger.error('Stripe checkout session creation error:', error);
      throw new AppError('Failed to create Stripe checkout session', 500);
    }
  }

  /**
   * STRIPE: Verify webhook signature
   */
  verifyStripeWebhook(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
    } catch (error: any) {
      logger.error('Stripe webhook verification failed:', error);
      throw new AppError('Invalid webhook signature', 400);
    }
  }

  /**
   * STRIPE: Handle webhook events
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    logger.info(`Stripe webhook event received: ${event.type}`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          logger.info(`Payment succeeded: ${paymentIntent.id}`);
          // Booking confirmation should be handled by the booking service
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          logger.error(`Payment failed: ${failedPayment.id}`);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Error handling Stripe webhook:', error);
      throw error;
    }
  }

  /**
   * STRIPE: Create refund
   */
  async createStripeRefund(paymentIntentId: string, amount?: number) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      logger.info(`Stripe refund created: ${refund.id}`);

      return refund;
    } catch (error: any) {
      logger.error('Stripe refund error:', error);
      throw new AppError('Failed to create Stripe refund', 500);
    }
  }

  /**
   * ESEWA: Initiate payment (New ePay API format)
   */
  async initiateEsewaPayment(data: PaymentIntentData) {
    try {
      const crypto = require('crypto');
      const transactionUuid = `${data.bookingId}-${Date.now()}`;
      const totalAmount = data.amount.toString();
      
      // Generate signature for new eSewa API
      const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${config.esewa.merchantId}`;
      const signature = crypto
        .createHmac('sha256', config.esewa.secretKey)
        .update(message)
        .digest('base64');

      const paymentData = {
        amount: totalAmount,
        tax_amount: '0',
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: config.esewa.merchantId,
        product_service_charge: '0',
        product_delivery_charge: '0',
        success_url: `${config.frontendUrl}/payment/esewa/success`,
        failure_url: `${config.frontendUrl}/payment/esewa/failure`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: signature,
      };

      logger.info(`eSewa payment initiated: ${data.bookingId}`);

      return {
        paymentUrl: `${config.esewa.url}/api/epay/main/v2/form`,
        paymentData,
        bookingId: data.bookingId,
      };
    } catch (error) {
      logger.error('eSewa payment initiation error:', error);
      throw new AppError('Failed to initiate eSewa payment', 500);
    }
  }

  /**
   * ESEWA: Verify payment (New API format)
   */
  async verifyEsewaPayment(oid: string, _amt: number, refId: string) {
    try {
      // New eSewa API uses base64 encoded response
      const decodedData = JSON.parse(Buffer.from(refId, 'base64').toString());
      
      if (decodedData.status === 'COMPLETE') {
        logger.info(`eSewa payment verification: ${oid} - Success`);
        return true;
      }
      
      logger.info(`eSewa payment verification: ${oid} - Failed`);
      return false;
    } catch (error) {
      logger.error('eSewa verification error:', error);
      return false;
    }
  }

  /**
   * KHALTI: Initiate payment
   */
  async initiateKhaltiPayment(data: PaymentIntentData) {
    try {
      const response = await axios.post(
        `${config.khalti.url}/payment/initiate/`,
        {
          return_url: `${config.frontendUrl}/payment/khalti/callback`,
          website_url: config.frontendUrl,
          amount: Math.round(data.amount * 100), // Convert to paisa
          purchase_order_id: data.bookingId,
          purchase_order_name: `Flight Booking ${data.bookingId}`,
          customer_info: {
            name: data.customerName,
            email: data.customerEmail,
          },
        },
        {
          headers: {
            Authorization: `Key ${config.khalti.secretKey}`,
          },
        }
      );

      logger.info(`Khalti payment initiated: ${data.bookingId}`);

      return {
        paymentUrl: response.data.payment_url,
        pidx: response.data.pidx,
        bookingId: data.bookingId,
      };
    } catch (error: any) {
      logger.error('Khalti payment initiation error:', error.response?.data || error);
      throw new AppError('Failed to initiate Khalti payment', 500);
    }
  }

  /**
   * KHALTI: Verify payment
   */
  async verifyKhaltiPayment(pidx: string) {
    try {
      const response = await axios.post(
        `${config.khalti.url}/payment/verify/`,
        { pidx },
        {
          headers: {
            Authorization: `Key ${config.khalti.secretKey}`,
          },
        }
      );

      logger.info(`Khalti payment verified: ${pidx}`);

      return {
        isVerified: response.data.status === 'Completed',
        data: response.data,
      };
    } catch (error: any) {
      logger.error('Khalti verification error:', error.response?.data || error);
      return {
        isVerified: false,
        data: null,
      };
    }
  }

  /**
   * PAYPAL: Create order (simplified - production needs full OAuth flow)
   */
  async createPayPalOrder(data: PaymentIntentData) {
    try {
      const auth = Buffer.from(
        `${config.paypal.clientId}:${config.paypal.secret}`
      ).toString('base64');

      const response = await axios.post(
        `https://api-m.${config.paypal.mode}.paypal.com/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: data.bookingId,
              amount: {
                currency_code: data.currency,
                value: data.amount.toFixed(2),
              },
            },
          ],
          application_context: {
            return_url: `${config.frontendUrl}/payment/paypal/success`,
            cancel_url: `${config.frontendUrl}/payment/paypal/cancel`,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
        }
      );

      logger.info(`PayPal order created: ${response.data.id}`);

      return {
        orderId: response.data.id,
        approveUrl: response.data.links.find((l: any) => l.rel === 'approve')?.href,
      };
    } catch (error: any) {
      logger.error('PayPal order creation error:', error.response?.data || error);
      throw new AppError('Failed to create PayPal order', 500);
    }
  }

  /**
   * PAYPAL: Capture payment
   */
  async capturePayPalPayment(orderId: string) {
    try {
      const auth = Buffer.from(
        `${config.paypal.clientId}:${config.paypal.secret}`
      ).toString('base64');

      const response = await axios.post(
        `https://api-m.${config.paypal.mode}.paypal.com/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
        }
      );

      logger.info(`PayPal payment captured: ${orderId}`);

      return response.data;
    } catch (error: any) {
      logger.error('PayPal capture error:', error.response?.data || error);
      throw new AppError('Failed to capture PayPal payment', 500);
    }
  }

  /**
   * Refund Stripe payment
   */
  async refundStripePayment(transactionId: string, amount: number): Promise<any> {
    try {
      const refund = await this.stripe.refunds.create({
        charge: transactionId,
        amount: Math.round(amount * 100), // Convert to cents
      });

      logger.info(`Stripe refund created: ${refund.id} for charge ${transactionId}`);
      return refund;
    } catch (error) {
      logger.error('Stripe refund error:', error);
      throw new AppError('Failed to process Stripe refund', 500);
    }
  }

  /**
   * Refund PayPal payment
   */
  async refundPayPalPayment(captureId: string, amount: number): Promise<any> {
    try {
      const accessToken = await this.getPayPalAccessToken();

      const response = await fetch(
        `${this.paypalBaseUrl}/v2/payments/captures/${captureId}/refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2),
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal refund failed: ${JSON.stringify(error)}`);
      }

      const refund: any = await response.json();
      logger.info(`PayPal refund created: ${refund.id} for capture ${captureId}`);
      return refund;
    } catch (error) {
      logger.error('PayPal refund error:', error);
      throw new AppError('Failed to process PayPal refund', 500);
    }
  }
}

export const paymentService = new PaymentService();
