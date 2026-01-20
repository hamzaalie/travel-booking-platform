import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorizeBookingAccess } from '../middleware/authorization.middleware';
import { bookingService } from '../services/booking.service';
import { validate } from '../middleware/validation.middleware';
import { pdfService } from '../services/pdf.service';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createBookingSchema = Joi.object({
  body: Joi.object({
    flightOffer: Joi.object().required(),
    passengers: Joi.array()
      .items(
        Joi.object({
          firstName: Joi.string().required(),
          lastName: Joi.string().required(),
          dateOfBirth: Joi.string().required(),
          gender: Joi.string().valid('M', 'F').required(),
          email: Joi.string().email().optional(),
          phone: Joi.string().optional(),
          passportNumber: Joi.string().optional(),
          passportExpiry: Joi.string().optional(),
          nationality: Joi.string().optional(),
        })
      )
      .min(1)
      .required(),
    paymentGateway: Joi.string()
      .valid('ESEWA', 'KHALTI', 'STRIPE', 'PAYPAL', 'WALLET')
      .required(),
    tripType: Joi.string().valid('ONE_WAY', 'ROUND_TRIP', 'MULTI_CITY').required(),
  }),
});

// POST /api/bookings
router.post(
  '/',
  authenticate,
  validate(createBookingSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const booking = await bookingService.createBooking({
      userId: req.user!.id,
      agentId: req.user!.agentId,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  })
);

// POST /api/bookings/:id/confirm
router.post(
  '/:id/confirm',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const booking = await bookingService.confirmBooking(req.params.id, req.body.paymentData);

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking,
    });
  })
);

// GET /api/bookings/:id
router.get(
  '/:id',
  authenticate,
  authorizeBookingAccess,
  asyncHandler(async (req: AuthRequest, res) => {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user!.id,
      req.user!.role
    );

    res.json({
      success: true,
      data: booking,
    });
  })
);

// GET /api/bookings
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const bookings = await bookingService.getUserBookings(req.user!.id, {
      status: req.query.status as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });

    res.json({
      success: true,
      data: bookings,
    });
  })
);

// POST /api/bookings/:id/cancel
router.post(
  '/:id/cancel',
  authenticate,
  authorizeBookingAccess,
  asyncHandler(async (req: AuthRequest, res) => {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user!.id,
      req.body.reason
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  })
);

// GET /api/bookings/:id/ticket/download
router.get(
  '/:id/ticket/download',
  authenticate,
  authorizeBookingAccess,
  asyncHandler(async (req: AuthRequest, res) => {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user!.id,
      req.user!.role
    );

    if (booking.status !== 'CONFIRMED') {
      res.status(400).json({
        success: false,
        message: 'Ticket can only be downloaded for confirmed bookings',
      });
      return;
    }

    // Extract flight details
    const flightDetails = booking.flightDetails as any;
    const passengers = booking.passengers as any;

    // Generate ticket for first passenger (can be extended for all passengers)
    const ticketData = {
      bookingReference: booking.bookingReference,
      pnr: booking.pnr || 'N/A',
      passengerName: `${passengers[0]?.firstName} ${passengers[0]?.lastName}`,
      departureCity: flightDetails?.origin || 'N/A',
      arrivalCity: flightDetails?.destination || 'N/A',
      departureDate: flightDetails?.departureDate || new Date().toISOString(),
      departureTime: flightDetails?.departureTime || 'N/A',
      arrivalDate: flightDetails?.arrivalDate || new Date().toISOString(),
      arrivalTime: flightDetails?.arrivalTime || 'N/A',
      airline: flightDetails?.airline || 'N/A',
      flightNumber: flightDetails?.flightNumber || 'N/A',
      seatNumber: flightDetails?.seatNumber,
      class: flightDetails?.class || 'Economy',
      baggage: flightDetails?.baggage || '1 x 23kg',
      ticketNumber: flightDetails?.ticketNumber,
      totalPrice: booking.totalAmount?.toNumber() || 0,
      currency: 'USD',
    };

    const filePath = await pdfService.generateTicket(ticketData);

    res.download(filePath, `ticket-${booking.bookingReference}.pdf`, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Optionally delete file after download
      // pdfService.deleteFile(filePath).catch(console.error);
    });
  })
);

// GET /api/bookings/:id/invoice/download
router.get(
  '/:id/invoice/download',
  authenticate,
  authorizeBookingAccess,
  asyncHandler(async (req: AuthRequest, res) => {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user!.id,
      req.user!.role
    );

    const flightDetails = booking.flightDetails as any;
    const passengers = booking.passengers as any;

    const invoiceData = {
      invoiceNumber: `INV-${booking.bookingReference}`,
      date: booking.createdAt.toISOString().split('T')[0],
      bookingReference: booking.bookingReference,
      customerName: booking.user.firstName + ' ' + booking.user.lastName,
      customerEmail: booking.user.email,
      items: [
        {
          description: `Flight: ${flightDetails?.origin} → ${flightDetails?.destination} (${passengers?.length || 1} passenger${passengers?.length > 1 ? 's' : ''})`,
          quantity: 1,
          unitPrice: booking.baseFare?.toNumber() || 0,
          total: booking.baseFare?.toNumber() || 0,
        },
        {
          description: 'Taxes & Fees',
          quantity: 1,
          unitPrice: booking.taxes?.toNumber() || 0,
          total: booking.taxes?.toNumber() || 0,
        },
      ],
      subtotal: booking.baseFare?.toNumber() || 0,
      tax: booking.taxes?.toNumber() || 0,
      total: booking.totalAmount?.toNumber() || 0,
      currency: 'USD',
    };

    const filePath = await pdfService.generateInvoice(invoiceData);

    res.download(filePath, `invoice-${booking.bookingReference}.pdf`, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Optionally delete file after download
      // pdfService.deleteFile(filePath).catch(console.error);
    });
  })
);

export default router;
