import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { amadeusService } from './amadeus.service';
import { pricingService } from './pricing.service';
import { walletService } from './wallet.service';
import { auditService } from './audit.service';
import emailService from './email.service';
import { toNPR } from '../utils/currencyConverter';

interface BookingPassenger {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
}

interface CreateBookingData {
  userId: string;
  agentId?: string;
  flightOffer: any;
  passengers: BookingPassenger[];
  paymentGateway?: 'ESEWA' | 'KHALTI' | 'STRIPE' | 'PAYPAL' | 'WALLET';
  tripType: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';
}

/**
 * Booking Service - Core Orchestration
 * Handles complete booking flow for B2C and B2B users
 */
export class BookingService {
  /**
   * Create booking (B2C or B2B)
   */
  async createBooking(data: CreateBookingData) {
    const bookingReference = this.generateBookingReference();

    try {
      // Step 1: Revalidate price with Amadeus (with fallback)
      let pricedOffer;
      let baseFare;
      let totalPrice;
      
      try {
        pricedOffer = await amadeusService.priceFlightOffer(data.flightOffer);
        const pricedCurrency = pricedOffer.data.flightOffers[0].price.currency || 'USD';
        baseFare = toNPR(parseFloat(pricedOffer.data.flightOffers[0].price.base), pricedCurrency);
        totalPrice = toNPR(parseFloat(pricedOffer.data.flightOffers[0].price.total), pricedCurrency);
      } catch (priceError) {
        // Fallback to original price (already converted to NPR by our search formatting)
        logger.warn('Price revalidation failed, using original price', priceError);
        baseFare = parseFloat(data.flightOffer.price?.base || '0');
        totalPrice = parseFloat(data.flightOffer.price?.total || data.flightOffer.price?.grandTotal || '0');
      }

      // Step 2: Calculate final price with markups
      const pricing = await pricingService.calculatePrice({
        baseFare,
        taxes: totalPrice - baseFare,
        agentId: data.agentId,
      });

      // Step 3: For B2B, check wallet balance and deduct
      let walletTransaction = null;
      if (data.agentId && data.paymentGateway === 'WALLET') {
        const agent = await prisma.agent.findUnique({
          where: { id: data.agentId },
          include: { wallet: true },
        });

        if (!agent || !agent.wallet) {
          throw new AppError('Agent wallet not found', 404);
        }

        // Check balance
        const hasBalance = await walletService.checkBalance(
          agent.wallet.id,
          pricing.totalPrice
        );

        if (!hasBalance) {
          throw new AppError('Insufficient wallet balance', 400);
        }

        // Deduct from wallet (transaction-safe)
        const debitResult = await walletService.debitWallet({
          walletId: agent.wallet.id,
          amount: pricing.totalPrice,
          reason: 'BOOKING_DEDUCTION',
          referenceId: bookingReference,
          description: `Flight booking: ${bookingReference}`,
          createdBy: data.userId,
        });

        walletTransaction = debitResult.transaction;
      }

      // Step 4: Create booking in database (pending state)
      const booking = await prisma.booking.create({
        data: {
          userId: data.userId,
          agentId: data.agentId,
          bookingReference,
          tripType: data.tripType,
          origin: data.flightOffer.itineraries[0].segments[0].departure.iataCode,
          destination:
            data.flightOffer.itineraries[0].segments[
              data.flightOffer.itineraries[0].segments.length - 1
            ].arrival.iataCode,
          departureDate: new Date(
            data.flightOffer.itineraries[0].segments[0].departure.at
          ),
          returnDate: data.flightOffer.itineraries[1]
            ? new Date(data.flightOffer.itineraries[1].segments[0].departure.at)
            : null,
          passengers: data.passengers as any,
          flightDetails: (pricedOffer?.data?.flightOffers?.[0] || data.flightOffer) as any,
          baseFare: pricing.baseFare,
          taxes: pricing.taxes,
          markup: pricing.globalMarkup,
          agentMarkup: pricing.agentMarkup,
          totalAmount: pricing.totalPrice,
          currency: 'NPR',
          commissionAmount: pricing.commission,
          status: 'PENDING',
          ticketUrls: [],
        },
      });

      // Step 5: Create payment record
      const payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          userId: data.userId,
          amount: pricing.totalPrice,
          gateway: data.paymentGateway || 'WALLET',
          status: data.paymentGateway === 'WALLET' ? 'COMPLETED' : 'PENDING',
          paymentData: walletTransaction
            ? { walletTransactionId: walletTransaction.id }
            : {},
        },
      });

      logger.info(`Booking created: ${bookingReference}`);

      return {
        booking,
        payment,
        pricing,
      };
    } catch (error) {
      logger.error('Booking creation error:', error);

      // If error after wallet deduction, we should credit back (compensation logic)
      // In production, implement proper compensation/rollback mechanism

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create booking', 500);
    }
  }

  /**
   * Confirm booking after payment success
   */
  async confirmBooking(bookingId: string, paymentData?: any) {
    try {
      return await prisma.$transaction(async (tx: any) => {
        // Get booking
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            payments: true,
            user: true,
          },
        });

        if (!booking) {
          throw new AppError('Booking not found', 404);
        }

        if (booking.status !== 'PENDING') {
          throw new AppError('Booking already processed', 400);
        }

        // Try to create Amadeus flight order (may fail in sandbox)
        let pnr: string | null = null;
        let ticketNumbers: string[] = [];
        let finalStatus = 'CONFIRMED';

        try {
          const travelers = amadeusService.formatTravelerData(
            booking.passengers as any[]
          );

          const flightOrder = await amadeusService.createFlightOrder(
            booking.flightDetails,
            travelers
          );

          pnr = flightOrder.data.associatedRecords?.[0]?.reference || null;
          ticketNumbers = flightOrder.data.travelers?.map(
            (t: any) => t.documents?.[0]?.number
          ) || [];
          finalStatus = 'TICKETED';
          logger.info(`Amadeus order created for ${booking.bookingReference} | PNR: ${pnr}`);
        } catch (amadeusError: any) {
          // Amadeus ticketing failed (sandbox, gender enum, etc.) — still confirm
          logger.warn(`Amadeus order creation failed for ${booking.bookingReference}, confirming without PNR:`, amadeusError.message || amadeusError);
        }

        // Update booking status
        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: finalStatus,
            pnr,
            ticketUrls: ticketNumbers,
          },
        });

        // Update payment
        await tx.payment.updateMany({
          where: { bookingId },
          data: {
            status: 'COMPLETED',
            webhookData: paymentData || {},
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: booking.userId,
            action: 'BOOKING_CONFIRMED',
            entity: 'Booking',
            entityId: bookingId,
            changes: {
              status: finalStatus,
              pnr,
            },
          },
        });

        logger.info(`Booking confirmed: ${booking.bookingReference} | Status: ${finalStatus}`);

        // Send confirmation emails
        if (booking.user?.email) {
          emailService.sendBookingConfirmation(booking.user.email, updatedBooking).catch(err =>
            logger.error('Failed to send booking confirmation email:', err)
          );
          if (finalStatus === 'TICKETED') {
            emailService.sendTicketEmail(booking.user.email, updatedBooking).catch(err =>
              logger.error('Failed to send ticket email:', err)
            );
          }
        }

        return updatedBooking;
      });
    } catch (error) {
      logger.error('Booking confirmation error:', error);

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to confirm booking', 500);
    }
  }

  /**
   * Get booking by ID with access control
   */
  async getBookingById(bookingId: string, userId: string, role: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
        payments: true,
        refunds: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Access control
    if (role !== 'SUPER_ADMIN') {
      if (booking.userId !== userId) {
        throw new AppError('Access denied', 403);
      }
    }

    return booking;
  }

  /**
   * Get user bookings
   */
  async getUserBookings(
    userId: string,
    filters?: {
      status?: string;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    }
  ) {
    const where: any = { userId };

    if (filters?.status) where.status = filters.status;

    if (filters?.fromDate || filters?.toDate) {
      where.departureDate = {};
      if (filters.fromDate) where.departureDate.gte = filters.fromDate;
      if (filters.toDate) where.departureDate.lte = filters.toDate;
    }

    return await prisma.booking.findMany({
      where,
      include: {
        payments: true,
        agent: {
          select: {
            agencyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 50,
    });
  }

  /**
   * Get agent bookings
   */
  async getAgentBookings(
    agentId: string,
    filters?: {
      status?: string;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    }
  ) {
    const where: any = { agentId };

    if (filters?.status) where.status = filters.status;

    if (filters?.fromDate || filters?.toDate) {
      where.departureDate = {};
      if (filters.fromDate) where.departureDate.gte = filters.fromDate;
      if (filters.toDate) where.departureDate.lte = filters.toDate;
    }

    return await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 100,
    });
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, userId: string, reason?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        payments: true,
        user: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      throw new AppError('Booking already cancelled', 400);
    }

    // Cancel in Amadeus if PNR exists
    if (booking.pnr) {
      try {
        // Note: Amadeus cancellation by PNR requires different endpoint
        logger.warn(`Booking cancellation requested: ${booking.pnr}`);
      } catch (error) {
        logger.error('Amadeus cancellation error:', error);
      }
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationData: {
          cancelledAt: new Date(),
          cancelledBy: userId,
          reason,
        } as any,
      },
      include: {
        user: true,
      },
    });

    await auditService.log({
      userId,
      action: 'BOOKING_CANCELLED',
      entity: 'Booking',
      entityId: bookingId,
      changes: { reason },
    });

    logger.info(`Booking cancelled: ${booking.bookingReference}`);

    // Send cancellation email
    emailService.sendBookingCancellationEmail(updatedBooking.user.email, updatedBooking).catch(err =>
      logger.error('Failed to send cancellation email:', err)
    );

    return updatedBooking;
  }

  /**
   * Generate unique booking reference
   */
  private generateBookingReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TB${timestamp}${random}`;
  }
}

export const bookingService = new BookingService();
