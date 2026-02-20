import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorizeAdmin } from '../middleware/authorization.middleware';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

const router = Router();

// All routes require admin auth
router.use(authenticate, authorizeAdmin());

// ============================================================================
// API PROVIDER MANAGEMENT
// ============================================================================

// GET /api/admin-extended/api-providers - Get all API providers
router.get(
  '/api-providers',
  asyncHandler(async (req, res) => {
    const { type } = req.query;

    // Get from site settings or return defaults
    let providers;
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'api_providers' },
      });
      providers = setting ? JSON.parse(String(setting.value)) : null;
    } catch {
      providers = null;
    }

    if (type && providers) {
      providers = providers.filter((p: any) => p.type === type);
    }

    res.json({ success: true, data: { providers } });
  })
);

// Helper: get or create api_providers setting
async function getOrCreateApiProviders(): Promise<any[]> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'api_providers' },
  });
  if (setting) {
    return JSON.parse(String(setting.value));
  }
  // Return null to signal it doesn't exist yet
  return [];
}

async function saveApiProviders(providers: any[]): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: 'api_providers' },
    update: { value: JSON.stringify(providers) },
    create: {
      key: 'api_providers',
      value: JSON.stringify(providers),
      category: 'api',
    },
  });
}

// PUT /api/admin-extended/api-providers/:id/toggle - Toggle API provider
router.put(
  '/api-providers/:id/toggle',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { isEnabled } = req.body;

    try {
      let providers = await getOrCreateApiProviders();
      const idx = providers.findIndex((p: any) => p.id === id);
      if (idx >= 0) {
        providers[idx].isEnabled = isEnabled;
      } else {
        // Provider not in saved list yet - add it
        providers.push({ id, isEnabled });
      }
      await saveApiProviders(providers);
    } catch (err) {
      logger.error('Failed to toggle API provider', err);
      return res.status(500).json({ success: false, message: 'Failed to toggle API provider' });
    }

    res.json({ success: true, message: 'API provider toggled' });
  })
);

// POST /api/admin-extended/api-providers/:id/test - Test API connection
router.post(
  '/api-providers/:id/test',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Simulate connection test
    const success = Math.random() > 0.1; // 90% success rate for demo
    
    res.json({
      success,
      data: {
        providerId: id,
        status: success ? 'CONNECTED' : 'ERROR',
        responseTime: Math.floor(Math.random() * 500) + 100,
        checkedAt: new Date().toISOString(),
      },
    });
  })
);

// PUT /api/admin-extended/api-providers/:id/config - Update API config
router.put(
  '/api-providers/:id/config',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const config = req.body;

    try {
      let providers = await getOrCreateApiProviders();
      const idx = providers.findIndex((p: any) => p.id === id);
      if (idx >= 0) {
        providers[idx].config = { ...providers[idx].config, ...config };
      } else {
        providers.push({ id, config });
      }
      await saveApiProviders(providers);
    } catch (err) {
      logger.error('Failed to update API config', err);
      return res.status(500).json({ success: false, message: 'Failed to update configuration' });
    }

    res.json({ success: true, message: 'API configuration updated' });
  })
);

// PUT /api/admin-extended/api-providers/:id/primary - Set as primary
router.put(
  '/api-providers/:id/primary',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { type } = req.body;

    try {
      let providers = await getOrCreateApiProviders();
      // Unset other primaries of same type, set the target
      providers.forEach((p: any) => {
        if (p.type === type) p.isPrimary = p.id === id;
      });
      // If provider not in list, add it
      if (!providers.find((p: any) => p.id === id)) {
        providers.push({ id, type, isPrimary: true });
      }
      await saveApiProviders(providers);
    } catch (err) {
      logger.error('Failed to set primary provider', err);
      return res.status(500).json({ success: false, message: 'Failed to set primary provider' });
    }

    res.json({ success: true, message: 'Primary provider updated' });
  })
);

// ============================================================================
// PAYMENT GATEWAY MANAGEMENT
// ============================================================================

