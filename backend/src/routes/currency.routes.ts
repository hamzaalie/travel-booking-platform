import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorizeAdmin } from '../middleware/authorization.middleware';
import { currencyService } from '../services/currency.service';

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// GET /api/currency - Get all active currencies
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const currencies = await currencyService.getActiveCurrencies();

    res.json({
      success: true,
      data: currencies,
    });
  })
);

// GET /api/currency/detect - Detect currency by IP
router.get(
  '/detect',
  asyncHandler(async (req, res) => {
    // Get client IP
    const ip = req.headers['x-forwarded-for'] as string || 
               req.socket.remoteAddress || 
               '0.0.0.0';
    
    const currency = await currencyService.getCurrencyByIP(ip);
    const currencyDetails = await currencyService.getCurrencyByCode(currency);

    res.json({
      success: true,
      data: {
        currencyCode: currency,
        details: currencyDetails,
      },
    });
  })
);

// GET /api/currency/:code - Get currency by code
router.get(
  '/:code',
  asyncHandler(async (req, res) => {
    const currency = await currencyService.getCurrencyByCode(req.params.code.toUpperCase());

    if (!currency) {
      return res.status(404).json({
        success: false,
        error: 'Currency not found',
      });
    }

    res.json({
      success: true,
      data: currency,
    });
  })
);

// POST /api/currency/convert - Convert currency
router.post(
  '/convert',
  asyncHandler(async (req, res) => {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, from, to',
      });
    }

    const converted = await currencyService.convertCurrency(
      parseFloat(amount),
      from.toUpperCase(),
      to.toUpperCase()
    );

    const fromCurrency = await currencyService.getCurrencyByCode(from.toUpperCase());
    const toCurrency = await currencyService.getCurrencyByCode(to.toUpperCase());

    res.json({
      success: true,
      data: {
        originalAmount: parseFloat(amount),
        convertedAmount: converted,
        from: fromCurrency,
        to: toCurrency,
        formattedFrom: currencyService.formatCurrency(parseFloat(amount), from.toUpperCase()),
        formattedTo: currencyService.formatCurrency(converted, to.toUpperCase()),
      },
    });
  })
);

// GET /api/currency/exchange-rate/:code - Get exchange rate
router.get(
  '/exchange-rate/:code',
  asyncHandler(async (req, res) => {
    const rate = await currencyService.getExchangeRate(req.params.code.toUpperCase());

    res.json({
      success: true,
      data: {
        currencyCode: req.params.code.toUpperCase(),
        rate,
        baseCurrency: 'NPR',
      },
    });
  })
);

// GET /api/currency/countries - Get country-currency mappings
router.get(
  '/countries/list',
  asyncHandler(async (_req, res) => {
    const countries = await currencyService.getCountryCurrencies();

    res.json({
      success: true,
      data: countries,
    });
  })
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// PUT /api/currency/:code - Update currency (admin)
router.put(
  '/:code',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const { name, symbol, exchangeRate, isActive, decimalPlaces } = req.body;

    const updated = await currencyService.updateCurrency(req.params.code.toUpperCase(), {
      name,
      symbol,
      exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
      isActive,
      decimalPlaces,
    });

    res.json({
      success: true,
      message: 'Currency updated successfully',
      data: updated,
    });
  })
);

// POST /api/currency - Create currency (admin)
router.post(
  '/',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const { code, name, symbol, exchangeRate, decimalPlaces } = req.body;

    if (!code || !name || !symbol || exchangeRate === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: code, name, symbol, exchangeRate',
      });
    }

    const currency = await currencyService.createCurrency({
      code: code.toUpperCase(),
      name,
      symbol,
      exchangeRate: parseFloat(exchangeRate),
      decimalPlaces,
    });

    res.status(201).json({
      success: true,
      message: 'Currency created successfully',
      data: currency,
    });
  })
);

// POST /api/currency/country-mapping - Add country-currency mapping (admin)
router.post(
  '/country-mapping',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const { countryCode, countryName, currencyCode } = req.body;

    if (!countryCode || !countryName || !currencyCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const mapping = await currencyService.addCountryCurrency(
      countryCode.toUpperCase(),
      countryName,
      currencyCode.toUpperCase()
    );

    res.json({
      success: true,
      message: 'Country-currency mapping added',
      data: mapping,
    });
  })
);

// POST /api/currency/refresh-rates - Refresh exchange rates (admin)
router.post(
  '/refresh-rates',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (_req: AuthRequest, res) => {
    await currencyService.updateExchangeRates();

    res.json({
      success: true,
      message: 'Exchange rates refreshed',
    });
  })
);

// POST /api/currency/initialize - Initialize currencies (admin)
router.post(
  '/initialize',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (_req: AuthRequest, res) => {
    await currencyService.initializeCurrencies();
    await currencyService.initializeCountryCurrencies();

    res.json({
      success: true,
      message: 'Currencies initialized',
    });
  })
);

export default router;
