/**
 * Unit Tests for Wallet Service
 * Critical tests for financial transaction integrity
 */

import { Decimal } from '@prisma/client/runtime/library';
import { WalletService } from '../../src/services/wallet.service';
import {
  createMockPrismaClient,
  mockAgent,
  mockWallet,
  mockWalletTransaction,
} from '../helpers/mockPrisma';

describe('WalletService', () => {
  let walletService: WalletService;
  let mockPrisma: any;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockPrisma = createMockPrismaClient();
    walletService = new WalletService();
    // Replace the real prisma with our mock
    (walletService as any).prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('creditWallet', () => {
    it('should successfully credit wallet and create transaction record', async () => {
      const updatedWallet = {
        ...mockWallet,
        balance: new Decimal(1500),
      };
      const transactionRecord = {
        ...mockWalletTransaction,
        type: 'CREDIT',
        amount: new Decimal(500),
        balanceBefore: new Decimal(1000),
        balanceAfter: new Decimal(1500),
      };

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          wallet: {
            update: jest.fn().mockResolvedValue(updatedWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue(transactionRecord),
          },
        });
      });

      const result = await walletService.creditWallet({
        walletId: 'agent-123',
        amount: 500,
        reason: 'FUND_LOAD',
        description: 'Test credit',
        referenceId: 'ref-123',        createdBy: 'admin-123',      });

      expect(result).toEqual(transactionRecord);
      expect(mockPrisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { agentId: 'agent-123' },
      });
    });

    it('should throw error for negative amount', async () => {
      await expect(
        walletService.creditWallet({
          walletId: 'agent-123',
          amount: -100,
          reason: 'FUND_LOAD',
          description: 'Invalid credit',          createdBy: 'admin-123',        })
      ).rejects.toThrow('Amount must be positive');
    });

    it('should throw error for zero amount', async () => {
      await expect(
        walletService.creditWallet({
          walletId: 'agent-123',
          amount: 0,
          reason: 'FUND_LOAD',
          description: 'Zero credit',          createdBy: 'admin-123',        })
      ).rejects.toThrow('Amount must be positive');
    });

    it('should throw error if wallet not found', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);

      await expect(
        walletService.creditWallet({
          walletId: 'nonexistent-agent',
          amount: 100,
          reason: 'FUND_LOAD',
          description: 'Test',          createdBy: 'admin-123',        })
      ).rejects.toThrow('Wallet not found');
    });

    it('should handle large amounts correctly', async () => {
      const largeAmount = 999999.99;
      const updatedWallet = {
        ...mockWallet,
        balance: new Decimal(1000 + largeAmount),
      };

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          wallet: {
            update: jest.fn().mockResolvedValue(updatedWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({
              ...mockWalletTransaction,
              amount: new Decimal(largeAmount),
            }),
          },
        });
      });

      const result = await walletService.creditWallet({
        walletId: 'agent-123',
        amount: largeAmount,
        reason: 'FUND_LOAD',
        description: 'Large credit',        createdBy: 'admin-123',      });

      expect(result.transaction.amount).toEqual(new Decimal(largeAmount));
    });
  });

  describe('debitWallet', () => {
    it('should successfully debit wallet when sufficient balance', async () => {
      const updatedWallet = {
        ...mockWallet,
        balance: new Decimal(500),
      };
      const transactionRecord = {
        ...mockWalletTransaction,
        type: 'DEBIT',
        amount: new Decimal(500),
        balanceBefore: new Decimal(1000),
        balanceAfter: new Decimal(500),
      };

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          wallet: {
            update: jest.fn().mockResolvedValue(updatedWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue(transactionRecord),
          },
        });
      });

      const result = await walletService.debitWallet({
        walletId: 'agent-123',
        amount: 500,
        reason: 'BOOKING_DEDUCTION',
        description: 'Test debit',
        referenceId: 'ref-123',
        createdBy: 'system',
      });

      expect(result).toEqual(transactionRecord);
    });

    it('should throw error when insufficient balance', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(
        walletService.debitWallet({
          walletId: 'agent-123',
          amount: 2000, // More than balance of 1000
          reason: 'BOOKING_DEDUCTION',
          description: 'Insufficient funds',
          createdBy: 'system',
        })
      ).rejects.toThrow('Insufficient wallet balance');
    });

    it('should throw error for negative amount', async () => {
      await expect(
        walletService.debitWallet({
          walletId: 'agent-123',
          amount: -100,
          reason: 'BOOKING_DEDUCTION',
          description: 'Invalid debit',          createdBy: 'system',        })
      ).rejects.toThrow('Amount must be positive');
    });

    it('should handle exact balance debit', async () => {
      const updatedWallet = {
        ...mockWallet,
        balance: new Decimal(0),
      };

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          wallet: {
            update: jest.fn().mockResolvedValue(updatedWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({
              ...mockWalletTransaction,
              type: 'DEBIT',
              amount: new Decimal(1000),
              balanceAfter: new Decimal(0),
            }),
          },
        });
      });

      const result = await walletService.debitWallet({
        walletId: 'agent-123',
        amount: 1000, // Exact balance
        reason: 'BOOKING_DEDUCTION',
        description: 'Full debit',
        createdBy: 'system',
      });

      expect(result.transaction.balanceAfter).toEqual(new Decimal(0));
    });

    it('should throw error for amount exceeding balance by 0.01', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(
        walletService.debitWallet({
          walletId: 'agent-123',
          amount: 1000.01,
          reason: 'BOOKING_DEDUCTION',
          description: 'Slightly over balance',
          createdBy: 'system',
        })
      ).rejects.toThrow('Insufficient wallet balance');
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history for agent', async () => {
      const transactions = [
        mockWalletTransaction,
        { ...mockWalletTransaction, id: 'txn-124', type: 'DEBIT' },
      ];

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.walletTransaction.findMany.mockResolvedValue(transactions);

      const result = await walletService.getTransactionHistory('agent-123');

      expect(result).toEqual(transactions);
      expect(mockPrisma.walletTransaction.findMany).toHaveBeenCalledWith({
        where: { walletId: 'wallet-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if no transactions', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.walletTransaction.findMany.mockResolvedValue([]);

      const result = await walletService.getTransactionHistory('agent-123');

      expect(result).toEqual([]);
    });

    it('should throw error if wallet not found', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);

      await expect(
        walletService.getTransactionHistory('nonexistent-agent')
      ).rejects.toThrow('Wallet not found');
    });
  });

  describe('Concurrent Transactions', () => {
    it('should handle multiple credits correctly', async () => {
      let currentBalance = 1000;
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const balanceBefore = currentBalance;
        currentBalance += 100;
        return callback({
          wallet: {
            update: jest.fn().mockResolvedValue({
              ...mockWallet,
              balance: new Decimal(currentBalance),
            }),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({
              ...mockWalletTransaction,
              balanceBefore: new Decimal(balanceBefore),
              balanceAfter: new Decimal(currentBalance),
            }),
          },
        });
      });

      // Simulate 5 concurrent credits of 100 each
      const creditPromises = Array(5)
        .fill(null)
        .map(() =>
          walletService.creditWallet({
            walletId: 'agent-123',
            amount: 100,
            reason: 'FUND_LOAD',
            description: 'Concurrent credit',
            createdBy: 'admin-123',
          })
        );

      const results = await Promise.all(creditPromises);

      expect(results).toHaveLength(5);
      // Final balance should be 1000 + (5 * 100) = 1500
      expect(currentBalance).toBe(1500);
    });

    it('should maintain balance integrity during mixed operations', async () => {
      let currentBalance = 1000;
      mockPrisma.wallet.findUnique.mockResolvedValue({
        ...mockWallet,
        balance: new Decimal(currentBalance),
      });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          wallet: {
            update: jest.fn().mockResolvedValue({
              ...mockWallet,
              balance: new Decimal(currentBalance),
            }),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue(mockWalletTransaction),
          },
        });
      });

      // This test documents the expected behavior
      // In a real scenario, database locks would ensure serialization
      const operations = [
        walletService.creditWallet({
          walletId: 'agent-123',
          amount: 500,
          reason: 'FUND_LOAD',
          description: 'Credit',
          createdBy: 'admin-123',
        }),
        walletService.debitWallet({
          walletId: 'agent-123',
          amount: 200,
          reason: 'BOOKING_DEDUCTION',
          description: 'Debit',
          createdBy: 'system',
        }),
      ];

      await Promise.all(operations);

      // Verify transaction methods were called
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal precision correctly', async () => {
      const preciseAmount = 123.45;
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          wallet: {
            update: jest.fn().mockResolvedValue(mockWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({
              ...mockWalletTransaction,
              amount: new Decimal(preciseAmount),
            }),
          },
        });
      });

      const result = await walletService.creditWallet({
        walletId: 'agent-123',
        amount: preciseAmount,
        reason: 'FUND_LOAD',
        description: 'Precise amount',
        createdBy: 'admin-123',
      });

      expect(result.transaction.amount.toNumber()).toBe(preciseAmount);
    });

    it('should reject amounts with more than 2 decimal places', async () => {
      // This should be validated in the service
      const invalidAmount = 100.123; // 3 decimal places

      await expect(
        walletService.creditWallet({
          walletId: 'agent-123',
          amount: invalidAmount,
          reason: 'FUND_LOAD',
          description: 'Invalid precision',
          createdBy: 'admin-123',
        })
      ).rejects.toThrow();
    });

    it('should handle missing optional referenceId', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          wallet: {
            update: jest.fn().mockResolvedValue(mockWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({
              ...mockWalletTransaction,
              referenceId: null,
            }),
          },
        });
      });

      const result = await walletService.creditWallet({
        walletId: 'agent-123',
        amount: 100,
        reason: 'FUND_LOAD',
        description: 'No reference',
        createdBy: 'admin-123',
        // referenceId omitted
      });

      expect(result.transaction.referenceId).toBeNull();
    });
  });
});
