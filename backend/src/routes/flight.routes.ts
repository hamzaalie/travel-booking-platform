import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { amadeusService } from '../services/amadeus.service';
import { pricingService } from '../services/pricing.service';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/flights/search
router.get(
  '/search',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass,
    } = req.query;

    const flights = await amadeusService.searchFlights({
      originLocationCode: origin as string,
      destinationLocationCode: destination as string,
      departureDate: departureDate as string,
      returnDate: returnDate as string | undefined,
      adults: parseInt(adults as string) || 1,
      children: children ? parseInt(children as string) : undefined,
      infants: infants ? parseInt(infants as string) : undefined,
      travelClass: travelClass as string | undefined,
    });

    // If agent, calculate prices with markup
    if (req.user?.role === 'B2B_AGENT' && req.user.agentId) {
      for (const flight of flights) {
        const pricing = await pricingService.calculatePrice({
          baseFare: parseFloat(flight.price.base),
          taxes: parseFloat(flight.price.total) - parseFloat(flight.price.base),
          agentId: req.user.agentId,
        });

        flight.price.withMarkup = pricing.totalPrice;
        flight.price.commission = pricing.commission;
      }
    } else {
      // Apply platform markup for B2C customers
      for (const flight of flights) {
        const total = parseFloat(flight.price.total);
        const result = await pricingService.applyPlatformMarkup(total);
        if (result.markup > 0) {
          flight.price.total = result.price.toString();
          flight.price.grandTotal = result.price.toString();
          flight.price.platformMarkup = result.markup;
          flight.price.platformMarkupPercentage = result.percentage;
        }
      }
    }

    res.json({
      success: true,
      data: flights,
    });
  })
);

// POST /api/flights/price
router.post(
  '/price',
  authenticate,
  asyncHandler(async (req, res) => {
    const { flightOffer } = req.body;

    const pricedOffer = await amadeusService.priceFlightOffer(flightOffer);

    res.json({
      success: true,
      data: pricedOffer,
    });
  })
);

// POST /api/flights/search/multi-city
// Multi-city flight search endpoint
router.post(
  '/search/multi-city',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const {
      segments,
      adults,
      children,
      infants,
      travelClass,
      max,
    } = req.body;

    // Validate segments
    if (!Array.isArray(segments) || segments.length < 2) {
      res.status(400).json({
        success: false,
        error: 'Multi-city search requires at least 2 segments',
      });
      return;
    }

    if (segments.length > 6) {
      res.status(400).json({
        success: false,
        error: 'Multi-city search supports maximum 6 segments',
      });
      return;
    }

    // Validate each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment.origin || !segment.destination || !segment.departureDate) {
        res.status(400).json({
          success: false,
          error: `Segment ${i + 1}: origin, destination, and departureDate are required`,
        });
        return;
      }

      // Validate date is not in the past
      const depDate = new Date(segment.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (depDate < today) {
        res.status(400).json({
          success: false,
          error: `Segment ${i + 1}: departure date cannot be in the past`,
        });
        return;
      }

      // Validate sequential dates
      if (i > 0) {
        const prevDate = new Date(segments[i - 1].departureDate);
        if (depDate <= prevDate) {
          res.status(400).json({
            success: false,
            error: `Segment ${i + 1}: departure date must be after previous segment`,
          });
          return;
        }
      }
    }

    // Validate passenger counts
    const adultCount = parseInt(adults) || 1;
    if (adultCount < 1 || adultCount > 9) {
      res.status(400).json({
        success: false,
        error: 'Adult passengers must be between 1 and 9',
      });
      return;
    }

    const result = await amadeusService.searchMultiCityFlights(
      segments.map((seg: any) => ({
        origin: seg.origin,
        destination: seg.destination,
        departureDate: seg.departureDate,
      })),
      {
        adults: adultCount,
        children: children ? parseInt(children) : undefined,
        infants: infants ? parseInt(infants) : undefined,
      },
      travelClass,
      max
    );

    // If agent, calculate prices with markup
    if (req.user?.role === 'B2B_AGENT' && req.user.agentId) {
      for (const offer of result.offers) {
        const pricing = await pricingService.calculatePrice({
          baseFare: offer.price.base,
          taxes: offer.price.total - offer.price.base,
          agentId: req.user.agentId,
        });

        offer.price.withMarkup = pricing.totalPrice;
        offer.price.commission = pricing.commission;
      }
    } else {
      // Apply platform markup for B2C customers
      for (const offer of result.offers) {
        const total = typeof offer.price.total === 'number' ? offer.price.total : parseFloat(offer.price.total);
        const applied = await pricingService.applyPlatformMarkup(total);
        if (applied.markup > 0) {
          offer.price.total = applied.price;
          offer.price.grandTotal = applied.price;
          offer.price.platformMarkup = applied.markup;
          offer.price.platformMarkupPercentage = applied.percentage;
        }
      }
    }

    res.json({
      success: true,
      data: {
        searchId: result.searchId,
        segments,
        offers: result.offers,
        meta: result.meta,
      },
    });
  })
);

export default router;
