import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Calendar, Search, Star, Wifi, Utensils, Dumbbell, Car as ParkingIcon, Waves, Coffee, Shield, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { hotelApi } from '@/services/api';

// Popular cities for hotels
const cities = [
  { code: 'NYC', name: 'New York', country: 'United States' },
  { code: 'LON', name: 'London', country: 'United Kingdom' },
  { code: 'PAR', name: 'Paris', country: 'France' },
  { code: 'DXB', name: 'Dubai', country: 'United Arab Emirates' },
  { code: 'SIN', name: 'Singapore', country: 'Singapore' },
  { code: 'TYO', name: 'Tokyo', country: 'Japan' },
  { code: 'HKG', name: 'Hong Kong', country: 'Hong Kong' },
  { code: 'BKK', name: 'Bangkok', country: 'Thailand' },
  { code: 'KTM', name: 'Kathmandu', country: 'Nepal' },
  { code: 'DEL', name: 'Delhi', country: 'India' },
  { code: 'BOM', name: 'Mumbai', country: 'India' },
  { code: 'SYD', name: 'Sydney', country: 'Australia' },
  { code: 'MEL', name: 'Melbourne', country: 'Australia' },
  { code: 'AMS', name: 'Amsterdam', country: 'Netherlands' },
  { code: 'FRA', name: 'Frankfurt', country: 'Germany' },
  { code: 'IST', name: 'Istanbul', country: 'Turkey' },
  { code: 'DOH', name: 'Doha', country: 'Qatar' },
  { code: 'SEL', name: 'Seoul', country: 'South Korea' },
  { code: 'BER', name: 'Berlin', country: 'Germany' },
  { code: 'ROM', name: 'Rome', country: 'Italy' },
];

