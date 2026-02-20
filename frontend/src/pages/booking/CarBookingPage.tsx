import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
// MULTI-CURRENCY MODEL REMOVED
// import { convertPrice } from '@/store/slices/currencySlice';
import { Car, User, CreditCard, Calendar, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface DriverForm {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  licenseNumber: string;
  licenseExpiry: string;
}

export default function CarBookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  // MULTI-CURRENCY MODEL REMOVED - Only NPR supported
  const formatPrice = (amount: number, _sourceCurrency?: string) => {
    return `रू ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const [carData, setCarData] = useState<any>(null);
  const [searchParams, setSearchParams] = useState<any>(null);
  
  const [driverInfo, setDriverInfo] = useState<DriverForm>({
    title: 'Mr',
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    countryCode: '+977',
    licenseNumber: '',
    licenseExpiry: '',
  });

  const [additionalInfo, setAdditionalInfo] = useState({
    flightNumber: '',
    specialRequests: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'ESEWA' | 'KHALTI' | 'WALLET'>('STRIPE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get car data from location state
    const stateData = location.state;
    
    if (!stateData?.car || !stateData?.searchParams) {
      toast.error('Car booking data not found. Please search for cars again.');
      navigate('/cars');
      return;
    }

    setCarData(stateData.car);
    setSearchParams(stateData.searchParams);

    // Restore previously filled form data if returning from failed payment
    const savedBooking = sessionStorage.getItem('bookingData');
    if (savedBooking) {
      try {
        const prev = JSON.parse(savedBooking);
        if (prev.type === 'CAR' && prev.driverInfo) {
          setDriverInfo(prev.driverInfo);
          if (prev.additionalInfo) setAdditionalInfo(prev.additionalInfo);
          if (prev.paymentMethod) setPaymentMethod(prev.paymentMethod);
          sessionStorage.removeItem('bookingData');
        }
      } catch (e) { /* ignore */ }
    }
  }, [location, navigate]);

  const validateForm = () => {
    if (!driverInfo.firstName || !driverInfo.lastName || !driverInfo.email || !driverInfo.phone) {
      toast.error('Please fill in all driver information');
      return false;
    }

    if (!driverInfo.licenseNumber || !driverInfo.licenseExpiry) {
      toast.error('Please provide driver license details');
      return false;
    }

    // Check license expiry is in the future
    const expiryDate = new Date(driverInfo.licenseExpiry);
    const dropoffDate = new Date(searchParams?.dropoffDate);
    
    if (expiryDate < dropoffDate) {
      toast.error('Driver license must be valid through the rental period');
      return false;
    }

    return true;
  };

  const handleBooking = async () => {
    if (!validateForm()) return;

    if (!isAuthenticated) {
      toast.error('Please login to continue');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData = {
        type: 'CAR',
        car: carData,
        searchParams,
        driverInfo,
        additionalInfo,
        paymentMethod,
      };

      // Store booking data for payment page
      sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
      
      // Navigate to payment page
      navigate('/payment');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to process booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!carData || !searchParams) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading car details...</p>
        </div>
      </div>
    );
  }

  const pickupDate = new Date(searchParams.pickupDate);
  const dropoffDate = new Date(searchParams.dropoffDate);
  const rentalDays = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = carData.pricePerDay * rentalDays;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Complete Your Car Rental</h1>
          <p className="text-gray-600 mt-2">Fill in driver details to continue</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Car Summary */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Car className="h-5 w-5 mr-2 text-primary-950" />
                Vehicle Details
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-4">
                  {carData.image ? (
                    <img
                      src={carData.image}
                      alt={carData.name}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-24 bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center rounded-lg">
                      <Car className="h-10 w-10 text-primary-800" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{carData.name}</h3>
                    <p className="text-sm text-gray-600">{carData.category} or similar</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span>👥 {carData.passengers} Passengers</span>
                      <span>🧳 {carData.luggage} Bags</span>
                      <span>⚙️ {carData.transmission}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t">
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-4 w-4 mr-2 text-primary-950" />
                    <div>
                      <p className="text-xs text-gray-500">Pick-up Location</p>
                      <p className="font-medium">{searchParams.pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-4 w-4 mr-2 text-primary-950" />
                    <div>
                      <p className="text-xs text-gray-500">Drop-off Location</p>
                      <p className="font-medium">{searchParams.dropoffLocation || searchParams.pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-4 w-4 mr-2 text-primary-950" />
                    <div>
                      <p className="text-xs text-gray-500">Pick-up</p>
                      <p className="font-medium">{pickupDate.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-4 w-4 mr-2 text-primary-950" />
                    <div>
                      <p className="text-xs text-gray-500">Drop-off</p>
                      <p className="font-medium">{dropoffDate.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  </div>
                </div>

                {carData.vendor?.name && (
                  <div className="pt-3 border-t text-sm text-gray-600">
                    <span className="font-medium">Rental Company:</span> {carData.vendor.name}
                  </div>
                )}
              </div>
            </div>

            {/* Driver Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary-950" />
                Driver Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <select
                      value={driverInfo.title}
                      onChange={(e) => setDriverInfo({ ...driverInfo, title: e.target.value })}
                      className="input w-full"
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={driverInfo.firstName}
                      onChange={(e) => setDriverInfo({ ...driverInfo, firstName: e.target.value })}
                      className="input w-full"
                      placeholder="John"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={driverInfo.lastName}
                      onChange={(e) => setDriverInfo({ ...driverInfo, lastName: e.target.value })}
                      className="input w-full"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={driverInfo.email}
                      onChange={(e) => setDriverInfo({ ...driverInfo, email: e.target.value })}
                      className="input w-full"
                      placeholder="your@email.com"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Confirmation will be sent here</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={driverInfo.countryCode}
                        onChange={(e) => setDriverInfo({ ...driverInfo, countryCode: e.target.value })}
                        className="input w-32"
                      >
                        <option value="+977">+977 (NP)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+91">+91 (IN)</option>
                      </select>
                      <input
                        type="tel"
                        value={driverInfo.phone}
                        onChange={(e) => setDriverInfo({ ...driverInfo, phone: e.target.value })}
                        className="input flex-1"
                        placeholder="9841234567"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Driver License Number *
                    </label>
                    <input
                      type="text"
                      value={driverInfo.licenseNumber}
                      onChange={(e) => setDriverInfo({ ...driverInfo, licenseNumber: e.target.value })}
                      className="input w-full"
                      placeholder="DL123456789"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={driverInfo.licenseExpiry}
                      onChange={(e) => setDriverInfo({ ...driverInfo, licenseExpiry: e.target.value })}
                      className="input w-full"
                      min={searchParams.dropoffDate?.split('T')[0]}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Additional Information (Optional)
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flight Number (if picking up at airport)
                  </label>
                  <input
                    type="text"
                    value={additionalInfo.flightNumber}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, flightNumber: e.target.value })}
                    className="input w-full"
                    placeholder="AA1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={additionalInfo.specialRequests}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, specialRequests: e.target.value })}
                    className="input w-full h-24"
                    placeholder="Child seat, GPS, additional driver, etc."
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-primary-950" />
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-900 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="STRIPE"
                    checked={paymentMethod === 'STRIPE'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mr-3"
                  />
                  <CreditCard className="h-5 w-5 text-gray-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Credit/Debit Card</p>
                    <p className="text-sm text-gray-600">Pay securely with Stripe</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-900 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="ESEWA"
                    checked={paymentMethod === 'ESEWA'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mr-3"
                  />
                  <div className="h-5 w-5 mr-3 flex items-center justify-center">
                    <span className="text-green-600 font-bold text-xs">e</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">eSewa</p>
                    <p className="text-sm text-gray-600">Pay with eSewa wallet</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-900 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="KHALTI"
                    checked={paymentMethod === 'KHALTI'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mr-3"
                  />
                  <div className="h-5 w-5 mr-3 flex items-center justify-center">
                    <span className="text-accent-500 font-bold text-xs">K</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Khalti</p>
                    <p className="text-sm text-gray-600">Pay with Khalti wallet</p>
                  </div>
                </label>

                {user?.role === 'B2B_AGENT' && (
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-900 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="WALLET"
                      checked={paymentMethod === 'WALLET'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-3"
                    />
                    <Car className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Agent Wallet</p>
                      <p className="text-sm text-gray-600">Pay from your agent wallet balance</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Rental Summary</h3>
              
              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Daily Rate</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(carData.pricePerDay, carData.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rental Duration</span>
                  <span className="font-medium text-gray-900">{rentalDays} {rentalDays === 1 ? 'Day' : 'Days'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(totalPrice, carData.currency)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-gray-900 font-semibold">Total Amount</span>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-bold text-primary-950">
                      {formatPrice(totalPrice, carData.currency)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Includes all mandatory fees</p>
              </div>

              <div className="bg-accent-50 border border-accent-200 rounded-lg p-3 mb-6 text-sm text-primary-950">
                <Clock className="h-4 w-4 inline mr-1" />
                <span className="font-medium">Free Cancellation</span>
                <p className="text-xs mt-1">Cancel up to 48 hours before pickup</p>
              </div>

              <button
                onClick={handleBooking}
                disabled={isSubmitting}
                className="btn btn-primary w-full py-4 text-lg font-bold flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By clicking "Proceed to Payment", you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