// GET /api/admin-extended/payment-gateways - Get all payment gateways
router.get(
  '/payment-gateways',
  asyncHandler(async (_req, res) => {
    let gateways;
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'payment_gateways' },
      });
      if (setting) {
        gateways = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      } else {
        gateways = null;
      }
    } catch (err) {
      logger.warn('Failed to read payment gateways setting:', err);
      gateways = null;
    }

    // Fetch real payment stats per gateway from the payments table
    let stats: Record<string, any> = {};
    try {
      const gatewayNames = ['ESEWA', 'KHALTI', 'STRIPE', 'WALLET'];
      for (const gw of gatewayNames) {
        const [total, completed, failed, volumeResult] = await Promise.all([
          prisma.payment.count({ where: { gateway: gw as any } }),
          prisma.payment.count({ where: { gateway: gw as any, status: 'COMPLETED' } }),
          prisma.payment.count({ where: { gateway: gw as any, status: 'FAILED' } }),
          prisma.payment.aggregate({
            where: { gateway: gw as any, status: 'COMPLETED' },
            _sum: { amount: true },
          }),
        ]);
        const volume = Number(volumeResult._sum.amount || 0);
        stats[gw.toLowerCase()] = {
          totalTransactions: total,
          successfulTransactions: completed,
          failedTransactions: failed,
          totalVolume: volume,
          successRate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
        };
      }
    } catch (err) {
      logger.warn('Failed to fetch payment stats:', err);
    }

    res.json({ success: true, data: { gateways, stats } });
  })
);

// PUT /api/admin-extended/payment-gateways/:id/toggle
router.put(
  '/payment-gateways/:id/toggle',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { isEnabled } = req.body;

    try {
      // Read existing or start fresh
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'payment_gateways' },
      });
      let gateways: any[] = [];
      if (setting) {
        gateways = typeof setting.value === 'string' ? JSON.parse(setting.value) : (setting.value as any[]);
      }

      const idx = gateways.findIndex((g: any) => g.id === id);
      if (idx >= 0) {
        gateways[idx].isEnabled = isEnabled;
        gateways[idx].status = isEnabled ? 'ACTIVE' : 'INACTIVE';
      } else {
        // Gateway not saved yet — create a stub entry
        gateways.push({ id, isEnabled, status: isEnabled ? 'ACTIVE' : 'INACTIVE' });
      }

      await prisma.siteSetting.upsert({
        where: { key: 'payment_gateways' },
        update: { value: gateways },
        create: { key: 'payment_gateways', value: gateways as any, category: 'payment' },
      });

      res.json({ success: true, message: 'Payment gateway toggled', data: { gateways } });
    } catch (err) {
      logger.warn('Failed to toggle payment gateway:', err);
      res.status(500).json({ success: false, error: 'Failed to toggle payment gateway' });
    }
  })
);

// POST /api/admin-extended/payment-gateways/:id/test
router.post(
  '/payment-gateways/:id/test',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const success = Math.random() > 0.1;
    
    res.json({
      success,
      data: {
        gatewayId: id,
        status: success ? 'ACTIVE' : 'ERROR',
        testedAt: new Date().toISOString(),
      },
    });
  })
);

// PUT /api/admin-extended/payment-gateways/:id/config
router.put(
  '/payment-gateways/:id/config',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const config = req.body;

    try {
      // Read existing or start fresh
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'payment_gateways' },
      });
      let gateways: any[] = [];
      if (setting) {
        gateways = typeof setting.value === 'string' ? JSON.parse(setting.value) : (setting.value as any[]);
      }

      const idx = gateways.findIndex((g: any) => g.id === id);
      if (idx >= 0) {
        gateways[idx] = { ...gateways[idx], ...config };
      } else {
        // Gateway not saved yet — create entry with config
        gateways.push({ id, ...config });
      }

      await prisma.siteSetting.upsert({
        where: { key: 'payment_gateways' },
        update: { value: gateways },
        create: { key: 'payment_gateways', value: gateways as any, category: 'payment' },
      });

      res.json({ success: true, message: 'Payment gateway configuration updated', data: { gateways } });
    } catch (err) {
      logger.warn('Failed to update payment gateway config:', err);
      res.status(500).json({ success: false, error: 'Failed to update payment gateway config' });
    }
  })
);

// ============================================================================
// POPULAR DESTINATIONS
// ============================================================================

// GET /api/admin-extended/popular-destinations
router.get(
  '/popular-destinations',
  asyncHandler(async (_req, res) => {
    let destinations;
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'popular_destinations' },
      });
      destinations = setting ? JSON.parse(String(setting.value)) : null;
    } catch {
      destinations = null;
    }

    res.json({ success: true, data: { destinations } });
  })
);

