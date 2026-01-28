import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '@/services/api';
import { 
  ArrowLeft, 
  Plane, 
  Users, 
  CreditCard
} from 'lucide-react';
import { getAirlineName } from '@/utils/airlines';

export default function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response: any = await bookingApi.getById(id!);
      return response.data;
    },
  });

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+)H(\d+)M/);
    if (match) {
      return `${match[1]}h ${match[2]}m`;
    }
    return duration;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600 mt-4">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Booking not found</p>
          <Link to="/customer/bookings" className="btn btn-primary mt-4">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const flightDetails = booking.flightDetails;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </button>

        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Plane className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {booking.origin} → {booking.destination}
                  </h1>
                  <p className="text-gray-600">Booking Reference: <span className="font-semibold">{booking.bookingReference}</span></p>
                  {booking.pnr && (
                    <p className="text-gray-600">PNR: <span className="font-semibold">{booking.pnr}</span></p>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${parseFloat(booking.totalAmount || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Flight Details */}
        {flightDetails?.itineraries?.map((itinerary: any, idx: number) => (
          <div key={idx} className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {idx === 0 ? 'Outbound Flight' : 'Return Flight'}
            </h2>
            
            {itinerary.segments?.map((segment: any, segIdx: number) => (
              <div key={segIdx} className={segIdx > 0 ? 'mt-4 pt-4 border-t' : ''}>
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatTime(segment.departure.at)}
                        </p>
                        <p className="text-sm text-gray-600">{segment.departure.iataCode}</p>
                      </div>
                      <div className="flex-1 relative">
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300"></div>
                        <div className="relative bg-white px-2 mx-auto w-fit">
                          <Plane className="h-5 w-5 text-primary-600 rotate-90" />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          {formatDuration(segment.duration)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatTime(segment.arrival.at)}
                        </p>
                        <p className="text-sm text-gray-600">{segment.arrival.iataCode}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Airline</p>
                      <p className="font-semibold">{getAirlineName(segment.carrierCode)}</p>
                      <p className="text-xs text-gray-500">{segment.carrierCode}-{segment.number}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Aircraft</p>
                      <p className="font-semibold">{segment.aircraft?.code || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Departure Terminal</p>
                      <p className="font-semibold">{segment.departure.terminal || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Arrival Terminal</p>
                      <p className="font-semibold">{segment.arrival.terminal || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Passenger Information */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Passenger Information
          </h2>
          <div className="space-y-3">
            {booking.passengers?.map((passenger: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{passenger.firstName} {passenger.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-semibold">{passenger.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-semibold">{passenger.gender === 'M' ? 'Male' : 'Female'}</p>
                  </div>
                  {passenger.passportNumber && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Passport Number</p>
                        <p className="font-semibold">{passenger.passportNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nationality</p>
                        <p className="font-semibold">{passenger.nationality}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Price Breakdown
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Base Fare</span>
              <span>${parseFloat(booking.baseFare || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Taxes & Fees</span>
              <span>${parseFloat(booking.taxes || 0).toFixed(2)}</span>
            </div>
            {booking.markup > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Markup</span>
                <span>${parseFloat(booking.markup || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between text-xl font-bold">
              <span>Total Amount</span>
              <span className="text-primary-600">${parseFloat(booking.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Booking Info */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Booked On</p>
              <p className="font-semibold">{formatDate(booking.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-600">Last Updated</p>
              <p className="font-semibold">{formatDate(booking.updatedAt)}</p>
            </div>
            <div>
              <p className="text-gray-600">Trip Type</p>
              <p className="font-semibold">{booking.tripType.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-gray-600">Payment Status</p>
              <p className="font-semibold">{booking.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
