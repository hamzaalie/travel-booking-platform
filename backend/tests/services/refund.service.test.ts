/**
 * Unit Tests for Refund Service
 * Tests penalty calculation and refund processing logic
 */

import { Decimal } from '@prisma/client/runtime/library';
import { RefundService } from '../../src/services/refund.service';
import {
  createMockPrismaClient,
  mockBooking,
  mockRefund,
  mockPayment,
  mockAgent,
} from '../helpers/mockPrisma';

describe('RefundService', () => {
  let refundService: RefundService;
  let mockPrisma: any;
  let mockWalletService: any;
  let mockPaymentService: any;
  let mockEmailService: any;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    
    // Mock wallet service
    mockWalletService = {
      creditWallet: jest.fn().mockResolvedValue({
        id: 'txn-123',
        amount: new Decimal(495),
      }),
    };

    // Mock payment service
    mockPaymentService = {
      refundStripePayment: jest.fn().mockResolvedValue({
        success: true,
        refundId: 'refund_123',
      }),
      refundPayPalPayment: jest.fn().mockResolvedValue({
        success: true,
        refundId: 'REFUND123',
      }),
    };

    // Mock email service
    mockEmailService = {
      sendRefundNotificationEmail: jest.fn().mockResolvedValue(true),
    };

    refundService = new RefundService();
    (refundService as any).prisma = mockPrisma;
    (refundService as any).walletService = mockWalletService;
    (refundService as any).paymentService = mockPaymentService;
    (refundService as any).emailService = mockEmailService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateRefund', () => {
    it('should apply 0% penalty for cancellation >30 days before departure', () => {
      const departureDate = new Date('2026-03-01');
      const cancellationDate = new Date('2026-01-15'); // 45 days before
      const totalPrice = 1000;

      const result = refundService.calculateRefund(
        totalPrice,
        departureDate,
        cancellationDate
      );

      expect(result.penaltyPercentage).toBe(0);
      expect(result.penalty).toBe(0);
      expect(result.refundAmount).toBe(1000);
    });

    it('should apply 5% penalty for 15-30 days before departure', () => {
      const departureDate = new Date('2026-02-01');
      const cancellationDate = new Date('2026-01-06'); // 26 days before
      const totalPrice = 1000;

      const result = refundService.calculateRefund(
        totalPrice,
        departureDate,
        cancellationDate
      );

      expect(result.penaltyPercentage).toBe(5);
      expect(result.penalty).toBe(50);
      expect(result.refundAmount).toBe(950);
    });

    it('should apply 5% penalty for 15-30 days before departure', () => {
      const departureDate = new Date('2026-02-01');
      const cancellationDate = new Date('2026-01-15'); // 17 days before
      const totalPrice = 1000;

      const result = refundService.calculateRefund(
        totalPrice,
        departureDate,
        cancellationDate
      );

      expect(result.penaltyPercentage).toBe(5);
      expect(result.penalty).toBe(50);
      expect(result.refundAmount).toBe(950);
    });

    it('should apply 20% penalty for 3-7 days before departure', () => {
      const departureDate = new Date('2026-02-01');
      const cancellationDate = new Date('2026-01-25'); // 7 days before
      const totalPrice = 1000;

      const result = refundService.calculateRefund(
        totalPrice,
        departureDate,
        cancellationDate
      );

      // 7 days before = 20% penalty
      expect(result.penaltyPercentage).toBe(20);
    });

    it('should apply 20% penalty for 3-7 days before departure', () => {
      const departureDate = new Date('2026-02-01');
      const cancellationDate = new Date('2026-01-27'); // 5 days before
      const totalPrice = 1000;

      const result = refundService.calculateRefund(
        totalPrice,
        departureDate,
        cancellationDate
      );

      expect(result.penaltyPercentage).toBe(20);
      expect(result.penalty).toBe(200);
      expect(result.refundAmount).toBe(800);
    });

    it('should apply 30% penalty for 1-2 days before departure', () => {
      const departureDate = new Date('2026-02-01');
      const cancellationDate = new Date('2026-01-30'); // 2 days before
      const totalPrice = 1000;

      const result = refundService.calculateRefund(
        totalPrice,
        departureDate,
        cancellationDate
      );

      expect(result.penaltyPercentage).toBe(30);
      expect(result.penalty).toBe(300);
      expect(result.refundAmount).toBe(700);
    });

    it('should apply 50% penalty for same day cancellation', () => {
      const departureDate = new Date('2026-02-01T12:00:00');
      const cancellationDate = new Date('2026-02-01T10:00:00'); // Same day
      const totalPrice = 1000;

      const result = refundService.calculateRefund(
        totalPrice,
        departureDate,
        cancellationDate
      );

      expect(result.penaltyPercentage).toBe(50);
      expect(result.penalty).toBe(500);
      expect(result.refundAmount).toBe(500);
    });

    it('should apply 50% penalty for cancellation on departure day', () => {
      const departureDate = new Date('2026-02-01T14:00:00');
      const cancellationDate = new Date('2026-02-01T08:00:00'); // Same day, earlier
      const totalPrice = 1000;

      const result = refundService.calculateRefund(
        totalPrice,
        departureDate,
        cancellationDate
      );

      expect(result.penaltyPercentage).toBe(50);
      expect(result.refundAmount).toBe(500);
    });

    it('should handle decimal prices correctly', () => {
      const departureDate = new Date('2026-03-01');
      const cancellationDate = new Date('2026-02-10'); // 19 days before - 5% penalty
      const totalPrice = 567.89;

      const result = refundService.calculateRefund(
        totalPrice,
        departureDate,
        cancellationDate
      );

      expect(result.penaltyPercentage).toBe(5);
      expect(result.penalty).toBeCloseTo(28.39, 2);
      expect(result.refundAmount).toBeCloseTo(539.50, 2);
    });

    it('should handle boundary case at exactly 30 days', () => {
      const departureDate = new Date('2026-03-01');
      const cancellationDate = new Date('2026-01-30'); // Exactly 30 days before
      const totalPrice = 1000;

      const result = refundService.calculateRefund(
        totalPrice,
        departureDate,
        cancellationDate
      );

      // At exactly 30 days, should be in 15-30 range (5% penalty)
      expect(result.penaltyPercentage).toBe(5);
    });
  });

  describe('processRefund - B2B Flow', () => {
    const b2bBooking = {
      ...mockBooking,
      agentId: 'agent-123',
      status: 'CANCELLED',
      totalPrice: new Decimal(550),
      flightDetails: {
        ...mockBooking.flightDetails,
        departureDate: '2026-03-01',
      },
    };

    it('should process B2B refund by crediting agent wallet', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(b2bBooking);
      mockPrisma.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          refund: {
            create: jest.fn().mockResolvedValue({
              ...mockRefund,
              refundAmount: new Decimal(550),
            }),
          },
          booking: {
            update: jest.fn().mockResolvedValue({
              ...b2bBooking,
              status: 'REFUNDED',
            }),
          },
          auditLog: {
            create: jest.fn(),
          },
        });
      });

      const result = await refundService.processRefund('booking-123', 'admin-123', 'Agent requested');

      expect(mockWalletService.creditWallet).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'agent-123',
          reason: 'REFUND',
        })
      );
      expect(mockEmailService.sendRefundNotificationEmail).toHaveBeenCalled();
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw error if booking not cancelled', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...b2bBooking,
        status: 'CONFIRMED',
      });

      await expect(
        refundService.processRefund('booking-123', 'admin-123', 'Reason')
      ).rejects.toThrow('Booking must be cancelled before processing refund');
    });

    it('should throw error if booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        refundService.processRefund('nonexistent', 'admin-123', 'Reason')
      ).rejects.toThrow('Booking not found');
    });
  });

  describe('processRefund - B2C Flow', () => {
    const b2cBooking = {
      ...mockBooking,
      agentId: null, // B2C booking
      status: 'CANCELLED',
      paymentMethod: 'STRIPE',
      totalPrice: new Decimal(550),
      flightDetails: {
        ...mockBooking.flightDetails,
        departureDate: '2026-03-01',
      },
    };

    it('should process B2C Stripe refund', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(b2cBooking);
      mockPrisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        gatewayPaymentId: 'pi_stripe123',
      });
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          refund: {
            create: jest.fn().mockResolvedValue(mockRefund),
          },
          booking: {
            update: jest.fn().mockResolvedValue({
              ...b2cBooking,
              status: 'REFUNDED',
            }),
          },
          auditLog: {
            create: jest.fn(),
          },
        });
      });

      const result = await refundService.processRefund('booking-123', 'admin-123', 'Customer requested');

      expect(mockPaymentService.refundStripePayment).toHaveBeenCalled();
      expect(result.status).toBe('COMPLETED');
    });

    it('should process B2C PayPal refund', async () => {
      const paypalBooking = { ...b2cBooking, paymentMethod: 'PAYPAL' };
      mockPrisma.booking.findUnique.mockResolvedValue(paypalBooking);
      mockPrisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        paymentMethod: 'PAYPAL',
        gatewayPaymentId: 'PAYPAL123',
      });
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          refund: {
            create: jest.fn().mockResolvedValue(mockRefund),
          },
          booking: {
            update: jest.fn().mockResolvedValue({
              ...paypalBooking,
              status: 'REFUNDED',
            }),
          },
          auditLog: {
            create: jest.fn(),
          },
        });
      });

      const result = await refundService.processRefund('booking-123', 'admin-123', 'Customer requested');

      expect(mockPaymentService.refundPayPalPayment).toHaveBeenCalled();
      expect(result.status).toBe('COMPLETED');
    });

    it('should create pending refund for manual gateways (Khalti/Esewa)', async () => {
      const khaltiBooking = { ...b2cBooking, paymentMethod: 'KHALTI' };
      mockPrisma.booking.findUnique.mockResolvedValue(khaltiBooking);
      mockPrisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        paymentMethod: 'KHALTI',
      });
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          refund: {
            create: jest.fn().mockResolvedValue({
              ...mockRefund,
              status: 'PENDING',
            }),
          },
          booking: {
            update: jest.fn().mockResolvedValue(khaltiBooking),
          },
          auditLog: {
            create: jest.fn(),
          },
        });
      });

      const result = await refundService.processRefund('booking-123', 'admin-123', 'Customer requested');

      expect(result.status).toBe('PENDING');
      expect(mockPaymentService.refundStripePayment).not.toHaveBeenCalled();
      expect(mockPaymentService.refundPayPalPayment).not.toHaveBeenCalled();
    });

    it('should handle payment gateway failure gracefully', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(b2cBooking);
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockPaymentService.refundStripePayment.mockRejectedValue(
        new Error('Gateway timeout')
      );
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          refund: {
            create: jest.fn().mockResolvedValue({
              ...mockRefund,
              status: 'FAILED',
            }),
          },
          booking: {
            update: jest.fn().mockResolvedValue(b2cBooking),
          },
          auditLog: {
            create: jest.fn(),
          },
        });
      });

      await expect(
        refundService.processRefund('booking-123', 'admin-123', 'Reason')
      ).rejects.toThrow('Gateway timeout');
    });
  });

  describe('getRefundById', () => {
    it('should return refund details', async () => {
      mockPrisma.refund.findUnique.mockResolvedValue(mockRefund);

      const result = await refundService.getRefundById('refund-123');

      expect(result).toEqual(mockRefund);
      expect(mockPrisma.refund.findUnique).toHaveBeenCalledWith({
        where: { id: 'refund-123' },
        include: expect.objectContaining({
          booking: true,
        }),
      });
    });

    it('should throw error if refund not found', async () => {
      mockPrisma.refund.findUnique.mockResolvedValue(null);

      await expect(refundService.getRefundById('nonexistent')).rejects.toThrow(
        'Refund not found'
      );
    });
  });

  describe('getAllRefunds', () => {
    it('should return paginated refunds', async () => {
      const refunds = [mockRefund, { ...mockRefund, id: 'refund-124' }];
      mockPrisma.refund.findMany.mockResolvedValue(refunds);
      mockPrisma.refund.count.mockResolvedValue(2);

      const result = await refundService.getAllRefunds({ page: 1, limit: 10 });

      expect(result.refunds).toEqual(refunds);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter refunds by status', async () => {
      mockPrisma.refund.findMany.mockResolvedValue([mockRefund]);
      mockPrisma.refund.count.mockResolvedValue(1);

      await refundService.getAllRefunds({ status: 'COMPLETED' });

      expect(mockPrisma.refund.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'COMPLETED' },
        })
      );
    });
  });

  describe('retryRefund', () => {
    it('should retry failed Stripe refund', async () => {
      const failedRefund = { ...mockRefund, status: 'FAILED' };
      mockPrisma.refund.findUnique.mockResolvedValue(failedRefund);
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        paymentMethod: 'STRIPE',
      });
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockPaymentService.refundStripePayment.mockResolvedValue({
        success: true,
        refundId: 'new_refund_123',
      });
      mockPrisma.refund.update.mockResolvedValue({
        ...failedRefund,
        status: 'COMPLETED',
      });

      const result = await refundService.retryRefund('refund-123', 'admin-123');

      expect(mockPaymentService.refundStripePayment).toHaveBeenCalled();
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw error if refund not in failed state', async () => {
      mockPrisma.refund.findUnique.mockResolvedValue({
        ...mockRefund,
        status: 'COMPLETED',
      });

      await expect(refundService.retryRefund('refund-123', 'admin-123')).rejects.toThrow(
        'Only failed refunds can be retried'
      );
    });
  });
});
