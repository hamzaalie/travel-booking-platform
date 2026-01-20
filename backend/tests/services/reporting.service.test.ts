/**
 * Unit Tests for Reporting Service
 * Tests analytics calculations and export functionality
 */

import { Decimal } from '@prisma/client/runtime/library';
import { ReportingService } from '../../src/services/reporting.service';
import {
  createMockPrismaClient,
  mockBooking,
  mockRefund,
  mockAgent,
  mockWalletTransaction,
} from '../helpers/mockPrisma';

describe('ReportingService', () => {
  let reportingService: ReportingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    reportingService = new ReportingService();
    (reportingService as any).prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRevenueAnalytics', () => {
    const dateRange = {
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    };

    it('should calculate revenue analytics correctly', async () => {
      const bookings = [
        { ...mockBooking, totalPrice: new Decimal(500), createdAt: new Date('2026-01-15') },
        { ...mockBooking, id: 'booking-124', totalPrice: new Decimal(750), createdAt: new Date('2026-01-15') },
        { ...mockBooking, id: 'booking-125', totalPrice: new Decimal(600), createdAt: new Date('2026-01-20') },
      ];

      const refunds = [
        { ...mockRefund, refundAmount: new Decimal(100), processedAt: new Date('2026-01-16') },
        { ...mockRefund, id: 'refund-124', refundAmount: new Decimal(200), processedAt: new Date('2026-01-20') },
      ];

      mockPrisma.booking.findMany.mockResolvedValue(bookings);
      mockPrisma.refund.findMany.mockResolvedValue(refunds);

      const result = await reportingService.getRevenueAnalytics(dateRange);

      expect(result.summary.totalBookings).toBe(3);
      expect(result.summary.totalRevenue).toBe(1850); // 500 + 750 + 600
      expect(result.summary.totalRefunds).toBe(300); // 100 + 200
      expect(result.summary.netRevenue).toBe(1550); // 1850 - 300
      expect(result.summary.averageBookingValue).toBeCloseTo(616.67, 2);
    });

    it('should group revenue by date correctly', async () => {
      const bookings = [
        { ...mockBooking, totalPrice: new Decimal(500), createdAt: new Date('2026-01-15T10:00:00') },
        { ...mockBooking, id: 'booking-124', totalPrice: new Decimal(300), createdAt: new Date('2026-01-15T14:00:00') },
        { ...mockBooking, id: 'booking-125', totalPrice: new Decimal(600), createdAt: new Date('2026-01-16T10:00:00') },
      ];

      mockPrisma.booking.findMany.mockResolvedValue(bookings);
      mockPrisma.refund.findMany.mockResolvedValue([]);

      const result = await reportingService.getRevenueAnalytics(dateRange);

      const day1 = result.dailyData.find((d) => d.date === '2026-01-15');
      const day2 = result.dailyData.find((d) => d.date === '2026-01-16');

      expect(day1?.bookings).toBe(2);
      expect(day1?.revenue).toBe(800); // 500 + 300
      expect(day2?.bookings).toBe(1);
      expect(day2?.revenue).toBe(600);
    });

    it('should handle empty date range', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.refund.findMany.mockResolvedValue([]);

      const result = await reportingService.getRevenueAnalytics(dateRange);

      expect(result.summary.totalBookings).toBe(0);
      expect(result.summary.totalRevenue).toBe(0);
      expect(result.summary.netRevenue).toBe(0);
      expect(result.summary.averageBookingValue).toBe(0);
      expect(result.dailyData).toHaveLength(0);
    });

    it('should handle refunds without corresponding booking dates', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([
        { ...mockBooking, totalPrice: new Decimal(1000), createdAt: new Date('2026-01-15') },
      ]);
      mockPrisma.refund.findMany.mockResolvedValue([
        { ...mockRefund, refundAmount: new Decimal(500), processedAt: new Date('2026-01-20') },
      ]);

      const result = await reportingService.getRevenueAnalytics(dateRange);

      expect(result.summary.totalRevenue).toBe(1000);
      expect(result.summary.totalRefunds).toBe(500);
      expect(result.summary.netRevenue).toBe(500);
    });
  });

  describe('getAgentPerformanceReport', () => {
    it('should calculate agent performance correctly', async () => {
      const agents = [mockAgent, { ...mockAgent, id: 'agent-124', userId: 'user-124' }];
      
      const bookingsAgent1 = [
        { ...mockBooking, totalPrice: new Decimal(500) },
        { ...mockBooking, id: 'booking-124', totalPrice: new Decimal(750) },
      ];

      const bookingsAgent2 = [
        { ...mockBooking, id: 'booking-125', totalPrice: new Decimal(600) },
      ];

      mockPrisma.agent.findMany.mockResolvedValue(agents);
      mockPrisma.booking.count
        .mockResolvedValueOnce(2) // Agent 1
        .mockResolvedValueOnce(1); // Agent 2
      mockPrisma.booking.findMany
        .mockResolvedValueOnce(bookingsAgent1)
        .mockResolvedValueOnce(bookingsAgent2);
      mockPrisma.wallet.findUnique
        .mockResolvedValueOnce({ balance: new Decimal(5000) })
        .mockResolvedValueOnce({ balance: new Decimal(3000) });

      const result = await reportingService.getAgentPerformanceReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      expect(result).toHaveLength(2);
      expect(result[0].totalBookings).toBe(2);
      expect(result[0].totalRevenue).toBe(1250);
      expect(result[0].averageBookingValue).toBe(625);
      expect(result[0].walletBalance).toBe(5000);
    });

    it('should handle agents with no bookings', async () => {
      mockPrisma.agent.findMany.mockResolvedValue([mockAgent]);
      mockPrisma.booking.count.mockResolvedValue(0);
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.wallet.findUnique.mockResolvedValue({ balance: new Decimal(0) });

      const result = await reportingService.getAgentPerformanceReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      expect(result).toHaveLength(1);
      expect(result[0].totalBookings).toBe(0);
      expect(result[0].totalRevenue).toBe(0);
      expect(result[0].averageBookingValue).toBe(0);
    });

    it('should filter by date range', async () => {
      mockPrisma.agent.findMany.mockResolvedValue([mockAgent]);
      mockPrisma.booking.count.mockResolvedValue(1);
      mockPrisma.booking.findMany.mockResolvedValue([mockBooking]);
      mockPrisma.wallet.findUnique.mockResolvedValue({ balance: new Decimal(1000) });

      await reportingService.getAgentPerformanceReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        })
      );
    });
  });

  describe('getLedgerReport', () => {
    it('should return wallet transactions', async () => {
      const transactions = [
        mockWalletTransaction,
        {
          ...mockWalletTransaction,
          id: 'txn-124',
          type: 'DEBIT',
          amount: new Decimal(200),
        },
      ];

      mockPrisma.walletTransaction.findMany.mockResolvedValue(transactions);

      const result = await reportingService.getLedgerReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        type: 'CREDIT',
        amount: mockWalletTransaction.amount,
      });
    });

    it('should filter by agent ID', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({ id: 'wallet-123' });
      mockPrisma.walletTransaction.findMany.mockResolvedValue([mockWalletTransaction]);

      await reportingService.getLedgerReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      }, 'agent-123');

      expect(mockPrisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { agentId: 'agent-123' },
      });
      expect(mockPrisma.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            walletId: 'wallet-123',
          }),
        })
      );
    });

    it('should return empty array if no transactions', async () => {
      mockPrisma.walletTransaction.findMany.mockResolvedValue([]);

      const result = await reportingService.getLedgerReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      expect(result).toEqual([]);
    });
  });

  describe('getBookingReport', () => {
    it('should return detailed booking data', async () => {
      const bookings = [
        mockBooking,
        { ...mockBooking, id: 'booking-124', status: 'CANCELLED' },
      ];

      mockPrisma.booking.findMany.mockResolvedValue(bookings);

      const result = await reportingService.getBookingReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('booking-123');
      expect(result[0].status).toBe('CONFIRMED');
    });

    it('should filter by status', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([mockBooking]);

      await reportingService.getBookingReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
        status: 'CONFIRMED',
      });

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'CONFIRMED',
          }),
        })
      );
    });

    it('should filter by agent ID', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([mockBooking]);

      await reportingService.getBookingReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
        agentId: 'agent-123',
      });

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agentId: 'agent-123',
          }),
        })
      );
    });

    it('should filter by user ID', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([mockBooking]);

      await reportingService.getBookingReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
        userId: 'user-123',
      });

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        })
      );
    });
  });

  describe('getProfitLossReport', () => {
    it('should calculate profit and loss correctly', async () => {
      const bookings = [
        {
          ...mockBooking,
          basePrice: new Decimal(500),
          taxes: new Decimal(50),
          totalPrice: new Decimal(600), // Includes markup
        },
        {
          ...mockBooking,
          id: 'booking-124',
          basePrice: new Decimal(800),
          taxes: new Decimal(80),
          totalPrice: new Decimal(950), // Includes markup
        },
      ];

      const refunds = [
        { ...mockRefund, refundAmount: new Decimal(100) },
      ];

      mockPrisma.booking.findMany.mockResolvedValue(bookings);
      mockPrisma.refund.findMany.mockResolvedValue(refunds);

      const result = await reportingService.getProfitLossReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      // Gross profit = total collected - (base prices + taxes)
      // Total collected = 600 + 950 = 1550
      // Cost = (500 + 50) + (800 + 80) = 1430
      // Gross profit = 1550 - 1430 = 120
      expect(result.totalRevenue).toBe(1550);
      expect(result.grossProfit).toBe(120);
      expect(result.expenses.refunds).toBe(100);
      expect(result.netProfit).toBe(20); // 120 - 100
      expect(result.profitMargin).toBeCloseTo(1.29, 2); // (20 / 1550) * 100
    });

    it('should handle no bookings', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.refund.findMany.mockResolvedValue([]);

      const result = await reportingService.getProfitLossReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      expect(result.totalRevenue).toBe(0);
      expect(result.grossProfit).toBe(0);
      expect(result.netProfit).toBe(0);
      expect(result.profitMargin).toBe(0);
    });

    it('should handle negative profit (loss)', async () => {
      const bookings = [
        {
          ...mockBooking,
          basePrice: new Decimal(500),
          taxes: new Decimal(50),
          totalPrice: new Decimal(560), // Small markup
        },
      ];

      const refunds = [
        { ...mockRefund, refundAmount: new Decimal(100) },
      ];

      mockPrisma.booking.findMany.mockResolvedValue(bookings);
      mockPrisma.refund.findMany.mockResolvedValue(refunds);

      const result = await reportingService.getProfitLossReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      // Gross profit = 560 - 550 = 10
      // Net profit = 10 - 100 = -90 (loss)
      expect(result.netProfit).toBe(-90);
      expect(result.profitMargin).toBeCloseTo(-16.07, 2);
    });
  });

  describe('exportToCSV', () => {
    it('should convert data to CSV format', async () => {
      const data = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Los Angeles' },
      ];
      const fields = ['name', 'age', 'city'];

      const result = await reportingService.exportToCSV(data, fields);

      expect(result).toContain('name');
      expect(result).toContain('age');
      expect(result).toContain('city');
      expect(result).toContain('John');
      expect(result).toContain('Jane');
      expect(typeof result).toBe('string');
    });

    it('should handle empty data array', async () => {
      const data: any[] = [];
      const fields = ['name', 'age'];

      const result = await reportingService.exportToCSV(data, fields);

      expect(result).toContain('name');
      expect(result).toContain('age');
      expect(typeof result).toBe('string');
    });

    it('should handle special characters', async () => {
      const data = [
        { name: 'John, Doe', description: 'Test "quote"' },
      ];
      const fields = ['name', 'description'];

      const result = await reportingService.exportToCSV(data, fields);

      expect(typeof result).toBe('string');
      expect(result).toBeTruthy();
    });
  });

  describe('generatePDFReport', () => {
    it('should generate PDF buffer', async () => {
      const reportData = {
        title: 'Revenue Report',
        summary: {
          totalRevenue: 1000,
          totalBookings: 10,
        },
        data: [
          { date: '2026-01-15', revenue: 500, bookings: 5 },
          { date: '2026-01-16', revenue: 500, bookings: 5 },
        ],
        columns: ['date', 'revenue', 'bookings'],
      };

      const result = await reportingService.generatePDFReport(reportData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle large datasets by limiting rows', async () => {
      const data = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: i,
          value: i * 10,
        }));

      const reportData = {
        title: 'Large Report',
        summary: { total: 100 },
        data,
        columns: ['id', 'value'],
      };

      const result = await reportingService.generatePDFReport(reportData);

      expect(result).toBeInstanceOf(Buffer);
      // PDF should only include first 50 rows as per service implementation
    });

    it('should handle empty data', async () => {
      const reportData = {
        title: 'Empty Report',
        summary: { total: 0 },
        data: [],
        columns: ['id', 'value'],
      };

      const result = await reportingService.generatePDFReport(reportData);

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
