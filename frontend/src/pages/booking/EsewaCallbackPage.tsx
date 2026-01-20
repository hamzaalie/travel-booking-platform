import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi, hotelApi, bookingApi, carRentalApi } from '@/services/api';

export default function EsewaCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [bookingId, setBookingId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // New eSewa API returns: data (base64 encoded response)
        const encodedData = searchParams.get('data');
        
        // Also support legacy format: oid, amt, refId
        const legacyOid = searchParams.get('oid');
        const legacyAmt = searchParams.get('amt');
        const legacyRefId = searchParams.get('refId');

        let transactionId = '';
        let orderAmount = 0;

        if (encodedData) {
          // New eSewa API format - decode base64 response
          try {
            const decodedData = JSON.parse(atob(encodedData));
            if (decodedData.status !== 'COMPLETE') {
              throw new Error('Payment was not completed');
            }
            transactionId = decodedData.transaction_code || decodedData.transaction_uuid;
            orderAmount = parseFloat(decodedData.total_amount);
          } catch (e) {
            throw new Error('Invalid eSewa response data');
          }
        } else if (legacyOid && legacyAmt && legacyRefId) {
          // Legacy format
          transactionId = legacyRefId;
          orderAmount = parseFloat(legacyAmt);
        } else {
          throw new Error('Invalid eSewa callback parameters');
        }

        // Get pending booking data
        const pendingBookingStr = sessionStorage.getItem('pendingBooking');
        if (!pendingBookingStr) {
          throw new Error('No pending booking found');
        }

        const bookingData = JSON.parse(pendingBookingStr);

        // Verify payment with backend
        const verifyResponse = await paymentApi.verifyEsewa({
          oid: bookingData.bookingId || transactionId,
          amt: orderAmount,
          refId: encodedData || transactionId,
        }) as any;

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
              method: 'ESEWA',
              gateway: 'ESEWA',
              transactionId: refId,
            },
          }) as any;
        } else if (bookingData.type === 'CAR') {
          bookingResponse = await carRentalApi.book({
            ...bookingData,
            payment: {
              method: 'ESEWA',
              gateway: 'ESEWA',
              transactionId: refId,
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
            paymentGateway: 'ESEWA',
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
        console.error('eSewa callback error:', error);
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
              <Loader2 className="h-16 w-16 text-green-600 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
              <p className="text-gray-600">
                Please wait while we verify your eSewa payment...
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
