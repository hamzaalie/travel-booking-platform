import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '@/services/api';
import { Link } from 'react-router-dom';
import { Plane, Search, Filter, Calendar, Users, CheckCircle, Clock, XCircle, MapPin, ArrowRight, Briefcase } from 'lucide-react';
import { getAirlineName } from '@/utils/airlines';

export default function MyBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: async () => {
      const response: any = await bookingApi.getMyBookings();
      return response.data;
    },
  });

  const filteredBookings = bookings?.filter((booking: any) => {
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    const matchesSearch = !searchTerm || 
      booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              placeholder="Search by booking reference or destination..."
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
          {filteredBookings.map((booking: any) => {
            // Extract flight details from the booking
            const flightOffer = booking.flightOffer || {};
            const itineraries = flightOffer.itineraries || [];
            const firstItinerary = itineraries[0] || {};
            const segments = firstItinerary.segments || [];
            const firstSegment = segments[0] || {};
            const lastSegment = segments[segments.length - 1] || {};
            const passengers = booking.passengers || [];
            
            // Calculate total duration
            const duration = firstItinerary.duration || '';
            const formatDuration = (dur: string) => {
              if (!dur) return 'N/A';
              const match = dur.match(/PT(\d+H)?(\d+M)?/);
              if (!match) return dur;
              const hours = match[1] ? match[1].replace('H', 'h ') : '';
              const minutes = match[2] ? match[2].replace('M', 'm') : '';
              return hours + minutes;
            };

            return (
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
                        ${parseFloat(booking.totalAmount || 0).toFixed(2)}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)} mt-1`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left - Departure Info */}
                    <div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Departure</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {firstSegment.departure?.iataCode || booking.origin}
                          </p>
                          <p className="text-sm text-gray-600">
                            {firstSegment.departure?.at ? 
                              new Date(firstSegment.departure.at).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 
                              booking.departureDate ? new Date(booking.departureDate).toLocaleDateString() : 'N/A'
                            }
                          </p>
                          {firstSegment.departure?.terminal && (
                            <p className="text-xs text-gray-500 mt-1">Terminal {firstSegment.departure.terminal}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center - Flight Path & Details */}
                    <div className="flex flex-col justify-center items-center">
                      <div className="flex items-center justify-center w-full mb-2">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <Plane className="h-5 w-5 text-primary-600 mx-3 transform rotate-90" />
                        <div className="h-px bg-gray-300 flex-1"></div>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDuration(duration)}
                        </p>
                        {segments.length > 1 && (
                          <p className="text-xs text-amber-600">
                            {segments.length - 1} stop{segments.length > 2 ? 's' : ''}
                          </p>
                        )}
                        {firstSegment.carrierCode && (
                          <p className="text-xs text-gray-500">
                            {getAirlineName(firstSegment.carrierCode)}
                          </p>
                        )}
                        {firstSegment.carrierCode && (
                          <p className="text-xs text-gray-400">
                            {firstSegment.carrierCode}-{firstSegment.number}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right - Arrival Info */}
                    <div className="text-right lg:text-left">
                      <div className="flex items-start space-x-2 justify-end lg:justify-start">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Arrival</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {lastSegment.arrival?.iataCode || booking.destination}
                          </p>
                          <p className="text-sm text-gray-600">
                            {lastSegment.arrival?.at ? 
                              new Date(lastSegment.arrival.at).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'
                            }
                          </p>
                          {lastSegment.arrival?.terminal && (
                            <p className="text-xs text-gray-500 mt-1">Terminal {lastSegment.arrival.terminal}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Passengers</p>
                        <p className="text-sm font-medium text-gray-900">
                          {passengers.length} {passengers.length === 1 ? 'Person' : 'People'}
                        </p>
                      </div>
                    </div>
                    
                    {flightOffer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin && (
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Cabin Class</p>
                          <p className="text-sm font-medium text-gray-900">
                            {flightOffer.travelerPricings[0].fareDetailsBySegment[0].cabin}
                          </p>
                        </div>
                      </div>
                    )}

                    {booking.paymentStatus && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Payment</p>
                          <p className="text-sm font-medium text-gray-900">
                            {booking.paymentStatus}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Booking Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(booking.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Passengers List */}
                  {passengers.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-gray-700 mb-2 uppercase">Passengers</p>
                      <div className="flex flex-wrap gap-2">
                        {passengers.map((passenger: any, idx: number) => (
                          <span key={idx} className="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            <Users className="h-3 w-3 mr-1" />
                            {passenger.firstName} {passenger.lastName}
                            {passenger.gender && ` (${passenger.gender})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-3 border-t">
                    <Link
                      to={`/customer/bookings/${booking.id}`}
                      className="btn btn-primary w-full flex items-center justify-center"
                    >
                      View Full Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Plane className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {searchTerm || statusFilter !== 'ALL' ? 'No bookings match your filters' : 'No bookings yet'}
          </p>
          {!searchTerm && statusFilter === 'ALL' && (
            <>
              <p className="text-sm text-gray-500 mb-4">Start your journey by booking a flight</p>
              <Link to="/search" className="btn btn-primary">
                Search Flights
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
