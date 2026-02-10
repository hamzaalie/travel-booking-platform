import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Building2, MapPin, Star, Wifi, Coffee, Car, Utensils,
  ChevronLeft, ChevronRight, Calendar, Users,
  Check, Info, CreditCard
} from 'lucide-react';

interface HotelDetails {
  hotelId: string;
  name: string;
  rating?: number;
  description?: string;
  address: string | {
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  photos: string[];
  amenities: string[];
  offers: Array<{
    id: string;
    checkInDate: string;
    checkOutDate: string;
    roomType: string;
    roomDescription?: string;
    boardType?: string;
    guests: number;
    price: {
      currency: string;
      total: number;
      base: number;
      taxes?: number;
    };
    cancellation?: {
      deadline: string;
      amount: number;
      description: string;
    };
  }>;
}

export default function HotelDetailsPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<HotelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Get hotel data from location state
    const locationState = (window.history.state as any)?.usr;
    const stateData = locationState?.hotel;
    
    if (stateData) {
      // Ensure the hotel data has proper structure
      const hotelData: HotelDetails = {
        hotelId: stateData.hotelId || stateData.id,
        name: stateData.name || 'Hotel Name Not Available',
        rating: stateData.rating,
        description: stateData.description,
        address: typeof stateData.address === 'string' 
          ? { street: stateData.address, city: '', country: '' }
          : stateData.address || { street: '', city: '', country: '' },
        location: stateData.location,
        photos: Array.isArray(stateData.photos) ? stateData.photos : [],
        amenities: Array.isArray(stateData.amenities) ? stateData.amenities : [],
        offers: Array.isArray(stateData.offers) ? stateData.offers : [],
      };
      
      setHotel(hotelData);
      setLoading(false);
    } else {
      toast.error('Hotel data not found. Please search for hotels again.');
      navigate('/hotels');
    }
  }, [hotelId, navigate]);

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi')) return <Wifi className="h-5 w-5" />;
    if (lower.includes('parking') || lower.includes('car')) return <Car className="h-5 w-5" />;
    if (lower.includes('restaurant') || lower.includes('dining')) return <Utensils className="h-5 w-5" />;
    if (lower.includes('coffee') || lower.includes('breakfast')) return <Coffee className="h-5 w-5" />;
    return <Check className="h-5 w-5" />;
  };

  const nextImage = () => {
    if (hotel && hotel.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % hotel.photos.length);
    }
  };

  const prevImage = () => {
    if (hotel && hotel.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + hotel.photos.length) % hotel.photos.length);
    }
  };

  const handleBookNow = (offerId: string) => {
    if (!hotel) return;
    const offer = hotel.offers.find(o => o.id === offerId);
    if (!offer) return;

    // Navigate to booking page with hotel and offer data
    navigate('/booking/hotel', {
      state: {
        hotel: {
          id: hotel.hotelId,
          name: hotel.name,
          address: hotel.address,
          rating: hotel.rating,
        },
        offer: offer,
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Search Results
        </button>

        {/* Image Gallery */}
        <div className="card overflow-hidden mb-8">
          {hotel.photos && hotel.photos.length > 0 ? (
            <div className="relative h-96 bg-gray-200">
              <img
                src={hotel.photos[currentImageIndex]}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
              {hotel.photos.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                    {currentImageIndex + 1} / {hotel.photos.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-96 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <Building2 className="h-32 w-32 text-primary-400" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hotel Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>
                      {typeof hotel.address === 'string'
                        ? hotel.address
                        : [hotel.address.street, hotel.address.city, hotel.address.country]
                            .filter(Boolean)
                            .join(', ') || 'Address not available'}
                    </span>
                  </div>
                </div>
                {hotel.rating && (
                  <div className="flex items-center space-x-2 bg-primary-50 px-4 py-2 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-400 fill-current" />
                    <span className="text-2xl font-bold text-gray-900">{hotel.rating}</span>
                  </div>
                )}
              </div>

              {hotel.description && (
                <div className="border-t pt-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Hotel</h2>
                  <p className="text-gray-700 leading-relaxed">{hotel.description}</p>
                </div>
              )}
            </div>

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center space-x-3 text-gray-700">
                      {getAmenityIcon(amenity)}
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Rooms */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Available Rooms ({hotel.offers.length})
              </h2>
              <div className="space-y-4">
                {hotel.offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="border border-gray-200 rounded-lg p-4 transition-all hover:border-primary-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {offer.roomType}
                        </h3>
                        {offer.roomDescription && (
                          <p className="text-sm text-gray-600 mb-2">{offer.roomDescription}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(offer.checkInDate).toLocaleDateString()} - {new Date(offer.checkOutDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {offer.guests} {offer.guests === 1 ? 'Guest' : 'Guests'}
                          </div>
                          {offer.boardType && (
                            <div className="flex items-center">
                              <Utensils className="h-4 w-4 mr-1" />
                              {offer.boardType}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm text-gray-600 mb-1">Total Price</div>
                        <div className="text-2xl font-bold text-primary-950">
                          {offer.price.currency} {offer.price.total.toFixed(2)}
                        </div>
                        {offer.price.taxes && offer.price.taxes > 0 && (
                          <div className="text-xs text-gray-500">
                            Including taxes: {offer.price.currency} {offer.price.taxes.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cancellation Policy */}
                    {offer.cancellation && (
                      <div className="flex items-start space-x-2 text-sm bg-accent-50 p-3 rounded-lg mb-3">
                        <Info className="h-4 w-4 text-primary-950 mt-0.5 flex-shrink-0" />
                        <div className="text-primary-950">
                          <div className="font-medium">Cancellation Policy</div>
                          <div>Free cancellation until {new Date(offer.cancellation.deadline).toLocaleString()}</div>
                          {offer.cancellation.description && (
                            <div className="text-xs mt-1">{offer.cancellation.description}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleBookNow(offer.id)}
                      className="btn btn-primary w-full flex items-center justify-center font-bold"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Book Now - {offer.price.currency} {offer.price.total.toFixed(2)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hotel</span>
                  <span className="font-medium text-gray-900">{hotel.name}</span>
                </div>
                {hotel.offers.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Check-in</span>
                      <span className="font-medium text-gray-900">
                        {new Date(hotel.offers[0].checkInDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Check-out</span>
                      <span className="font-medium text-gray-900">
                        {new Date(hotel.offers[0].checkOutDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Guests</span>
                      <span className="font-medium text-gray-900">
                        {hotel.offers[0].guests} {hotel.offers[0].guests === 1 ? 'Adult' : 'Adults'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Starting from</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-primary-950">
                      {hotel.offers[0]?.price.currency} {Math.min(...hotel.offers.map(o => o.price.total)).toFixed(2)}
                    </span>
                    <div className="text-sm text-gray-600">/night</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                <Check className="h-4 w-4 inline mr-1" />
                {hotel.offers.length} room option{hotel.offers.length > 1 ? 's' : ''} available
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
