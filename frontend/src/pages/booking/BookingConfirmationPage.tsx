import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingApi } from '@/services/api';
import { CheckCircle, Plane, Users, Download, Mail, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await bookingApi.getById(id!) as any;
      setBooking(response.data);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
      toast.error('Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    toast.success('Downloading ticket...');
  };

  const handleEmail = () => {
    // TODO: Implement email functionality
    toast.success('Ticket sent to your email');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-16 w-16 text-primary-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const passengers = booking.passengers || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="card mb-8 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-4">
            Your booking has been successfully confirmed
          </p>
          <div className="inline-flex items-center space-x-2 bg-primary-100 px-6 py-3 rounded-lg">
            <span className="text-sm font-medium text-primary-900">Booking Reference:</span>
            <span className="text-xl font-bold text-primary-600">{booking.bookingReference}</span>
          </div>
          {booking.pnr && (
            <div className="inline-flex items-center space-x-2 bg-blue-100 px-6 py-3 rounded-lg ml-4">
              <span className="text-sm font-medium text-blue-900">PNR:</span>
              <span className="text-xl font-bold text-blue-600">{booking.pnr}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center space-x-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-5 w-5 text-gray-600" />
              <span>Download Ticket</span>
            </button>
            <button
              onClick={handleEmail}
              className="flex items-center justify-center space-x-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-5 w-5 text-gray-600" />
              <span>Email Ticket</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center space-x-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Printer className="h-5 w-5 text-gray-600" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Flight Details */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Plane className="h-5 w-5 mr-2 text-primary-600" />
            Flight Information
          </h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-3xl font-bold text-gray-900">{booking.origin}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(booking.departureDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex-1 mx-8">
                <div className="flex items-center justify-center">
                  <div className="h-px bg-gray-300 flex-1"></div>
                  <Plane className="h-6 w-6 text-primary-600 mx-4" />
                  <div className="h-px bg-gray-300 flex-1"></div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {booking.tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{booking.destination}</p>
                {booking.returnDate && (
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(booking.returnDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="font-semibold text-gray-900">
                  {booking.status === 'CONFIRMED' && '✓ Confirmed'}
                  {booking.status === 'TICKETED' && '✓ Ticketed'}
                  {booking.status === 'PENDING' && '⏳ Pending'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Booking Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(booking.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                <p className="font-semibold text-primary-600 text-lg">
                  ${booking.totalAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                <p className="font-semibold text-gray-900">
                  {booking.payments?.[0]?.gateway || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger Details */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary-600" />
            Passenger Information
          </h2>
          <div className="space-y-4">
            {passengers.map((passenger: any, index: number) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {passenger.title}. {passenger.firstName} {passenger.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {passenger.type || 'Adult'} • DOB: {passenger.dateOfBirth}
                    </p>
                  </div>
                  {passenger.ticketNumber && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Ticket Number</p>
                      <p className="font-mono font-semibold text-gray-900">
                        {passenger.ticketNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Information */}
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-3">Important Information</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• Please arrive at the airport at least 3 hours before departure for international flights</li>
            <li>• Carry a valid photo ID and passport for international travel</li>
            <li>• Check baggage allowance and restrictions before packing</li>
            <li>• Web check-in opens 24 hours before departure</li>
            <li>• For any changes or cancellations, contact our support team</li>
          </ul>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Link to="/customer/bookings" className="btn btn-secondary">
            View All Bookings
          </Link>
          <Link to="/search" className="btn btn-primary">
            Book Another Flight
          </Link>
        </div>
      </div>
    </div>
  );
}
