import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorizeAdmin } from '../middleware/authorization.middleware';
import { siteSettingsService } from '../services/site-settings.service';

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// GET /api/settings/public - Get public settings
router.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const [header, footer, branding, general] = await Promise.all([
      siteSettingsService.getHeaderSettings(),
      siteSettingsService.getFooterSettings(),
      siteSettingsService.getBrandingSettings(),
      siteSettingsService.getGeneralSettings(),
    ]);

    res.json({
      success: true,
      data: {
        header,
        footer,
        branding,
        general: {
          siteName: general.siteName,
          siteDescription: general.siteDescription,
          defaultCurrency: general.defaultCurrency,
          timezone: general.timezone,
          maintenanceMode: general.maintenanceMode,
          maintenanceMessage: general.maintenanceMessage,
        },
      },
    });
  })
);

// GET /api/settings/header - Get header settings
router.get(
  '/header',
  asyncHandler(async (_req, res) => {
    const header = await siteSettingsService.getHeaderSettings();

    res.json({
      success: true,
      data: header,
    });
  })
);

// GET /api/settings/footer - Get footer settings
router.get(
  '/footer',
  asyncHandler(async (_req, res) => {
    const footer = await siteSettingsService.getFooterSettings();

    res.json({
      success: true,
      data: footer,
    });
  })
);

// GET /api/settings/branding - Get branding settings
router.get(
  '/branding',
  asyncHandler(async (_req, res) => {
    const branding = await siteSettingsService.getBrandingSettings();

    res.json({
      success: true,
      data: branding,
    });
  })
);

// GET /api/settings/seo - Get SEO settings
router.get(
  '/seo',
  asyncHandler(async (_req, res) => {
    const seo = await siteSettingsService.getSeoSettings();

    res.json({
      success: true,
      data: seo,
    });
  })
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// All admin routes require authentication
router.use(authenticate);
router.use(authorizeAdmin());

// GET /api/settings/all - Get all settings (admin)
router.get(
  '/all',
  asyncHandler(async (_req: AuthRequest, res) => {
    const settings = await siteSettingsService.getAllSettings();

    res.json({
      success: true,
      data: settings,
    });
  })
);

// PUT /api/settings/header - Update header settings
router.put(
  '/header',
  asyncHandler(async (req: AuthRequest, res) => {
    const updated = await siteSettingsService.updateHeaderSettings(req.body, req.user!.id);

    res.json({
      success: true,
      message: 'Header settings updated successfully',
      data: updated,
    });
  })
);

// PUT /api/settings/footer - Update footer settings
router.put(
  '/footer',
  asyncHandler(async (req: AuthRequest, res) => {
    const updated = await siteSettingsService.updateFooterSettings(req.body, req.user!.id);

    res.json({
      success: true,
      message: 'Footer settings updated successfully',
      data: updated,
    });
  })
);

// PUT /api/settings/branding - Update branding settings
router.put(
  '/branding',
  asyncHandler(async (req: AuthRequest, res) => {
    const updated = await siteSettingsService.updateBrandingSettings(req.body, req.user!.id);

    res.json({
      success: true,
      message: 'Branding settings updated successfully',
      data: updated,
    });
  })
);

// PUT /api/settings/seo - Update SEO settings
router.put(
  '/seo',
  asyncHandler(async (req: AuthRequest, res) => {
    const updated = await siteSettingsService.updateSeoSettings(req.body, req.user!.id);

    res.json({
      success: true,
      message: 'SEO settings updated successfully',
      data: updated,
    });
  })
);

// PUT /api/settings/general - Update general settings
router.put(
  '/general',
  asyncHandler(async (req: AuthRequest, res) => {
    const updated = await siteSettingsService.updateGeneralSettings(req.body, req.user!.id);

    res.json({
      success: true,
      message: 'General settings updated successfully',
      data: updated,
    });
  })
);

// POST /api/settings/initialize - Initialize default settings
router.post(
  '/initialize',
  asyncHandler(async (_req: AuthRequest, res) => {
    await siteSettingsService.initializeSettings();

    res.json({
      success: true,
      message: 'Settings initialized successfully',
    });
  })
);

// GET /api/settings/:key - Get specific setting by key
router.get(
  '/:key',
  asyncHandler(async (req: AuthRequest, res) => {
    const setting = await siteSettingsService.getSetting(req.params.key);

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found',
      });
    }

    res.json({
      success: true,
      data: setting,
    });
  })
);

// PUT /api/settings/:key - Update specific setting by key
router.put(
  '/:key',
  asyncHandler(async (req: AuthRequest, res) => {
    const { value, category } = req.body;

    if (!value || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: value, category',
      });
    }

    const setting = await siteSettingsService.setSetting(
      req.params.key,
      value,
      category,
      req.user!.id
    );

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: setting,
    });
  })
);

export default router;
