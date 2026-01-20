import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { Users, Plane, DollarSign, TrendingUp } from 'lucide-react';

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
              <p className="text-3xl font-bold text-primary-700">{stats?.bookings.total || 0}</p>
            </div>
            <Plane className="h-12 w-12 text-primary-600" />
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

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-700">
                ${(stats?.revenue.total || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-600" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Pending Agent Approvals</h3>
          <p className="text-gray-600 mb-4">
            {stats?.agents.pending || 0} agents waiting for approval
          </p>
          <a href="/admin/agents" className="btn btn-primary">
            Review Agents
          </a>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Pending Fund Requests</h3>
          <p className="text-gray-600 mb-4">
            {stats?.fundRequests.pending || 0} fund requests to process
          </p>
          <a href="/admin/fund-requests" className="btn btn-primary">
            Process Requests
          </a>
        </div>
      </div>
    </div>
  );
}
