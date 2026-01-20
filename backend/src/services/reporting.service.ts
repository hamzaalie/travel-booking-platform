import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface RevenueData {
  date: string;
  bookings: number;
  revenue: number;
  refunds: number;
  netRevenue: number;
}

interface AgentPerformance {
  agentId: string;
  agencyName: string;
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  walletBalance: number;
}

/**
 * Reporting Service
 * Handles analytics and report generation
 */
export class ReportingService {
  /**
   * Get revenue analytics for a date range
   */
  async getRevenueAnalytics(dateRange: DateRange): Promise<{
    summary: any;
    dailyData: RevenueData[];
  }> {
    const { startDate, endDate } = dateRange;

    // Get all bookings in date range
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['CONFIRMED', 'TICKETED'] },
      },
      select: {
        id: true,
        totalAmount: true,
        baseFare: true,
        markup: true,
        createdAt: true,
      },
    });

    // Get all refunds in date range
    const refunds = await prisma.refund.findMany({
      where: {
        processedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      select: {
        amount: true,
        processedAt: true,
      },
    });

    // Calculate summary
    const totalRevenue = bookings.reduce(
      (sum: number, b: any) => sum + (b.totalPrice?.toNumber() || 0),
      0
    );
    const totalRefunds = refunds.reduce(
      (sum: number, r: any) => sum + (r.amount?.toNumber() || 0),
      0
    );
    const totalMarkup = bookings.reduce(
      (sum: number, b: any) => sum + (b.markup?.toNumber() || 0),
      0
    );
    const netRevenue = totalRevenue - totalRefunds;

    // Group by date for daily data
    const dailyMap = new Map<string, RevenueData>();

    bookings.forEach((booking: any) => {
      const date = booking.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || {
        date,
        bookings: 0,
        revenue: 0,
        refunds: 0,
        netRevenue: 0,
      };

      existing.bookings += 1;
      existing.revenue += booking.totalAmount?.toNumber() || 0;
      dailyMap.set(date, existing);
    });

    refunds.forEach((refund: any) => {
      const date = refund.processedAt!.toISOString().split('T')[0];
      const existing = dailyMap.get(date);
      if (existing) {
        existing.refunds += refund.amount?.toNumber() || 0;
        existing.netRevenue = existing.revenue - existing.refunds;
      }
    });

    const dailyData = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      summary: {
        totalBookings: bookings.length,
        totalRevenue,
        totalRefunds,
        totalMarkup,
        netRevenue,
        averageBookingValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
      dailyData,
    };
  }

  /**
   * Get agent performance report
   */
  async getAgentPerformanceReport(dateRange: DateRange): Promise<AgentPerformance[]> {
    const { startDate, endDate } = dateRange;

    const agents = await prisma.agent.findMany({
      where: {
        status: 'APPROVED',
      },
      include: {
        wallet: true,
        bookings: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: { in: ['CONFIRMED', 'TICKETED'] },
          },
          select: {
            totalAmount: true,
          },
        },
      },
    });

    return agents.map((agent: any) => {
      const totalRevenue = agent.bookings.reduce(
        (sum: number, b: any) => sum + (b.totalAmount?.toNumber() || 0),
        0
      );
      const totalBookings = agent.bookings.length;

      return {
        agentId: agent.id,
        agencyName: agent.agencyName,
        totalBookings,
        totalRevenue,
        averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
        walletBalance: agent.wallet?.balance?.toNumber() || 0,
      };
    });
  }

  /**
   * Get ledger report (all wallet transactions)
   */
  async getLedgerReport(dateRange: DateRange, agentId?: string): Promise<any[]> {
    const { startDate, endDate } = dateRange;

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (agentId) {
      where.wallet = { agentId };
    }

    const transactions = await prisma.walletTransaction.findMany({
      where,
      include: {
        wallet: {
          include: {
            agent: {
              select: {
                agencyName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return transactions.map((txn: any) => ({
      date: txn.createdAt.toISOString(),
      agencyName: txn.wallet.agent?.agencyName || 'N/A',
      type: txn.type,
      amount: txn.amount.toNumber(),
      balanceBefore: txn.balanceBefore.toNumber(),
      balanceAfter: txn.balanceAfter.toNumber(),
      reason: txn.reason,
      description: txn.description,
      referenceId: txn.referenceId,
    }));
  }

  /**
   * Get booking report with filters
   */
  async getBookingReport(filters: {
    startDate: Date;
    endDate: Date;
    status?: string;
    agentId?: string;
    userId?: string;
  }): Promise<any[]> {
    const where: any = {
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.agentId) {
      where.agentId = filters.agentId;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        agent: {
          select: {
            agencyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((booking: any) => {
      const flightDetails = booking.flightDetails as any;
      return {
        bookingReference: booking.bookingReference,
        pnr: booking.pnr,
        status: booking.status,
        customerName: `${booking.user.firstName} ${booking.user.lastName}`,
        customerEmail: booking.user.email,
        agencyName: booking.agent?.agencyName || 'Direct',
        origin: flightDetails?.origin || 'N/A',
        destination: flightDetails?.destination || 'N/A',
        departureDate: flightDetails?.departureDate || 'N/A',
        basePrice: booking.baseFare?.toNumber() || 0,
        markup: booking.markup?.toNumber() || 0,
        totalPrice: booking.totalAmount?.toNumber() || 0,
        createdAt: booking.createdAt.toISOString(),
      };
    });
  }

  /**
   * Get profit/loss statement
   */
  async getProfitLossReport(dateRange: DateRange): Promise<any> {
    const { startDate, endDate } = dateRange;

    // Revenue from bookings
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ['CONFIRMED', 'TICKETED'] },
      },
      select: {
        baseFare: true,
        markup: true,
        totalAmount: true,
      },
    });

    // Refunds
    const refunds = await prisma.refund.findMany({
      where: {
        processedAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
      select: {
        amount: true,
      },
    });

    const totalMarkup = bookings.reduce((sum: number, b: any) => sum + (b.markup?.toNumber() || 0), 0);
    const totalRefunds = refunds.reduce((sum: number, r: any) => sum + (r.amount?.toNumber() || 0), 0);

    // Calculate gross profit (markup is our profit)
    const grossProfit = totalMarkup;
    
    // Operating expenses (would need to be configured)
    const operatingExpenses = 0; // TODO: Add expense tracking

    const netProfit = grossProfit - operatingExpenses;

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      revenue: {
        totalBookings: bookings.length,
        grossMarkup: totalMarkup,
      },
      expenses: {
        refunds: totalRefunds,
        operating: operatingExpenses,
        total: totalRefunds + operatingExpenses,
      },
      profit: {
        gross: grossProfit,
        net: netProfit,
        margin: bookings.length > 0 ? (netProfit / bookings.reduce((sum: number, b: any) => sum + (b.totalAmount?.toNumber() || 0), 0)) * 100 : 0,
      },
    };
  }

  /**
   * Export report to CSV
   */
  async exportToCSV(data: any[], fields: string[]): Promise<string> {
    try {
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      return csv;
    } catch (error) {
      logger.error('CSV export error:', error);
      throw new AppError('Failed to export CSV', 500);
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDFReport(reportData: {
    title: string;
    summary: any;
    data: any[];
    columns: string[];
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text(reportData.title, { align: 'center' });
        doc.moveDown();

        // Summary section
        if (reportData.summary) {
          doc.fontSize(14).text('Summary', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10);

          Object.entries(reportData.summary).forEach(([key, value]) => {
            if (typeof value === 'object') {
              doc.text(`${this.formatLabel(key)}:`);
              Object.entries(value as any).forEach(([k, v]) => {
                doc.text(`  ${this.formatLabel(k)}: ${this.formatValue(v)}`, {
                  indent: 20,
                });
              });
            } else {
              doc.text(`${this.formatLabel(key)}: ${this.formatValue(value)}`);
            }
          });

          doc.moveDown();
        }

        // Data table
        if (reportData.data.length > 0) {
          doc.fontSize(12).text('Details', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(8);

          // Table header
          const startY = doc.y;
          const colWidth = (doc.page.width - 100) / reportData.columns.length;

          reportData.columns.forEach((col, i) => {
            doc.text(this.formatLabel(col), 50 + i * colWidth, startY, {
              width: colWidth,
              align: 'left',
            });
          });

          doc.moveDown();

          // Table rows (limit to first 50 for PDF)
          reportData.data.slice(0, 50).forEach((row) => {
            const rowY = doc.y;
            reportData.columns.forEach((col, i) => {
              doc.text(
                String(row[col] || 'N/A'),
                50 + i * colWidth,
                rowY,
                {
                  width: colWidth,
                  align: 'left',
                }
              );
            });
            doc.moveDown(0.5);
          });

          if (reportData.data.length > 50) {
            doc.moveDown();
            doc.fontSize(8).text(
              `Showing first 50 of ${reportData.data.length} records. Download CSV for full data.`,
              { align: 'center' }
            );
          }
        }

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(
            `Generated on ${new Date().toLocaleString()} | Page ${i + 1} of ${pageCount}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }

        doc.end();
      } catch (error) {
        logger.error('PDF generation error:', error);
        reject(new AppError('Failed to generate PDF', 500));
      }
    });
  }

  /**
   * Format label for display
   */
  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Format value for display
   */
  private formatValue(value: any): string {
    if (typeof value === 'number') {
      if (value % 1 !== 0) {
        return `$${value.toFixed(2)}`;
      }
      return value.toString();
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  }
}

export const reportingService = new ReportingService();
