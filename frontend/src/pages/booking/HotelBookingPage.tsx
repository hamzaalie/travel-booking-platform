import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Building2, User, Mail, CreditCard, Calendar, Users, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface GuestForm {
  title: string;
  firstName: string;
  lastName: string;
}

export default function HotelBookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [hotelData, setHotelData] = useState<any>(null);
  const [offerData, setOfferData] = useState<any>(null);
  
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: '',
    countryCode: '+977',
  });

  const [guestInfo, setGuestInfo] = useState<GuestForm>({
    title: 'Mr',
    firstName: '',
    lastName: '',
  });

  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'ESEWA' | 'KHALTI' | 'WALLET'>('STRIPE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get hotel and offer data from location state
    const stateData = location.state;
    
    if (!stateData?.hotel || !stateData?.offer) {
      toast.error('Hotel booking data not found. Please select a hotel again.');
      navigate('/hotels');
      return;
    }

    setHotelData(stateData.hotel);
    setOfferData(stateData.offer);
  }, [location, navigate]);

  const validateForm = () => {
    if (!contactInfo.email || !contactInfo.phone) {
      toast.error('Please fill in contact information');
      return false;
    }

    if (!guestInfo.firstName || !guestInfo.lastName) {
      toast.error('Please fill in guest information');
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
        type: 'HOTEL',
        hotel: hotelData,
        offer: offerData,
        guestInfo,
        contactInfo,
        specialRequests,
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

  if (!hotelData || !offerData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  const totalPrice = parseFloat(offerData.price?.total || '0');
  const checkInDate = new Date(offerData.checkInDate);
  const checkOutDate = new Date(offerData.checkOutDate);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Hotel Booking</h1>
          <p className="text-gray-600 mt-2">Fill in guest details to continue</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Summary */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-primary-950" />
                Hotel Details
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{hotelData.name}</h3>
                  {hotelData.rating && (
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1 text-sm text-gray-600">{hotelData.rating}</span>
                    </div>
                  )}
                </div>
                
                {hotelData.address && (
                  <div className="flex items-start text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      {typeof hotelData.address === 'string' 
                        ? hotelData.address 
                        : [hotelData.address.street, hotelData.address.city, hotelData.address.country]
                            .filter(Boolean)
                            .join(', ')}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-4 w-4 mr-2 text-primary-950" />
                    <div>
                      <p className="text-xs text-gray-500">Check-in</p>
                      <p className="font-medium">{checkInDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-4 w-4 mr-2 text-primary-950" />
                    <div>
                      <p className="text-xs text-gray-500">Check-out</p>
                      <p className="font-medium">{checkOutDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Users className="h-4 w-4 mr-2 text-primary-950" />
                    <div>
                      <p className="text-xs text-gray-500">Guests</p>
                      <p className="font-medium">{offerData.guests} {offerData.guests === 1 ? 'Guest' : 'Guests'}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Building2 className="h-4 w-4 mr-2 text-primary-950" />
                    <div>
                      <p className="text-xs text-gray-500">Room Type</p>
                      <p className="font-medium">{offerData.roomType}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-1">{offerData.roomType}</p>
                  {offerData.roomDescription && (
                    <p className="text-sm text-gray-600">{offerData.roomDescription}</p>
                  )}
                  {offerData.boardType && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Board:</span> {offerData.boardType}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary-950" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className="input w-full"
                    placeholder="your@email.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Booking confirmation will be sent to this email</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={contactInfo.countryCode}
                      onChange={(e) => setContactInfo({ ...contactInfo, countryCode: e.target.value })}
                      className="input w-32"
                    >
                      <option value="+977">+977 (NP)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+91">+91 (IN)</option>
                      <option value="+86">+86 (CN)</option>
                    </select>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      className="input flex-1"
                      placeholder="9841234567"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary-950" />
                Primary Guest Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <select
                      value={guestInfo.title}
                      onChange={(e) => setGuestInfo({ ...guestInfo, title: e.target.value })}
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
                      value={guestInfo.firstName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
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
                      value={guestInfo.lastName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                      className="input w-full"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Special Requests (Optional)
              </h2>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="input w-full h-32"
                placeholder="Any special requests or preferences? (e.g., late check-in, high floor, twin beds)"
              />
              <p className="text-xs text-gray-500 mt-2">
                Special requests cannot be guaranteed but the hotel will do its best to accommodate them.
              </p>
            </div>

            {/* Payment Method */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-primary-950" />
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
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

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
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

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
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
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="WALLET"
                      checked={paymentMethod === 'WALLET'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-3"
                    />
                    <Building2 className="h-5 w-5 text-gray-600 mr-3" />
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Room Rate</span>
                  <span className="font-medium text-gray-900">
                    {offerData.price.currency} {offerData.price.base?.toFixed(2) || offerData.price.total?.toFixed(2)}
                  </span>
                </div>
                {offerData.price.taxes && offerData.price.taxes > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes & Fees</span>
                    <span className="font-medium text-gray-900">
                      {offerData.price.currency} {offerData.price.taxes.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Number of Nights</span>
                  <span className="font-medium text-gray-900">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-gray-900 font-semibold">Total Amount</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-primary-950">
                      {offerData.price.currency} {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">All taxes and fees included</p>
              </div>

              {offerData.cancellation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-sm text-green-800">
                  <p className="font-medium mb-1">Free Cancellation</p>
                  <p className="text-xs">
                    Until {new Date(offerData.cancellation.deadline).toLocaleDateString()}
                  </p>
                </div>
              )}

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
