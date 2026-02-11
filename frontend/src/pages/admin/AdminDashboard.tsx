import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { Users, Plane, DollarSign, TrendingUp, CreditCard, MapPin, Wifi, Shield, Armchair, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const response: any = await adminApi.getDashboard();
      return response.data;
    },
  });

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-primary-900">{stats?.bookings.total || 0}</p>
            </div>
            <Plane className="h-12 w-12 text-primary-950" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Agents</p>
              <p className="text-3xl font-bold text-green-700">{stats?.agents.active || 0}</p>
            </div>
            <Users className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="card bg-accent-50 border-accent-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-accent-600">
                NPR {(stats?.revenue.total || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-accent-500" />
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-orange-700">
                {(stats?.agents.pending || 0) + (stats?.fundRequests.pending || 0)}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Pending Agent Approvals</h3>
          <p className="text-gray-600 mb-4">
            {stats?.agents.pending || 0} agents waiting for approval
          </p>
          <Link to="/admin/agents" className="btn btn-primary">
            Review Agents
          </Link>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Pending Fund Requests</h3>
          <p className="text-gray-600 mb-4">
            {stats?.fundRequests.pending || 0} fund requests to process
          </p>
          <Link to="/admin/fund-requests" className="btn btn-primary">
            Process Requests
          </Link>
        </div>
      </div>

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
