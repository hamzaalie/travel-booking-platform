import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error.middleware';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

/**
 * eSIM Service
 * Handles eSIM product listings, ordering, and activation
 * 
 * Supports multiple providers:
 * - Airalo (https://www.airalo.com/developer)
 * - eSIM Go (https://www.esimgo.com/api)
 * - Flexiroam (https://www.flexiroam.com/api)
 */

interface EsimConfig {
  provider: 'airalo' | 'esimgo' | 'flexiroam' | 'custom';
  apiKey: string;
  apiSecret?: string;
  baseUrl: string;
  sandboxMode: boolean;
}

interface EsimProduct {
  id: string;
  name: string;
  description: string;
  countries: string[];
  regions: string[];
  dataAmount: string;
  validityDays: number;
  price: number;
  currency: string;
}

interface EsimOrderResult {
  orderId: string;
  iccid: string;
  qrCode: string;
  activationCode: string;
  instructions: string;
  status: string;
}

// Country name to ISO code mapping for search
const countryNameToCode: Record<string, string> = {
  'nepal': 'NP', 'india': 'IN', 'thailand': 'TH', 'japan': 'JP',
  'usa': 'US', 'united states': 'US', 'uk': 'GB', 'united kingdom': 'GB',
  'uae': 'AE', 'united arab emirates': 'AE', 'australia': 'AU',
  'singapore': 'SG', 'south korea': 'KR', 'korea': 'KR',
  'france': 'FR', 'germany': 'DE', 'italy': 'IT', 'spain': 'ES',
  'turkey': 'TR', 'malaysia': 'MY', 'indonesia': 'ID', 'vietnam': 'VN',
  'china': 'CN', 'canada': 'CA', 'brazil': 'BR', 'mexico': 'MX',
  'philippines': 'PH', 'egypt': 'EG', 'saudi arabia': 'SA',
  'switzerland': 'CH', 'netherlands': 'NL', 'portugal': 'PT',
  'greece': 'GR', 'ireland': 'IE', 'sweden': 'SE', 'norway': 'NO',
  'denmark': 'DK', 'finland': 'FI', 'austria': 'AT', 'belgium': 'BE',
  'czech republic': 'CZ', 'poland': 'PL', 'hungary': 'HU',
  'romania': 'RO', 'croatia': 'HR', 'sri lanka': 'LK',
  'bangladesh': 'BD', 'pakistan': 'PK', 'myanmar': 'MM',
  'cambodia': 'KH', 'laos': 'LA', 'hong kong': 'HK', 'taiwan': 'TW',
  'new zealand': 'NZ', 'argentina': 'AR', 'colombia': 'CO',
  'peru': 'PE', 'chile': 'CL', 'south africa': 'ZA',
  'kenya': 'KE', 'nigeria': 'NG', 'morocco': 'MA', 'tanzania': 'TZ',
  'qatar': 'QA', 'bahrain': 'BH', 'kuwait': 'KW', 'oman': 'OM',
  'jordan': 'JO', 'israel': 'IL', 'russia': 'RU', 'ukraine': 'UA',
  'maldives': 'MV', 'fiji': 'FJ',
};

// Default eSIM configuration
const defaultConfig: EsimConfig = {
  provider: 'airalo',
  apiKey: process.env.ESIM_API_KEY || '',
  apiSecret: process.env.ESIM_API_SECRET || '',
  baseUrl: process.env.ESIM_API_URL || 'https://partners-api.airalo.com/v2',
  sandboxMode: process.env.ESIM_SANDBOX !== undefined
    ? process.env.ESIM_SANDBOX === 'true'
    : process.env.NODE_ENV !== 'production',
};

export class EsimService {
  private config: EsimConfig;
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(esimConfig?: Partial<EsimConfig>) {
    this.config = { ...defaultConfig, ...esimConfig };
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(async (config) => {
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });
  }