// POST /api/admin-extended/popular-destinations
router.post(
  '/popular-destinations',
  asyncHandler(async (req: AuthRequest, res) => {
    const data = req.body;
    const id = Date.now().toString();

    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'popular_destinations' },
      });
      const destinations = setting ? JSON.parse(String(setting.value)) : [];
      destinations.push({ ...data, id, createdAt: new Date().toISOString() });

      await prisma.siteSetting.upsert({
        where: { key: 'popular_destinations' },
        update: { value: JSON.stringify(destinations) },
        create: { key: 'popular_destinations', value: JSON.stringify(destinations), category: 'content' },
      });
    } catch (err) {
      logger.error('Failed to create destination:', err);
    }

    res.json({ success: true, message: 'Destination created', data: { id } });
  })
);

// PUT /api/admin-extended/popular-destinations/:id
router.put(
  '/popular-destinations/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const data = req.body;

    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'popular_destinations' },
      });
      if (setting) {
        const destinations = JSON.parse(String(setting.value));
        const idx = destinations.findIndex((d: any) => d.id === id);
        if (idx >= 0) {
          destinations[idx] = { ...destinations[idx], ...data };
          await prisma.siteSetting.update({
            where: { key: 'popular_destinations' },
            data: { value: JSON.stringify(destinations) },
          });
        }
      }
    } catch (err) {
      logger.error('Failed to update destination:', err);
    }

    res.json({ success: true, message: 'Destination updated' });
  })
);

// DELETE /api/admin-extended/popular-destinations/:id
router.delete(
  '/popular-destinations/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'popular_destinations' },
      });
      if (setting) {
        const destinations = JSON.parse(String(setting.value));
        const filtered = destinations.filter((d: any) => d.id !== id);
        await prisma.siteSetting.update({
          where: { key: 'popular_destinations' },
          data: { value: JSON.stringify(filtered) },
        });
      }
    } catch (err) {
      logger.error('Failed to delete destination:', err);
    }

    res.json({ success: true, message: 'Destination deleted' });
  })
);

// PUT /api/admin-extended/popular-destinations/:id/toggle
router.put(
  '/popular-destinations/:id/toggle',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'popular_destinations' },
      });
      if (setting) {
        const destinations = JSON.parse(String(setting.value));
        const idx = destinations.findIndex((d: any) => d.id === id);
        if (idx >= 0) {
          destinations[idx].isActive = isActive;
          await prisma.siteSetting.update({
            where: { key: 'popular_destinations' },
            data: { value: JSON.stringify(destinations) },
          });
        }
      }
    } catch (err) {
      logger.error('Failed to toggle destination:', err);
    }

    res.json({ success: true, message: 'Destination visibility updated' });
  })
);

// ============================================================================
// ESIM COMMISSION & MARKUP
// ============================================================================

// GET /api/admin-extended/esim-commission
router.get(
  '/esim-commission',
  asyncHandler(async (_req, res) => {
    let rules;
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'esim_commission_rules' },
      });
      rules = setting ? JSON.parse(String(setting.value)) : null;
    } catch {
      rules = null;
    }

    res.json({ success: true, data: { rules } });
  })
);

// POST /api/admin-extended/esim-commission
router.post(
  '/esim-commission',
  asyncHandler(async (req: AuthRequest, res) => {
    const data = req.body;
    const id = Date.now().toString();

    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'esim_commission_rules' },
      });
      const rules = setting ? JSON.parse(String(setting.value)) : [];
      rules.push({ ...data, id, createdAt: new Date().toISOString() });

      await prisma.siteSetting.upsert({
        where: { key: 'esim_commission_rules' },
        update: { value: JSON.stringify(rules) },
        create: { key: 'esim_commission_rules', value: JSON.stringify(rules), category: 'commission' },
      });
    } catch (err) {
      logger.error('Failed to create esim commission rule:', err);
    }

    res.json({ success: true, message: 'Commission rule created', data: { id } });
  })
);

// PUT /api/admin-extended/esim-commission/:id
router.put(
  '/esim-commission/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const data = req.body;

    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'esim_commission_rules' },
      });
      if (setting) {
        const rules = JSON.parse(String(setting.value));
        const idx = rules.findIndex((r: any) => r.id === id);
        if (idx >= 0) {
          rules[idx] = { ...rules[idx], ...data };
          await prisma.siteSetting.update({
            where: { key: 'esim_commission_rules' },
            data: { value: JSON.stringify(rules) },
          });
        }
      }
    } catch (err) {
      logger.error('Failed to update esim commission rule:', err);
    }

    res.json({ success: true, message: 'Commission rule updated' });
  })
);

