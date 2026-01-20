# Advanced Reporting & Analytics System

## Overview

Comprehensive reporting system providing business intelligence, financial analytics, and data export capabilities (CSV/PDF) for the Travel Booking Platform.

## Features

### 1. Revenue Analytics
- Daily revenue breakdown
- Total bookings and revenue
- Refund tracking
- Net revenue calculation
- Average booking value
- Period comparison

### 2. Agent Performance Reports
- Individual agent statistics
- Total bookings per agent
- Revenue generated
- Average booking value
- Current wallet balance
- Performance ranking

### 3. Ledger Reports
- Complete wallet transaction history
- Credit/debit breakdown
- Running balance tracking
- Transaction reasons
- Agent-specific or system-wide
- Audit trail for financial reconciliation

### 4. Booking Reports
- Detailed booking data
- Flight route information
- Customer details
- Pricing breakdown (base + markup)
- Status tracking
- Date range filtering
- Agent/customer filtering

### 5. Profit & Loss Statement
- Gross markup (profit)
- Total refunds (loss)
- Operating expenses (configurable)
- Net profit calculation
- Profit margin percentage
- Period comparison

### 6. Export Capabilities
- **CSV Export**: Full data export for Excel/Google Sheets
- **PDF Export**: Professional formatted reports with summaries
- Multiple report types supported
- Configurable columns
- Batch exports

## API Endpoints

### Get Revenue Analytics
```http
GET /api/reports/revenue?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "summary": {
      "totalBookings": 150,
      "totalRevenue": 75000.00,
      "totalRefunds": 5000.00,
      "totalMarkup": 7500.00,
      "netRevenue": 70000.00,
      "averageBookingValue": 500.00,
      "period": {
        "startDate": "2026-01-01T00:00:00Z",
        "endDate": "2026-01-31T23:59:59Z"
      }
    },
    "dailyData": [
      {
        "date": "2026-01-01",
        "bookings": 5,
        "revenue": 2500.00,
        "refunds": 0,
        "netRevenue": 2500.00
      },
      ...
    ]
  }
}
```

### Get Agent Performance
```http
GET /api/reports/agents?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": [
    {
      "agentId": "agent-123",
      "agencyName": "Travel Pro Agency",
      "totalBookings": 45,
      "totalRevenue": 22500.00,
      "averageBookingValue": 500.00,
      "walletBalance": 5000.00
    },
    ...
  ]
}
```

### Get Ledger Report
```http
GET /api/reports/ledger?startDate=2026-01-01&endDate=2026-01-31&agentId=agent-123
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": [
    {
      "date": "2026-01-05T10:30:00Z",
      "agencyName": "Travel Pro Agency",
      "type": "CREDIT",
      "amount": 5000.00,
      "balanceBefore": 10000.00,
      "balanceAfter": 15000.00,
      "reason": "FUND_LOAD",
      "description": "Fund load request approved",
      "referenceId": "fund-req-456"
    },
    ...
  ]
}
```

### Get Booking Report
```http
GET /api/reports/bookings?startDate=2026-01-01&endDate=2026-01-31&status=CONFIRMED
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": [
    {
      "bookingReference": "TB123456",
      "pnr": "ABC123",
      "status": "CONFIRMED",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "agencyName": "Travel Pro Agency",
      "origin": "JFK",
      "destination": "LAX",
      "departureDate": "2026-02-15",
      "basePrice": 450.00,
      "markup": 50.00,
      "totalPrice": 500.00,
      "createdAt": "2026-01-10T14:30:00Z"
    },
    ...
  ]
}
```

### Get Profit & Loss
```http
GET /api/reports/profit-loss?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-01-01T00:00:00Z",
      "endDate": "2026-01-31T23:59:59Z"
    },
    "revenue": {
      "totalBookings": 150,
      "grossMarkup": 7500.00
    },
    "expenses": {
      "refunds": 500.00,
      "operating": 0,
      "total": 500.00
    },
    "profit": {
      "gross": 7500.00,
      "net": 7000.00,
      "margin": 9.33
    }
  }
}
```

### Export to CSV
```http
GET /api/reports/export/csv?reportType=revenue&startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <admin_token>

Response: CSV file download
Content-Type: text/csv
Content-Disposition: attachment; filename="revenue-report.csv"

date,bookings,revenue,refunds,netRevenue
2026-01-01,5,2500.00,0,2500.00
2026-01-02,8,4000.00,0,4000.00
...
```

Supported report types:
- `revenue` - Daily revenue data
- `agents` - Agent performance
- `ledger` - Wallet transactions
- `bookings` - Booking details

