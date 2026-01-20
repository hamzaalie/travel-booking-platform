import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { hotelService } from '../services/hotel.service';
import { validate } from '../middleware/validation.middleware';
import Joi from 'joi';

const router = Router();

// Validation schemas
const searchHotelsSchema = Joi.object({
  query: Joi.object({
    cityCode: Joi.string().required(),
    checkInDate: Joi.string().required(),
    checkOutDate: Joi.string().required(),
    adults: Joi.number().min(1).required(),
    rooms: Joi.number().min(1).optional(),
    radius: Joi.number().optional(),
    radiusUnit: Joi.string().valid('KM', 'MILE').optional(),
    ratings: Joi.string().optional(),
    amenities: Joi.string().optional(),
    priceRange: Joi.string().optional(),
    currency: Joi.string().optional(),
    bestRateOnly: Joi.boolean().optional(),
  }),
});

const searchByGeocodeSchema = Joi.object({
  query: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    checkInDate: Joi.string().required(),
    checkOutDate: Joi.string().required(),
    adults: Joi.number().min(1).required(),
    rooms: Joi.number().min(1).optional(),
    radius: Joi.number().optional(),
    radiusUnit: Joi.string().valid('KM', 'MILE').optional(),
    ratings: Joi.string().optional(),
    amenities: Joi.string().optional(),
    priceRange: Joi.string().optional(),
    currency: Joi.string().optional(),
    bestRateOnly: Joi.boolean().optional(),
  }),
});

const bookHotelSchema = Joi.object({
  body: Joi.object({
    offerId: Joi.string().required(),
    guests: Joi.array()
      .items(
        Joi.object({
          title: Joi.string().valid('MR', 'MRS', 'MS', 'MISS').optional(),
          firstName: Joi.string().required(),
          lastName: Joi.string().required(),
          phone: Joi.string().required(),
          email: Joi.string().email().required(),
        })
      )
      .min(1)
      .required(),
    payment: Joi.object({
      method: Joi.string().valid('CREDIT_CARD').required(),
      cardType: Joi.string().required(),
      cardNumber: Joi.string().required(),
      expiryDate: Joi.string().required(),
      holderName: Joi.string().required(),
    }).required(),
  }),
});

/**
 * @route   GET /api/hotels/search
 * @desc    Search hotels by city
 * @access  Public
 */
router.get(
  '/search',
  validate(searchHotelsSchema),
  asyncHandler(async (req, res) => {
    const { ratings, amenities, ...restQuery } = req.query;

    const searchParams = {
      ...restQuery,
      cityCode: req.query.cityCode as string,
      checkInDate: req.query.checkInDate as string,
      checkOutDate: req.query.checkOutDate as string,
      adults: parseInt(req.query.adults as string),
      rooms: req.query.rooms ? parseInt(req.query.rooms as string) : undefined,
      radius: req.query.radius ? parseInt(req.query.radius as string) : undefined,
      radiusUnit: req.query.radiusUnit as 'KM' | 'MILE' | undefined,
      ratings: ratings ? (ratings as string).split(',') : undefined,
      amenities: amenities ? (amenities as string).split(',') : undefined,
      currency: req.query.currency as string | undefined,
      bestRateOnly: req.query.bestRateOnly === 'true',
    };

    const hotels = await hotelService.searchHotels(searchParams);

    res.json({
      success: true,
      count: hotels.length,
      data: hotels,
    });
  })
);

/**
 * @route   POST /api/hotels/search/advanced
 * @desc    Advanced hotel search with filters
 * @access  Public
 */
router.post(
  '/search/advanced',
  asyncHandler(async (req, res) => {
    const results = await hotelService.searchHotelsAdvanced(req.body);

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  })
);

/**
 * @route   GET /api/hotels/search-by-location
 * @desc    Search hotels by geographic coordinates
 * @access  Public
 */
router.get(
  '/search-by-location',
  validate(searchByGeocodeSchema),
  asyncHandler(async (req, res) => {
    const { latitude, longitude, ratings, amenities, ...restQuery } = req.query;

    const searchParams = {
      ...restQuery,
      checkInDate: req.query.checkInDate as string,
      checkOutDate: req.query.checkOutDate as string,
      adults: parseInt(req.query.adults as string),
      rooms: req.query.rooms ? parseInt(req.query.rooms as string) : undefined,
      radius: req.query.radius ? parseInt(req.query.radius as string) : undefined,
      radiusUnit: req.query.radiusUnit as 'KM' | 'MILE' | undefined,
      ratings: ratings ? (ratings as string).split(',') : undefined,
      amenities: amenities ? (amenities as string).split(',') : undefined,
      currency: req.query.currency as string | undefined,
      bestRateOnly: req.query.bestRateOnly === 'true',
    };

    const hotels = await hotelService.searchHotelsByGeocode(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      searchParams
    );

    res.json({
      success: true,
      count: hotels.length,
      data: hotels,
    });
  })
);

/**
 * @route   GET /api/hotels/:hotelId
 * @desc    Get hotel details by ID
 * @access  Public
 */
router.get(
  '/:hotelId',
  asyncHandler(async (req, res) => {
    const hotel = await hotelService.getHotelById(req.params.hotelId);

    res.json({
      success: true,
      data: hotel,
    });
  })
);

/**
 * @route   GET /api/hotels/offers/:offerId
 * @desc    Get hotel offer details
 * @access  Public
 */
router.get(
  '/offers/:offerId',
  asyncHandler(async (req, res) => {
    const offer = await hotelService.getHotelOffer(req.params.offerId);

    res.json({
      success: true,
      data: offer,
    });
  })
);

/**
 * @route   POST /api/hotels/book
 * @desc    Book a hotel
 * @access  Private
 */
router.post(
  '/book',
  authenticate,
  validate(bookHotelSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { offerId, guests, payment } = req.body;

    const booking = await hotelService.bookHotel(offerId, guests, payment);

    res.status(201).json({
      success: true,
      message: 'Hotel booked successfully',
      data: booking,
    });
  })
);

/**
 * @route   DELETE /api/hotels/bookings/:bookingId
 * @desc    Cancel hotel booking
 * @access  Private
 */
router.delete(
  '/bookings/:bookingId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await hotelService.cancelHotelBooking(req.params.bookingId);

    res.json({
      success: true,
      message: 'Hotel booking cancelled successfully',
      data: result,
    });
  })
);

/**
 * @route   POST /api/hotels/voucher/generate
 * @desc    Generate hotel voucher PDF
 * @access  Private
 */
router.post(
  '/voucher/generate',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { bookingId } = req.body;

    const pdfBuffer = await hotelService.generateHotelVoucher(bookingId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=hotel-voucher-${bookingId}.pdf`);
    res.send(pdfBuffer);
  })
);

export default router;
