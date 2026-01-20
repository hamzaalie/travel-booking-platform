import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorization.middleware';
import { Permission } from '../middleware/permissions';
import { reportingService } from '../services/reporting.service';
import { AppError } from '../middleware/error.middleware';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

/**
 * @route   GET /api/reports/revenue
 * @desc    Get revenue analytics
 * @access  Super Admin and Finance Admin
 */
router.get(
  '/revenue',
  authenticate,
  authorizePermission(Permission.VIEW_REVENUE_ANALYTICS),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', 400);
      }

      const dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const analytics = await reportingService.getRevenueAnalytics(dateRange);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/reports/agents
 * @desc    Get agent performance report
 * @access  Super Admin and Finance Admin
 */
router.get(
  '/agents',
  authenticate,
  authorizePermission(Permission.VIEW_AGENT_PERFORMANCE),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', 400);
      }

      const dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const report = await reportingService.getAgentPerformanceReport(dateRange);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/reports/ledger
 * @desc    Get ledger report (wallet transactions)
 * @access  Super Admin and Finance Admin
 */
router.get(
  '/ledger',
  authenticate,
  authorizePermission(Permission.VIEW_FINANCIAL_REPORTS),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { startDate, endDate, agentId } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', 400);
      }

      const dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const report = await reportingService.getLedgerReport(
        dateRange,
        agentId as string | undefined
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/reports/bookings
 * @desc    Get detailed booking report
 * @access  Admin roles (including Operations Team)
 */
router.get(
  '/bookings',
  authenticate,
  authorizePermission(Permission.VIEW_ALL_BOOKINGS, Permission.GENERATE_REPORTS),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { startDate, endDate, status, agentId, userId } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', 400);
      }

      const filters = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        status: status as string | undefined,
        agentId: agentId as string | undefined,
        userId: userId as string | undefined,
      };

      const report = await reportingService.getBookingReport(filters);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/reports/profit-loss
 * @desc    Get profit & loss statement
 * @access  Super Admin and Finance Admin only
 */
router.get(
  '/profit-loss',
  authenticate,
  authorizePermission(Permission.VIEW_REVENUE_ANALYTICS),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', 400);
      }

      const dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const report = await reportingService.getProfitLossReport(dateRange);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/reports/export/csv
 * @desc    Export report to CSV
 * @access  Admin roles with export permission
 */
router.get(
  '/export/csv',
  authenticate,
  authorizePermission(Permission.EXPORT_REPORTS),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { reportType, startDate, endDate, agentId } = req.query;

      if (!reportType || !startDate || !endDate) {
        throw new AppError('Report type, start date, and end date are required', 400);
      }

      const dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      let data: any[] = [];
      let fields: string[] = [];
      let filename = '';

      switch (reportType) {
        case 'revenue':
          const revenueData = await reportingService.getRevenueAnalytics(dateRange);
          data = revenueData.dailyData;
          fields = ['date', 'bookings', 'revenue', 'refunds', 'netRevenue'];
          filename = 'revenue-report.csv';
          break;

        case 'agents':
          data = await reportingService.getAgentPerformanceReport(dateRange);
          fields = [
            'agencyName',
            'totalBookings',
            'totalRevenue',
            'averageBookingValue',
            'walletBalance',
          ];
          filename = 'agent-performance.csv';
          break;

        case 'ledger':
          data = await reportingService.getLedgerReport(dateRange, agentId as string);
          fields = [
            'date',
            'agencyName',
            'type',
            'amount',
            'balanceBefore',
            'balanceAfter',
            'reason',
            'description',
          ];
          filename = 'ledger-report.csv';
          break;

        case 'bookings':
          data = await reportingService.getBookingReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          });
          fields = [
            'bookingReference',
            'pnr',
            'status',
            'customerName',
            'customerEmail',
            'agencyName',
            'origin',
            'destination',
            'departureDate',
            'basePrice',
            'markup',
            'totalPrice',
            'createdAt',
          ];
          filename = 'booking-report.csv';
          break;

        default:
          throw new AppError('Invalid report type', 400);
      }

      const csv = await reportingService.exportToCSV(data, fields);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/reports/export/pdf
 * @desc    Export report to PDF
 * @access  Admin roles with export permission
 */
router.get(
  '/export/pdf',
  authenticate,
  authorizePermission(Permission.EXPORT_REPORTS),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { reportType, startDate, endDate } = req.query;

      if (!reportType || !startDate || !endDate) {
        throw new AppError('Report type, start date, and end date are required', 400);
      }

      const dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      let reportData: any = {};

      switch (reportType) {
        case 'revenue':
          const revenueAnalytics = await reportingService.getRevenueAnalytics(dateRange);
          reportData = {
            title: 'Revenue Analytics Report',
            summary: revenueAnalytics.summary,
            data: revenueAnalytics.dailyData,
            columns: ['date', 'bookings', 'revenue', 'refunds', 'netRevenue'],
          };
          break;

        case 'agents':
          const agentData = await reportingService.getAgentPerformanceReport(dateRange);
          reportData = {
            title: 'Agent Performance Report',
            summary: {
              totalAgents: agentData.length,
              totalBookings: agentData.reduce((sum, a) => sum + a.totalBookings, 0),
              totalRevenue: agentData.reduce((sum, a) => sum + a.totalRevenue, 0),
            },
            data: agentData,
            columns: ['agencyName', 'totalBookings', 'totalRevenue', 'averageBookingValue'],
          };
          break;

        case 'profit-loss':
          const plData = await reportingService.getProfitLossReport(dateRange);
          reportData = {
            title: 'Profit & Loss Statement',
            summary: plData,
            data: [],
            columns: [],
          };
          break;

        default:
          throw new AppError('Invalid report type', 400);
      }

      const pdfBuffer = await reportingService.generatePDFReport(reportData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