### Export to PDF
```http
GET /api/reports/export/pdf?reportType=revenue&startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <admin_token>

Response: PDF file download
Content-Type: application/pdf
Content-Disposition: attachment; filename="revenue-report.pdf"
```

Supported report types:
- `revenue` - Revenue analytics with charts
- `agents` - Agent performance summary
- `profit-loss` - P&L statement

## Usage Examples

### Generate Monthly Revenue Report

```typescript
// Get analytics
const response = await fetch(
  '/api/reports/revenue?startDate=2026-01-01&endDate=2026-01-31',
  {
    headers: { Authorization: `Bearer ${adminToken}` }
  }
);
const { data } = await response.json();

console.log('Total Revenue:', data.summary.totalRevenue);
console.log('Total Bookings:', data.summary.totalBookings);
console.log('Net Revenue:', data.summary.netRevenue);

// Export to CSV
window.location.href = `/api/reports/export/csv?reportType=revenue&startDate=2026-01-01&endDate=2026-01-31&token=${adminToken}`;
```

### Generate Agent Performance Report

```typescript
const response = await fetch(
  '/api/reports/agents?startDate=2026-01-01&endDate=2026-01-31',
  {
    headers: { Authorization: `Bearer ${adminToken}` }
  }
);
const { data } = await response.json();

// Top performing agents
const topAgents = data
  .sort((a, b) => b.totalRevenue - a.totalRevenue)
  .slice(0, 10);

topAgents.forEach((agent, index) => {
  console.log(`${index + 1}. ${agent.agencyName}: $${agent.totalRevenue}`);
});
```

### Generate Ledger Report for Specific Agent

```typescript
const response = await fetch(
  `/api/reports/ledger?startDate=2026-01-01&endDate=2026-01-31&agentId=${agentId}`,
  {
    headers: { Authorization: `Bearer ${adminToken}` }
  }
);
const { data } = await response.json();

// Calculate totals
const credits = data
  .filter(txn => txn.type === 'CREDIT')
  .reduce((sum, txn) => sum + txn.amount, 0);

const debits = data
  .filter(txn => txn.type === 'DEBIT')
  .reduce((sum, txn) => sum + txn.amount, 0);

console.log('Total Credits:', credits);
console.log('Total Debits:', debits);
console.log('Net Movement:', credits - debits);
```

## Frontend Integration

### Admin Report Dashboard Component

```typescript
// src/pages/admin/ReportsPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('revenue');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', reportType, startDate, endDate],
    queryFn: () => adminApi.getReport(reportType, { startDate, endDate }),
  });

  const handleExportCSV = () => {
    window.location.href = `/api/reports/export/csv?reportType=${reportType}&startDate=${startDate}&endDate=${endDate}`;
  };

  const handleExportPDF = () => {
    window.location.href = `/api/reports/export/pdf?reportType=${reportType}&startDate=${startDate}&endDate=${endDate}`;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports & Analytics</h1>

      {/* Date Range Picker */}
      <div className="mb-4 flex gap-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Report Type Selector */}
      <div className="mb-4">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="revenue">Revenue Analytics</option>
          <option value="agents">Agent Performance</option>
          <option value="ledger">Ledger Report</option>
          <option value="bookings">Booking Report</option>
          <option value="profit-loss">Profit & Loss</option>
        </select>
      </div>

      {/* Export Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleExportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Export PDF
        </button>
      </div>

      {/* Report Display */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          {/* Render report data based on type */}
          {reportType === 'revenue' && (
            <RevenueChart data={reportData} />
          )}
          {reportType === 'agents' && (
            <AgentTable data={reportData} />
          )}
          {/* ... other report types */}
        </div>
      )}
    </div>
  );
}
```

### API Service Methods

```typescript
// src/services/api.ts - Add to adminApi
export const adminApi = {
  // ... existing methods

  getReport: async (reportType: string, params: any) => {
    const queryString = new URLSearchParams(params).toString();
    const { data } = await apiClient.get(`/admin/reports/${reportType}?${queryString}`);
    return data;
  },

  exportReportCSV: (reportType: string, params: any) => {
    const queryString = new URLSearchParams(params).toString();
    return `/api/reports/export/csv?reportType=${reportType}&${queryString}`;
  },

  exportReportPDF: (reportType: string, params: any) => {
    const queryString = new URLSearchParams(params).toString();
    return `/api/reports/export/pdf?reportType=${reportType}&${queryString}`;
  },
};
```

## Report Formats

### CSV Format

Simple, tabular format compatible with Excel and Google Sheets:

```csv
date,bookings,revenue,refunds,netRevenue
2026-01-01,5,2500.00,0,2500.00
2026-01-02,8,4000.00,0,4000.00
2026-01-03,12,6000.00,500.00,5500.00
```