export default function HotelSearchPage() {
  const navigate = useNavigate();
  const [destinationInput, setDestinationInput] = useState('');
  const [destinationCode, setDestinationCode] = useState('');
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const destinationRef = useRef<HTMLDivElement>(null);
  
  const [searchForm, setSearchForm] = useState({
    checkIn: '',
    checkOut: '',
    rooms: '1',
    adults: '2',
    children: '0',
  });

  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter cities based on input
  const filterCities = (input: string) => {
    if (!input) return [];
    const searchTerm = input.toLowerCase();
    return cities.filter(
      city =>
        city.code.toLowerCase().includes(searchTerm) ||
        city.name.toLowerCase().includes(searchTerm) ||
        city.country.toLowerCase().includes(searchTerm)
    );
  };

  const filteredCities = filterCities(destinationInput);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = (city: typeof cities[0]) => {
    setDestinationCode(city.code);
    setDestinationInput(`${city.name}, ${city.country}`);
    setShowDestinationDropdown(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!destinationCode || !searchForm.checkIn || !searchForm.checkOut) {
      toast.error('Please fill all required fields');
      return;
    }

    // Validate that check-out is after check-in
    const checkInDate = new Date(searchForm.checkIn);
    const checkOutDate = new Date(searchForm.checkOut);
    
    if (checkOutDate <= checkInDate) {
      toast.error('Check-out date must be at least 1 day after check-in date');
      return;
    }

    try {
      setIsSearching(true);
      
      // Call Amadeus hotel search API
      const response = await hotelApi.search({
        cityCode: destinationCode,
        checkInDate: searchForm.checkIn,
        checkOutDate: searchForm.checkOut,
        adults: parseInt(searchForm.adults),
        rooms: parseInt(searchForm.rooms),
      }) as any;

      if (response.data && response.data.length > 0) {
        // Use real data from Amadeus API - no mock data
        const hotels = response.data.map((hotel: any) => {
          const firstOffer = hotel.offers?.[0];
          const address = hotel.address || {};
          
          // Build complete address string
          const addressParts = [
            address.street,
            address.city,
            address.country
          ].filter(Boolean);
          
          return {
            id: hotel.hotelId,
            name: hotel.name || 'Hotel Name Not Available',
            address: addressParts.length > 0 ? addressParts.join(', ') : 'Address not available',
            rating: hotel.rating ? parseFloat(hotel.rating) : null,
            description: hotel.description || '',
            location: hotel.location || null,
            price: firstOffer?.price?.total || 0,
            currency: firstOffer?.price?.currency || 'USD',
            amenities: hotel.amenities || [],
            photos: hotel.photos || [],
            offers: hotel.offers || [],
            available: hotel.offers && hotel.offers.length > 0,
          };
        });
        
        setResults(hotels);
        toast.success(`Found ${hotels.length} hotel${hotels.length > 1 ? 's' : ''} with available rooms!`);
      } else {
        setResults([]);
        toast.error('No hotels found for the selected criteria');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to search hotels';
      toast.error(errorMsg);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="h-4 w-4" />;
      case 'pool':
        return <Waves className="h-4 w-4" />;
      case 'restaurant':
        return <Utensils className="h-4 w-4" />;
      case 'parking':
        return <ParkingIcon className="h-4 w-4" />;
      case 'spa':
        return <Award className="h-4 w-4" />;
      case 'gym':
        return <Dumbbell className="h-4 w-4" />;
      case 'breakfast':
        return <Coffee className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Building2 className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Stay</h1>
            <p className="text-xl text-blue-100">Discover amazing hotels at unbeatable prices</p>
          </div>

          {/* Search Form */}
          <div className="card max-w-5xl mx-auto">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1 relative" ref={destinationRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1 text-primary-600" />
                    Destination
                  </label>
                  <input
                    type="text"
                    value={destinationInput}
                    onChange={(e) => {
                      setDestinationInput(e.target.value);
                      setShowDestinationDropdown(true);
                    }}
                    onFocus={() => setShowDestinationDropdown(true)}
                    className="input-lg w-full text-gray-900"
                    placeholder="Enter city name"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Search for your destination</p>
                  
                  {/* Dropdown */}
                  {showDestinationDropdown && filteredCities.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-80 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <button
                          key={city.code}
                          type="button"
                          onClick={() => handleCitySelect(city)}
                          className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-primary-100 p-2 rounded">
                              <Building2 className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{city.name}</p>
                              <p className="text-sm text-gray-600">{city.country}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1 text-primary-600" />
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={searchForm.checkIn}
                    onChange={(e) => {
                      setSearchForm({ ...searchForm, checkIn: e.target.value });
                      // Auto-adjust check-out if it's before or same as new check-in
                      if (searchForm.checkOut && e.target.value >= searchForm.checkOut) {
                        const nextDay = new Date(e.target.value);
                        nextDay.setDate(nextDay.getDate() + 1);
                        setSearchForm({
                          ...searchForm,
                          checkIn: e.target.value,
                          checkOut: nextDay.toISOString().split('T')[0]
                        });
                      }
                    }}
                    className="input-lg w-full"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1 text-primary-600" />
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={searchForm.checkOut}
                    onChange={(e) => setSearchForm({ ...searchForm, checkOut: e.target.value })}
                    className="input-lg w-full"
                    min={searchForm.checkIn ? new Date(new Date(searchForm.checkIn).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rooms</label>
                  <select
                    value={searchForm.rooms}
                    onChange={(e) => setSearchForm({ ...searchForm, rooms: e.target.value })}
                    className="input-lg w-full"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Room' : 'Rooms'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adults</label>
                  <select
                    value={searchForm.adults}
                    onChange={(e) => setSearchForm({ ...searchForm, adults: e.target.value })}
                    className="input-lg w-full"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Adult' : 'Adults'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Children</label>
                  <select
                    value={searchForm.children}
                    onChange={(e) => setSearchForm({ ...searchForm, children: e.target.value })}
                    className="input-lg w-full"
                  >
                    {[0, 1, 2, 3, 4].map((num) => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Child' : 'Children'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="btn btn-primary w-full py-4 text-lg font-bold flex items-center justify-center"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Searching Hotels...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Search Hotels
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
              Available Hotels <span className="text-primary-600">({results.length})</span>
            </h2>
            <select className="input">
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Rating: High to Low</option>
              <option>Most Popular</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {results.map((hotel) => (
              <div key={hotel.id} className="card hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Hotel Image */}
                  <div className="relative overflow-hidden rounded-lg h-64 md:h-full">
                    {hotel.photos && hotel.photos.length > 0 ? (
                      <img
                        src={hotel.photos[0]}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                        <Building2 className="h-20 w-20 text-primary-400" />
                      </div>
                    )}
                    {hotel.rating && (
                      <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-bold text-gray-900">{hotel.rating}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hotel Details */}
                  <div className="md:col-span-2 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-4">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="text-sm">{hotel.address}</span>
                      </div>

                      {/* Amenities */}
                      {hotel.amenities && hotel.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {hotel.amenities.slice(0, 6).map((amenity: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-1 bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-700"
                            >
                              {getAmenityIcon(amenity)}
                              <span>{amenity}</span>
                            </div>
                          ))}
                          {hotel.amenities.length > 6 && (
                            <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-700">
                              <span>+{hotel.amenities.length - 6} more</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Price and Action */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-t pt-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Starting from</p>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-3xl sm:text-4xl font-bold text-primary-600">
                            {hotel.currency === 'USD' ? '$' : hotel.currency} {parseFloat(hotel.price).toFixed(2)}
                          </span>
                          <span className="text-gray-600">/night</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigate(`/hotels/${hotel.id}`, {
                            state: {
                              hotel: {
                                hotelId: hotel.id,
                                name: hotel.name,
                                rating: hotel.rating,
                                description: hotel.description,
                                address: hotel.address,
                                location: hotel.location,
                                photos: hotel.photos,
                                amenities: hotel.amenities,
                                offers: hotel.offers,
                              }
                            }
                          });
                        }}
                        className="btn btn-primary px-8 py-3 w-full sm:w-auto whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </div>
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
            <Building2 className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Hotels Selected</h3>
            <p className="text-gray-600">Start your search to find amazing hotels</p>
          </div>
        </div>
      )}
    </div>
  );
}
