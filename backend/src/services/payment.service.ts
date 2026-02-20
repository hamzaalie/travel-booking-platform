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
  customerPhone?: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  failureUrl?: string;
}

/**
 * Payment Gateway Service
 * Handles integration with multiple payment gateways
 */
export class PaymentService {
  private stripe: Stripe;
  // PayPal removed — not supported
  // private paypalBaseUrl: string;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-10-16',
    });
    // PayPal removed
    // this.paypalBaseUrl = config.paypal.mode === 'live'
    //   ? 'https://api-m.paypal.com'
    //   : 'https://api-m.sandbox.paypal.com';
  }

  // PayPal removed — all PayPal methods commented out
  // private async getPayPalAccessToken(): Promise<string> { ... }

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
   * Get the correct eSewa payment base URL.
   * Only valid eSewa domains are accepted. Invalid/unknown domains are rejected.
   * Sandbox (rc-epay.esewa.com.np) is used for test merchant EPAYTEST.
   * Production (epay.esewa.com.np) is used for real merchant codes.
   * Reference: https://developer.esewa.com.np/pages/Epay
   */
  private getEsewaPaymentUrl(): string {
    // These are the ONLY valid eSewa payment domains per official docs
    const SANDBOX_URL = 'https://rc-epay.esewa.com.np';
    const PRODUCTION_URL = 'https://epay.esewa.com.np';
    const VALID_HOSTNAMES = ['epay.esewa.com.np', 'rc-epay.esewa.com.np'];

    const configUrl = config.esewa.url;

    // Check if env var has a valid eSewa domain
    if (configUrl) {
      try {
        const parsed = new URL(configUrl);
        const hostname = parsed.hostname;
        if (VALID_HOSTNAMES.includes(hostname)) {
          // Valid domain — strip any trailing path and return
          return `https://${hostname}`;
        }
      } catch (_) {
        // Malformed URL, ignore
      }
      // If we get here, the env var has an INVALID domain (e.g. uat.esewa.com.np)
      logger.warn(`ESEWA_URL env var has invalid domain: "${configUrl}". Ignoring it and using default.`);
    }

    // Auto-select based on merchant ID
    // EPAYTEST = sandbox, anything else = production
    const isTestMerchant = config.esewa.merchantId === 'EPAYTEST';
    const baseUrl = isTestMerchant ? SANDBOX_URL : PRODUCTION_URL;
    logger.info(`Using eSewa ${isTestMerchant ? 'SANDBOX' : 'PRODUCTION'} URL: ${baseUrl}`);
    return baseUrl;
  }

  /**
   * Get the correct eSewa status check base URL.
   * Sandbox: rc.esewa.com.np | Production: esewa.com.np
   */
  private getEsewaStatusUrl(): string {
    const SANDBOX_STATUS_URL = 'https://rc.esewa.com.np';
    const PRODUCTION_STATUS_URL = 'https://esewa.com.np';
    const isTestMerchant = config.esewa.merchantId === 'EPAYTEST';
    return isTestMerchant ? SANDBOX_STATUS_URL : PRODUCTION_STATUS_URL;
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
        success_url: data.successUrl || `${config.frontendUrl}/payment/esewa/success`,
        failure_url: data.failureUrl || `${config.frontendUrl}/payment/esewa/failure`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: signature,
      };

      const esewaBaseUrl = this.getEsewaPaymentUrl();
      const paymentUrl = `${esewaBaseUrl}/api/epay/main/v2/form`;

      logger.info(`eSewa payment initiated: ${data.bookingId}, uuid: ${transactionUuid}, url: ${paymentUrl}`);

      return {
        paymentUrl,
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
            // Build the message from signed_field_names in the exact order eSewa specifies
            const crypto = require('crypto');
            const signedFields = (decodedData.signed_field_names || '').split(',');
            const messageParts = signedFields.map((field: string) => `${field}=${decodedData[field]}`);
            const message = messageParts.join(',');
            
            logger.info(`eSewa signature verification message: "${message}"`);
            
            const expectedSignature = crypto
              .createHmac('sha256', config.esewa.secretKey)
              .update(message)
              .digest('base64');
            
            logger.info(`eSewa signatures - expected: "${expectedSignature}", received: "${decodedData.signature}"`);
            
            if (expectedSignature === decodedData.signature) {
              logger.info(`eSewa payment verified via callback signature: ${transactionUuid}`);
              return {
                isVerified: true,
                transactionCode: decodedData.transaction_code,
                status: decodedData.status,
              };
            } else {
              logger.warn(`eSewa signature mismatch, falling back to status check API`);
            }
          }
        } catch (decodeError) {
          logger.warn('Failed to decode eSewa response, falling back to status check API:', decodeError);
        }
      }

      // Use Status Check API for verification
      const esewaStatusBaseUrl = this.getEsewaStatusUrl();
      
      const statusUrl = `${esewaStatusBaseUrl}/api/epay/transaction/status/?product_code=${config.esewa.merchantId}&total_amount=${totalAmount}&transaction_uuid=${transactionUuid}`;
      
      logger.info(`eSewa status check URL: ${statusUrl}`);
      
      const response = await axios.get(statusUrl);
      
      logger.info(`eSewa status check response:`, response.data);
      
      if (response.data.status === 'COMPLETE') {
        logger.info(`eSewa payment verified via status check: ${transactionUuid}`);
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
      logger.error('eSewa verification error:', error.response?.data || error.message);
      
      // If status check API fails but we have an encoded response showing COMPLETE,
      // trust the callback data (eSewa already debited the user)
      if (encodedResponse) {
        try {
          const decodedData = JSON.parse(Buffer.from(encodedResponse, 'base64').toString());
          if (decodedData.status === 'COMPLETE' && decodedData.transaction_code) {
            logger.info(`eSewa: Status API failed but callback shows COMPLETE, trusting callback for ${transactionUuid}`);
            return {
              isVerified: true,
              transactionCode: decodedData.transaction_code,
              status: decodedData.status,
            };
          }
        } catch (e) {
          // ignore decode error
        }
      }
      
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
      // Khalti only supports NPR — amount is in paisa (1 NPR = 100 paisa)
      // Minimum amount is 1000 paisa (Rs. 10), maximum is 100000000 paisa (Rs. 1,000,000)
      const amountInPaisa = Math.max(Math.round(data.amount * 100), 1000);
      
      if (amountInPaisa > 100000000) {
        throw new AppError('Amount exceeds Khalti maximum limit of NPR 1,000,000', 400);
      }

      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      
      const payload = {
        return_url: data.successUrl || `${frontendUrl}/payment/khalti/callback`,
        website_url: frontendUrl,
        amount: amountInPaisa,
        purchase_order_id: data.bookingId,
        purchase_order_name: `Booking - ${data.bookingId}`,
        customer_info: {
          name: data.customerName || 'Customer',
          email: data.customerEmail || '',
          phone: data.customerPhone || '9800000000',
        },
      };

      const khaltiUrl = `${config.khalti.url}/epayment/initiate/`;
      logger.info(`[Khalti] Initiating payment...`, { 
        url: khaltiUrl, 
        payload,
        secretKeyPrefix: config.khalti.secretKey?.substring(0, 8) + '...',
      });

      const response = await axios.post(
        khaltiUrl,
        payload,
        {
          headers: {
            'Authorization': `Key ${config.khalti.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
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
      if (error instanceof AppError) throw error;
      
      logger.error('[Khalti] Payment initiation failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        khaltiUrl: `${config.khalti.url}/epayment/initiate/`,
        secretKeyLength: config.khalti.secretKey?.length,
        secretKeyPrefix: config.khalti.secretKey?.substring(0, 8) + '...',
      });

      // Parse Khalti's various error response formats
      let errorMessage = 'Failed to initiate Khalti payment';
      const respData = error.response?.data;
      if (respData) {
        if (typeof respData === 'string') {
          errorMessage = respData;
        } else if (respData.detail) {
          errorMessage = respData.detail;
        } else if (respData.error_key) {
          errorMessage = respData.error_key;
        } else if (respData.message) {
          errorMessage = respData.message;
        }
      }

      // Provide user-friendly messages for common errors
      if (errorMessage.toLowerCase().includes('invalid token') || errorMessage.toLowerCase().includes('invalid key')) {
        errorMessage = 'Khalti payment gateway configuration error. Please contact support.';
        logger.error('Khalti secret key is invalid. Please update KHALTI_SECRET_KEY in environment variables.');
      }
      
      // Return 502 Bad Gateway (not 401!) to avoid confusing with JWT auth errors
      // 401 should ONLY be used for JWT authentication failures, not third-party API errors
      const statusCode = error.response?.status === 401 ? 502 : (error.response?.status || 500);
      throw new AppError(errorMessage, statusCode);
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
   * PAYPAL: REMOVED — PayPal is no longer supported
   */
  /*
  async createPayPalOrder(data: PaymentIntentData) {
    try {
      const auth = Buffer.from(
        `${config.paypal.clientId}:${config.paypal.secret}`
      ).toString('base64');

      const response = await axios.post(
        `${this.paypalBaseUrl}/v2/checkout/orders`,
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

  async capturePayPalPayment(orderId: string) {
    try {
      const auth = Buffer.from(
        `${config.paypal.clientId}:${config.paypal.secret}`
      ).toString('base64');

      const response = await axios.post(
        `${this.paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`,
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
  */

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
   * Refund PayPal payment — REMOVED (PayPal no longer supported)
   */
  /*
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
              currency_code: 'NPR',
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
  */
}

export const paymentService = new PaymentService();