### PDF Format

Professional document with:
- Report title
- Summary section with key metrics
- Detailed data table
- Page numbers
- Generation timestamp
- Company branding (configurable)

## Scheduled Reports

### Automated Report Generation (Future Enhancement)

```typescript
// Using node-cron for scheduled reports
import cron from 'node-cron';
import { reportingService } from './services/reporting.service';
import emailService from './services/email.service';

// Daily revenue report at 8 AM
cron.schedule('0 8 * * *', async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateRange = {
    startDate: yesterday,
    endDate: yesterday,
  };

  const report = await reportingService.getRevenueAnalytics(dateRange);
  
  // Send to admin email
  await emailService.sendDailyReportEmail('admin@travelbooking.com', report);
});

// Weekly agent performance report (Mondays at 9 AM)
cron.schedule('0 9 * * 1', async () => {
  const lastWeek = {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  };

  const report = await reportingService.getAgentPerformanceReport(lastWeek);
  
  // Generate PDF and send
  const pdf = await reportingService.generatePDFReport({
    title: 'Weekly Agent Performance',
    summary: { /* ... */ },
    data: report,
    columns: ['agencyName', 'totalBookings', 'totalRevenue'],
  });

  await emailService.sendPDFReport('admin@travelbooking.com', pdf, 'Weekly Agent Report');
});
```

## Performance Optimization

### Large Dataset Handling

For reports with thousands of records:

1. **Pagination**: Limit results per page
2. **Streaming**: Stream CSV data instead of loading all in memory
3. **Caching**: Cache frequently accessed reports (Redis)
4. **Background Jobs**: Generate large reports asynchronously (Bull queue)

```typescript
// Example: Background report generation
import { Queue } from 'bull';

const reportQueue = new Queue('reports', process.env.REDIS_URL!);

reportQueue.process(async (job) => {
  const { reportType, dateRange, userId } = job.data;
  
  // Generate report
  const report = await reportingService.getRevenueAnalytics(dateRange);
  
  // Store in S3 or file system
  const fileUrl = await saveReportToStorage(report);
  
  // Notify user
  await emailService.sendReportReadyEmail(userId, fileUrl);
});

// Queue report generation
export const queueReport = (reportType: string, dateRange: any, userId: string) => {
  reportQueue.add({ reportType, dateRange, userId });
};
```

## Security Considerations

1. **Authorization**: All report endpoints require admin authentication
2. **Data Privacy**: Filter sensitive data based on user role
3. **Rate Limiting**: Prevent report generation abuse
4. **Audit Logging**: Log all report access and exports
5. **Data Encryption**: Encrypt exported files containing sensitive data

## Monitoring & Analytics

### Key Metrics to Track

- Number of reports generated per day
- Most requested report types
- Average report generation time
- Export format preferences (CSV vs PDF)
- Report access patterns
- Failed report generations

```typescript
// Example: Report analytics
await prisma.reportLog.create({
  data: {
    userId: req.user!.userId,
    reportType: 'revenue',
    format: 'CSV',
    dateRange: { startDate, endDate },
    generationTime: duration,
    recordCount: data.length,
  },
});
```

## Future Enhancements

1. **Interactive Charts**: Real-time chart visualization with Chart.js/Recharts
2. **Custom Reports**: User-defined report builder
3. **Data Visualization**: Advanced graphs and dashboards
4. **Export to Excel**: Native .xlsx format with formulas
5. **Report Scheduling**: Automated email delivery
6. **Report Templates**: Pre-configured report templates
7. **Comparative Analysis**: Period-over-period comparisons
8. **Forecasting**: Predictive analytics based on historical data

## Troubleshooting

### Large CSV Files

If CSV generation times out:
- Implement streaming with `json2csv-stream`
- Add pagination and generate multiple files
- Use background jobs for large datasets

### PDF Layout Issues

If PDF content overflows:
- Limit rows per page
- Adjust font sizes
- Use landscape orientation for wide tables

### Memory Issues

For large reports:
- Implement streaming
- Use pagination
- Generate reports asynchronously
- Clear cached data after generation

## Summary

✅ Complete reporting and analytics system
✅ 5 comprehensive report types
✅ CSV export with configurable columns
✅ PDF export with professional formatting
✅ Revenue, agent, ledger, booking, P&L reports
✅ Admin API endpoints with authentication
✅ Date range filtering
✅ Production-ready with error handling
✅ Extensible architecture for future enhancements

The reporting system provides complete business intelligence for platform operators, enabling data-driven decision making and financial reconciliation.
