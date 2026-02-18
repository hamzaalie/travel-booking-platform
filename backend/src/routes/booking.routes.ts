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

    if (!['CONFIRMED', 'TICKETED'].includes(booking.status)) {
      res.status(400).json({
        success: false,
        message: 'Ticket can only be downloaded for confirmed/ticketed bookings',
      });
      return;
    }

    // Extract flight details from Amadeus itinerary structure
    const flightDetails = booking.flightDetails as any;
    const passengers = booking.passengers as any;
    const firstSegment = flightDetails?.itineraries?.[0]?.segments?.[0];
    const lastSegment = flightDetails?.itineraries?.[0]?.segments?.slice(-1)[0];

    // Generate ticket for first passenger (can be extended for all passengers)
    const ticketData = {
      bookingReference: booking.bookingReference,
      pnr: booking.pnr || 'N/A',
      passengerName: `${passengers[0]?.firstName} ${passengers[0]?.lastName}`,
      departureCity: firstSegment?.departure?.iataCode || booking.origin || 'N/A',
      arrivalCity: lastSegment?.arrival?.iataCode || booking.destination || 'N/A',
      departureDate: firstSegment?.departure?.at
        ? new Date(firstSegment.departure.at).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
        : (booking.departureDate ? new Date(booking.departureDate).toLocaleDateString() : 'N/A'),
      departureTime: firstSegment?.departure?.at
        ? new Date(firstSegment.departure.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        : 'N/A',
      arrivalDate: lastSegment?.arrival?.at
        ? new Date(lastSegment.arrival.at).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
        : 'N/A',
      arrivalTime: lastSegment?.arrival?.at
        ? new Date(lastSegment.arrival.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        : 'N/A',
      airline: firstSegment?.carrierCode || 'N/A',
      flightNumber: firstSegment ? `${firstSegment.carrierCode}-${firstSegment.number}` : 'N/A',
      seatNumber: flightDetails?.seatNumber,
      class: flightDetails?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'Economy',
      baggage: flightDetails?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.weight
        ? `${flightDetails.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.weight}kg`
        : '1 x 23kg',
      ticketNumber: passengers[0]?.ticketNumber,
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
    const firstSeg = flightDetails?.itineraries?.[0]?.segments?.[0];
    const lastSeg = flightDetails?.itineraries?.[0]?.segments?.slice(-1)[0];

    const invoiceData = {
      invoiceNumber: `INV-${booking.bookingReference}`,
      date: booking.createdAt.toISOString().split('T')[0],
      bookingReference: booking.bookingReference,
      customerName: booking.user.firstName + ' ' + booking.user.lastName,
      customerEmail: booking.user.email,
      items: [
        {
          description: `Flight: ${firstSeg?.departure?.iataCode || booking.origin || 'N/A'} → ${lastSeg?.arrival?.iataCode || booking.destination || 'N/A'} (${passengers?.length || 1} passenger${passengers?.length > 1 ? 's' : ''})`,
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
