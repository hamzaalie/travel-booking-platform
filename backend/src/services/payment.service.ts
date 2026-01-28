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
   * ESEWA: Initiate payment (New ePay API v2 format)
   * Based on: https://developer.esewa.com.np/pages/Epay
   */
  async initiateEsewaPayment(data: PaymentIntentData) {
    try {
      const crypto = require('crypto');
      const transactionUuid = `${data.bookingId}-${Date.now()}`;
      const totalAmount = Math.round(data.amount).toString();
      
      // Generate HMAC SHA256 signature for eSewa ePay v2
      // Format: total_amount=X,transaction_uuid=Y,product_code=Z
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

      logger.info(`eSewa payment initiated: ${data.bookingId}, transaction_uuid: ${transactionUuid}`);

      // Clean the eSewa URL - ensure we use the correct base URL
      // Production: https://epay.esewa.com.np
      // Sandbox: https://rc-epay.esewa.com.np
      let esewaBaseUrl = config.esewa.url || 'https://rc-epay.esewa.com.np';
      // Remove any trailing paths if someone set the full URL
      esewaBaseUrl = esewaBaseUrl.replace(/\/api\/epay.*$/, '').replace(/\/epay.*$/, '').replace(/\/$/, '');
      
      return {
        paymentUrl: `${esewaBaseUrl}/api/epay/main/v2/form`,
        paymentData,
        transactionUuid,
        bookingId: data.bookingId,
      };
    } catch (error) {
      logger.error('eSewa payment initiation error:', error);
      throw new AppError('Failed to initiate eSewa payment', 500);
    }
  }

  /**
   * ESEWA: Verify payment using Status Check API
   * Based on: https://developer.esewa.com.np/pages/Epay#status-check
   */
  async verifyEsewaPayment(transactionUuid: string, totalAmount: number, encodedResponse?: string) {
    try {
      // If we have the encoded response from callback, decode it first
      if (encodedResponse) {
        try {
          const decodedData = JSON.parse(Buffer.from(encodedResponse, 'base64').toString());
          logger.info(`eSewa decoded response:`, decodedData);
          
          if (decodedData.status === 'COMPLETE') {
            // Verify the signature to ensure response integrity
            const crypto = require('crypto');
            const message = `transaction_code=${decodedData.transaction_code},status=${decodedData.status},total_amount=${decodedData.total_amount},transaction_uuid=${decodedData.transaction_uuid},product_code=${decodedData.product_code},signed_field_names=${decodedData.signed_field_names}`;
            const expectedSignature = crypto
              .createHmac('sha256', config.esewa.secretKey)
              .update(message)
              .digest('base64');
            
            if (expectedSignature === decodedData.signature) {
              logger.info(`eSewa payment verified via callback: ${transactionUuid}`);
              return {
                isVerified: true,
                transactionCode: decodedData.transaction_code,
                status: decodedData.status,
              };
            }
          }
        } catch (decodeError) {
          logger.warn('Failed to decode eSewa response, falling back to status check API');
        }
      }

      // Use Status Check API for verification
      // Sandbox: https://rc.esewa.com.np/api/epay/transaction/status/
      // Production: https://esewa.com.np/api/epay/transaction/status/
      let esewaStatusBaseUrl = config.esewa.url || 'https://rc-epay.esewa.com.np';
      esewaStatusBaseUrl = esewaStatusBaseUrl.replace(/\/api\/epay.*$/, '').replace(/\/epay.*$/, '').replace(/\/$/, '');
      // For status check, use rc.esewa.com.np (not rc-epay.esewa.com.np)
      esewaStatusBaseUrl = esewaStatusBaseUrl.replace('rc-epay.esewa.com.np', 'rc.esewa.com.np').replace('epay.esewa.com.np', 'esewa.com.np');
      
      const statusUrl = `${esewaStatusBaseUrl}/api/epay/transaction/status/?product_code=${config.esewa.merchantId}&total_amount=${totalAmount}&transaction_uuid=${transactionUuid}`;
      
      const response = await axios.get(statusUrl);
      
      logger.info(`eSewa status check response:`, response.data);
      
      if (response.data.status === 'COMPLETE') {
        logger.info(`eSewa payment verified: ${transactionUuid}`);
        return {
          isVerified: true,
          transactionCode: response.data.ref_id,
          status: response.data.status,
        };
      }
      
      return {
        isVerified: false,
        status: response.data.status,
      };
    } catch (error: any) {
      logger.error('eSewa verification error:', error.response?.data || error);
      return {
        isVerified: false,
        error: error.message,
      };
    }
  }

  /**
   * KHALTI: Initiate payment (ePayment v2 API)
   * Based on: https://docs.khalti.com/khalti-epayment/
   */
  async initiateKhaltiPayment(data: PaymentIntentData) {
    try {
      // Ensure amount is at least 1000 paisa (Rs. 10)
      const amountInPaisa = Math.max(Math.round(data.amount * 100), 1000);
      
      const payload = {
        return_url: `${config.frontendUrl}/payment/khalti/callback`,
        website_url: config.frontendUrl || 'http://localhost:3000',
        amount: amountInPaisa,
        purchase_order_id: data.bookingId,
        purchase_order_name: `Flight Booking - ${data.bookingId}`,
        customer_info: {
          name: data.customerName || 'Customer',
          email: data.customerEmail || '',
          phone: '9800000000', // Default phone for testing
        },
      };

      logger.info(`Khalti payment request:`, { url: `${config.khalti.url}/epayment/initiate/`, payload });

      const response = await axios.post(
        `${config.khalti.url}/epayment/initiate/`,
        payload,
        {
          headers: {
            'Authorization': `Key ${config.khalti.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Khalti payment initiated: ${data.bookingId}, pidx: ${response.data.pidx}`);

      return {
        paymentUrl: response.data.payment_url,
        pidx: response.data.pidx,
        expiresAt: response.data.expires_at,
        expiresIn: response.data.expires_in,
        bookingId: data.bookingId,
      };
    } catch (error: any) {
      logger.error('Khalti payment initiation error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error_key ||
                          JSON.stringify(error.response?.data) ||
                          'Failed to initiate Khalti payment';
      
      throw new AppError(errorMessage, error.response?.status || 500);
    }
  }

  /**
   * KHALTI: Verify payment using Lookup API
   * Based on: https://docs.khalti.com/khalti-epayment/#payment-verification-lookup
   */
  async verifyKhaltiPayment(pidx: string) {
    try {
      const response = await axios.post(
        `${config.khalti.url}/epayment/lookup/`,
        { pidx },
        {
          headers: {
            'Authorization': `Key ${config.khalti.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Khalti payment lookup response:`, response.data);

      // Only 'Completed' status is considered successful
      const isCompleted = response.data.status === 'Completed';
      
      return {
        isVerified: isCompleted,
        status: response.data.status,
        transactionId: response.data.transaction_id,
        totalAmount: response.data.total_amount,
        fee: response.data.fee,
        refunded: response.data.refunded,
        data: response.data,
      };
    } catch (error: any) {
      logger.error('Khalti verification error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      return {
        isVerified: false,
        status: 'Error',
        error: error.response?.data?.detail || error.message,
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
