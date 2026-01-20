import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/config/database';

describe('Payment Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let bookingId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'payment-test@example.com',
        password: 'hashedpassword',
        firstName: 'Payment',
        lastName: 'Test User',
        role: 'B2C_CUSTOMER',
      },
    });
    userId = user.id;

    // Mock login to get token (you'll need to implement proper auth)
    authToken = 'test-token';

    // Create test booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        bookingReference: 'TEST-' + Date.now(),
        pnr: 'PNR123',
        tripType: 'ONE_WAY',
        origin: 'JFK',
        destination: 'LAX',
        departureDate: new Date(),
        bookingData: {},
        basePrice: 400,
        taxes: 50,
        totalAmount: 500,
        status: 'PENDING',
      },
    });
    bookingId = booking.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.payment.deleteMany({ where: { bookingId } });
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('POST /api/payments/wallet', () => {
    it('should process wallet payment successfully', async () => {
      // First create agent and wallet
      const agent = await prisma.agent.create({
        data: {
          userId,
          agencyName: 'Test Agency',
          status: 'APPROVED',
        },
      });
      
      await prisma.wallet.create({
        data: {
          agentId: agent.id,
          balance: 1000,
          status: 'ACTIVE',
        },
      });

      const response = await request(app)
        .post('/api/payments/wallet')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          amount: 500,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.status).toBe('COMPLETED');
    });

    it('should fail with insufficient balance', async () => {
      const agent = await prisma.agent.findUnique({ where: { userId } });
      if (agent) {
        await prisma.wallet.update({
          where: { agentId: agent.id },
          data: { balance: 100 },
        });
      }

      const response = await request(app)
        .post('/api/payments/wallet')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          amount: 500,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/insufficient/i);
    });
  });

  describe('POST /api/payments/stripe/create-intent', () => {
    it('should create Stripe payment intent', async () => {
      const response = await request(app)
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          amount: 500,
        });

      expect(response.status).toBe(200);
      expect(response.body.clientSecret).toBeDefined();
    });
  });

  describe('POST /api/payments/esewa/initialize', () => {
    it('should initialize eSewa payment', async () => {
      const response = await request(app)
        .post('/api/payments/esewa/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          amount: 500,
        });

      expect(response.status).toBe(200);
      expect(response.body.paymentUrl).toBeDefined();
    });
  });

  describe('POST /api/payments/khalti/initialize', () => {
    it('should initialize Khalti payment', async () => {
      const response = await request(app)
        .post('/api/payments/khalti/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          amount: 500,
        });

      expect(response.status).toBe(200);
      expect(response.body.paymentUrl).toBeDefined();
    });
  });

  describe('GET /api/payments/:paymentId', () => {
    it('should get payment details', async () => {
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId,
          amount: 500,
          gateway: 'WALLET',
          status: 'COMPLETED',
          transactionId: 'test-txn-123',
        },
      });

      const response = await request(app)
        .get(`/api/payments/${payment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.id).toBe(payment.id);
    });
  });

  describe('POST /api/payments/refund', () => {
    it('should process refund successfully', async () => {
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId,
          amount: 500,
          gateway: 'WALLET',
          status: 'COMPLETED',
          transactionId: 'test-txn-456',
        },
      });

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: payment.id,
          amount: 500,
          reason: 'Test refund',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