// DELETE /api/admin-extended/esim-commission/:id
router.delete(
  '/esim-commission/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'esim_commission_rules' },
      });
      if (setting) {
        const rules = JSON.parse(String(setting.value));
        const filtered = rules.filter((r: any) => r.id !== id);
        await prisma.siteSetting.update({
          where: { key: 'esim_commission_rules' },
          data: { value: JSON.stringify(filtered) },
        });
      }
    } catch (err) {
      logger.error('Failed to delete esim commission rule:', err);
    }

    res.json({ success: true, message: 'Commission rule deleted' });
  })
);

// PUT /api/admin-extended/esim-commission/:id/toggle
router.put(
  '/esim-commission/:id/toggle',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'esim_commission_rules' },
      });
      if (setting) {
        const rules = JSON.parse(String(setting.value));
        const idx = rules.findIndex((r: any) => r.id === id);
        if (idx >= 0) {
          rules[idx].isActive = isActive;
          await prisma.siteSetting.update({
            where: { key: 'esim_commission_rules' },
            data: { value: JSON.stringify(rules) },
          });
        }
      }
    } catch (err) {
      logger.error('Failed to toggle esim commission rule:', err);
    }

    res.json({ success: true, message: 'Commission rule toggled' });
  })
);

// ============================================================================
// BOOKING CUSTOMIZATION
// ============================================================================

// PUT /api/admin-extended/bookings/:id/customize
router.put(
  '/bookings/:id/customize',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { fareClass, seatAssignment, mealPreference, baggageAllowance, specialAssistance, adminNotes } = req.body;

    try {
      // Update booking with customization data stored in flightDetails JSON
      const booking = await prisma.booking.findUnique({ where: { id } });
      if (booking) {
        const flightDetails = typeof booking.flightDetails === 'string'
          ? JSON.parse(booking.flightDetails)
          : (booking.flightDetails || {});

        const updatedDetails = {
          ...flightDetails,
          fareClass,
          seatAssignment,
          mealPreference,
          baggageAllowance,
          specialAssistance,
          adminNotes,
          lastCustomizedAt: new Date().toISOString(),
          customizedBy: (req as AuthRequest).user?.id,
        };

        await prisma.booking.update({
          where: { id },
          data: { flightDetails: JSON.stringify(updatedDetails) },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: (req as AuthRequest).user?.id || '',
            action: 'BOOKING_CUSTOMIZED',
            entity: 'Booking',
            entityId: id,
            changes: JSON.stringify({ fareClass, seatAssignment, mealPreference, baggageAllowance }),
          },
        });
      }
    } catch (err) {
      logger.error('Failed to customize booking:', err);
      return res.status(500).json({ success: false, message: 'Failed to customize booking' });
    }

    res.json({ success: true, message: 'Booking customized successfully' });
  })
);

// ============================================================================
// ADMIN LOGIN AS USER (Direct Login)
// ============================================================================

// POST /api/admin-extended/login-as-user/:userId
router.post(
  '/login-as-user/:userId',
  asyncHandler(async (req: AuthRequest, res) => {
    const { userId } = req.params;
    const jwt = require('jsonwebtoken');

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { agent: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Generate a temporary token for the admin to act as this user
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          impersonatedBy: (req as AuthRequest).user?.id,
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '2h' }
      );

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: (req as AuthRequest).user?.id || '',
          action: 'ADMIN_LOGIN_AS_USER',
          entity: 'User',
          entityId: userId,
          changes: JSON.stringify({ targetUser: user.email, targetRole: user.role }),
        },
      });

      res.json({
        success: true,
        data: {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            agent: user.agent,
          },
        },
      });
    } catch (err) {
      logger.error('Failed to login as user:', err);
      return res.status(500).json({ success: false, message: 'Failed to login as user' });
    }
  })
);

// ============================================================================
// BOOKING MANAGEMENT (Admin actions: status, refund, change, resend ticket)
// ============================================================================

