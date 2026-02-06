import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { SabreService } from '../services/sabre.service';
import { logger } from '../config/logger';

const router = Router();
const sabreService = new SabreService();

/**
 * Search flights using Sabre Bargain Finder Max
 * POST /api/sabre/search
 */
router.post('/search', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      cabinClass = 'Y',
      directOnly = false,
      maxResults = 50,
    } = req.body;

    // Validate required fields
    if (!origin || !destination || !departureDate) {
      res.status(400).json({
        success: false,
        error: 'Origin, destination, and departure date are required',
      });
      return;
    }

    logger.info('Sabre flight search request', {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers: { adults, children, infants },
    });

    const flights = await sabreService.searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      cabinClass,
      directOnly,
      maxResults,
    });

    res.json({
      success: true,
      source: 'SABRE',
      count: flights.length,
      data: flights,
    });
  } catch (error: any) {
    logger.error('Sabre search error:', error);
    next(error);
  }
});

/**
 * Check flight availability
 * POST /api/sabre/availability
 */
router.post('/availability', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      origin,
      destination,
      departureDate,
      carrierCode,
    } = req.body;

    if (!origin || !destination || !departureDate) {
      res.status(400).json({
        success: false,
        error: 'Origin, destination, and departure date are required',
      });
      return;
    }

    const availability = await sabreService.checkAvailability({
      origin,
      destination,
      departureDate,
      carrierCode,
    });

    res.json({
      success: true,
      data: availability,
    });
  } catch (error: any) {
    logger.error('Sabre availability error:', error);
    next(error);
  }
});

/**
 * Get seat map for a flight
 * POST /api/sabre/seatmap
 */
router.post('/seatmap', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      origin,
      destination,
      departureDate,
      carrierCode,
      flightNumber,
    } = req.body;

    if (!origin || !destination || !departureDate || !carrierCode || !flightNumber) {
      res.status(400).json({
        success: false,
        error: 'Origin, destination, departure date, carrier code, and flight number are required',
      });
      return;
    }

    const seatMap = await sabreService.getSeatMap({
      origin,
      destination,
      departureDate,
      carrierCode,
      flightNumber,
    });

    res.json({
      success: true,
      data: seatMap,
    });
  } catch (error: any) {
    logger.error('Sabre seat map error:', error);
    next(error);
  }
});

/**
 * Get price quote for a flight offer
 * POST /api/sabre/price-quote
 */
router.post('/price-quote', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { flightOffer } = req.body;

    if (!flightOffer) {
      res.status(400).json({
        success: false,
        error: 'Flight offer is required',
      });
      return;
    }

    const priceQuote = await sabreService.getPriceQuote(flightOffer);

    res.json({
      success: true,
      data: priceQuote,
    });
  } catch (error: any) {
    logger.error('Sabre price quote error:', error);
    next(error);
  }
});

/**
 * Create booking/PNR
 * POST /api/sabre/book
 */
router.post('/book', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      flightOffer,
      passengers,
      contactInfo,
    } = req.body;

    if (!flightOffer || !passengers || !contactInfo) {
      res.status(400).json({
        success: false,
        error: 'Flight offer, passengers, and contact info are required',
      });
      return;
    }

    logger.info('Creating Sabre PNR', {
      passengerCount: passengers.length,
      userId: req.user?.id,
    });

    const booking = await sabreService.createPNR({
      flightOffer,
      passengers,
      contactInfo,
    });

    res.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    logger.error('Sabre booking error:', error);
    next(error);
  }
});

/**
 * Cancel PNR
 * POST /api/sabre/cancel/:pnr
 */
router.post('/cancel/:pnr', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pnr } = req.params;

    logger.info('Cancelling Sabre PNR', {
      pnr,
      userId: req.user?.id,
    });

    const result = await sabreService.cancelPNR(pnr);

    res.json({
      success: true,
      cancelled: result,
    });
  } catch (error: any) {
    logger.error('Sabre cancellation error:', error);
    next(error);
  }
});

/**
 * Get airline information
 * GET /api/sabre/airlines/:code
 */
router.get('/airlines/:code', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.params;

    const airline = await sabreService.getAirlineInfo(code);

    res.json({
      success: true,
      data: airline,
    });
  } catch (error: any) {
    logger.error('Sabre airline info error:', error);
    next(error);
  }
});

/**
 * Get airport information
 * GET /api/sabre/airports/:code
 */
router.get('/airports/:code', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.params;

    const airport = await sabreService.getAirportInfo(code);

    res.json({
      success: true,
      data: airport,
    });
  } catch (error: any) {
    logger.error('Sabre airport info error:', error);
    next(error);
  }
});

export default router;
