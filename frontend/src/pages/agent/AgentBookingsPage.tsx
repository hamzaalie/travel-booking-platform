import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { agentApi } from '@/services/api';
import { Link } from 'react-router-dom';
import { Plane, Search, Filter, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';

export default function AgentBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['agentBookings'],
    queryFn: async () => {
      const response: any = await agentApi.getBookings();
      return response.data;
    },
  });

  const filteredBookings = bookings?.filter((booking: any) => {
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    const matchesSearch = !searchTerm || 
      booking.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pnr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking reference, PNR or destination..."
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
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600 mt-4">Loading bookings...</p>
        </div>
      ) : filteredBookings && filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking: any) => (
            <div key={booking.id} className="card hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header with Status and Reference */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Plane className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {booking.origin} → {booking.destination}
                        </h3>
                        {getStatusIcon(booking.status)}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span><strong>Ref:</strong> {booking.bookingReference}</span>
                        {booking.pnr && <span><strong>PNR:</strong> {booking.pnr}</span>}
                        <span>Booked: {new Date(booking.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      ${parseFloat(booking.totalAmount || booking.totalPrice || 0).toFixed(2)}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)} mt-1`}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm font-medium text-gray-900">{booking.bookingType || 'FLIGHT'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Departure</p>
                    <p className="text-sm font-medium text-gray-900">
                      {booking.departureDate ? new Date(booking.departureDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Passengers</p>
                    <p className="text-sm font-medium text-gray-900">
                      {booking.passengers?.length || booking.passengerCount || 1}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment</p>
                    <p className="text-sm font-medium text-gray-900">
                      {booking.paymentMethod || 'WALLET'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t">
                  <Link
                    to={`/customer/bookings/${booking.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                  {booking.status === 'CONFIRMED' && (
                    <Link
                      to={`/customer/bookings/${booking.id}/cancel`}
                      className="btn btn-danger btn-sm"
                    >
                      Request Cancellation
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Plane className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700 mb-2">No bookings found</p>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'ALL' 
              ? 'Try adjusting your filters' 
              : 'Start booking flights for your customers!'}
          </p>
          <Link to="/search" className="btn btn-primary inline-flex items-center">
            <Plane className="h-5 w-5 mr-2" />
            Search Flights
          </Link>
        </div>
      )}
    </div>
  );
}

