import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorizePermission, authorizeAdmin } from '../middleware/authorization.middleware';
import { Permission } from '../middleware/permissions';
import { adminService } from '../services/admin.service';
import { walletService } from '../services/wallet.service';
import { pricingService } from '../services/pricing.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/admin/dashboard
// Accessible by all admin roles
router.get(
  '/dashboard',
  authorizeAdmin(),
  asyncHandler(async (_req, res) => {
    const stats = await adminService.getDashboardStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

// GET /api/admin/agents/pending
// Only Super Admin can view pending agents
router.get(
  '/agents/pending',
  authorizePermission(Permission.APPROVE_AGENTS),
  asyncHandler(async (_req, res) => {
    const agents = await adminService.getPendingAgents();

    res.json({
      success: true,
      data: agents,
    });
  })
);

// POST /api/admin/agents/:id/approve
// Only Super Admin can approve agents
router.post(
  '/agents/:id/approve',
  authorizePermission(Permission.APPROVE_AGENTS),
  asyncHandler(async (req: AuthRequest, res) => {
    const agent = await adminService.approveAgent(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Agent approved successfully',
      data: agent,
    });
  })
);

// POST /api/admin/agents/:id/reject
// Only Super Admin can reject agents
router.post(
  '/agents/:id/reject',
  authorizePermission(Permission.APPROVE_AGENTS),
  asyncHandler(async (req: AuthRequest, res) => {
    const agent = await adminService.rejectAgent(
      req.params.id,
      req.user!.id,
      req.body.reason
    );

    res.json({
      success: true,
      message: 'Agent rejected successfully',
      data: agent,
    });
  })
);

// GET /api/admin/agents
// All admin roles can view agents
router.get(
  '/agents',
  authorizePermission(Permission.VIEW_ALL_AGENTS),
  asyncHandler(async (req, res) => {
    const agents = await adminService.getAllAgents({
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    });

    res.json({
      success: true,
      data: agents,
    });
  })
);

// GET /api/admin/bookings
// Finance Admin and Operations Team can view all bookings
router.get(
  '/bookings',
  authorizePermission(Permission.VIEW_ALL_BOOKINGS),
  asyncHandler(async (req, res) => {
    const bookings = await adminService.getAllBookings({
      status: req.query.status as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });

    res.json({
      success: true,
      data: bookings,
    });
  })
);

// GET /api/admin/fund-requests
// Finance Admin can view and manage fund requests
router.get(
  '/fund-requests',
  authorizePermission(Permission.APPROVE_FUND_REQUESTS, Permission.VIEW_FINANCIAL_REPORTS),
  asyncHandler(async (req, res) => {
    const requests = await adminService.getFundRequests(req.query.status as string | undefined);

    res.json({
      success: true,
      data: requests,
    });
  })
);

// POST /api/admin/fund-requests/:id/approve
// Finance Admin and Super Admin can approve
router.post(
  '/fund-requests/:id/approve',
  authorizePermission(Permission.APPROVE_FUND_REQUESTS),
  asyncHandler(async (req: AuthRequest, res) => {
    const request = await adminService.approveFundRequest(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Fund request approved successfully',
      data: request,
    });
  })
);

// POST /api/admin/fund-requests/:id/reject
// Finance Admin and Super Admin can reject
router.post(
  '/fund-requests/:id/reject',
  authorizePermission(Permission.APPROVE_FUND_REQUESTS),
  asyncHandler(async (req: AuthRequest, res) => {
    const request = await adminService.rejectFundRequest(
      req.params.id,
      req.user!.id,
      req.body.reason
    );

    res.json({
      success: true,
      message: 'Fund request rejected successfully',
      data: request,
    });
  })
);

// POST /api/admin/wallet/:id/freeze
// Only Finance Admin and Super Admin
router.post(
  '/wallet/:id/freeze',
  authorizePermission(Permission.MANAGE_WALLETS),
  asyncHandler(async (req: AuthRequest, res) => {
    const wallet = await walletService.freezeWallet(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Wallet frozen successfully',
      data: wallet,
    });
  })
);

// POST /api/admin/wallet/:id/unfreeze
// Only Finance Admin and Super Admin
router.post(
  '/wallet/:id/unfreeze',
  authorizePermission(Permission.MANAGE_WALLETS),
  asyncHandler(async (req: AuthRequest, res) => {
    const wallet = await walletService.unfreezeWallet(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Wallet unfrozen successfully',
      data: wallet,
    });
  })
);

// GET /api/admin/markups
// All admin roles can view markups
router.get(
  '/markups',
  authorizeAdmin(),
  asyncHandler(async (req, res) => {
    const markups = await pricingService.getMarkups({
      isGlobal: req.query.isGlobal === 'true' ? true : undefined,
    });

    res.json({
      success: true,
      data: markups,
    });
  })
);

// POST /api/admin/markups
// Only Super Admin can create global markups
router.post(
  '/markups',
  authorizePermission(Permission.MANAGE_GLOBAL_MARKUPS),
  asyncHandler(async (req, res) => {
    const markup = await pricingService.createMarkup(req.body);

    res.status(201).json({
      success: true,
      message: 'Markup created successfully',
      data: markup,
    });
  })
);

// PUT /api/admin/markups/:id
// Only Super Admin can update markups
router.put(
  '/markups/:id',
  authorizePermission(Permission.MANAGE_GLOBAL_MARKUPS),
  asyncHandler(async (req, res) => {
    const markup = await pricingService.updateMarkup(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Markup updated successfully',
      data: markup,
    });
  })
);

