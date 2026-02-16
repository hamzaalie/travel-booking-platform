import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Amadeus GDS Api and thn we workinng on the integration amd then we have to work on the other parts
  amadeus: {
    apiKey: process.env.AMADEUS_API_KEY || '',
    apiSecret: process.env.AMADEUS_API_SECRET || '',
    baseUrl: process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com',
  },

  // Payment Gateways
  esewa: {
    merchantId: process.env.ESEWA_MERCHANT_ID || 'EPAYTEST',
    secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
    url: process.env.ESEWA_URL || 'https://rc-epay.esewa.com.np',
  },

  khalti: {
    secretKey: process.env.KHALTI_SECRET_KEY || 'live_secret_key_f5ae353ec473436fa3a2ae8913269329',
    publicKey: process.env.KHALTI_PUBLIC_KEY || 'live_public_key_fd287d968b1c4d729233c8f9e90b34eb',
    // Sandbox: https://dev.khalti.com/api/v2 | Production: https://khalti.com/api/v2
    url: process.env.KHALTI_URL || 'https://khalti.com/api/v2',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    secret: process.env.PAYPAL_SECRET || '',
    mode: process.env.PAYPAL_MODE || 'sandbox',
  },

  // Email
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'noreply@travelbooking.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Travel Booking Platform',
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },

  // Application
  app: {
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
    supportedCurrencies: ['USD', 'NPR', 'EUR', 'GBP'],
  },
};

// Validation
export const validateConfig = (): void => {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(
      `Warning: Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Warning for production
  if (config.env === 'production') {
    const productionVars = [
      'AMADEUS_API_KEY',
      'AMADEUS_API_SECRET',
      'SENDGRID_API_KEY',
    ];

    const missingProdVars = productionVars.filter((varName) => !process.env[varName]);

    if (missingProdVars.length > 0) {
      console.warn(
        `Warning: Missing production environment variables: ${missingProdVars.join(', ')}`
      );
    }
  }
};
