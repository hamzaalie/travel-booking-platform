import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { carRentalService } from '../services/car-rental.service';
import { pricingService } from '../services/pricing.service';
import { validate } from '../middleware/validation.middleware';
import Joi from 'joi';

const router = Router();

// Validation schemas
const searchCarRentalsSchema = Joi.object({
  query: Joi.object({
    pickupLocationCode: Joi.string().required(),
    pickupDate: Joi.string().required(),
    pickupTime: Joi.string().required(),
    dropoffLocationCode: Joi.string().optional(),
    dropoffDate: Joi.string().required(),
    dropoffTime: Joi.string().required(),
    currency: Joi.string().optional(),
    providerCodes: Joi.string().optional(),
    rateClass: Joi.string().optional(),
  }),
});

const bookCarRentalSchema = Joi.object({
  body: Joi.object({
    offerId: Joi.string().required(),
    driver: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().email().required(),
      dateOfBirth: Joi.string().required(),
      licenseNumber: Joi.string().required(),
      licenseCountry: Joi.string().required(),
    }).required(),
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
 * @route   GET /api/car-rentals/search
 * @desc    Search car rental offers
 * @access  Public
 */
router.get(
  '/search',
  validate(searchCarRentalsSchema),
  asyncHandler(async (req, res) => {
    const { providerCodes } = req.query;

    const searchParams = {
      pickupLocationCode: req.query.pickupLocationCode as string,
      pickupDate: req.query.pickupDate as string,
      pickupTime: req.query.pickupTime as string,
      dropoffLocationCode: req.query.dropoffLocationCode as string | undefined,
      dropoffDate: req.query.dropoffDate as string,
      dropoffTime: req.query.dropoffTime as string,
      currency: req.query.currency as string | undefined,
      providerCodes: providerCodes ? (providerCodes as string).split(',') : undefined,
      rateClass: req.query.rateClass as string | undefined,
    };

    const offers = await carRentalService.searchCarRentals(searchParams);

    // Apply platform markup to car rental prices for all users
    for (const offer of offers) {
      const o = offer as any;
      if (o.price?.total) {
        const applied = await pricingService.applyPlatformMarkup(o.price.total);
        if (applied.markup > 0) {
          o.price.total = applied.price;
          if (o.price.base) {
            const baseApplied = await pricingService.applyPlatformMarkup(o.price.base);
            o.price.base = baseApplied.price;
          }
          o.price.platformMarkup = applied.markup;
          o.price.platformMarkupPercentage = applied.percentage;
        }
      }
    }

    res.json({
      success: true,
      count: offers.length,
      data: offers,
    });
  })
);

/**
 * @route   GET /api/car-rentals/offers/:offerId
 * @desc    Get car rental offer details
 * @access  Public
 */
router.get(
  '/offers/:offerId',
  asyncHandler(async (req, res) => {
    const offer = await carRentalService.getCarRentalOffer(req.params.offerId);

    res.json({
      success: true,
      data: offer,
    });
  })
);

/**
 * @route   POST /api/car-rentals/book
 * @desc    Book a car rental
 * @access  Private
 */
router.post(
  '/book',
  authenticate,
  validate(bookCarRentalSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { offerId, driver, payment } = req.body;

    const booking = await carRentalService.bookCarRental(offerId, driver, payment);

    res.status(201).json({
      success: true,
      message: 'Car rental booked successfully',
      data: booking,
    });
  })
);

/**
 * @route   DELETE /api/car-rentals/bookings/:bookingId
 * @desc    Cancel car rental booking
 * @access  Private
 */
router.delete(
  '/bookings/:bookingId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await carRentalService.cancelCarRentalBooking(req.params.bookingId);

    res.json({
      success: true,
      message: 'Car rental booking cancelled successfully',
      data: result,
    });
  })
);

/**
 * @route   GET /api/car-rentals/:rentalId/insurance
 * @desc    Get insurance options for a car rental
 * @access  Public
 */
router.get(
  '/:rentalId/insurance',
  asyncHandler(async (req, res) => {
    const options = await carRentalService.getInsuranceOptions(req.params.rentalId);

    res.json({
      success: true,
      data: options,
    });
  })
);

/**
 * @route   GET /api/car-rentals/:rentalId/addons
 * @desc    Get available add-ons for a car rental
 * @access  Public
 */
router.get(
  '/:rentalId/addons',
  asyncHandler(async (req, res) => {
    const addOns = await carRentalService.getAvailableAddOns(req.params.rentalId);

    res.json({
      success: true,
      count: addOns.length,
      data: addOns,
    });
  })
);

/**
 * @route   POST /api/car-rentals/voucher/generate
 * @desc    Generate car rental voucher PDF
 * @access  Private
 */
router.post(
  '/voucher/generate',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { bookingId } = req.body;

    const pdfBuffer = await carRentalService.generateCarRentalVoucher(bookingId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=car-rental-voucher-${bookingId}.pdf`);
    res.send(pdfBuffer);
  })
);

export default router;