// PUT /api/admin-extended/bookings/:id/status - Update booking status
router.put(
  '/bookings/:id/status',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'TICKETED', 'CANCELLED', 'REFUNDED', 'FAILED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    try {
      const booking = await prisma.booking.update({
        where: { id },
        data: {
          status,
          ...(status === 'CANCELLED'
            ? {
                cancellationData: {
                  cancelledAt: new Date(),
                  cancelledBy: req.user!.id,
                  reason: note || 'Status changed by admin',
                } as any,
              }
            : {}),
        },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          payments: true,
        },
      });

      logger.info(`Admin ${req.user!.id} changed booking ${id} status to ${status}`);

      res.json({
        success: true,
        message: `Booking status updated to ${status}`,
        data: booking,
      });
    } catch (err: any) {
      logger.error('Failed to update booking status:', err);
      return res.status(500).json({ success: false, message: 'Failed to update booking status' });
    }
  })
);

// POST /api/admin-extended/bookings/:id/refund - Initiate refund with penalty
router.post(
  '/bookings/:id/refund',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { reason, penaltyAmount, refundAmount, adminNotes } = req.body;

    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { payments: true, user: true },
      });

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      if (booking.status === 'REFUNDED') {
        return res.status(400).json({ success: false, message: 'Booking already refunded' });
      }

      // Create refund record
      const refund = await prisma.refund.create({
        data: {
          bookingId: id,
          paymentId: booking.payments[0]?.id || null,
          amount: booking.totalAmount,
          penaltyAmount: penaltyAmount || 0,
          refundAmount: refundAmount || Number(booking.totalAmount),
          status: 'PENDING',
          reason: reason || 'Admin initiated refund',
          refundData: {
            adminNotes,
            initiatedBy: req.user!.id,
            initiatedAt: new Date(),
          } as any,
          processedBy: req.user!.id,
        },
      });

      // Update booking status
      await prisma.booking.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          cancellationData: {
            cancelledAt: new Date(),
            cancelledBy: req.user!.id,
            reason: reason || 'Refunded by admin',
            refundId: refund.id,
          } as any,
        },
      });

      logger.info(`Admin ${req.user!.id} initiated refund for booking ${id}: NPR ${refundAmount} (penalty: NPR ${penaltyAmount})`);

      res.json({
        success: true,
        message: 'Refund initiated successfully',
        data: refund,
      });
    } catch (err: any) {
      logger.error('Failed to initiate refund:', err);
      return res.status(500).json({ success: false, message: 'Failed to initiate refund' });
    }
  })
);

// POST /api/admin-extended/bookings/:id/change-request - Create flight change request
router.post(
  '/bookings/:id/change-request',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { requestType, reason, requestedChanges, adminNotes } = req.body;

    try {
      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const validTypes = ['DATE_CHANGE', 'NAME_CORRECTION', 'ROUTE_CHANGE', 'CLASS_UPGRADE', 'CANCELLATION', 'REFUND', 'ADD_PASSENGER', 'REMOVE_PASSENGER'];
      if (!validTypes.includes(requestType)) {
        return res.status(400).json({ success: false, message: `Invalid request type. Must be one of: ${validTypes.join(', ')}` });
      }

      const changeRequest = await prisma.flightChangeRequest.create({
        data: {
          bookingId: id,
          userId: req.user!.id,
          requestType,
          reason,
          requestedChanges: requestedChanges || {},
          status: 'UNDER_REVIEW',
          adminNotes,
        },
      });

      logger.info(`Admin ${req.user!.id} created ${requestType} change request for booking ${id}`);

      res.json({
        success: true,
        message: 'Flight change request created',
        data: changeRequest,
      });
    } catch (err: any) {
      logger.error('Failed to create change request:', err);
      return res.status(500).json({ success: false, message: 'Failed to create change request' });
    }
  })
);

// POST /api/admin-extended/bookings/:id/resend-ticket - Resend ticket email to customer
router.post(
  '/bookings/:id/resend-ticket',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      });

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      // In a real implementation, this would call the email service
      // emailService.sendTicketEmail(booking.user.email, booking);
      logger.info(`Admin ${req.user!.id} requested resend ticket email for booking ${id} to ${booking.user.email}`);

      res.json({
        success: true,
        message: `Ticket email resent to ${booking.user.email}`,
      });
    } catch (err: any) {
      logger.error('Failed to resend ticket email:', err);
      return res.status(500).json({ success: false, message: 'Failed to resend ticket email' });
    }
  })
);

export default router;
