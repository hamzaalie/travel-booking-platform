import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { hotelApi, bookingApi, carRentalApi } from '@/services/api';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [bookingId, setBookingId] = useState<string>('');

  useEffect(() => {
    const completeBooking = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        // Retrieve pending booking data
        const pendingBookingStr = sessionStorage.getItem('pendingBooking');
        if (!pendingBookingStr) {
          throw new Error('No pending booking found');
        }

        const bookingData = JSON.parse(pendingBookingStr);

        let bookingResponse;

        if (bookingData.type === 'HOTEL') {
          // Create hotel booking
          bookingResponse = await hotelApi.book({
            offerId: bookingData.offer.id,
            guests: [{
              title: bookingData.guestInfo.title.toUpperCase(),
              firstName: bookingData.guestInfo.firstName,
              lastName: bookingData.guestInfo.lastName,
              email: bookingData.contactInfo.email,
              phone: `${bookingData.contactInfo.countryCode}${bookingData.contactInfo.phone}`,
            }],
            payment: {
              method: 'CREDIT_CARD',
              cardType: 'VISA',
              cardNumber: '4111111111111111',
              expiryDate: '12/2028',
              holderName: `${bookingData.guestInfo.firstName} ${bookingData.guestInfo.lastName}`,
              gateway: 'STRIPE',
            },
          }) as any;
        } else if (bookingData.type === 'CAR') {
          // Create car rental booking
          bookingResponse = await carRentalApi.book({
            ...bookingData,
            payment: {
              method: 'CREDIT_CARD',
              gateway: 'STRIPE',
            },
          }) as any;
        } else {
          // Map passengers for flight booking
          const mappedPassengers = bookingData.passengers.map((p: any) => {
            const passenger: any = {
              firstName: p.firstName,
              lastName: p.lastName,
              dateOfBirth: p.dateOfBirth,
              gender: p.title === 'Mr' || p.title === 'Mstr' ? 'M' : 'F',
              email: bookingData.contactInfo?.email || p.email,
              phone: bookingData.contactInfo?.phone || p.phone,
              nationality: p.nationality,
            };
            if (p.passportNumber) passenger.passportNumber = p.passportNumber;
            if (p.passportExpiry) passenger.passportExpiry = p.passportExpiry;
            return passenger;
          });

          bookingResponse = await bookingApi.create({
            flightOffer: bookingData.flightOffer,
            passengers: mappedPassengers,
            paymentGateway: 'STRIPE',
            tripType: bookingData.searchData?.tripType || 'ONE_WAY',
          }) as any;
        }

        // Clear session storage
        sessionStorage.removeItem('pendingBooking');
        sessionStorage.removeItem('bookingData');
        sessionStorage.removeItem('selectedFlight');
        sessionStorage.removeItem('searchData');

        setBookingId(bookingResponse.data.id || bookingResponse.data.hotelBooking?.id);
        setStatus('success');
        toast.success('Payment successful! Your booking is confirmed.');

        // Redirect after 3 seconds
        setTimeout(() => {
          navigate(`/customer/bookings/${bookingResponse.data.id || bookingResponse.data.hotelBooking?.id}`);
        }, 3000);

      } catch (error: any) {
        console.error('Booking completion error:', error);
        setStatus('error');
        toast.error(error.response?.data?.message || 'Failed to complete booking');
      }
    };

    completeBooking();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="h-16 w-16 text-primary-600 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
              <p className="text-gray-600">
                Please wait while we confirm your payment and complete your booking...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-4">
                Your booking has been confirmed. Booking ID: <strong>{bookingId}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to your booking details...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Failed</h1>
              <p className="text-gray-600 mb-6">
                Your payment was processed, but we couldn't complete your booking. Please contact support.
              </p>
              <button
                onClick={() => navigate('/customer/dashboard')}
                className="btn btn-primary"
              >
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
