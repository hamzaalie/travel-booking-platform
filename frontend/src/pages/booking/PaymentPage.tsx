import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { bookingApi, paymentApi, hotelApi, walletApi, carRentalApi } from '@/services/api';
import { Wallet, Loader2, ArrowLeft, Building2, Plane, Car } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [bookingData, setBookingData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const savedBooking = sessionStorage.getItem('bookingData');
    
    if (!savedBooking) {
      toast.error('No booking data found. Redirecting...');
      navigate('/search');
      return;
    }

    setBookingData(JSON.parse(savedBooking));

    // Fetch wallet balance if B2B agent
    if (user?.role === 'B2B_AGENT') {
      walletApi.getWallet().then((response: any) => {
        setWalletBalance(response.data?.balance || 0);
      }).catch((err) => {
        console.error('Failed to fetch wallet balance:', err);
        setWalletBalance(0);
      });
    }
  }, [navigate, user]);

  const calculateTotal = () => {
    if (!bookingData) return 0;
    
    if (bookingData.type === 'HOTEL') {
      return parseFloat(bookingData.offer?.price?.total || '0');
    } else if (bookingData.type === 'CAR') {
      const rentalDays = Math.ceil(
        (new Date(bookingData.searchParams?.dropoffDate).getTime() - 
         new Date(bookingData.searchParams?.pickupDate).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      return parseFloat(bookingData.car?.pricePerDay || 0) * rentalDays;
    } else {
      const { flightOffer } = bookingData;
      return parseFloat(flightOffer.price?.total || flightOffer.price?.grandTotal || '0');
    }
  };

  const handleWalletPayment = async () => {
    setIsProcessing(true);

    try {
      const total = calculateTotal();
      
      if (walletBalance < total) {
        toast.error('Insufficient wallet balance');
        setIsProcessing(false);
        return;
      }

      let response;

      if (bookingData.type === 'HOTEL') {
        // Create hotel booking with wallet payment
        response = await hotelApi.book({
          offerId: bookingData.offer.id,
          guests: [{
            title: bookingData.guestInfo.title.toUpperCase(),
            firstName: bookingData.guestInfo.firstName,
            lastName: bookingData.guestInfo.lastName,
            email: bookingData.contactInfo.email,
            phone: `${bookingData.contactInfo.countryCode}${bookingData.contactInfo.phone}`,
          }],
          payment: {
            method: 'WALLET',
            gateway: 'WALLET',
          },
        }) as any;
      } else if (bookingData.type === 'CAR') {
        // Create car rental booking with wallet payment
        response = await carRentalApi.book({
          ...bookingData,
          payment: {
            method: 'WALLET',
            gateway: 'WALLET',
          },
        }) as any;
      } else {
        // Map passengers to include required gender field
        const mappedPassengers = bookingData.passengers.map((p: any) => {
          const passenger: any = {
            firstName: p.firstName,
            lastName: p.lastName,
            dateOfBirth: p.dateOfBirth,
            gender: p.title === 'Mr' || p.title === 'Mstr' ? 'M' : 'F',
            email: bookingData.contactInfo?.email,
            phone: bookingData.contactInfo?.phone,
            nationality: p.nationality,
          };
          // Only include passport fields if they have values
          if (p.passportNumber) passenger.passportNumber = p.passportNumber;
          if (p.passportExpiry) passenger.passportExpiry = p.passportExpiry;
          return passenger;
        });

        // Create flight booking with wallet payment
        response = await bookingApi.create({
          flightOffer: bookingData.flightOffer,
          passengers: mappedPassengers,
          paymentGateway: 'WALLET',
          tripType: bookingData.searchData?.tripType || 'ONE_WAY',
        }) as any;
      }

      toast.success('Booking confirmed!');
      sessionStorage.removeItem('bookingData');
      sessionStorage.removeItem('selectedFlight');
      sessionStorage.removeItem('searchData');
      
      const newBookingId = response.data.id || response.data.hotelBooking?.id;
      navigate(`/customer/bookings/${newBookingId}`);
    } catch (error: any) {
      console.error('Wallet payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripePayment = async () => {
    setIsProcessing(true);

    try {
      const total = calculateTotal();
      let currency = 'USD';
      let customerEmail = '';
      let customerName = '';

      if (bookingData.type === 'HOTEL') {
        currency = bookingData.offer?.price?.currency || 'USD';
        customerEmail = bookingData.contactInfo?.email || '';
        customerName = `${bookingData.guestInfo?.firstName} ${bookingData.guestInfo?.lastName}`;
      } else if (bookingData.type === 'CAR') {
        currency = bookingData.car?.currency || 'USD';
        customerEmail = bookingData.driverInfo?.email || '';
        customerName = `${bookingData.driverInfo?.firstName} ${bookingData.driverInfo?.lastName}`;
      } else {
        const { flightOffer } = bookingData!;
        const passenger = bookingData!.passengers[0];
        currency = flightOffer.price?.currency || 'USD';
        customerEmail = passenger.email || bookingData.contactInfo?.email;
        customerName = `${passenger.firstName} ${passenger.lastName}`;
      }

      let bookingType = 'Booking';
      if (bookingData.type === 'HOTEL') bookingType = 'Hotel';
      else if (bookingData.type === 'CAR') bookingType = 'Car Rental';
      else bookingType = 'Flight';

      // Create Stripe checkout session
      const response = await paymentApi.createStripeCheckout({
        amount: total,
        currency,
        bookingId: `TEMP-${Date.now()}`,
        customerEmail,
        customerName,
        bookingType,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment`,
      }) as any;

      // Redirect to Stripe Checkout
      if (response.data.url) {
        // Store booking data for after payment success
        sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
        window.location.href = response.data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Stripe payment error:', error);
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      'Failed to create Stripe payment';
      toast.error(errorMsg);
      setIsProcessing(false);
    }
  };

  const handleEsewaPayment = async () => {
    setIsProcessing(true);

    try {
      const total = calculateTotal();
      let customerEmail = '';
      let customerName = '';

      if (bookingData.type === 'HOTEL') {
        customerEmail = bookingData.contactInfo?.email || '';
        customerName = `${bookingData.guestInfo?.firstName} ${bookingData.guestInfo?.lastName}`;
      } else if (bookingData.type === 'CAR') {
        customerEmail = bookingData.driverInfo?.email || '';
        customerName = `${bookingData.driverInfo?.firstName} ${bookingData.driverInfo?.lastName}`;
      } else {
        const passenger = bookingData.passengers[0];
        customerEmail = passenger.email || bookingData.contactInfo?.email;
        customerName = `${passenger.firstName} ${passenger.lastName}`;
      }

      // Store booking data for after payment callback
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));

      // Initiate eSewa payment
      const response = await paymentApi.initiateEsewa({
        amount: total,
        bookingId: `TEMP-${Date.now()}`,
        customerEmail,
        customerName,
      }) as any;

      // Submit form to eSewa
      if (response.data.paymentData) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = response.data.paymentUrl;

        Object.keys(response.data.paymentData).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = response.data.paymentData[key];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      }
    } catch (error: any) {
      console.error('eSewa payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to initialize eSewa payment');
      setIsProcessing(false);
    }
  };

  const handleKhaltiPayment = async () => {
    setIsProcessing(true);

    try {
      const total = calculateTotal();
      let customerEmail = '';
      let customerName = '';

      if (bookingData.type === 'HOTEL') {
        customerEmail = bookingData.contactInfo?.email || '';
        customerName = `${bookingData.guestInfo?.firstName} ${bookingData.guestInfo?.lastName}`;
      } else if (bookingData.type === 'CAR') {
        customerEmail = bookingData.driverInfo?.email || '';
        customerName = `${bookingData.driverInfo?.firstName} ${bookingData.driverInfo?.lastName}`;
      } else {
        const passenger = bookingData.passengers[0];
        customerEmail = passenger.email || bookingData.contactInfo?.email;
        customerName = `${passenger.firstName} ${passenger.lastName}`;
      }

      // Store booking data for after payment callback
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));

      // Initiate Khalti payment
      const response = await paymentApi.initiateKhalti({
        amount: total,
        bookingId: `TEMP-${Date.now()}`,
        customerEmail,
        customerName,
      }) as any;

      // Redirect to Khalti 
      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      }
    } catch (error: any) {
      console.error('Khalti payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to initialize Khalti payment');
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (!bookingData) return;

    switch (bookingData.paymentMethod) {
      case 'WALLET':
        handleWalletPayment();
        break;
      case 'STRIPE':
        handleStripePayment();
        break;
      case 'ESEWA':
        handleEsewaPayment();
        break;
      case 'KHALTI':
        handleKhaltiPayment();
        break;
      default:
        toast.error('Invalid payment method');
    }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Booking Details
        </button>

        <div className="card"> 
          <div className="text-center mb-8">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              {bookingData.type === 'HOTEL' ? (
                <Building2 className="h-8 w-8 text-primary-600" />
              ) : bookingData.type === 'CAR' ? (
                <Car className="h-8 w-8 text-primary-600" />
              ) : (
                <Plane className="h-8 w-8 text-primary-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
            <p className="text-gray-600 mt-2">{bookingData.type === 'HOTEL' ? 'Hotel' : bookingData.type === 'CAR' ? 'Car Rental' : 'Flight'} Booking - Secure payment processing</p>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
            
            <div className="space-y-3 mb-4">
              {bookingData.type === 'HOTEL' ? (
                <>
                  <div className="flex items-center justify-between text-gray-700">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      <span>Hotel: {bookingData.hotel?.name}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Room Type</span>
                    <span>{bookingData.offer?.roomType}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Guests</span>
                    <span>{bookingData.offer?.guests} {bookingData.offer?.guests === 1 ? 'Guest' : 'Guests'}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Dates</span>
                    <span>{new Date(bookingData.offer?.checkInDate).toLocaleDateString()} - {new Date(bookingData.offer?.checkOutDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Total Price</span>
                    <span>{bookingData.offer?.price?.currency} {parseFloat(bookingData.offer?.price?.total || '0').toFixed(2)}</span>
                  </div>
                </>
              ) : bookingData.type === 'CAR' ? (
                <>
                  <div className="flex items-center justify-between text-gray-700">
                    <div className="flex items-center">
                      <Car className="h-4 w-4 mr-2" />
                      <span>Car: {bookingData.car?.name}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Category</span>
                    <span>{bookingData.car?.category}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Pick-up</span>
                    <span>{new Date(bookingData.searchParams?.pickupDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Drop-off</span>
                    <span>{new Date(bookingData.searchParams?.dropoffDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Rental Days</span>
                    <span>{Math.ceil((new Date(bookingData.searchParams?.dropoffDate).getTime() - new Date(bookingData.searchParams?.pickupDate).getTime()) / (1000 * 60 * 60 * 24))} Days</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Total Price</span>
                    <span>{bookingData.car?.currency} {(bookingData.car?.pricePerDay * Math.ceil((new Date(bookingData.searchParams?.dropoffDate).getTime() - new Date(bookingData.searchParams?.pickupDate).getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-gray-700">
                    <div className="flex items-center">
                      <Plane className="h-4 w-4 mr-2" />
                      <span>Flight: {bookingData.searchData.origin} → {bookingData.searchData.destination}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>
                      {bookingData.searchData.adults + bookingData.searchData.children + bookingData.searchData.infants} Passenger(s)
                    </span>
                    <span>${parseFloat(bookingData.flightOffer.price?.total || bookingData.flightOffer.price?.grandTotal || '0').toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total Amount</span>
                <span className="text-3xl font-bold text-primary-600">
                  {bookingData.type === 'HOTEL' ? bookingData.offer?.price?.currency : bookingData.type === 'CAR' ? bookingData.car?.currency : '$'} {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Balance (for B2B agents) */}
          {bookingData.paymentMethod === 'WALLET' && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wallet className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">Wallet Balance</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    ${walletBalance.toFixed(2)}
                  </span>
                </div>
                {walletBalance < total && (
                  <p className="text-sm text-red-600 mt-2">
                    Insufficient balance. Please load funds or choose another payment method.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Method Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Payment Method:</strong>{' '}
              {bookingData.paymentMethod === 'WALLET' && 'Wallet Balance'}
              {bookingData.paymentMethod === 'STRIPE' && 'Credit/Debit Card (Stripe)'}
              {bookingData.paymentMethod === 'ESEWA' && 'eSewa'}
              {bookingData.paymentMethod === 'KHALTI' && 'Khalti'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePayment}
              disabled={isProcessing || (bookingData.paymentMethod === 'WALLET' && walletBalance < total)}
              className="btn btn-primary w-full py-3 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing Payment...
                </>
              ) : (
                <>
                  Pay {bookingData.type === 'HOTEL' ? bookingData.offer?.price?.currency : bookingData.type === 'CAR' ? bookingData.car?.currency : '$'}{total.toFixed(2)}
                </>
              )}
            </button>

            <button
              onClick={() => navigate(-1)}
              disabled={isProcessing}
              className="btn btn-secondary w-full"
            >
              Cancel
            </button>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>🔒 Your payment is secure and encrypted</p>
            <p className="mt-1">By completing this purchase, you agree to our terms and conditions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
