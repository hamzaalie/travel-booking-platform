import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { flightApi } from '@/services/api';
import { RootState } from '@/store';
import { convertPrice } from '@/store/slices/currencySlice';
import { Plane, Calendar, Users, ArrowRight, Clock, AlertCircle, ChevronDown, ChevronUp, Luggage, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AirlineLogo from '@/components/common/AirlineLogo';
import FlightSearchLoader from '@/components/common/FlightSearchLoader';
import { getAirlineName } from '@/utils/airlines';

export default function FlightResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [expandedFlight, setExpandedFlight] = useState<number | null>(null);

  // Currency conversion
  const { currentCurrency, currencies, exchangeRates } = useSelector(
    (state: RootState) => state.currency
  );

  const formatPrice = (amount: number, sourceCurrency?: string) => {
    const source = sourceCurrency || 'USD';
    if (currentCurrency === source) {
      // Same currency, no conversion needed
      const info = currencies.find(c => c.code === source);
      const symbol = info?.symbol || source;
      return `${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return convertPrice(amount, currentCurrency, exchangeRates, currencies, source);
  };

  const searchData = {
    tripType: searchParams.get('tripType') || 'ONE_WAY',
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    departureDate: searchParams.get('departDate') || searchParams.get('departureDate') || '',
    returnDate: searchParams.get('returnDate'),
    adults: parseInt(searchParams.get('adults') || '1'),
    children: parseInt(searchParams.get('children') || '0'),
    infants: parseInt(searchParams.get('infants') || '0'),
    travelClass: searchParams.get('cabinClass') || 'ECONOMY',
  };

  const { data: response, isLoading, error, isError } = useQuery({
    queryKey: ['flights', searchParams.toString()],
    queryFn: () => flightApi.search(searchData),
    enabled: !!(searchData.origin && searchData.destination && searchData.departureDate),
    retry: 2,
    retryDelay: 1000,
  });

  const flights = (response as any)?.data || [];

  useEffect(() => {
    if (isError && error) {
      console.error('Flight search error:', error);
      toast.error('Failed to fetch flights. Please check your connection and try again.');
    }
  }, [isError, error]);

  if (!searchData.origin || !searchData.destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Search</h2>
          <button
            onClick={() => navigate('/search')}
            className="btn btn-primary"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Search Summary Header */}
      <div className="bg-white shadow-md border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-6 flex-wrap gap-3">
              <div className="flex items-center space-x-2 bg-primary-50 px-4 py-2 rounded-lg">
                <Plane className="h-5 w-5 text-primary-950" />
                <span className="font-bold text-gray-900 text-lg">
                  {searchData.origin} → {searchData.destination}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="font-medium">{searchData.departureDate}</span>
                {searchData.returnDate && (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span className="font-medium">{searchData.returnDate}</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="font-medium">
                  {searchData.adults + searchData.children + searchData.infants} Passenger{(searchData.adults + searchData.children + searchData.infants) > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="btn btn-secondary btn-sm"
            >
              Modify Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <FlightSearchLoader />
        ) : isError ? (
          <div className="text-center py-20">
            <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Unable to Search Flights</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We're having trouble connecting to the flight booking system. Please check your internet connection and try again.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="btn btn-primary btn-lg font-bold"
            >
              Try Again
            </button>
          </div>
        ) : flights && flights.length > 0 ? (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-2">
                  {flights.length} Flight{flights.length > 1 ? 's' : ''} Found
                </h2>
                <p className="text-gray-600">Choose the best option for your journey</p>
              </div>
            </div>
            <div className="space-y-6">
              {flights.map((flight: any, index: number) => {
                // Helper function to format time from ISO string
                const formatTime = (isoString: string) => {
                  if (!isoString) return 'N/A';
                  const date = new Date(isoString);
                  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                };

                // Helper function to format date
                const formatDate = (isoString: string) => {
                  if (!isoString) return '';
                  const date = new Date(isoString);
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
                };

                // Helper function to format duration
                const formatDuration = (duration: string) => {
                  if (!duration) return 'N/A';
                  const hours = duration.match(/(\d+)H/)?.[1] || '0';
                  const minutes = duration.match(/(\d+)M/)?.[1] || '0';
                  return `${hours} Hr ${minutes} Mins`;
                };

                // Calculate layover duration
                const calculateLayover = (arrival: string, departure: string) => {
                  if (!arrival || !departure) return '';
                  const diff = new Date(departure).getTime() - new Date(arrival).getTime();
                  const hours = Math.floor(diff / (1000 * 60 * 60));
                  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                  return `${hours}h ${minutes}m layover`;
                };

                // Get first itinerary (outbound flight)
                const itinerary = flight.itineraries?.[0];
                const segments = itinerary?.segments || [];
                const firstSegment = segments[0];
                const lastSegment = segments[segments.length - 1];
                const numberOfStops = segments.length - 1;

                // Get airline info
                const airlineCode = firstSegment?.carrierCode || 'Unknown';
                const flightNumber = firstSegment?.number || '';

                // Get baggage info
                const travelerPricing = flight.travelerPricings?.[0];
                const fareDetails = travelerPricing?.fareDetailsBySegment?.[0];
                const checkedBags = fareDetails?.includedCheckedBags?.weight 
                  ? `${fareDetails.includedCheckedBags.weight} ${fareDetails.includedCheckedBags.weightUnit || 'Kg'}`
                  : '46 Kg (2 Pcs)';
                const cabinBaggage = '7 Kg / person';

                const isExpanded = expandedFlight === index;

                return (
                  <div key={flight.id || index} className="card bg-white border border-gray-200 hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                      {/* Main Flight Info */}
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-4">
                        {/* Airline Logo & Info */}
                        <AirlineLogo 
                          code={airlineCode} 
                          size="large"
                          showName={true}
                          flightNumber={flightNumber}
                        />

                        {/* Flight Route */}
                        <div className="flex-1 flex items-center justify-between">
                          {/* Departure */}
                          <div className="text-left">
                            <p className="text-sm text-gray-600 mb-1">{firstSegment?.departure?.iataCode}</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                              {formatTime(firstSegment?.departure?.at)}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{formatDate(firstSegment?.departure?.at)}</p>
                          </div>

                          {/* Duration & Stops */}
                          <div className="flex-1 px-3 sm:px-6 text-center">
                            <div className="relative flex items-center justify-center mb-2">
                              <div className="absolute w-full h-0.5 bg-gray-300"></div>
                              <div className="relative bg-white px-2">
                                <Plane className="h-5 w-5 text-primary-950 transform rotate-90" />
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-700">
                              {formatDuration(itinerary?.duration)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {numberOfStops === 0 ? 'Non Stop' : `${numberOfStops} Stop${numberOfStops > 1 ? 's' : ''}`}
                            </p>
                          </div>

                          {/* Arrival */}
                          <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">{lastSegment?.arrival?.iataCode}</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                              {formatTime(lastSegment?.arrival?.at)}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{formatDate(lastSegment?.arrival?.at)}</p>
                          </div>
                        </div>

                        {/* Price & Book Button */}
                        <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start lg:text-right border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Total</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-950 mb-1">
                              {formatPrice(parseFloat(flight.price?.total || flight.price?.grandTotal || '0'), flight.price?.currency)}
                            </p>
                            <p className="text-xs text-gray-600 mb-3">for all travelers</p>
                          </div>
                          <button
                            onClick={() => {
                              sessionStorage.setItem('selectedFlight', JSON.stringify(flight));
                              sessionStorage.setItem('searchData', JSON.stringify(searchData));
                              navigate('/booking/flight');
                            }}
                            className="btn btn-primary font-bold px-6 lg:w-full"
                          >
                            BOOK NOW
                          </button>
                        </div>
                      </div>

                      {/* Additional Info Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
                          {/* Flight Details Button */}
                          <button
                            onClick={() => setExpandedFlight(isExpanded ? null : index)}
                            className="flex items-center gap-1 text-primary-950 hover:text-primary-900 font-medium"
                          >
                            <Plane className="h-4 w-4" />
                            Flight Details
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>

                          {/* Baggage Info */}
                          <div className="flex items-center gap-1 text-gray-600">
                            <Luggage className="h-4 w-4" />
                            {checkedBags}
                          </div>

                          {/* Cabin Baggage */}
                          <div className="flex items-center gap-1 text-gray-600">
                            <Luggage className="h-3 w-3" />
                            {cabinBaggage}
                          </div>
                        </div>

                        {/* Non Refundable Badge */}
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <XCircle className="h-4 w-4" />
                          Non Refundable
                        </div>

                        {/* Share Button */}
                        <button className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium">
                          <ArrowRight className="h-4 w-4" />
                          Share
                        </button>
                      </div>

                      {/* Expanded Flight Details */}
                      {isExpanded && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-4">Flight Itinerary</h4>
                          <div className="space-y-4">
                            {segments.map((segment: any, segIndex: number) => (
                              <div key={segIndex}>
                                <div className="flex gap-4">
                                  {/* Timeline */}
                                  <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-primary-950"></div>
                                    {segIndex < segments.length - 1 && (
                                      <div className="w-0.5 h-20 bg-gray-300 my-2"></div>
                                    )}
                                  </div>

                                  {/* Segment Details */}
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <p className="font-bold text-gray-900">
                                          {segment.departure.iataCode} → {segment.arrival.iataCode}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {formatTime(segment.departure.at)} - {formatTime(segment.arrival.at)} • {formatDuration(segment.duration)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {formatDate(segment.departure.at)}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-700">
                                          {getAirlineName(segment.operating?.carrierCode || segment.carrierCode)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {segment.carrierCode}-{segment.number} • {segment.aircraft?.code || 'Aircraft'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Layover Info */}
                                    {segIndex < segments.length - 1 && (
                                      <div className="mt-4 mb-2">
                                        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
                                          <Clock className="h-4 w-4" />
                                          <span className="font-medium">
                                            {calculateLayover(segment.arrival.at, segments[segIndex + 1].departure.at)} at {segment.arrival.iataCode}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Baggage Details */}
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <h5 className="font-semibold text-gray-900 mb-3">Baggage Information</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Luggage className="h-5 w-5 text-gray-600" />
                                <div>
                                  <p className="font-medium text-gray-900">Check-in Baggage</p>
                                  <p className="text-gray-600">{checkedBags}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Luggage className="h-4 w-4 text-gray-600" />
                                <div>
                                  <p className="font-medium text-gray-900">Cabin Baggage</p>
                                  <p className="text-gray-600">{cabinBaggage}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Flights Found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We couldn't find any flights matching your search criteria. Try adjusting your dates or destinations.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="btn btn-primary btn-lg"
            >
              Try Different Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
