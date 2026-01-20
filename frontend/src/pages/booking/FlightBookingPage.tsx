import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Plane, User, Mail, CreditCard, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

interface PassengerForm {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality: string;
}

export default function FlightBookingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [flightData, setFlightData] = useState<any>(null);
  const [searchData, setSearchData] = useState<any>(null);
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: '',
    countryCode: '+977',
  });

  const [passengers, setPassengers] = useState<PassengerForm[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'ESEWA' | 'KHALTI' | 'WALLET'>('STRIPE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load flight and search data from sessionStorage
    const savedFlight = sessionStorage.getItem('selectedFlight');
    const savedSearch = sessionStorage.getItem('searchData');

    if (!savedFlight || !savedSearch) {
      toast.error('No flight selected. Redirecting to search...');
      navigate('/search');
      return;
    }

    const flight = JSON.parse(savedFlight);
    const search = JSON.parse(savedSearch);

    setFlightData(flight);
    setSearchData(search);

    // Initialize passenger forms
    const initialPassengers: PassengerForm[] = [];

    for (let i = 0; i < search.adults; i++) {
      initialPassengers.push({
        title: 'Mr',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        passportNumber: '',
        passportExpiry: '',
        nationality: 'US',
      });
    }

    for (let i = 0; i < search.children; i++) {
      initialPassengers.push({
        title: 'Mstr',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        passportNumber: '',
        passportExpiry: '',
        nationality: 'US',
      });
    }

    for (let i = 0; i < search.infants; i++) {
      initialPassengers.push({
        title: 'Inf',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: 'US',
      });
    }

    setPassengers(initialPassengers);
  }, [navigate]);

  const updatePassenger = (index: number, field: keyof PassengerForm, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const validateForm = () => {
    if (!contactInfo.email || !contactInfo.phone) {
      toast.error('Please fill in contact information');
      return false;
    }

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.firstName || !p.lastName || !p.dateOfBirth) {
        toast.error(`Please complete passenger ${i + 1} information`);
        return false;
      }
    }

    return true;
  };

  const handleBooking = async () => {
    if (!validateForm()) return;

    if (!isAuthenticated) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData = {
        flightOffer: flightData,
        passengers,
        contactInfo,
        paymentMethod,
        searchData,
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

  if (!flightData || !searchData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading flight details...</p>
        </div>
      </div>
    );
  }

  // Helper function to get flight price
  const getFlightPrice = () => {
    return parseFloat(flightData.price?.total || flightData.price?.grandTotal || '0');
  };

  const basePrice = getFlightPrice();
  const totalPrice = basePrice;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
          <p className="text-gray-600 mt-2">Fill in passenger details to continue</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Summary */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Plane className="h-5 w-5 mr-2 text-primary-600" />
                Flight Details
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {searchData.origin}
                    </p>
                    <p className="text-sm text-gray-600">
                      {flightData.itineraries?.[0]?.segments?.[0]?.departure?.at 
                        ? new Date(flightData.itineraries[0].segments[0].departure.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div className="flex-1 mx-8">
                    <div className="flex items-center justify-center">
                      <div className="h-px bg-gray-300 flex-1"></div>
                      <Plane className="h-5 w-5 text-primary-600 mx-2" />
                      <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-1">
                      {flightData.itineraries?.[0]?.duration 
                        ? (() => {
                            const d = flightData.itineraries[0].duration;
                            const hours = d.match(/(\d+)H/)?.[1] || '0';
                            const minutes = d.match(/(\d+)M/)?.[1] || '0';
                            return `${hours}h ${minutes}m`;
                          })()
                        : 'Direct'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {searchData.destination}
                    </p>
                    <p className="text-sm text-gray-600">
                      {flightData.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.at
                        ? new Date(flightData.itineraries[0].segments.slice(-1)[0].arrival.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                  <span className="font-medium">{flightData.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Airline'}</span>
                  <span className="mx-2">•</span>
                  <span>{searchData.travelClass || 'ECONOMY'}</span>
                  <span className="mx-2">•</span>
                  <span>{flightData.itineraries?.[0]?.segments?.length - 1 === 0 ? 'Direct' : `${flightData.itineraries[0].segments.length - 1} stop(s)`}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary-600" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className="input"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={contactInfo.countryCode}
                      onChange={(e) => setContactInfo({ ...contactInfo, countryCode: e.target.value })}
                      className="input w-24"
                    >
                      <option value="+977">+977</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+91">+91</option>
                    </select>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      className="input flex-1"
                      placeholder="9801234567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            {passengers.map((passenger, index) => (
              <div key={index} className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary-600" />
                  Passenger {index + 1} 
                  {index < searchData.adults && ' (Adult)'}
                  {index >= searchData.adults && index < searchData.adults + searchData.children && ' (Child)'}
                  {index >= searchData.adults + searchData.children && ' (Infant)'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <select
                      value={passenger.title}
                      onChange={(e) => updatePassenger(index, 'title', e.target.value)}
                      className="input"
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Mstr">Master</option>
                      <option value="Inf">Infant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={passenger.firstName}
                      onChange={(e) => updatePassenger(index, 'firstName', e.target.value)}
                      className="input"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={passenger.lastName}
                      onChange={(e) => updatePassenger(index, 'lastName', e.target.value)}
                      className="input"
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                    <input
                      type="date"
                      value={passenger.dateOfBirth}
                      onChange={(e) => updatePassenger(index, 'dateOfBirth', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
                    <input
                      type="text"
                      value={passenger.passportNumber}
                      onChange={(e) => updatePassenger(index, 'passportNumber', e.target.value)}
                      className="input"
                      placeholder="A12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Passport Expiry</label>
                    <input
                      type="date"
                      value={passenger.passportExpiry}
                      onChange={(e) => updatePassenger(index, 'passportExpiry', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
                    <select
                      value={passenger.nationality}
                      onChange={(e) => updatePassenger(index, 'nationality', e.target.value)}
                      className="input"
                    >
                      <option value="US">United States</option>
                      <option value="NP">Nepal</option>
                      <option value="IN">India</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CN">China</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar - Price Summary & Payment */}
          <div className="space-y-6">
            <div className="card sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Summary</h2>
              
              <div className="space-y-3 mb-4">
                {searchData.adults > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Adult × {searchData.adults}</span>
                    <span>${basePrice.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="space-y-2">
                  {user?.role === 'B2B_AGENT' && (
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-600">
                      <input
                        type="radio"
                        name="payment"
                        value="WALLET"
                        checked={paymentMethod === 'WALLET'}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="mr-3"
                      />
                      <Wallet className="h-5 w-5 text-primary-600 mr-2" />
                      <span>Wallet Balance</span>
                    </label>
                  )}
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-600">
                    <input
                      type="radio"
                      name="payment"
                      value="STRIPE"
                      checked={paymentMethod === 'STRIPE'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-3"
                    />
                    <CreditCard className="h-5 w-5 text-primary-600 mr-2" />
                    <span>Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-600">
                    <input
                      type="radio"
                      name="payment"
                      value="ESEWA"
                      checked={paymentMethod === 'ESEWA'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-3"
                    />
                    <span className="font-semibold text-green-600">eSewa</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-600">
                    <input
                      type="radio"
                      name="payment"
                      value="KHALTI"
                      checked={paymentMethod === 'KHALTI'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-3"
                    />
                    <span className="font-semibold text-purple-600">Khalti</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={isSubmitting}
                className="btn btn-primary w-full"
              >
                {isSubmitting ? 'Processing...' : 'Continue to Payment'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By proceeding, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
