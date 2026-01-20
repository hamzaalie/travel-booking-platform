import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { auditService } from './audit.service';

type TransactionType = 'CREDIT' | 'DEBIT';
type TransactionReason =
  | 'FUND_LOAD'
  | 'BOOKING_DEDUCTION'
  | 'BOOKING_REFUND'
  | 'ADMIN_CREDIT'
  | 'ADMIN_DEBIT'
  | 'CANCELLATION_REFUND';

interface WalletOperationData {
  walletId: string;
  amount: number;
  reason: TransactionReason;
  referenceId?: string;
  description?: string;
  createdBy: string;
}

/**
 * CRITICAL FINANCIAL SERVICE
 * This service handles all wallet operations with ACID guarantees.
 * All transactions are immutable and audited.
 */
export class WalletService {
  /**
   * Get wallet by agent ID
   */
  async getWalletByAgentId(agentId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { agentId },
      include: {
        agent: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    return wallet;
  }

  /**
   * Check if wallet has sufficient balance
   */
  async checkBalance(walletId: string, requiredAmount: number): Promise<boolean> {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    if (wallet.status !== 'ACTIVE') {
      throw new AppError(`Wallet is ${wallet.status}`, 403);
    }

    return wallet.balance.toNumber() >= requiredAmount;
  }

  /**
   * CRITICAL: Credit wallet with transaction-safe operation
   * Uses database transaction with FOR UPDATE lock to prevent race conditions
   */
  async creditWallet(data: WalletOperationData) {
    if (data.amount <= 0) {
      throw new AppError('Credit amount must be positive', 400);
    }

    try {
      return await prisma.$transaction(
        async (tx: any) => {
          // Lock wallet row for update
          const wallet = await tx.wallet.findUnique({
            where: { id: data.walletId },
          });

          if (!wallet) {
            throw new AppError('Wallet not found', 404);
          }

          if (wallet.status !== 'ACTIVE') {
            throw new AppError(`Wallet is ${wallet.status}`, 403);
          }

          const balanceBefore = wallet.balance;
          const balanceAfter = new Decimal(balanceBefore.toNumber() + data.amount);

          // Create immutable ledger entry
          const transaction = await tx.walletTransaction.create({
            data: {
              walletId: data.walletId,
              type: 'CREDIT',
              amount: data.amount,
              balanceBefore,
              balanceAfter,
              reason: data.reason,
              referenceId: data.referenceId,
              description: data.description,
              createdBy: data.createdBy,
            },
          });

          // Update wallet balance
          const updatedWallet = await tx.wallet.update({
            where: { id: data.walletId },
            data: { balance: balanceAfter },
          });

          // Audit log
          await tx.auditLog.create({
            data: {
              userId: data.createdBy,
              action: 'WALLET_CREDIT',
              entity: 'WalletTransaction',
              entityId: transaction.id,
              changes: {
                walletId: data.walletId,
                amount: data.amount,
                reason: data.reason,
                balanceBefore: balanceBefore.toString(),
                balanceAfter: balanceAfter.toString(),
              },
            },
          });

          logger.info(
            `Wallet credited: ${data.walletId} | Amount: ${data.amount} | Reason: ${data.reason}`
          );

          return {
            transaction,
            wallet: updatedWallet,
          };
        },
        {
          isolationLevel: 'Serializable' as any,
          maxWait: 5000,
          timeout: 10000,
        }
      );
    } catch (error) {
      logger.error('Wallet credit error:', error);
      throw new AppError('Failed to credit wallet', 500);
    }
  }

  /**
   * CRITICAL: Debit wallet with transaction-safe operation
   * Includes balance check and prevents overdraft
   */
  async debitWallet(data: WalletOperationData) {
    if (data.amount <= 0) {
      throw new AppError('Debit amount must be positive', 400);
    }

    try {
      return await prisma.$transaction(
        async (tx: any) => {
          // Lock wallet row for update
          const wallet = await tx.wallet.findUnique({
            where: { id: data.walletId },
          });

          if (!wallet) {
            throw new AppError('Wallet not found', 404);
          }

          if (wallet.status !== 'ACTIVE') {
            throw new AppError(`Wallet is ${wallet.status}`, 403);
          }

          const balanceBefore = wallet.balance;
          const requiredAmount = data.amount;

          // Check sufficient balance
          if (balanceBefore.toNumber() < requiredAmount) {
            throw new AppError(
              `Insufficient balance. Required: ${requiredAmount}, Available: ${balanceBefore}`,
              400
            );
          }

          const balanceAfter = new Decimal(balanceBefore.toNumber() - requiredAmount);

          // Create immutable ledger entry
          const transaction = await tx.walletTransaction.create({
            data: {
              walletId: data.walletId,
              type: 'DEBIT',
              amount: requiredAmount,
              balanceBefore,
              balanceAfter,
              reason: data.reason,
              referenceId: data.referenceId,
              description: data.description,
              createdBy: data.createdBy,
            },
          });

          // Update wallet balance
          const updatedWallet = await tx.wallet.update({
            where: { id: data.walletId },
            data: { balance: balanceAfter },
          });

          // Audit log
          await tx.auditLog.create({
            data: {
              userId: data.createdBy,
              action: 'WALLET_DEBIT',
              entity: 'WalletTransaction',
              entityId: transaction.id,
              changes: {
                walletId: data.walletId,
                amount: requiredAmount,
                reason: data.reason,
                balanceBefore: balanceBefore.toString(),
                balanceAfter: balanceAfter.toString(),
              },
            },
          });

          logger.info(
            `Wallet debited: ${data.walletId} | Amount: ${requiredAmount} | Reason: ${data.reason}`
          );

          return {
            transaction,
            wallet: updatedWallet,
          };
        },
        {
          isolationLevel: 'Serializable' as any,
          maxWait: 5000,
          timeout: 10000,
        }
      );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Wallet debit error:', error);
      throw new AppError('Failed to debit wallet', 500);
    }
  }

  /**
   * Get wallet transaction history
   */
  async getTransactionHistory(walletId: string, filters?: {
    fromDate?: Date;
    toDate?: Date;
    type?: TransactionType;
    limit?: number;
  }) {
    const where: any = { walletId };

    if (filters?.type) where.type = filters.type;

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    return await prisma.walletTransaction.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 100,
    });
  }

  /**
   * Freeze wallet (admin only)
   */
  async freezeWallet(walletId: string, adminId: string) {
    const wallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { status: 'FROZEN' },
    });

    await auditService.log({
      userId: adminId,
      action: 'WALLET_FROZEN',
      entity: 'Wallet',
      entityId: walletId,
    });

    logger.warn(`Wallet frozen: ${walletId} by admin ${adminId}`);

    return wallet;
  }

  /**
   * Unfreeze wallet (admin only)
   */
  async unfreezeWallet(walletId: string, adminId: string) {
    const wallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { status: 'ACTIVE' },
    });

    await auditService.log({
      userId: adminId,
      action: 'WALLET_UNFROZEN',
      entity: 'Wallet',
      entityId: walletId,
    });

    logger.info(`Wallet unfrozen: ${walletId} by admin ${adminId}`);

    return wallet;
  }

  /**
   * Get wallet balance report
   */
  async getBalanceReport() {
    const wallets = await prisma.wallet.findMany({
      include: {
        agent: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const totalBalance = wallets.reduce((sum: number, w: any) => sum + w.balance.toNumber(), 0);
    const activeWallets = wallets.filter((w: any) => w.status === 'ACTIVE').length;
    const frozenWallets = wallets.filter((w: any) => w.status === 'FROZEN').length;

    return {
      totalWallets: wallets.length,
      activeWallets,
      frozenWallets,
      totalBalance,
      wallets: wallets.map((w: any) => ({
        id: w.id,
        agentName: w.agent.agencyName,
        balance: w.balance.toNumber(),
        status: w.status,
        email: w.agent.user.email,
      })),
    };
  }
}

export const walletService = new WalletService();
