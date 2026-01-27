import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Destination {
  id: string;
  name: string;
  country: string;
  code: string;
  tagline: string;
  image: string;
}

const popularDestinations: Destination[] = [
  {
    id: '1',
    name: 'Dubai',
    country: 'United Arab Emirates',
    code: 'DXB',
    tagline: 'City of Gold',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop'
  },
  {
    id: '2',
    name: 'Bangkok',
    country: 'Thailand',
    code: 'BKK',
    tagline: 'Temple Paradise',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&h=400&fit=crop'
  },
  {
    id: '3',
    name: 'Singapore',
    country: 'Singapore',
    code: 'SIN',
    tagline: 'Garden City',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&h=400&fit=crop'
  },
  {
    id: '4',
    name: 'Kuala Lumpur',
    country: 'Malaysia',
    code: 'KUL',
    tagline: 'Modern Skyline',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&h=400&fit=crop'
  },
  {
    id: '5',
    name: 'Bali',
    country: 'Indonesia',
    code: 'DPS',
    tagline: 'Island Paradise',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop'
  },
  {
    id: '6',
    name: 'Tokyo',
    country: 'Japan',
    code: 'NRT',
    tagline: 'Culture & Tech',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop'
  },
  {
    id: '7',
    name: 'London',
    country: 'United Kingdom',
    code: 'LHR',
    tagline: 'Royal Heritage',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop'
  },
  {
    id: '8',
    name: 'Paris',
    country: 'France',
    code: 'CDG',
    tagline: 'City of Love',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop'
  },
  {
    id: '9',
    name: 'New York',
    country: 'United States',
    code: 'JFK',
    tagline: 'The Big Apple',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop'
  },
  {
    id: '10',
    name: 'Sydney',
    country: 'Australia',
    code: 'SYD',
    tagline: 'Harbour City',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&h=400&fit=crop'
  },
  {
    id: '11',
    name: 'Maldives',
    country: 'Maldives',
    code: 'MLE',
    tagline: 'Tropical Heaven',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=400&fit=crop'
  },
  {
    id: '12',
    name: 'Istanbul',
    country: 'Turkey',
    code: 'IST',
    tagline: 'East Meets West',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&h=400&fit=crop'
  }
];

export default function PopularDestinations() {
  const navigate = useNavigate();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkScrollButtons);
      return () => slider.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 320; // Card width + gap
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleDestinationClick = (destination: Destination) => {
    // Get tomorrow's date for departure
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const departureDate = tomorrow.toISOString().split('T')[0];

    // Navigate to search results with the destination pre-filled
    const searchParams = new URLSearchParams({
      origin: 'KTM', // Default origin - Kathmandu
      destination: destination.code,
      departureDate: departureDate,
      adults: '1',
      children: '0',
      infants: '0',
      cabinClass: 'ECONOMY',
      tripType: 'ONE_WAY'
    });

    navigate(`/flights/search?${searchParams.toString()}`);
  };

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-1 bg-green-500 mx-auto mb-4 rounded-full"></div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            Popular Destinations
          </h2>
          <p className="text-gray-600 text-lg">
            We have selected best locations around the world for you.
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
              canScrollLeft 
                ? 'hover:bg-gray-50 hover:shadow-xl cursor-pointer opacity-100' 
                : 'opacity-0 cursor-default'
            }`}
            style={{ left: '-20px' }}
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
              canScrollRight 
                ? 'hover:bg-gray-50 hover:shadow-xl cursor-pointer opacity-100' 
                : 'opacity-0 cursor-default'
            }`}
            style={{ right: '-20px' }}
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>

          {/* Slider */}
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {popularDestinations.map((destination) => (
              <div
                key={destination.id}
                onClick={() => handleDestinationClick(destination)}
                className="flex-shrink-0 w-[300px] cursor-pointer group"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative h-[200px] overflow-hidden">
                    <img
                      src={destination.image}
                      alt={destination.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Hover overlay with "Search Flights" */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        Search Flights →
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-gray-500 text-sm mb-1">{destination.tagline}</p>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {destination.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{destination.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Link */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/flights/search')}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            View All Destinations
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
