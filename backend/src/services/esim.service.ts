import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error.middleware';
import axios, { AxiosInstance } from 'axios';

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

// Default eSIM configuration
const defaultConfig: EsimConfig = {
  provider: 'airalo',
  apiKey: process.env.ESIM_API_KEY || '',
  apiSecret: process.env.ESIM_API_SECRET || '',
  baseUrl: process.env.ESIM_API_URL || 'https://sandbox-partners-api.airalo.com/v2',
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
        const response = await this.client.post('/token', {
          client_id: this.config.apiKey,
          client_secret: this.config.apiSecret,
          grant_type: 'client_credentials',
        });

        this.accessToken = response.data.data.access_token;
        // Token valid for 1 hour, refresh 5 minutes before expiry
        this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
        logger.info('eSIM API authenticated successfully');
      }
    } catch (error: any) {
      logger.error('eSIM authentication failed:', error.message);
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
   */
  async getProducts(params?: {
    country?: string;
    region?: string;
    limit?: number;
    page?: number;
  }): Promise<{ products: EsimProduct[]; total: number }> {
    try {
      await this.ensureAuthenticated();

      // Fetch from provider API
      const response = await this.client.get('/packages', {
        params: {
          filter: params?.country ? { type: params.country } : undefined,
          limit: params?.limit || 50,
          page: params?.page || 1,
        },
      });

      const products = response.data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        countries: item.coverage,
        regions: item.regions || [],
        dataAmount: item.data || item.data_amount,
        validityDays: item.validity || item.day,
        price: item.price,
        currency: item.currency || 'USD',
      }));

      return {
        products,
        total: response.data.meta?.total || products.length,
      };
    } catch (error: any) {
      logger.error('Failed to fetch eSIM products:', error.message);
      
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
   * Get product details by ID
   */
  async getProductById(productId: string): Promise<EsimProduct | null> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.get(`/packages/${productId}`);
      const item = response.data.data;

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        countries: item.coverage,
        regions: item.regions || [],
        dataAmount: item.data || item.data_amount,
        validityDays: item.validity || item.day,
        price: item.price,
        currency: item.currency || 'USD',
      };
    } catch (error: any) {
      logger.error('Failed to fetch eSIM product:', error.message);
      
      // Try from database
      const cached = await prisma.esimProduct.findUnique({
        where: { externalId: productId },
      });

      if (cached) {
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
    }
  }

  /**
   * Get countries/destinations with eSIM coverage
   */
  async getDestinations(): Promise<Array<{ code: string; name: string; flag: string }>> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.get('/countries');
      return response.data.data.map((item: any) => ({
        code: item.country_code,
        name: item.title || item.name,
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
    try {
      await this.ensureAuthenticated();

      // Get product details
      const product = await this.getProductById(productId);
      if (!product) {
        throw new AppError('eSIM product not found', 404);
      }

      // Place order with provider
      const response = await this.client.post('/orders', {
        package_id: productId,
        quantity,
        type: 'sim', // or 'esim' depending on provider
        description: `eSIM Order for ${product.name}`,
      });

      const orderData = response.data.data;

      // Create order in database
      const dbProduct = await prisma.esimProduct.upsert({
        where: { externalId: productId },
        update: {},
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
          status: 'PROCESSING',
          externalOrderId: orderData.id,
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
        status: 'PROCESSING',
      };
    } catch (error: any) {
      logger.error('Failed to purchase eSIM:', error.message);
      throw new AppError(error.message || 'Failed to purchase eSIM', 500);
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
  async getAllOrders(params?: { status?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (params?.status) {
      where.status = params.status;
    }

    const limit = params?.limit || 50;
    const page = params?.page || 1;

    const [orders, total] = await Promise.all([
      prisma.esimOrder.findMany({
        where,
        include: { product: true },
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
