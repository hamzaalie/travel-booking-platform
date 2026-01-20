import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { Link } from 'react-router-dom';
import { Plane, Search, Filter, Calendar, CheckCircle, Clock, XCircle, Download } from 'lucide-react';

export default function AllBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['allBookings'],
    queryFn: async () => {
      const response: any = await adminApi.getAllBookings();
      return response.data;
    },
  });

  const filteredBookings = bookings?.filter((booking: any) => {
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    const matchesSearch = !searchTerm || 
      booking.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pnr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || 
      new Date(booking.createdAt).toISOString().split('T')[0] === dateFilter;
    return matchesStatus && matchesSearch && matchesDate;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const stats = {
    total: bookings?.length || 0,
    confirmed: bookings?.filter((b: any) => b.status === 'CONFIRMED').length || 0,
    pending: bookings?.filter((b: any) => b.status === 'PENDING').length || 0,
    cancelled: bookings?.filter((b: any) => b.status === 'CANCELLED').length || 0,
    totalRevenue: bookings?.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0) || 0,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Bookings</h1>
        <button className="btn btn-secondary">
          <Download className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-primary-50">
          <p className="text-sm text-gray-600">Total Bookings</p>
          <p className="text-2xl font-bold text-primary-700">{stats.total}</p>
        </div>
        <div className="card bg-green-50">
          <p className="text-sm text-gray-600">Confirmed</p>
          <p className="text-2xl font-bold text-green-700">{stats.confirmed}</p>
        </div>
        <div className="card bg-yellow-50">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="card bg-red-50">
          <p className="text-sm text-gray-600">Cancelled</p>
          <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
        </div>
        <div className="card bg-purple-50">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-purple-700">${stats.totalRevenue.toFixed(0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference, PNR, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input pl-10"
            >
              <option value="ALL">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600 mt-4">Loading bookings...</p>
        </div>
      ) : filteredBookings && filteredBookings.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{booking.bookingReference}</div>
                      {booking.pnr && <div className="text-xs text-gray-500">PNR: {booking.pnr}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Plane className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium">
                          {booking.flightDetails?.origin} → {booking.flightDetails?.destination}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{booking.user?.email}</div>
                      <div className="text-xs text-gray-500">
                        {booking.user?.role === 'B2B_AGENT' ? 'Agent' : 'Customer'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">${booking.totalPrice?.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(booking.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/bookings/${booking.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Plane className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'ALL' || dateFilter ? 'No bookings match your filters' : 'No bookings yet'}
          </p>
        </div>
      )}
    </div>
  );
}