// DELETE /api/admin/markups/:id
// Only Super Admin can delete markups
router.delete(
  '/markups/:id',
  authorizePermission(Permission.MANAGE_GLOBAL_MARKUPS),
  asyncHandler(async (req, res) => {
    await pricingService.deleteMarkup(req.params.id);

    res.json({
      success: true,
      message: 'Markup deleted successfully',
    });
  })
);

// ============================================================================
// USER MANAGEMENT ROUTES (Super Admin Only)
// ============================================================================

// GET /api/admin/users
// Get all users with filtering
router.get(
  '/users',
  authorizePermission(Permission.MANAGE_USERS),
  asyncHandler(async (req, res) => {
    const result = await adminService.getAllUsers({
      role: req.query.role as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// PUT /api/admin/users/:id/role
// Update user role
router.put(
  '/users/:id/role',
  authorizePermission(Permission.UPDATE_USER_ROLES),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await adminService.updateUserRole(
      req.params.id,
      req.body.role,
      req.user!.id
    );

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  })
);

// PUT /api/admin/users/:id/toggle-status
// Activate/deactivate user
router.put(
  '/users/:id/toggle-status',
  authorizePermission(Permission.MANAGE_USERS),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await adminService.toggleUserStatus(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  })
);

// ============================================================================
// AGENT MARKUP & DISCOUNT MANAGEMENT ROUTES
// ============================================================================

// GET /api/admin/agents/:id/details
// Get agent details with documents
router.get(
  '/agents/:id/details',
  authorizePermission(Permission.VIEW_ALL_AGENTS),
  asyncHandler(async (req, res) => {
    const agent = await adminService.getAgentDetails(req.params.id);

    res.json({
      success: true,
      data: agent,
    });
  })
);

// GET /api/admin/agents/:id/documents
// Get agent documents
router.get(
  '/agents/:id/documents',
  authorizePermission(Permission.VIEW_ALL_AGENTS),
  asyncHandler(async (req, res) => {
    const documents = await adminService.getAgentDocuments(req.params.id);

    res.json({
      success: true,
      data: documents,
    });
  })
);

// POST /api/admin/documents/:id/verify
// Verify or reject agent document
router.post(
  '/documents/:id/verify',
  authorizePermission(Permission.APPROVE_AGENTS),
  asyncHandler(async (req: AuthRequest, res) => {
    const { action, rejectionReason } = req.body;

    if (!action || !['VERIFIED', 'REJECTED'].includes(action)) {
      res.status(400).json({
        success: false,
        error: 'Invalid action. Must be VERIFIED or REJECTED',
      });
      return;
    }

    const document = await adminService.verifyAgentDocument(
      req.params.id,
      req.user!.id,
      action,
      rejectionReason
    );

    res.json({
      success: true,
      message: `Document ${action.toLowerCase()} successfully`,
      data: document,
    });
  })
);

// GET /api/admin/agents/markup-settings
// Get all agents with markup settings
router.get(
  '/agents/markup-settings',
  authorizePermission(Permission.VIEW_ALL_AGENTS),
  asyncHandler(async (req, res) => {
    const agents = await adminService.getAgentsWithMarkupSettings({
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    });

    res.json({
      success: true,
      data: agents,
    });
  })
);

// PUT /api/admin/agents/:id/markup-settings
// Update agent markup and discount settings
router.put(
  '/agents/:id/markup-settings',
  authorizePermission(Permission.MANAGE_GLOBAL_MARKUPS),
  asyncHandler(async (req: AuthRequest, res) => {
    const {
      markupType,
      markupValue,
      discountType,
      discountValue,
      commissionType,
      commissionValue,
      creditLimit,
    } = req.body;

    const agent = await adminService.updateAgentMarkupSettings(
      req.params.id,
      req.user!.id,
      {
        markupType,
        markupValue: markupValue !== undefined ? parseFloat(markupValue) : undefined,
        discountType,
        discountValue: discountValue !== undefined ? parseFloat(discountValue) : undefined,
        commissionType,
        commissionValue: commissionValue !== undefined ? parseFloat(commissionValue) : undefined,
        creditLimit: creditLimit !== undefined ? parseFloat(creditLimit) : undefined,
      }
    );

    res.json({
      success: true,
      message: 'Agent markup settings updated successfully',
      data: agent,
    });
  })
);

// POST /api/admin/agents/bulk-markup-settings
// Bulk update markup settings for multiple agents
router.post(
  '/agents/bulk-markup-settings',
  authorizePermission(Permission.MANAGE_GLOBAL_MARKUPS),
  asyncHandler(async (req: AuthRequest, res) => {
    const { agentIds, markupType, markupValue, discountType, discountValue } = req.body;

    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'agentIds must be a non-empty array',
      });
      return;
    }

    const result = await adminService.bulkUpdateAgentMarkupSettings(
      agentIds,
      req.user!.id,
      {
        markupType,
        markupValue: markupValue !== undefined ? parseFloat(markupValue) : undefined,
        discountType,
        discountValue: discountValue !== undefined ? parseFloat(discountValue) : undefined,
      }
    );

    res.json({
      success: true,
      message: `Markup settings updated for ${result.updatedCount} agents`,
      data: result,
    });
  })
);

export default router;
