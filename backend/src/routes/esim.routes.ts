import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorizeAdmin } from '../middleware/authorization.middleware';
import { esimService } from '../services/esim.service';

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