  /**
   * Authenticate with the eSIM provider
   */
  async authenticate(): Promise<void> {
    try {
      if (this.config.provider === 'airalo') {
        // Airalo requires multipart/form-data for token endpoint
        const formData = new FormData();
        formData.append('client_id', this.config.apiKey);
        formData.append('client_secret', this.config.apiSecret || '');
        formData.append('grant_type', 'client_credentials');

        const response = await axios.post(
          `${this.config.baseUrl}/token`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Accept': 'application/json',
            },
            timeout: 30000,
          }
        );

        this.accessToken = response.data.data.access_token;
        // Token valid for 24 hours per Airalo docs, refresh 1 hour before expiry
        this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
        logger.info('eSIM API authenticated successfully');
      }
    } catch (error: any) {
      logger.error('eSIM authentication failed:', error.response?.data || error.message);
      throw new AppError('Failed to authenticate with eSIM provider', 500);
    }
  }

  /**
   * Ensure authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  /**
   * Get available eSIM packages/products
   * Airalo returns: data[] = countries, each with operators[], each with packages[]
   * We flatten this into a simple list of purchasable packages
   */
  async getProducts(params?: {
    country?: string;
    region?: string;
    limit?: number;
    page?: number;
  }): Promise<{ products: EsimProduct[]; total: number }> {
    try {
      await this.ensureAuthenticated();

      // Build Airalo query params
      const queryParams: any = {};
      if (params?.country) {
        // Convert country name to ISO code if needed (Airalo expects codes like NP, US, etc.)
        const search = params.country.trim().toLowerCase();
        const code = countryNameToCode[search] || (search.length === 2 ? search.toUpperCase() : null);
        if (code) {
          queryParams['filter[country]'] = code;
        } else {
          // Try as-is (might be a slug like 'nepal')
          queryParams['filter[country]'] = params.country;
        }
      }
      if (params?.region === 'Global' || params?.region === 'global') queryParams['filter[type]'] = 'global';
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.page) queryParams.page = params.page;

      const response = await this.client.get('/packages', { params: queryParams });

      // Airalo response: { data: [ { slug, country_code, title, operators: [ { packages: [...] } ] } ] }
      const countries = response.data.data || [];
      const products: EsimProduct[] = [];

      for (const country of countries) {
        const countryName = country.title || country.slug || '';
        const countryCode = country.country_code || '';

        for (const operator of (country.operators || [])) {
          for (const pkg of (operator.packages || [])) {
            products.push({
              id: pkg.id,
              name: pkg.title || `${countryName} - ${pkg.id}`,
              description: operator.other_info || pkg.short_info || '',
              countries: countryCode ? [countryCode] : [],
              regions: operator.type === 'global' ? [country.slug] : [],
              dataAmount: pkg.is_unlimited
                ? 'Unlimited'
                : pkg.amount >= 1024
                  ? `${(pkg.amount / 1024).toFixed(pkg.amount % 1024 === 0 ? 0 : 1)} GB`
                  : `${pkg.amount} MB`,
              validityDays: pkg.day || 0,
              price: pkg.price || 0,
              currency: 'USD',
            });
          }
        }
      }

      return {
        products,
        total: response.data.meta?.total || products.length,
      };
    } catch (error: any) {
      logger.error('Failed to fetch eSIM products:', error.response?.data || error.message);
      
      // Return cached products from database as fallback
      const cachedProducts = await prisma.esimProduct.findMany({
        where: { isActive: true },
        take: params?.limit || 50,
        skip: params?.page ? (params.page - 1) * (params?.limit || 50) : 0,
      });

      return {
        products: cachedProducts.map(p => ({
          id: p.externalId,
          name: p.name,
          description: p.description || '',
          countries: p.countries,
          regions: p.regions,
          dataAmount: p.dataAmount,
          validityDays: p.validityDays,
          price: Number(p.price),
          currency: p.currency,
        })),
        total: await prisma.esimProduct.count({ where: { isActive: true } }),
      };
    }
  }

  /**
   * Get product details by ID (Airalo package_id like "change-7days-1gb")
   */
  async getProductById(productId: string): Promise<EsimProduct | null> {
    try {
      // Always fetch fresh price from Airalo API
      const { products } = await this.getProducts({ limit: 500 });
      const liveProduct = products.find(p => p.id === productId);
      if (liveProduct) return liveProduct;

      // If not found in live API, try database cache as last resort
      const cached = await prisma.esimProduct.findUnique({
        where: { externalId: productId },
      });

      if (cached) {
        logger.warn(`Product ${productId} not found in live API, using DB cache`);
        return {
          id: cached.externalId,
          name: cached.name,
          description: cached.description || '',
          countries: cached.countries,
          regions: cached.regions,
          dataAmount: cached.dataAmount,
          validityDays: cached.validityDays,
          price: Number(cached.price),
          currency: cached.currency,
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Failed to fetch eSIM product:', error.message);
      return null;
    }
  }

  /**
   * Get countries/destinations with eSIM coverage
   */
  async getDestinations(): Promise<Array<{ code: string; name: string; flag: string }>> {
    try {
      await this.ensureAuthenticated();

      // Use packages endpoint with filter[type]=local to get countries with coverage
      const response = await this.client.get('/packages', {
        params: { 'filter[type]': 'local', limit: 250 },
      });
      
      const countries = response.data.data || [];
      return countries.map((item: any) => ({
        code: item.country_code || '',
        name: item.title || item.slug || '',
        flag: item.image?.url || '',
      }));
    } catch (error: any) {
      logger.error('Failed to fetch eSIM destinations:', error.message);
      
      // Return common destinations
      return [
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'JP', name: 'Japan', flag: '🇯🇵' },
        { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
        { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
        { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
        { code: 'AU', name: 'Australia', flag: '🇦🇺' },
        { code: 'EU', name: 'Europe', flag: '🇪🇺' },
      ];
    }
  }

  /**
   * Purchase an eSIM
   */
  async purchaseEsim(
    userId: string,
    productId: string,
    quantity: number = 1
  ): Promise<EsimOrderResult> {
    // Validate credentials are configured
    if (!this.config.apiKey || !this.config.apiSecret) {
      logger.error('eSIM purchase failed: ESIM_API_KEY or ESIM_API_SECRET not configured');
      throw new AppError('eSIM service is not configured. Please contact support.', 503);
    }

    try {
      logger.info(`eSIM purchase started: userId=${userId}, productId=${productId}, qty=${quantity}`);
      await this.ensureAuthenticated();
      logger.info(`eSIM auth OK, token present: ${!!this.accessToken}`);

      // Get product details
      const product = await this.getProductById(productId);
      if (!product) {
        throw new AppError('eSIM product not found', 404);
      }
      logger.info(`eSIM product found: ${product.name} (${product.price} ${product.currency})`);

      // Place order with Airalo
      const orderFormData = new FormData();
      orderFormData.append('package_id', productId);
      orderFormData.append('quantity', String(quantity));

      logger.info(`Placing Airalo order: package_id=${productId}, baseUrl=${this.config.baseUrl}`);

      const response = await axios.post(
        `${this.config.baseUrl}/orders`,
        orderFormData,
        {
          headers: {
            ...orderFormData.getHeaders(),
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          timeout: 30000,
        }
      );

      logger.info(`Airalo order response status: ${response.status}`);
      const orderData = response.data.data;

      if (!orderData) {
        logger.error('Airalo order response missing data:', JSON.stringify(response.data));
        throw new AppError('Invalid response from eSIM provider', 502);
      }

      logger.info(`Airalo order created: id=${orderData.id}, sims=${JSON.stringify(orderData.sims?.length || 0)}`);

      // Create order in database
      const dbProduct = await prisma.esimProduct.upsert({
        where: { externalId: productId },
        update: {
          name: product.name,
          description: product.description,
          countries: product.countries,
          regions: product.regions,
          dataAmount: product.dataAmount,
          validityDays: product.validityDays,
          price: product.price,
          currency: product.currency,
        },
        create: {
          externalId: productId,
          name: product.name,
          description: product.description,
          countries: product.countries,
          regions: product.regions,
          dataAmount: product.dataAmount,
          validityDays: product.validityDays,
          price: product.price,
          currency: product.currency,
          providerName: this.config.provider,
        },
      });

      const order = await prisma.esimOrder.create({
        data: {
          userId,
          productId: dbProduct.id,
          quantity,
          totalAmount: product.price * quantity,
          currency: product.currency,
          status: orderData.sims?.[0]?.iccid ? 'COMPLETED' : 'PROCESSING',
          externalOrderId: String(orderData.id),
          iccid: orderData.sims?.[0]?.iccid,
          qrCode: orderData.sims?.[0]?.qrcode || orderData.sims?.[0]?.qrcode_url,
          activationCode: orderData.sims?.[0]?.lpa,
          providerResponse: orderData,
        },
      });

      logger.info(`eSIM order created: ${order.id} for user ${userId}`);

      return {
        orderId: order.id,
        iccid: orderData.sims?.[0]?.iccid || '',
        qrCode: orderData.sims?.[0]?.qrcode || orderData.sims?.[0]?.qrcode_url || '',
        activationCode: orderData.sims?.[0]?.lpa || '',
        instructions: this.getActivationInstructions(),
        status: orderData.sims?.[0]?.iccid ? 'COMPLETED' : 'PROCESSING',
      };
    } catch (error: any) {
      // Extract detailed error info from Airalo API responses
      const airaloError = error.response?.data;
      const statusCode = error.response?.status;
      const errorDetail = airaloError?.message || airaloError?.error || error.message;

      logger.error('Failed to purchase eSIM:', {
        message: error.message,
        statusCode,
        airaloResponse: airaloError ? JSON.stringify(airaloError) : 'N/A',
        productId,
        userId,
      });

      // Re-throw AppErrors as-is (e.g. 404 product not found)
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `eSIM purchase failed: ${errorDetail || 'Unknown error'}`,
        statusCode === 401 ? 401 : statusCode === 422 ? 422 : 500
      );
    }
  }

  /**
   * Get user's eSIM orders
   */
  async getUserOrders(userId: string) {
    return await prisma.esimOrder.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string, userId: string) {
    const order = await prisma.esimOrder.findUnique({
      where: { id: orderId },
      include: { product: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized access to order', 403);
    }

    return order;
  }

  /**
   * Update order status (admin)
   */
  async updateOrderStatus(orderId: string, status: string) {
    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'ACTIVATED', 'EXPIRED', 'FAILED', 'CANCELLED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const order = await prisma.esimOrder.findUnique({
      where: { id: orderId },
      include: { product: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const updated = await prisma.esimOrder.update({
      where: { id: orderId },
      data: { status: status as any },
      include: { product: true },
    });

    logger.info(`eSIM order ${orderId} status updated to ${status}`);
    return updated;
  }

  /**
   * Get all orders (admin)
   */
  async getAllOrders(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.search) {
      where.OR = [
        { id: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
        { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
        { iccid: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const limit = params?.limit || 50;
    const page = params?.page || 1;

    const [orders, total] = await Promise.all([
      prisma.esimOrder.findMany({
        where,
        include: {
          product: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.esimOrder.count({ where }),
    ]);

    return { orders, total };
  }

  /**
   * Check eSIM usage/status
   */
  async checkUsage(orderId: string, userId: string): Promise<{
    dataUsed: string;
    dataRemaining: string;
    daysRemaining: number;
    status: string;
  }> {
    const order = await this.getOrderById(orderId, userId);

    try {
      await this.ensureAuthenticated();

      const response = await this.client.get(`/sims/${order.iccid}/usage`);
      const usage = response.data.data;

      return {
        dataUsed: usage.used || '0 MB',
        dataRemaining: usage.remaining || order.product.dataAmount,
        daysRemaining: usage.days_remaining || order.product.validityDays,
        status: usage.status || 'ACTIVE',
      };
    } catch (error: any) {
      logger.error('Failed to check eSIM usage:', error.message);
      return {
        dataUsed: 'N/A',
        dataRemaining: order.product.dataAmount,
        daysRemaining: order.product.validityDays,
        status: order.status,
      };
    }
  }

  /**
   * Sync products from provider to database
   */
  async syncProducts(): Promise<number> {
    try {
      await this.ensureAuthenticated();

      let page = 1;
      let syncedCount = 0;
      let hasMore = true;

      while (hasMore) {
        const { products, total } = await this.getProducts({ limit: 100, page });

        for (const product of products) {
          await prisma.esimProduct.upsert({
            where: { externalId: product.id },
            update: {
              name: product.name,
              description: product.description,
              countries: product.countries,
              regions: product.regions,
              dataAmount: product.dataAmount,
              validityDays: product.validityDays,
              price: product.price,
              currency: product.currency,
              isActive: true,
            },
            create: {
              externalId: product.id,
              name: product.name,
              description: product.description,
              countries: product.countries,
              regions: product.regions,
              dataAmount: product.dataAmount,
              validityDays: product.validityDays,
              price: product.price,
              currency: product.currency,
              providerName: this.config.provider,
              isActive: true,
            },
          });
          syncedCount++;
        }

        hasMore = products.length === 100 && syncedCount < total;
        page++;
      }

      logger.info(`Synced ${syncedCount} eSIM products from ${this.config.provider}`);
      return syncedCount;
    } catch (error: any) {
      logger.error('Failed to sync eSIM products:', error.message);
      throw new AppError('Failed to sync products', 500);
    }
  }

  /**
   * Get activation instructions
   */
  private getActivationInstructions(): string {
    return `
## How to Activate Your eSIM

### For iPhone (iOS 12.1+):
1. Go to Settings > Cellular/Mobile Data
2. Tap "Add Cellular Plan" or "Add eSIM"
3. Scan the QR code provided
4. Follow the on-screen instructions
5. Once activated, turn on Data Roaming

### For Android:
1. Go to Settings > Network & Internet > Mobile network
2. Tap "Add" or "+" button
3. Select "Scan QR code"
4. Scan the QR code provided
5. Follow the on-screen instructions
6. Enable Data Roaming when traveling

### Manual Activation:
If QR scanning doesn't work, you can manually enter the activation code:
1. Go to eSIM settings on your device
2. Select "Enter Details Manually"
3. Enter the SM-DP+ address and activation code
4. Follow the prompts to complete setup

### Important Notes:
- Keep your original SIM active for calls/SMS unless your eSIM supports it
- Activate your eSIM before traveling or ensure you have Wi-Fi for activation
- Data roaming must be enabled for the eSIM to work abroad
- Contact support if you experience any issues
    `;
  }
}

export const esimService = new EsimService();
