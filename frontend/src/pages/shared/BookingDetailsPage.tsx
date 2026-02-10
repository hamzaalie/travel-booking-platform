import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '@/services/api';
import { Plane, Calendar, Users, MapPin, CreditCard, FileText, ArrowLeft, XCircle, Download, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response: any = await bookingApi.getById(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await bookingApi.cancel(id!);
    },
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    },
  });

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      cancelMutation.mutate();
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any }> = {
      CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };
    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-4 w-4 mr-2" />
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
        <p className="text-gray-600 mt-4">Loading booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600 mb-4">Booking not found</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-600">Reference: {booking.bookingReference}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(booking.status)}
          {booking.status === 'CONFIRMED' && (
            <button className="btn btn-secondary">
              <Download className="h-5 w-5 mr-2" />
              Download Ticket
            </button>
          )}
          {booking.status !== 'CANCELLED' && (
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="btn btn-danger flex items-center justify-center"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Flight Information */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Plane className="h-6 w-6 mr-2 text-primary-950" />
              Flight Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span className="text-2xl font-bold text-gray-900">{booking.flightDetails?.origin}</span>
                  </div>
                  <p className="text-sm text-gray-600">{booking.flightDetails?.originCity || 'Departure'}</p>
                </div>
                <div className="flex flex-col items-center">
                  <Plane className="h-6 w-6 text-primary-950 transform rotate-90 mb-2" />
                  <span className="text-xs text-gray-500">
                    {booking.flightDetails?.duration || 'Direct'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-2 mb-2">
                    <span className="text-2xl font-bold text-gray-900">{booking.flightDetails?.destination}</span>
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">{booking.flightDetails?.destinationCity || 'Arrival'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Departure Date</p>
                    <p className="font-semibold">
                      {booking.flightDetails?.departureDate
                        ? new Date(booking.flightDetails.departureDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Not available'}
                    </p>
                  </div>
                </div>
                {booking.flightDetails?.returnDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Return Date</p>
                      <p className="font-semibold">
                        {new Date(booking.flightDetails.returnDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {booking.pnr && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary-900 font-medium">PNR (Passenger Name Record)</p>
                      <p className="text-xl font-bold text-primary-900">{booking.pnr}</p>
                    </div>
                    <FileText className="h-8 w-8 text-primary-950" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Passenger Information */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Users className="h-6 w-6 mr-2 text-primary-950" />
              Passenger Information ({booking.passengers?.length || 0})
            </h2>
            <div className="space-y-3">
              {booking.passengers?.map((passenger: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {passenger.firstName} {passenger.lastName}
                    </h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {passenger.type || 'Adult'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {passenger.dateOfBirth && (
                      <p><strong>DOB:</strong> {new Date(passenger.dateOfBirth).toLocaleDateString()}</p>
                    )}
                    {passenger.passportNumber && (
                      <p><strong>Passport:</strong> {passenger.passportNumber}</p>
                    )}
                    {passenger.nationality && (
                      <p><strong>Nationality:</strong> {passenger.nationality}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Breakdown */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <CreditCard className="h-6 w-6 mr-2 text-primary-950" />
              Price Breakdown
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Base Fare</span>
                <span className="font-medium">${booking.basePrice?.toFixed(2) || '0.00'}</span>
              </div>
              {booking.markup > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Markup</span>
                  <span className="font-medium">${booking.markup.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Taxes & Fees</span>
                <span className="font-medium">
                  ${((booking.totalPrice || 0) - (booking.basePrice || 0) - (booking.markup || 0)).toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-primary-900">
                  ${booking.totalPrice?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Payment Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">{booking.payment?.gateway?.toUpperCase() || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className={`font-medium ${
                  booking.payment?.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {booking.payment?.status || 'PENDING'}
                </span>
              </div>
              {booking.payment?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-medium text-xs">{booking.payment.transactionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Booking Timeline */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Booking Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Booking Created</p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {booking.confirmedAt && (
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Booking Confirmed</p>
                    <p className="text-xs text-gray-500">
                      {new Date(booking.confirmedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {booking.cancelledAt && (
                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Booking Cancelled</p>
                    <p className="text-xs text-gray-500">
                      {new Date(booking.cancelledAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
