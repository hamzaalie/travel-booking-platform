import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error.middleware';
import { auditService } from './audit.service';

/**
 * Flight Change Request Service
 * Handles flight modification, date changes, refunds, and cancellations
 */

interface CreateChangeRequestData {
  bookingId: string;
  userId: string;
  requestType: 'DATE_CHANGE' | 'NAME_CORRECTION' | 'ROUTE_CHANGE' | 'CLASS_UPGRADE' | 
               'CANCELLATION' | 'REFUND' | 'ADD_PASSENGER' | 'REMOVE_PASSENGER';
  reason?: string;
  requestedChanges?: {
    newDepartureDate?: string;
    newReturnDate?: string;
    newRoute?: { origin: string; destination: string };
    newClass?: string;
    passengerDetails?: any;
    additionalInfo?: string;
  };
}

interface ProcessRequestData {
  status: 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  penaltyAmount?: number;
  additionalAmount?: number;
}

export class FlightChangeService {
  /**
   * Create a change request
   */
  async createChangeRequest(data: CreateChangeRequestData) {
    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { user: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.userId !== data.userId) {
      // Check if user is an agent who made this booking
      const agent = await prisma.agent.findFirst({
        where: { userId: data.userId },
      });
      
      if (!agent || booking.agentId !== agent.id) {
        throw new AppError('Unauthorized access to booking', 403);
      }
    }

    // Check booking status
    if (['CANCELLED', 'REFUNDED', 'FAILED'].includes(booking.status)) {
      throw new AppError(`Cannot modify a ${booking.status.toLowerCase()} booking`, 400);
    }

    // Check for existing pending request of same type
    const existingRequest = await prisma.flightChangeRequest.findFirst({
      where: {
        bookingId: data.bookingId,
        requestType: data.requestType,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
    });

    if (existingRequest) {
      throw new AppError(`A ${data.requestType.toLowerCase().replace('_', ' ')} request is already pending`, 400);
    }

    // Create the request
    const request = await prisma.flightChangeRequest.create({
      data: {
        bookingId: data.bookingId,
        userId: data.userId,
        requestType: data.requestType,
        reason: data.reason,
        requestedChanges: data.requestedChanges as any,
        status: 'PENDING',
      },
      include: {
        booking: {
          include: { user: true },
        },
      },
    });

    await auditService.log({
      userId: data.userId,
      action: 'CHANGE_REQUEST_CREATED',
      entity: 'FlightChangeRequest',
      entityId: request.id,
      changes: {
        bookingReference: booking.bookingReference,
        requestType: data.requestType,
      },
    });

    logger.info(`Change request created: ${request.id} for booking ${booking.bookingReference}`);

    return request;
  }

  /**
   * Get change request by ID
   */
  async getChangeRequestById(requestId: string, userId?: string) {
    const request = await prisma.flightChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        booking: {
          include: { user: true },
        },
      },
    });

    if (!request) {
      throw new AppError('Change request not found', 404);
    }

    // If userId provided, verify access
    if (userId && request.userId !== userId) {
      const agent = await prisma.agent.findFirst({
        where: { userId },
      });
      
      if (!agent || request.booking.agentId !== agent.id) {
        // Check if user is admin
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user || !['SUPER_ADMIN', 'OPERATIONS_TEAM'].includes(user.role)) {
          throw new AppError('Unauthorized access', 403);
        }
      }
    }

    return request;
  }

  /**
   * Get user's change requests
   */
  async getUserChangeRequests(userId: string, params?: {
    status?: string;
    requestType?: string;
    limit?: number;
    page?: number;
  }) {
    const limit = params?.limit || 10;
    const page = params?.page || 1;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.requestType) {
      where.requestType = params.requestType;
    }

    const [requests, total] = await Promise.all([
      prisma.flightChangeRequest.findMany({
        where,
        include: {
          booking: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.flightChangeRequest.count({ where }),
    ]);

    return {
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all change requests (admin)
   */
  async getAllChangeRequests(params?: {
    status?: string;
    requestType?: string;
    limit?: number;
    page?: number;
  }) {
    const limit = params?.limit || 20;
    const page = params?.page || 1;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.requestType) {
      where.requestType = params.requestType;
    }

    const [requests, total] = await Promise.all([
      prisma.flightChangeRequest.findMany({
        where,
        include: {
          booking: {
            include: { user: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.flightChangeRequest.count({ where }),
    ]);

    return {
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark request as under review
   */
  async markUnderReview(requestId: string, adminId: string) {
    const request = await this.getChangeRequestById(requestId);

    if (request.status !== 'PENDING') {
      throw new AppError('Request is not in pending status', 400);
    }

    const updated = await prisma.flightChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'UNDER_REVIEW',
        processedBy: adminId,
      },
      include: { booking: true },
    });

    await auditService.log({
      userId: adminId,
      action: 'CHANGE_REQUEST_UNDER_REVIEW',
      entity: 'FlightChangeRequest',
      entityId: requestId,
    });

    return updated;
  }

  /**
   * Process change request (approve/reject)
   */
  async processChangeRequest(
    requestId: string,
    adminId: string,
    data: ProcessRequestData
  ) {
    const request = await this.getChangeRequestById(requestId);

    if (!['PENDING', 'UNDER_REVIEW'].includes(request.status)) {
      throw new AppError('Request cannot be processed', 400);
    }

    const updateData: any = {
      status: data.status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      adminNotes: data.adminNotes,
      processedBy: adminId,
      processedAt: new Date(),
    };

    if (data.penaltyAmount !== undefined) {
      updateData.penaltyAmount = data.penaltyAmount;
    }
    if (data.additionalAmount !== undefined) {
      updateData.additionalAmount = data.additionalAmount;
    }

    const updated = await prisma.flightChangeRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        booking: {
          include: { user: true },
        },
      },
    });

    // If approved, update booking status based on request type
    if (data.status === 'APPROVED') {
      await this.applyApprovedChanges(updated);
    }

    await auditService.log({
      userId: adminId,
      action: data.status === 'APPROVED' ? 'CHANGE_REQUEST_APPROVED' : 'CHANGE_REQUEST_REJECTED',
      entity: 'FlightChangeRequest',
      entityId: requestId,
      changes: {
        adminNotes: data.adminNotes,
        penaltyAmount: data.penaltyAmount,
        additionalAmount: data.additionalAmount,
      },
    });

    // Send email notification
    try {
      // TODO: Implement email notification
      // Subject: approved/rejected notification based on status
      logger.info(`Notification sent for request ${requestId}, status: ${data.status}`);
    } catch (error) {
      logger.error('Failed to send notification:', error);
    }

    return updated;
  }

  /**
   * Apply approved changes to booking
   */
  private async applyApprovedChanges(request: any) {
    const booking = request.booking;

    switch (request.requestType) {
      case 'CANCELLATION':
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED',
            cancellationData: {
              requestId: request.id,
              cancelledAt: new Date().toISOString(),
              reason: request.reason,
            },
          },
        });
        break;

      case 'REFUND':
        // Mark for refund processing
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'REFUNDED' },
        });
        break;

      case 'DATE_CHANGE':
        // Update flight details with new dates
        const currentDetails = booking.flightDetails as any;
        if (request.requestedChanges?.newDepartureDate) {
          currentDetails.newDepartureDate = request.requestedChanges.newDepartureDate;
        }
        if (request.requestedChanges?.newReturnDate) {
          currentDetails.newReturnDate = request.requestedChanges.newReturnDate;
        }
        currentDetails.modifiedAt = new Date().toISOString();
        currentDetails.modificationNote = 'Date changed via change request';

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            flightDetails: currentDetails,
            departureDate: request.requestedChanges?.newDepartureDate 
              ? new Date(request.requestedChanges.newDepartureDate) 
              : booking.departureDate,
            returnDate: request.requestedChanges?.newReturnDate 
              ? new Date(request.requestedChanges.newReturnDate) 
              : booking.returnDate,
          },
        });
        break;

      case 'NAME_CORRECTION':
        // Update passenger details
        const passengers = booking.passengers as any[];
        if (request.requestedChanges?.passengerDetails) {
          // Apply name corrections
          const corrections = request.requestedChanges.passengerDetails;
          passengers.forEach((p: any, index: number) => {
            if (corrections[index]) {
              p.firstName = corrections[index].firstName || p.firstName;
              p.lastName = corrections[index].lastName || p.lastName;
              p.correctedAt = new Date().toISOString();
            }
          });
        }

        await prisma.booking.update({
          where: { id: booking.id },
          data: { passengers },
        });
        break;

      // Add more cases as needed
    }

    // Update request status to COMPLETED
    await prisma.flightChangeRequest.update({
      where: { id: request.id },
      data: { status: 'COMPLETED' },
    });
  }

  /**
   * Cancel a pending change request
   */
  async cancelChangeRequest(requestId: string, userId: string) {
    const request = await this.getChangeRequestById(requestId, userId);

    if (!['PENDING', 'UNDER_REVIEW'].includes(request.status)) {
      throw new AppError('Cannot cancel this request', 400);
    }

    const updated = await prisma.flightChangeRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    await auditService.log({
      userId,
      action: 'CHANGE_REQUEST_CANCELLED',
      entity: 'FlightChangeRequest',
      entityId: requestId,
    });

    return updated;
  }

  /**
   * Get change request statistics (admin dashboard)
   */
  async getRequestStats() {
    const [pending, underReview, approved, rejected, total] = await Promise.all([
      prisma.flightChangeRequest.count({ where: { status: 'PENDING' } }),
      prisma.flightChangeRequest.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.flightChangeRequest.count({ where: { status: 'APPROVED' } }),
      prisma.flightChangeRequest.count({ where: { status: 'REJECTED' } }),
      prisma.flightChangeRequest.count(),
    ]);

    const byType = await prisma.flightChangeRequest.groupBy({
      by: ['requestType'],
      _count: true,
    });

    return {
      pending,
      underReview,
      approved,
      rejected,
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.requestType] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export const flightChangeService = new FlightChangeService();
