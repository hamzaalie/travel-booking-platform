import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Plane,
  Download,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

interface ReportData {
  totalRevenue: number;
  totalBookings: number;
  activeAgents: number;
  totalCommission: number;
  salesByDay: Array<{ date: string; revenue: number; bookings: number }>;
  salesByAgent: Array<{ name: string; revenue: number; bookings: number }>;
  salesByService: Array<{ service: string; revenue: number; count: number }>;
  recentBookings: Array<{
    id: string;
    bookingReference: string;
    agentName: string;
    service: string;
    amount: number;
    commission: number;
    date: string;
  }>;
}

export default function ReportingDashboardPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReportData();
  }, [dateRange, startDate, endDate]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const mockData: ReportData = {
        totalRevenue: 125000,
        totalBookings: 342,
        activeAgents: 28,
        totalCommission: 15600,
        salesByDay: [
          { date: '2025-01-01', revenue: 12500, bookings: 45 },
          { date: '2025-01-02', revenue: 15800, bookings: 52 },
          { date: '2025-01-03', revenue: 18200, bookings: 48 },
          { date: '2025-01-04', revenue: 14500, bookings: 41 },
          { date: '2025-01-05', revenue: 21000, bookings: 63 },
          { date: '2025-01-06', revenue: 19500, bookings: 55 },
          { date: '2025-01-07', revenue: 23500, bookings: 38 },
        ],
        salesByAgent: [
          { name: 'Travel Pro', revenue: 45000, bookings: 120 },
          { name: 'Sky Tours', revenue: 38000, bookings: 95 },
          { name: 'Global Travel', revenue: 25000, bookings: 72 },
          { name: 'Elite Voyages', revenue: 17000, bookings: 55 },
        ],
        salesByService: [
          { service: 'Flight', revenue: 95000, count: 280 },
          { service: 'Hotel', revenue: 25000, count: 45 },
          { service: 'Car Rental', revenue: 5000, count: 17 },
        ],
        recentBookings: [
          {
            id: '1',
            bookingReference: 'BK12345',
            agentName: 'Travel Pro Agency',
            service: 'Flight',
            amount: 850,
            commission: 42.5,
            date: new Date().toISOString(),
          },
          {
            id: '2',
            bookingReference: 'BK12344',
            agentName: 'Sky Tours',
            service: 'Hotel',
            amount: 450,
            commission: 22.5,
            date: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      };
      setReportData(mockData);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    toast.success('Exporting to PDF...');
    // TODO: Implement PDF export
  };

  const handleExportExcel = () => {
    toast.success('Exporting to Excel...');
    // TODO: Implement Excel export
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (isLoading || !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Sales, revenue, and performance insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleExportPDF} className="btn btn-secondary">
            <Download className="h-5 w-5 mr-2" />
            Export PDF
          </button>
          <button onClick={handleExportExcel} className="btn btn-primary">
            <Download className="h-5 w-5 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">${reportData.totalRevenue.toLocaleString()}</p>
              <p className="text-blue-100 text-xs mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% from last period
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Total Bookings</p>
              <p className="text-3xl font-bold">{reportData.totalBookings}</p>
              <p className="text-green-100 text-xs mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.3% from last period
              </p>
            </div>
            <Plane className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Active Agents</p>
              <p className="text-3xl font-bold">{reportData.activeAgents}</p>
              <p className="text-purple-100 text-xs mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5 this month
              </p>
            </div>
            <Users className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Total Commission</p>
              <p className="text-3xl font-bold">${reportData.totalCommission.toLocaleString()}</p>
              <p className="text-orange-100 text-xs mt-1">Avg: 12.5% markup</p>
            </div>
            <BarChart3 className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.salesByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Revenue ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings by Day */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.salesByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#10B981" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Agents */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Agents</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.salesByAgent} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.salesByService}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => `${props.service}: $${props.revenue.toLocaleString()}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
              >
                {reportData.salesByService.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Ref
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                    {booking.bookingReference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.agentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.service}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${booking.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    ${booking.commission.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.date).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Average Booking Value</h4>
          <p className="text-2xl font-bold text-gray-900">
            ${(reportData.totalRevenue / reportData.totalBookings).toFixed(2)}
          </p>
        </div>
        <div className="card">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Average Commission Rate</h4>
          <p className="text-2xl font-bold text-gray-900">
            {((reportData.totalCommission / reportData.totalRevenue) * 100).toFixed(2)}%
          </p>
        </div>
        <div className="card">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Bookings per Agent</h4>
          <p className="text-2xl font-bold text-gray-900">
            {(reportData.totalBookings / reportData.activeAgents).toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}
