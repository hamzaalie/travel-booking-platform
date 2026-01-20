import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi, hotelApi, bookingApi, carRentalApi } from '@/services/api';

export default function KhaltiCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [bookingId, setBookingId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const pidx = searchParams.get('pidx');
        const transaction_id = searchParams.get('transaction_id');
        const statusParam = searchParams.get('status');

        if (statusParam === 'Canceled' || statusParam === 'User canceled') {
          setStatus('error');
          setErrorMessage('Payment was cancelled');
          toast.error('Payment was cancelled');
          return;
        }

        if (!pidx) {
          throw new Error('Invalid payment callback');
        }

        // Get pending booking data
        const pendingBookingStr = sessionStorage.getItem('pendingBooking');
        if (!pendingBookingStr) {
          throw new Error('No pending booking found');
        }

        const bookingData = JSON.parse(pendingBookingStr);

        // Verify payment with Khalti
        const verifyResponse = await paymentApi.verifyKhalti(pidx, bookingData.tempBookingId || 'TEMP') as any;

        if (!verifyResponse.data.success) {
          throw new Error('Payment verification failed');
        }

        // Now create the actual booking
        let bookingResponse;

        if (bookingData.type === 'HOTEL') {
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
              method: 'KHALTI',
              gateway: 'KHALTI',
              transactionId: transaction_id,
            },
          }) as any;
        } else if (bookingData.type === 'CAR') {
          bookingResponse = await carRentalApi.book({
            ...bookingData,
            payment: {
              method: 'KHALTI',
              gateway: 'KHALTI',
              transactionId: transaction_id,    
            },
          }) as any;
        } else {
          // Flight booking
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
            paymentGateway: 'KHALTI',
            tripType: bookingData.searchData?.tripType || 'ONE_WAY',
          }) as any;
        }

        // Clear session storage
        sessionStorage.removeItem('pendingBooking');
        sessionStorage.removeItem('bookingData');
        sessionStorage.removeItem('selectedFlight');
        sessionStorage.removeItem('searchData');

        const newBookingId = bookingResponse.data.id || bookingResponse.data.hotelBooking?.id;
        setBookingId(newBookingId);
        setStatus('success');
        toast.success('Payment successful! Your booking is confirmed.');

        // Redirect after 3 seconds
        setTimeout(() => {
          navigate(`/customer/bookings/${newBookingId}`);
        }, 3000);

      } catch (error: any) {
        console.error('Khalti callback error:', error);
        setStatus('error');
        setErrorMessage(error.response?.data?.message || error.message || 'Payment verification failed');
        toast.error('Payment verification failed');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="h-16 w-16 text-purple-600 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
              <p className="text-gray-600">
                Please wait while we verify your Khalti payment...
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
              <p className="text-gray-600 mb-6">
                {errorMessage || 'Something went wrong with your payment. Please try again.'}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(-2)}
                  className="btn btn-primary w-full"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/customer/dashboard')}
                  className="btn btn-secondary w-full"
                >
                  Go to Dashboard 
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
