import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { XCircle, AlertCircle, DollarSign, Plane, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  bookingReference: string;
  pnr: string;
  status: string;
  totalAmount: number;
  departureDate: string;
  origin: string; 
  
  destination: string;
  passengers: Array<{
    firstName: string;
    lastName: string;
  }>;
}

interface FareRule {
  category: string;
  rules: string;
  penalty: number;
  refundable: boolean;
}

export default function CancellationRequestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
    fetchFareRules();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await bookingApi.getById(id);
      const mockBooking: Booking = {
        id: id!,
        bookingReference: 'BK123456',
        pnr: 'ABC123',
        status: 'CONFIRMED',
        totalAmount: 850,
        departureDate: '2026-02-15',
        origin: 'JFK',
        destination: 'LAX',
        passengers: [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Doe' },
        ],
      };
      setBooking(mockBooking);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
      toast.error('Failed to load booking details');
    }
  };

  const fetchFareRules = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual Amadeus API call
      // const response = await fareRulesApi.getFareRules(pnr);
      const mockRules: FareRule[] = [
        {
          category: 'Cancellation',
          rules: 'Cancellation is permitted. Cancellation fee applies.',
          penalty: 150,
          refundable: true,
        },
        {
          category: 'Changes',
          rules: 'Changes are permitted. Change fee and fare difference applies.',
          penalty: 100,
          refundable: false,
        },
      ];
      setFareRules(mockRules);
    } catch (error) {
      console.error('Failed to fetch fare rules:', error);
      toast.error('Failed to load fare rules');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRefundAmount = () => {
    if (!booking) return 0;
    const cancellationPenalty = fareRules.find((r) => r.category === 'Cancellation')?.penalty || 0;
    return Math.max(0, booking.totalAmount - cancellationPenalty);
  };

  const handleSubmitCancellation = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    if (!acceptTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: API call to submit cancellation request
      // await bookingApi.requestCancellation(id, {
      //   reason: cancellationReason,
      // });

      toast.success('Cancellation request submitted successfully');
      navigate('/customer/bookings');
    } catch (error) {
      console.error('Cancellation request error:', error);
      toast.error('Failed to submit cancellation request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !booking) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Plane className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  const refundAmount = calculateRefundAmount();
  const cancellationPenalty = booking.totalAmount - refundAmount;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <XCircle className="h-8 w-8 text-red-600" />
        <h1 className="text-3xl font-bold text-gray-900">Request Cancellation</h1>
      </div>

      {/* Warning Alert */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Important Notice</p>
            <p className="text-sm text-yellow-700 mt-1">
              Please review the fare rules and cancellation penalties carefully before submitting your request.
              Refunds are subject to airline policies and processing times may vary.
            </p>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Details</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Booking Reference</p>
            <p className="font-semibold text-gray-900">{booking.bookingReference}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">PNR</p>
            <p className="font-semibold text-gray-900">{booking.pnr}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Route</p>
            <p className="font-semibold text-gray-900">
              {booking.origin} → {booking.destination}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Departure Date</p>
            <p className="font-semibold text-gray-900">
              {new Date(booking.departureDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Passengers</p>
            <p className="font-semibold text-gray-900">
              {booking.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Paid</p>
            <p className="font-semibold text-gray-900">${booking.totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Fare Rules */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-6 w-6 mr-2" />
          Fare Rules & Policies
        </h2>
        
        <div className="space-y-4">
          {fareRules.map((rule, index) => (
            <div key={index} className="border-l-4 border-primary-500 pl-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{rule.category}</h3>
                {rule.penalty > 0 && (
                  <span className="text-red-600 font-bold">Penalty: ${rule.penalty.toFixed(2)}</span>
                )}
              </div>
              <p className="text-sm text-gray-600">{rule.rules}</p>
              <div className="flex items-center mt-2">
                {rule.refundable ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Refundable
                  </span>
                ) : (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Non-Refundable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refund Calculation */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-6 w-6 mr-2" />
          Refund Calculation
        </h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-gray-700">
            <span>Original Amount Paid</span>
            <span className="font-semibold">${booking.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-red-600">
            <span>Cancellation Penalty</span>
            <span className="font-semibold">-${cancellationPenalty.toFixed(2)}</span>
          </div>
          <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Estimated Refund Amount</span>
            <span className="text-2xl font-bold text-green-600">${refundAmount.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            * Final refund amount may vary based on airline processing and any additional fees.
          </p>
        </div>
      </div>

      {/* Cancellation Form */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cancellation Request</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Cancellation *
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="input"
              rows={4}
              placeholder="Please provide a detailed reason for your cancellation request..."
              required
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              id="acceptTerms"
            />
            <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700">
              I understand and accept the cancellation policy. I acknowledge that the cancellation penalty
              of <strong>${cancellationPenalty.toFixed(2)}</strong> will be deducted from my refund, and
              the processing time may take 7-14 business days.
            </label>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Your cancellation request will be submitted to our team</li>
              <li>We will process the cancellation with the airline</li>
              <li>Once confirmed, the refund will be initiated</li>
              <li>Refund will be credited to your original payment method</li>
              <li>You will receive email confirmation at each step</li>
            </ol>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitCancellation}
              disabled={isSubmitting || !acceptTerms || !cancellationReason.trim()}
              className="btn btn-danger flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Cancellation Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
