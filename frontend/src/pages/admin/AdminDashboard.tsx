import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { 
  Users, Plane, DollarSign, TrendingUp, CreditCard, MapPin, Wifi, Shield, 
  Armchair, Settings, Clock, CheckCircle, XCircle, Activity, Calendar,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

type RevenuePeriod = 'today' | 'week' | 'month' | 'total';

export default function AdminDashboard() {
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('month');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const response: any = await adminApi.getDashboard();
      return response.data;
    },
  });

  const getRevenueValue = () => {
    if (!stats?.revenue) return 0;
    return stats.revenue[revenuePeriod] || 0;
  };

  const getRevenuePeriodLabel = () => {
    switch (revenuePeriod) {
      case 'today': return "Today's Revenue";
      case 'week': return "This Week's Revenue";
      case 'month': return "This Month's Revenue";
      case 'total': return 'Total Revenue';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'TICKETED':
        return 'text-green-700 bg-green-100';
      case 'PENDING':
        return 'text-yellow-700 bg-yellow-100';
      case 'CANCELLED':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Bookings with breakdown */}
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-primary-900">{stats?.bookings?.total ?? 0}</p>
            </div>
            <Plane className="h-12 w-12 text-primary-950" />
          </div>
          <div className="flex gap-3 text-xs mt-2">
            <span className="flex items-center gap-1 text-green-700">
              <CheckCircle className="h-3 w-3" /> {stats?.bookings?.confirmed ?? 0} confirmed
            </span>
            <span className="flex items-center gap-1 text-yellow-700">
              <Clock className="h-3 w-3" /> {stats?.bookings?.pending ?? 0} pending
            </span>
            <span className="flex items-center gap-1 text-red-700">
              <XCircle className="h-3 w-3" /> {stats?.bookings?.cancelled ?? 0} cancelled
            </span>
          </div>
        </div>

        {/* Active Agents */}
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Agents</p>
              <p className="text-3xl font-bold text-green-700">{stats?.agents?.active ?? 0}</p>
            </div>
            <Users className="h-12 w-12 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats?.agents?.pending ?? 0} pending approval | {stats?.agents?.total ?? 0} total
          </p>
        </div>

        {/* Revenue with period selector */}
        <div className="card bg-accent-50 border-accent-200">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-sm text-gray-600">{getRevenuePeriodLabel()}</p>
              <p className="text-2xl font-bold text-accent-600">
                NPR {getRevenueValue().toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-accent-500" />
          </div>
          <div className="flex gap-1 mt-2">
            {(['today', 'week', 'month', 'total'] as RevenuePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setRevenuePeriod(period)}
                className={`px-2 py-0.5 text-xs rounded ${
                  revenuePeriod === period
                    ? 'bg-accent-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {period === 'total' ? 'All' : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Customers & Requests */}
        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-orange-700">
                {(stats?.agents?.pending ?? 0) + (stats?.fundRequests?.pending ?? 0)}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <UserCheck className="h-3 w-3 inline" /> {stats?.customers?.total ?? 0} registered customers
          </p>
        </div>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Pending Agent Approvals</h3>
          <p className="text-gray-600 mb-4">
            {stats?.agents?.pending ?? 0} agents waiting for approval
          </p>
          <Link to="/admin/agents" className="btn btn-primary">
            Review Agents
          </Link>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Pending Fund Requests</h3>
          <p className="text-gray-600 mb-4">
            {stats?.fundRequests?.pending ?? 0} fund requests to process
          </p>
          <Link to="/admin/fund-requests" className="btn btn-primary">
            Process Requests
          </Link>
        </div>

        {/* Recent Activity Feed */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-gray-600" />
            <h3 className="text-xl font-semibold">Recent Activity</h3>
          </div>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.recentActivity.slice(0, 6).map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-2 text-sm border-b border-gray-100 pb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-gray-700 truncate">
                      <span className="font-medium">{activity.userName}</span>{' '}
                      <span className="text-gray-500">{activity.action.replace(/_/g, ' ').toLowerCase()}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>
      </div>

      {/* Recent Bookings Table */}
      {stats?.recentBookings && stats.recentBookings.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="text-xl font-semibold">Recent Bookings</h3>
            </div>
            <Link to="/admin/bookings" className="text-sm text-primary-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((booking: any) => (
                  <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2">
                      <Link to={`/admin/bookings/${booking.id}`} className="text-primary-600 hover:underline font-medium">
                        {booking.bookingReference || booking.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-2 text-gray-700">{booking.userName}</td>
                    <td className="py-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {booking.type || 'FLIGHT'}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium">
                      NPR {(booking.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Management Quick Links */}
      <h2 className="text-xl font-semibold mb-4">Management</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { to: '/admin/b2b-portal', icon: Shield, label: 'B2B Portal', desc: 'Agent verification, documents & direct login', color: 'text-indigo-600 bg-indigo-50' },
          { to: '/admin/booking-customize', icon: Armchair, label: 'Booking Customization', desc: 'Fare class, seats & services config', color: 'text-blue-600 bg-blue-50' },
          { to: '/admin/esim-commission', icon: Wifi, label: 'eSIM Commission', desc: 'Markup & commission rules for eSIM', color: 'text-emerald-600 bg-emerald-50' },
          { to: '/admin/payment-gateways', icon: CreditCard, label: 'Payment Gateways', desc: 'eSewa, Khalti, Stripe & more', color: 'text-purple-600 bg-purple-50' },
          { to: '/admin/api-management', icon: Settings, label: 'API Management', desc: 'Amadeus, Sabre & provider config', color: 'text-orange-600 bg-orange-50' },
          { to: '/admin/popular-destinations', icon: MapPin, label: 'Popular Destinations', desc: 'Homepage destinations management', color: 'text-rose-600 bg-rose-50' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium group-hover:text-primary-950 transition-colors">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
