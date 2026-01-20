import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Users, MapPin, ArrowLeftRight, Plane } from 'lucide-react';

interface SearchFormProps {
  onSearch?: (params: any) => void;
}

// Popular airports with countries
const airports = [
  { code: 'JFK', city: 'New York', country: 'United States' },
  { code: 'LAX', city: 'Los Angeles', country: 'United States' },
  { code: 'LHR', city: 'London', country: 'United Kingdom' },
  { code: 'CDG', city: 'Paris', country: 'France' },
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore' },
  { code: 'HND', city: 'Tokyo', country: 'Japan' },
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong' },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand' },
  { code: 'KTM', city: 'Kathmandu', country: 'Nepal' },
  { code: 'DEL', city: 'Delhi', country: 'India' },
  { code: 'BOM', city: 'Mumbai', country: 'India' },
  { code: 'SYD', city: 'Sydney', country: 'Australia' },
  { code: 'MEL', city: 'Melbourne', country: 'Australia' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey' },
  { code: 'DOH', city: 'Doha', country: 'Qatar' },
  { code: 'ICN', city: 'Seoul', country: 'South Korea' },
  { code: 'NRT', city: 'Tokyo Narita', country: 'Japan' },
];

export default function SearchForm({ onSearch }: SearchFormProps) {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY'>('ROUND_TRIP');
  
  const [originInput, setOriginInput] = useState('');
  const [origin, setOrigin] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  
  const [destinationInput, setDestinationInput] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState('ECONOMY');
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  const totalPassengers = adults + children + infants;

  // Filter airports based on input
  const filterAirports = (input: string) => {
    if (!input) return [];
    const searchTerm = input.toLowerCase();
    return airports.filter(
      airport =>
        airport.code.toLowerCase().includes(searchTerm) ||
        airport.city.toLowerCase().includes(searchTerm) ||
        airport.country.toLowerCase().includes(searchTerm)
    );
  };

  const filteredOriginAirports = filterAirports(originInput);
  const filteredDestinationAirports = filterAirports(destinationInput);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOriginSelect = (airport: typeof airports[0]) => {
    setOrigin(airport.code);
    setOriginCountry(airport.country);
    setOriginInput(`${airport.code} - ${airport.city}, ${airport.country}`);
    setShowOriginDropdown(false);
  };

  const handleDestinationSelect = (airport: typeof airports[0]) => {
    setDestination(airport.code);
    setDestinationCountry(airport.country);
    setDestinationInput(`${airport.code} - ${airport.city}, ${airport.country}`);
    setShowDestinationDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const searchParams = {
      tripType,
      origin,
      originCountry,
      destination,
      destinationCountry,
      departureDate,
      returnDate: tripType === 'ROUND_TRIP' ? returnDate : undefined,
      adults,
      children,
      infants,
      cabinClass,
    };

    if (onSearch) {
      onSearch(searchParams);
    } else {
      // Navigate to search results with query params
      const queryParams: Record<string, string> = {
        tripType,
        origin,
        originCountry,
        destination,
        destinationCountry,
        departureDate,
        adults: adults.toString(),
        children: children.toString(),
        infants: infants.toString(),
        cabinClass,
      };
      
      if (tripType === 'ROUND_TRIP' && returnDate) {
        queryParams.returnDate = returnDate;
      }
      
      const query = new URLSearchParams(queryParams).toString();
      navigate(`/search/results?${query}`);
    }
  };

  const swapLocations = () => {
    const tempInput = originInput;
    const tempCode = origin;
    const tempCountry = originCountry;
    
    setOriginInput(destinationInput);
    setOrigin(destination);
    setOriginCountry(destinationCountry);
    
    setDestinationInput(tempInput);
    setDestination(tempCode);
    setDestinationCountry(tempCountry);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
      {/* Trip Type Selector */}
      <div className="flex gap-3 mb-8">
        <button
          type="button"
          onClick={() => setTripType('ROUND_TRIP')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            tripType === 'ROUND_TRIP'
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Plane className="inline h-4 w-4 mr-2" />
          Round Trip
        </button>
        <button
          type="button"
          onClick={() => setTripType('ONE_WAY')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            tripType === 'ONE_WAY'
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Plane className="inline h-4 w-4 mr-2" />
          One Way
        </button>
        <button
          type="button"
          onClick={() => setTripType('MULTI_CITY')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            tripType === 'MULTI_CITY'
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Plane className="inline h-4 w-4 mr-2" />
          Multi City
        </button>
      </div>

      {/* Origin & Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative">
        {/* Origin */}
        <div className="relative" ref={originRef}>
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <div className="bg-primary-100 p-1.5 rounded-lg mr-2">
              <MapPin className="h-4 w-4 text-primary-600" />
            </div>
            From
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={originInput}
              onChange={(e) => {
                setOriginInput(e.target.value);
                setShowOriginDropdown(true);
              }}
              onFocus={() => setShowOriginDropdown(true)}
              placeholder="Enter city or airport code"
              className="input-lg w-full pl-12 text-lg font-medium text-gray-900"
            />
            <Plane className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-1">Enter airport code & country</p>
          
          {/* Dropdown */}
          {showOriginDropdown && filteredOriginAirports.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-80 overflow-y-auto">
              {filteredOriginAirports.map((airport) => (
                <button
                  key={airport.code}
                  type="button"
                  onClick={() => handleOriginSelect(airport)}
                  className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-2 rounded">
                      <Plane className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{airport.code} - {airport.city}</p>
                      <p className="text-sm text-gray-600">{airport.country}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={swapLocations}
          className="absolute left-1/2 top-14 transform -translate-x-1/2 bg-white border-2 border-primary-200 p-3 rounded-full hover:bg-primary-50 hover:border-primary-400 transition-all duration-300 shadow-lg hover:shadow-xl z-10 hidden md:block"
          title="Swap locations"
        >
          <ArrowLeftRight className="h-5 w-5 text-primary-600" />
        </button>

        {/* Destination */}
        <div className="relative" ref={destinationRef}>
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <div className="bg-primary-100 p-1.5 rounded-lg mr-2">
              <MapPin className="h-4 w-4 text-primary-600" />
            </div>
            To
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={destinationInput}
              onChange={(e) => {
                setDestinationInput(e.target.value);
                setShowDestinationDropdown(true);
              }}
              onFocus={() => setShowDestinationDropdown(true)}
              placeholder="Enter city or airport code"
              className="input-lg w-full pl-12 text-lg font-medium text-gray-900"
            />
            <Plane className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 rotate-90" />
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-1">Enter airport code & country</p>
          
          {/* Dropdown */}
          {showDestinationDropdown && filteredDestinationAirports.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-80 overflow-y-auto">
              {filteredDestinationAirports.map((airport) => (
                <button
                  key={airport.code}
                  type="button"
                  onClick={() => handleDestinationSelect(airport)}
                  className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-2 rounded">
                      <Plane className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{airport.code} - {airport.city}</p>
                      <p className="text-sm text-gray-600">{airport.country}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <div className="bg-green-100 p-1.5 rounded-lg mr-2">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
            Departure Date
          </label>
          <div className="relative">
            <input
              type="date"
              required
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input-lg w-full text-gray-900"
              style={{ colorScheme: 'light' }}
            />
          </div>
        </div>
        {tripType === 'ROUND_TRIP' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <div className="bg-orange-100 p-1.5 rounded-lg mr-2">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
              Return Date
            </label>
            <div className="relative">
              <input
                type="date"
                required={tripType === 'ROUND_TRIP'}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={departureDate || new Date().toISOString().split('T')[0]}
                className="input-lg w-full text-gray-900"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Passengers & Class */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Passenger Selector */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <div className="bg-purple-100 p-1.5 rounded-lg mr-2">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            Passengers
          </label>
          <button
            type="button"
            onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
            className="w-full input-lg text-left flex items-center justify-between"
          >
            <span className="font-medium text-gray-900">
              {totalPassengers} {totalPassengers === 1 ? 'Passenger' : 'Passengers'}
            </span>
            <Users className="h-5 w-5 text-gray-400" />
          </button>

          {/* Passenger Dropdown */}
          {showPassengerDropdown && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-6 z-20">
              <div className="space-y-5">
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Adults</div>
                    <div className="text-sm text-gray-500">12+ years</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-600 font-bold transition-all"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults(Math.min(9, adults + 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-600 font-bold transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Children</div>
                    <div className="text-sm text-gray-500">2-11 years</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-600 font-bold transition-all"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren(Math.min(9, children + 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-600 font-bold transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Infants</div>
                    <div className="text-sm text-gray-500">Under 2 years</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setInfants(Math.max(0, infants - 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-600 font-bold transition-all"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{infants}</span>
                    <button
                      type="button"
                      onClick={() => setInfants(Math.min(9, infants + 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-600 font-bold transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPassengerDropdown(false)}
                className="mt-6 w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors font-semibold"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Cabin Class */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <div className="bg-blue-100 p-1.5 rounded-lg mr-2">
              <Plane className="h-4 w-4 text-blue-600" />
            </div>
            Cabin Class
          </label>
          <div className="relative">
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
              className="input-lg w-full appearance-none pr-12 cursor-pointer bg-white font-medium text-gray-900"
            >
              <option value="ECONOMY">Economy Class</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business Class</option>
              <option value="FIRST">First Class</option>
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search Button */}
      <button 
        type="submit" 
        className="w-full btn btn-primary btn-lg py-5 text-xl font-bold shadow-2xl hover:shadow-3xl"
      >
        <Search className="inline h-6 w-6 mr-3" />
        Search Flights
      </button>
      
      <p className="text-center text-sm text-gray-500 mt-4">
        ✨ Search from 500+ airlines worldwide • Instant results
      </p>
    </form>
  );
}
