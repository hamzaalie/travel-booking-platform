/**
 * Mock Prisma Client Helpers
 * Provides utilities for mocking Prisma operations in tests
 */

import { Decimal } from '@prisma/client/runtime/library';

export const createMockPrismaClient = () => {
  return {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    agent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    refund: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    fundRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    markup: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => {
      // Mock transaction - execute the callback with the mock client
      if (typeof callback === 'function') {
        return callback(this);
      }
      // If array of promises, execute them
      return Promise.all(callback);
    }),
    $disconnect: jest.fn(),
  };
};

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  password: '$2b$12$hashedpassword',
  role: 'B2C_CUSTOMER',
  emailVerified: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

export const mockAgent = {
  id: 'agent-123',
  userId: 'user-123',
  agencyName: 'Test Travel Agency',
  agencyAddress: '123 Test St',
  agencyPhone: '+1234567890',
  licenseNumber: 'LIC123',
  approvalStatus: 'APPROVED',
  approvedBy: 'admin-123',
  approvedAt: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

export const mockWallet = {
  id: 'wallet-123',
  agentId: 'agent-123',
  balance: new Decimal(1000),
  currency: 'NPR', // MULTI-CURRENCY MODEL REMOVED
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

export const mockWalletTransaction = {
  id: 'txn-123',
  walletId: 'wallet-123',
  type: 'CREDIT',
  amount: new Decimal(500),
  balanceBefore: new Decimal(1000),
  balanceAfter: new Decimal(1500),
  reason: 'FUND_APPROVED',
  description: 'Fund request approved',
  referenceId: 'fund-123',
  createdAt: new Date('2026-01-01'),
};

export const mockBooking = {
  id: 'booking-123',
  userId: 'user-123',
  agentId: 'agent-123',
  pnr: 'ABC123',
  status: 'CONFIRMED',
  flightDetails: {
    origin: 'JFK',
    destination: 'LAX',
    departureDate: '2026-02-15',
    returnDate: '2026-02-20',
  },
  passengerDetails: [
    {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      passportNumber: 'P123456',
    },
  ],
  basePrice: new Decimal(500),
  taxes: new Decimal(50),
  totalPrice: new Decimal(550),
  paymentMethod: 'STRIPE',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

export const mockRefund = {
  id: 'refund-123',
  bookingId: 'booking-123',
  originalAmount: new Decimal(550),
  penaltyAmount: new Decimal(55),
  refundAmount: new Decimal(495),
  penaltyPercentage: new Decimal(10),
  reason: 'Customer requested cancellation',
  status: 'COMPLETED',
  processedBy: 'admin-123',
  processedAt: new Date('2026-01-02'),
  createdAt: new Date('2026-01-02'),
};

export const mockPayment = {
  id: 'payment-123',
  bookingId: 'booking-123',
  amount: new Decimal(550),
  currency: 'NPR', // MULTI-CURRENCY MODEL REMOVED
  paymentMethod: 'STRIPE',
  gatewayPaymentId: 'pi_123456',
  status: 'COMPLETED',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

export const mockFundRequest = {
  id: 'fund-123',
  agentId: 'agent-123',
  amount: new Decimal(1000),
  paymentMethod: 'BANK_TRANSFER',
  paymentReference: 'BANK123',
  paymentProof: 'proof.jpg',
  status: 'APPROVED',
  approvedBy: 'admin-123',
  approvedAt: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

export const mockMarkup = {
  id: 'markup-123',
  agentId: 'agent-123',
  markupType: 'PERCENTAGE',
  markupValue: new Decimal(5),
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};
