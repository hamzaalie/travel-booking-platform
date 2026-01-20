import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Calendar, Search, Users, Fuel, Settings, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { carRentalApi } from '@/services/api';

// Popular car rental locations
const locations = [
  { code: 'JFK', name: 'New York JFK Airport', country: 'United States' },
  { code: 'LAX', name: 'Los Angeles Airport', country: 'United States' },
  { code: 'LHR', name: 'London Heathrow', country: 'United Kingdom' },
  { code: 'CDG', name: 'Paris Charles de Gaulle', country: 'France' },
  { code: 'DXB', name: 'Dubai Airport', country: 'United Arab Emirates' },
  { code: 'SIN', name: 'Singapore Changi', country: 'Singapore' },
  { code: 'HND', name: 'Tokyo Haneda', country: 'Japan' },
  { code: 'HKG', name: 'Hong Kong Airport', country: 'Hong Kong' },
  { code: 'BKK', name: 'Bangkok Suvarnabhumi', country: 'Thailand' },
  { code: 'KTM', name: 'Kathmandu Airport', country: 'Nepal' },
  { code: 'DEL', name: 'Delhi Airport', country: 'India' },
  { code: 'BOM', name: 'Mumbai Airport', country: 'India' },
  { code: 'SYD', name: 'Sydney Airport', country: 'Australia' },
  { code: 'MEL', name: 'Melbourne Airport', country: 'Australia' },
  { code: 'AMS', name: 'Amsterdam Schiphol', country: 'Netherlands' },
  { code: 'FRA', name: 'Frankfurt Airport', country: 'Germany' },
  { code: 'IST', name: 'Istanbul Airport', country: 'Turkey' },
  { code: 'DOH', name: 'Doha Airport', country: 'Qatar' },
  { code: 'ICN', name: 'Seoul Incheon', country: 'South Korea' },
  { code: 'NRT', name: 'Tokyo Narita', country: 'Japan' },
];

