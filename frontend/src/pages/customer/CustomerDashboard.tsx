import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { bookingApi } from '@/services/api';
import { Link } from 'react-router-dom';
import { Plane, Clock, CheckCircle, XCircle, Search } from 'lucide-react';

export default function CustomerDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['customerBookings'],
    queryFn: async () => {
      const response: any = await bookingApi.getMyBookings();
      return response.data;
    },
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
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">Manage your bookings and explore new destinations</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/search" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-full mr-4">
              <Search className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Search Flights</h3>
              <p className="text-sm text-gray-600">Find your next adventure</p>
            </div>
          </div>
        </Link>

        <Link to="/customer/bookings" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <Plane className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">My Bookings</h3>
              <p className="text-sm text-gray-600">{bookings?.length || 0} bookings</p>
            </div>
          </div>
        </Link>

        <div className="card bg-gradient-to-br from-primary-500 to-blue-600 text-white">
          <h3 className="font-semibold text-lg mb-2">Total Spent</h3>
          <p className="text-3xl font-bold">
            ${bookings?.reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0).toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
          <Link to="/customer/bookings" className="text-primary-600 hover:text-primary-700 font-medium">
            View All →
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-4">Loading bookings...</p>
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.slice(0, 5).map((booking: any) => (
              <Link
                key={booking.id}
                to={`/customer/bookings/${booking.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary-100 p-3 rounded-lg">
                      <Plane className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {booking.origin} → {booking.destination}
                        </h3>
                        {getStatusIcon(booking.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Booking Ref: {booking.bookingReference}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${parseFloat(booking.totalAmount || 0).toFixed(2)}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Plane className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No bookings yet</p>
            <Link to="/search" className="btn btn-primary">
              Search Flights
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
