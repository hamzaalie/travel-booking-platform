import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { walletService } from './wallet.service';
import { paymentService } from './payment.service';
import emailService from './email.service';

interface RefundCalculation {
  bookingAmount: number;
  penalty: number;
  refundAmount: number;
  penaltyPercentage: number;
}

/**
 * Refund Service
 * Handles refund processing for both B2B and B2C bookings
 */
export class RefundService {
  /**
   * Calculate refund amount with penalty
   * Penalty rules based on time before departure
   */
  calculateRefund(
    bookingAmount: number,
    departureDate: Date,
    cancellationDate: Date = new Date()
  ): RefundCalculation {
    const daysUntilDeparture = Math.ceil(
      (departureDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let penaltyPercentage = 0;

    // Penalty structure (can be customized per airline/fare rules)
    if (daysUntilDeparture < 0) {
      // After departure - no refund
      penaltyPercentage = 100;
    } else if (daysUntilDeparture === 0) {
      // Same day - 50% penalty
      penaltyPercentage = 50;
    } else if (daysUntilDeparture <= 2) {
      // 1-2 days - 30% penalty
      penaltyPercentage = 30;
    } else if (daysUntilDeparture <= 7) {
      // 3-7 days - 20% penalty
      penaltyPercentage = 20;
    } else if (daysUntilDeparture <= 14) {
      // 8-14 days - 10% penalty
      penaltyPercentage = 10;
    } else if (daysUntilDeparture <= 30) {
      // 15-30 days - 5% penalty
      penaltyPercentage = 5;
    } else {
      // 30+ days - no penalty
      penaltyPercentage = 0;
    }

    const penalty = (bookingAmount * penaltyPercentage) / 100;
    const refundAmount = bookingAmount - penalty;

    return {
      bookingAmount,
      penalty,
      refundAmount,
      penaltyPercentage,
    };
  }

  /**
   * Process refund for a booking
   * Handles both B2B (wallet credit) and B2C (payment gateway refund)
   */
  async processRefund(
    bookingId: string,
    adminId: string,
    reason?: string
  ): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      // Get booking with all details
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          agent: {
            include: {
              wallet: true,
              user: true,
            },
          },
          payments: {
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      if (booking.status !== 'CANCELLED') {
        throw new AppError('Booking must be cancelled before processing refund', 400);
      }

      // Check if refund already processed
      const existingRefund = await tx.refund.findFirst({
        where: {
          bookingId,
          status: { in: ['PENDING', 'COMPLETED'] },
        },
      });

      if (existingRefund) {
        throw new AppError('Refund already processed or pending', 400);
      }

      // Calculate refund amount
      let departureDate = new Date();
      if (booking.flightDetails && typeof booking.flightDetails === 'object') {
        const flightData = booking.flightDetails as any;
        departureDate = new Date(flightData.departureDate || new Date());
      }

      const refundCalc = this.calculateRefund(
        booking.totalPrice?.toNumber() || 0,
        departureDate
      );

      logger.info(
        `Refund calculation for ${booking.bookingReference}: Amount=${refundCalc.bookingAmount}, Penalty=${refundCalc.penalty}, Refund=${refundCalc.refundAmount}`
      );

      // Determine refund method based on booking type
      const isB2BBooking = !!booking.agentId;
      let refundStatus: 'PENDING' | 'COMPLETED' = 'PENDING';
      let refundMethod: string = '';
      let transactionId: string | null = null;

      if (isB2BBooking) {
        // B2B: Credit agent wallet
        if (!booking.agent?.wallet) {
          throw new AppError('Agent wallet not found', 404);
        }

        refundMethod = 'WALLET';

        // Credit wallet with refund amount
        await walletService.creditWallet({
          walletId: booking.agent.wallet.id,
          amount: refundCalc.refundAmount,
          reason: 'FUND_LOAD' as any,
          referenceId: bookingId,
          description: `Refund for booking ${booking.bookingReference}`,
          createdBy: adminId,
        });

        refundStatus = 'COMPLETED';
        transactionId = `REFUND-${booking.bookingReference}-${Date.now()}`;

        logger.info(
          `B2B refund: Credited $${refundCalc.refundAmount} to agent wallet ${booking.agent.wallet.id}`
        );

        // Send email to agent
        emailService.sendRefundNotificationEmail(booking.agent.user.email, {
          booking,
          refundAmount: refundCalc.refundAmount,
          penalty: refundCalc.penalty,
          method: 'Wallet Credit',
        }).catch(err => logger.error('Failed to send refund email to agent:', err));

      } else {
        // B2C: Refund to payment gateway
        const payment = booking.payments[0];
        if (!payment) {
          throw new AppError('No completed payment found for booking', 404);
        }

        refundMethod = payment.gateway;

        try {
          // Process gateway refund
          let gatewayRefund;
          switch (payment.gateway) {
            case 'STRIPE':
              gatewayRefund = await paymentService.refundStripePayment(
                payment.transactionId,
                refundCalc.refundAmount
              );
              transactionId = gatewayRefund.id;
              break;

            case 'KHALTI':
              // Khalti refund API (if available)
              logger.warn('Khalti refund not implemented, marking as pending');
              refundStatus = 'PENDING';
              break;

            case 'ESEWA':
              // Esewa refund API (if available)
              logger.warn('Esewa refund not implemented, marking as pending');
              refundStatus = 'PENDING';
              break;

            case 'PAYPAL':
              // PayPal removed — no longer supported
              logger.warn('PayPal refund not available (PayPal removed), marking as pending');
              refundStatus = 'PENDING';
              break;

            default:
              throw new AppError(`Unsupported payment gateway: ${payment.gateway}`, 400);
          }

          if (transactionId) {
            refundStatus = 'COMPLETED';
          }

          logger.info(
            `B2C refund: Processed $${refundCalc.refundAmount} via ${payment.gateway}`
          );

        } catch (error) {
          logger.error('Gateway refund error:', error);
          // Mark as pending for manual processing
          refundStatus = 'PENDING';
        }

        // Send email to customer
        emailService.sendRefundNotificationEmail(booking.user.email, {
          booking,
          refundAmount: refundCalc.refundAmount,
          penalty: refundCalc.penalty,
          method: refundMethod,
        }).catch(err => logger.error('Failed to send refund email to customer:', err));
      }

      // Create refund record
      const refund = await tx.refund.create({
        data: {
          bookingId,
          amount: new Decimal(refundCalc.refundAmount),
          penalty: new Decimal(refundCalc.penalty),
          penaltyPercentage: refundCalc.penaltyPercentage,
          status: refundStatus,
          method: refundMethod,
          transactionId,
          reason: reason || 'Booking cancellation',
          processedBy: adminId,
          processedAt: new Date(),
        },
      });

      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'REFUNDED' },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'REFUND_PROCESSED',
          entity: 'Refund',
          entityId: refund.id,
          changes: {
            bookingReference: booking.bookingReference,
            refundAmount: refundCalc.refundAmount,
            penalty: refundCalc.penalty,
            method: refundMethod,
            status: refundStatus,
          },
        },
      });

      logger.info(`Refund processed: ${refund.id} for booking ${booking.bookingReference}`);

      return {
        ...refund,
        booking,
      };
    });
  }

  /**
   * Get refund by ID
   */
  async getRefundById(refundId: string): Promise<any> {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        booking: {
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

    if (!refund) {
      throw new AppError('Refund not found', 404);
    }

    return refund;
  }

  /**
   * Get all refunds with filters
   */
  async getAllRefunds(filters?: {
    status?: string;
    method?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ refunds: any[]; total: number; page: number; totalPages: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.method) {
      where.method = filters.method;
    }

    if (filters?.startDate || filters?.endDate) {
      where.processedAt = {};
      if (filters.startDate) {
        where.processedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.processedAt.lte = filters.endDate;
      }
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          booking: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
              agent: {
                select: {
                  id: true,
                  agencyName: true,
                },
              },
            },
          },
        },
        orderBy: { processedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ]);

    return {
      refunds,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retry failed refund
   */
  async retryRefund(refundId: string, adminId: string): Promise<any> {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        booking: {
          include: {
            payments: true,
            agent: {
              include: { wallet: true },
            },
          },
        },
      },
    });

    if (!refund) {
      throw new AppError('Refund not found', 404);
    }

    if (refund.status === 'COMPLETED') {
      throw new AppError('Refund already completed', 400);
    }

    if (refund.status === 'FAILED') {
      // Reset to pending for retry
      await prisma.refund.update({
        where: { id: refundId },
        data: { status: 'PENDING' },
      });
    }

    // Re-process the refund
    return await this.processRefund(refund.bookingId, adminId, refund.reason || undefined);
  }
}

export const refundService = new RefundService();