export default function CarRentalPage() {
  const navigate = useNavigate();
  const [pickupInput, setPickupInput] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const pickupRef = useRef<HTMLDivElement>(null);
  
  const [dropoffInput, setDropoffInput] = useState('');
  const [dropoffCode, setDropoffCode] = useState('');
  const [showDropoffDropdown, setShowDropoffDropdown] = useState(false);
  const dropoffRef = useRef<HTMLDivElement>(null);
  
  const [searchForm, setSearchForm] = useState({
    pickupDate: '',
    pickupTime: '10:00',
    dropoffDate: '',
    dropoffTime: '10:00',
    driverAge: '25',
  });

  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter locations based on input
  const filterLocations = (input: string) => {
    if (!input) return [];
    const searchTerm = input.toLowerCase();
    return locations.filter(
      loc =>
        loc.code.toLowerCase().includes(searchTerm) ||
        loc.name.toLowerCase().includes(searchTerm) ||
        loc.country.toLowerCase().includes(searchTerm)
    );
  };

  const filteredPickupLocations = filterLocations(pickupInput);
  const filteredDropoffLocations = filterLocations(dropoffInput);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickupRef.current && !pickupRef.current.contains(event.target as Node)) {
        setShowPickupDropdown(false);
      }
      if (dropoffRef.current && !dropoffRef.current.contains(event.target as Node)) {
        setShowDropoffDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePickupSelect = (location: typeof locations[0]) => {
    setPickupCode(location.code);
    setPickupInput(`${location.name}`);
    setShowPickupDropdown(false);
  };

  const handleDropoffSelect = (location: typeof locations[0]) => {
    setDropoffCode(location.code);
    setDropoffInput(`${location.name}`);
    setShowDropoffDropdown(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupCode || !searchForm.pickupDate || !searchForm.dropoffDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsSearching(true);
      
      // Validate dates
      const pickup = new Date(searchForm.pickupDate + 'T' + searchForm.pickupTime);
      const dropoff = new Date(searchForm.dropoffDate + 'T' + searchForm.dropoffTime);
      
      if (dropoff <= pickup) {
        toast.error('Drop-off must be after pick-up time');
        setIsSearching(false);
        return;
      }
      
      // Call real API
      const response = await carRentalApi.search({
        pickupLocationCode: pickupCode,
        dropoffLocationCode: dropoffCode || pickupCode,
        pickupDate: searchForm.pickupDate,
        pickupTime: searchForm.pickupTime,
        dropoffDate: searchForm.dropoffDate,
        dropoffTime: searchForm.dropoffTime,
      }) as any;

      if (response.data && response.data.length > 0) {
        // Transform API response
        const cars = response.data.map((car: any) => ({
          id: car.id,
          name: (car.vehicle?.make && car.vehicle?.model) ? `${car.vehicle.make} ${car.vehicle.model}` : 'Car',
          category: car.vehicle?.category || 'Standard',
          passengers: car.vehicle?.seats || 5,
          luggage: car.vehicle?.doors || 2,
          transmission: car.vehicle?.transmission || 'Automatic',
          fuelType: car.vehicle?.fuelType || 'Petrol',
          airConditioning: car.vehicle?.airConditioning !== false,
          pricePerDay: parseFloat(car.price?.base || car.price?.total || 0) / calculateDays(),
          totalPrice: parseFloat(car.price?.total || 0),
          currency: car.price?.currency || 'USD',
          image: car.vehicle?.imageUrl || null,
          features: [],
          vendor: car.provider || {},
          rawData: car,
        }));
        
        setResults(cars);
        toast.success(`Found ${cars.length} available car${cars.length > 1 ? 's' : ''}!`);
      } else {
        setResults([]);
        toast.error('No cars available for the selected criteria');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to search cars';
      toast.error(errorMsg);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const calculateDays = () => {
    if (!searchForm.pickupDate || !searchForm.dropoffDate) return 0;
    const diff = new Date(searchForm.dropoffDate).getTime() - new Date(searchForm.pickupDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleBookNow = (car: any) => {
    navigate('/booking/car', {
      state: {
        car,
        searchParams: {
          pickupLocation: pickupInput,
          pickupLocationCode: pickupCode,
          pickupDate: searchForm.pickupDate + 'T' + searchForm.pickupTime,
          dropoffLocation: pickupInput,
          dropoffLocationCode: pickupCode,
          dropoffDate: searchForm.dropoffDate + 'T' + searchForm.dropoffTime,
          driverAge: searchForm.driverAge,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Car className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Rent Your Perfect Car</h1>
            <p className="text-xl text-blue-100">Wide selection of vehicles at competitive prices</p>
          </div>

          {/* Search Form */}
          <div className="card max-w-6xl mx-auto">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" ref={pickupRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1 text-blue-600" />
                    Pick-up Location
                  </label>
                  <input
                    type="text"
                    value={pickupInput}
                    onChange={(e) => {
                      setPickupInput(e.target.value);
                      setShowPickupDropdown(true);
                    }}
                    onFocus={() => setShowPickupDropdown(true)}
                    className="input-lg w-full text-gray-900 placeholder:text-gray-400"
                    style={{ color: '#111827' }}
                    placeholder="Airport, City, or Address"
                    required
                  />
                  
                  {/* Pickup Dropdown */}
                  {showPickupDropdown && filteredPickupLocations.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-80 overflow-y-auto">
                      {filteredPickupLocations.map((location) => (
                        <button
                          key={location.code}
                          type="button"
                          onClick={() => handlePickupSelect(location)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded">
                              <MapPin className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{location.name}</p>
                              <p className="text-sm text-gray-600">{location.country}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={dropoffRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1 text-blue-600" />
                    Drop-off Location
                  </label>
                  <input
                    type="text"
                    value={dropoffInput}
                    onChange={(e) => {
                      setDropoffInput(e.target.value);
                      setShowDropoffDropdown(true);
                    }}
                    onFocus={() => setShowDropoffDropdown(true)}
                    className="input-lg w-full text-gray-900 placeholder:text-gray-400"
                    style={{ color: '#111827' }}
                    placeholder="Same as pick-up or different location"
                  />
                  
                  {/* Dropoff Dropdown */}
                  {showDropoffDropdown && filteredDropoffLocations.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-80 overflow-y-auto">
                      {filteredDropoffLocations.map((location) => (
                        <button
                          key={location.code}
                          type="button"
                          onClick={() => handleDropoffSelect(location)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded">
                              <MapPin className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{location.name}</p>
                              <p className="text-sm text-gray-600">{location.country}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1 text-blue-600" />
                    Pick-up Date
                  </label>
                  <input
                    type="date"
                    value={searchForm.pickupDate}
                    onChange={(e) => setSearchForm({ ...searchForm, pickupDate: e.target.value })}
                    className="input-lg w-full"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pick-up Time</label>
                  <input
                    type="time"
                    value={searchForm.pickupTime}
                    onChange={(e) => setSearchForm({ ...searchForm, pickupTime: e.target.value })}
                    className="input-lg w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1 text-blue-600" />
                    Drop-off Date
                  </label>
                  <input
                    type="date"
                    value={searchForm.dropoffDate}
                    onChange={(e) => setSearchForm({ ...searchForm, dropoffDate: e.target.value })}
                    className="input-lg w-full"
                    min={searchForm.pickupDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Drop-off Time</label>
                  <input
                    type="time"
                    value={searchForm.dropoffTime}
                    onChange={(e) => setSearchForm({ ...searchForm, dropoffTime: e.target.value })}
                    className="input-lg w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Driver's Age</label>
                <select
                  value={searchForm.driverAge}
                  onChange={(e) => setSearchForm({ ...searchForm, driverAge: e.target.value })}
                  className="input-lg w-full md:w-64"
                >
                  <option value="18">18-24 years</option>
                  <option value="25">25-64 years</option>
                  <option value="65">65+ years</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="btn btn-primary w-full py-4 text-lg font-bold flex items-center justify-center"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Searching Cars...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Search Cars
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Available Cars <span className="text-blue-600">({results.length})</span>
            </h2>
            <div className="flex items-center space-x-4">
              {calculateDays() > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Rental Period</p>
                  <p className="text-lg font-bold text-gray-900">{calculateDays()} Days</p>
                </div>
              )}
              <select className="input">
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Category</option>
                <option>Most Popular</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {results.map((car) => (
              <div key={car.id} className="card hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                {/* Car Image */}
                <div className="relative overflow-hidden rounded-lg h-48 mb-4">
                  {car.image ? (
                    <img
                      src={car.image}
                      alt={car.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Car className="h-16 w-16 text-blue-400" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {car.category}
                  </div>
                  {car.fuelType === 'Electric' && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                      <Zap className="h-3 w-3 mr-1" />
                      Eco
                    </div>
                  )}
                </div>

                {/* Car Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {car.name}
                    </h3>
                    <p className="text-sm text-gray-600">or similar {car.category.toLowerCase()}</p>
                  </div>

                  {/* Specifications */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>{car.passengers} Passengers</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span>{car.luggage} Bags</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <span>{car.transmission}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Fuel className="h-4 w-4 text-blue-600" />
                      <span>{car.fuelType}</span>
                    </div>
                  </div>

                  {/* Vendor Info */}
                  {car.vendor?.name && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Provider:</span> {car.vendor.name}
                    </div>
                  )}

                  {/* Features */}
                  {car.features && car.features.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {car.features.map((feature: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price and Action */}
                  <div className="border-t pt-4">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">From</p>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-3xl font-bold text-blue-600">
                            {car.currency === 'USD' ? '$' : car.currency} {car.pricePerDay?.toFixed(2) || '0.00'}
                          </span>
                          <span className="text-sm text-gray-600">/day</span>
                        </div>
                        {calculateDays() > 0 && car.totalPrice > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            Total: <span className="font-semibold">
                              {car.currency === 'USD' ? '$' : car.currency} {car.totalPrice?.toFixed(2) || '0.00'}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleBookNow(car)}
                      className="btn btn-primary w-full font-bold flex items-center justify-center"
                    >
                      <Car className="h-5 w-5 mr-2" />
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !isSearching && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Car className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Cars Selected</h3>
            <p className="text-gray-600">Start your search to find the perfect vehicle</p>
          </div>
        </div>
      )}
    </div>
  );
}
