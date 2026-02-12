import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config, validateConfig } from './config';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { errorHandler, notFound } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import flightRoutes from './routes/flight.routes';
import bookingRoutes from './routes/booking.routes';
import walletRoutes from './routes/wallet.routes';
import adminRoutes from './routes/admin.routes';
import agentRoutes from './routes/agent.routes';
import paymentRoutes from './routes/payment.routes';
import refundRoutes from './routes/refund.routes';
import reportRoutes from './routes/report.routes';
import webhookRoutes from './routes/webhook.routes';
import fundRequestRoutes from './routes/fund-request.routes';
import hotelRoutes from './routes/hotel.routes';
import carRentalRoutes from './routes/car-rental.routes';
import ssrRoutes from './routes/ssr.routes';
import currencyRoutes from './routes/currency.routes';
import settingsRoutes from './routes/settings.routes';
import contentRoutes from './routes/content.routes';
import esimRoutes from './routes/esim.routes';
import flightChangeRoutes from './routes/flight-change.routes';
import sabreRoutes from './routes/sabre.routes';
import adminExtendedRoutes from './routes/admin-extended.routes';

// Validate configuration
validateConfig();

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS - Allow frontend origins
app.use(
  cors({
    origin: config.env === 'production' 
      ? [
          config.frontendUrl,
          // Railway app URLs
          'https://web-production-6d65d.up.railway.app',
          'https://web-production-b72c0.up.railway.app',
          /\.railway\.app$/, 
          /\.up\.railway\.app$/,
          // Vercel
          /\.vercel\.app$/,
          // Hostinger
          /\.hostingersite\.com$/,
          /\.hostinger\.com$/,
          'https://darkslategrey-jay-641616.hostingersite.com',
          // Localhost for development
          'http://localhost:3000',
          'http://localhost:5173',
        ]
      : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (required for Railway / reverse proxy deployments)
app.set('trust proxy', 1);

// Rate limiting - general API limiter
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Webhook routes (before body parsing middleware for Stripe)
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/fund-requests', fundRequestRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/car-rentals', carRentalRoutes);
app.use('/api/ssr', ssrRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/esim', esimRoutes);
app.use('/api/flight-change', flightChangeRoutes);
app.use('/api/sabre', sabreRoutes);
app.use('/api/admin-extended', adminExtendedRoutes);

// Serve frontend in production
if (config.env === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
const HOST = '0.0.0.0'; // Bind to all interfaces for containerized deployments

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(PORT, HOST, () => {
      logger.info(`Server running on ${HOST}:${PORT} in ${config.env} mode`);
      logger.info(`Frontend URL: ${config.frontendUrl}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
