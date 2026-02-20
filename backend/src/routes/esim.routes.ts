import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorizeAdmin } from '../middleware/authorization.middleware';
import { esimService } from '../services/esim.service';
import { logger } from '../config/logger';

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// GET /api/esim/products - Get available eSIM products
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { country, region, limit, page } = req.query;

    const result = await esimService.getProducts({
      country: country as string,
      region: region as string,
      limit: limit ? parseInt(limit as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// GET /api/esim/products/:id - Get eSIM product details
router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await esimService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  })
);

// GET /api/esim/destinations - Get available destinations
router.get(
  '/destinations',
  asyncHandler(async (_req, res) => {
    const destinations = await esimService.getDestinations();

    res.json({
      success: true,
      data: destinations,
    });
  })
);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

// POST /api/esim/purchase - Purchase an eSIM
router.post(
  '/purchase',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required',
      });
    }

    try {
      const result = await esimService.purchaseEsim(
        req.user!.id,
        productId,
        quantity || 1
      );

      res.json({
        success: true,
        message: 'eSIM purchased successfully',
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      logger.error(`eSIM purchase route error: ${error.message}`, { statusCode, productId });
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to purchase eSIM',
      });
    }
  })
);

// GET /api/esim/orders - Get user's eSIM orders
router.get(
  '/orders',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const orders = await esimService.getUserOrders(req.user!.id);

    res.json({
      success: true,
      data: orders,
    });
  })
);

// GET /api/esim/orders/:id - Get eSIM order details
router.get(
  '/orders/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const order = await esimService.getOrderById(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: order,
    });
  })
);

// GET /api/esim/orders/:id/usage - Check eSIM usage
router.get(
  '/orders/:id/usage',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const usage = await esimService.checkUsage(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: usage,
    });
  })
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// GET /api/esim/orders/:id/topup-packages - Get available top-up packages for an eSIM
router.get(
  '/orders/:id/topup-packages',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await esimService.getTopUpPackages(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

// POST /api/esim/orders/:id/topup - Apply a top-up to an existing eSIM
router.post(
  '/orders/:id/topup',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        error: 'Package ID is required',
      });
    }

    try {
      const result = await esimService.applyTopUp(
        req.params.id,
        req.user!.id,
        packageId
      );

      res.json({
        success: true,
        message: 'eSIM topped up successfully',
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      logger.error(`eSIM top-up route error: ${error.message}`, { statusCode, orderId: req.params.id });
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to apply top-up',
      });
    }
  })
);

// GET /api/esim/orders/:id/topup-history - Get top-up history for an eSIM
router.get(
  '/orders/:id/topup-history',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const history = await esimService.getTopUpHistory(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: history,
    });
  })
);

// ============================================================================
// ADMIN ROUTES (below)
// ============================================================================

// GET /api/esim/admin/orders - Get all eSIM orders (admin)
router.get(
  '/admin/orders',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const { status, page, limit, search } = req.query;

    const result = await esimService.getAllOrders({
      status: status as string,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// PUT /api/esim/admin/orders/:orderId/status - Update order status (admin)
router.put(
  '/admin/orders/:orderId/status',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const order = await esimService.updateOrderStatus(orderId, status);

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  })
);

// POST /api/esim/admin/sync - Sync products from provider
router.post(
  '/admin/sync',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (_req: AuthRequest, res) => {
    const count = await esimService.syncProducts();

    res.json({
      success: true,
      message: `Synced ${count} products from provider`,
      data: { syncedCount: count },
    });
  })
);

export default router;
