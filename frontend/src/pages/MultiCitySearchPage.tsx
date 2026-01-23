/**
 * Multi-City Flight Search Page
 * Complete integration of search form and results display
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MultiCitySearchForm } from '@/components/flights/MultiCitySearchForm';
import { MultiCityResults } from '@/components/flights/MultiCityResults';
import { type MultiCityFlightOffer } from '../../shared/multiCityTypes';
import axios from 'axios';
import { Plane, ArrowLeft } from 'lucide-react';

interface SearchResponse {
  searchId: string;
  segments: any[];
  offers: MultiCityFlightOffer[];
  meta: {
    count: number;
    currency: string;
    searchedAt: string;
  };
}

export const MultiCitySearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<MultiCityFlightOffer | null>(null);

  const handleSearch = async (formData: any) => {
    setIsSearching(true);
    setSearchResults(null);
    setSelectedOffer(null);

    try {
      const response = await axios.post<{ success: boolean; data: SearchResponse }>(
        '/api/flights/search/multi-city',
        formData
      );

      if (response.data.success) {
        setSearchResults(response.data.data);
        toast.success(`Found ${response.data.data.offers.length} flight options!`);
        
        // Scroll to results
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 100);
      }
    } catch (error: any) {
      console.error('Multi-city search error:', error);
      const errorMessage = error.response?.data?.error || 'Search failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectOffer = (offer: MultiCityFlightOffer) => {
    setSelectedOffer(offer);
    
    // Store in session storage for booking flow
    sessionStorage.setItem('selectedFlightOffer', JSON.stringify(offer));
    sessionStorage.setItem('searchType', 'MULTI_CITY');
    sessionStorage.setItem('searchSegments', JSON.stringify(searchResults?.segments));

    // Navigate to booking page
    toast.success('Flight selected! Proceeding to booking...');
    
    setTimeout(() => {
      navigate('/booking', {
        state: {
          offer,
          searchType: 'MULTI_CITY',
          segments: searchResults?.segments,
        },
      });
    }, 1000);
  };

  const handleBackToSearch = () => {
    navigate('/flights');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={handleBackToSearch}
            className="flex items-center space-x-2 text-white hover:text-blue-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Flight Search</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <Plane className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Multi-City Flight Search</h1>
              <p className="text-blue-100 mt-1">
                Book complex itineraries with multiple destinations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Form - Sticky Sidebar on Desktop */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Search Flights</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Add 2 to 6 flight segments
                  </p>
                </div>

                <MultiCitySearchForm
                  onSearch={handleSearch}
                  isLoading={isSearching}
                />
              </div>

              {/* Tips Card */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Use flexible dates for better prices</li>
                  <li>• Each segment connects to the next</li>
                  <li>• Circular routes may cost more</li>
                  <li>• Book early for complex itineraries</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div id="results-section" className="lg:col-span-2">
            {isSearching && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <Plane className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">Searching flights...</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Finding the best options for your multi-city journey
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isSearching && searchResults && (
              <div className="space-y-6">
                {/* Results Header */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {searchResults.meta.count} Flight Options Found
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {searchResults.segments.length} segments • Searched at{' '}
                        {new Date(searchResults.meta.searchedAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSearchResults(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        New Search
                      </button>
                    </div>
                  </div>

                  {/* Journey Overview */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                      {searchResults.segments.map((segment: any, index: number) => (
                        <React.Fragment key={index}>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                              {segment.origin}
                            </span>
                            <Plane className="w-4 h-4 text-gray-400" />
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                              {segment.destination}
                            </span>
                          </div>
                          {index < searchResults.segments.length - 1 && (
                            <span className="text-gray-400 flex-shrink-0">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results List */}
                <MultiCityResults
                  offers={searchResults.offers}
                  onSelectOffer={handleSelectOffer}
                  selectedOfferId={selectedOffer?.id}
                  currency={searchResults.meta.currency}
                />
              </div>
            )}

            {!isSearching && !searchResults && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plane className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Search?
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Fill out the search form on the left to find the best multi-city flight options
                  for your journey.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      {searchResults && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg py-4 z-40">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedOffer ? (
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>Flight selected • {searchResults.meta.currency} {selectedOffer.price.total.toLocaleString()}</span>
                </span>
              ) : (
                `${searchResults.meta.count} options available`
              )}
            </div>

            {selectedOffer && (
              <button
                onClick={() => handleSelectOffer(selectedOffer)}
                className="btn btn-primary"
              >
                Continue to Booking
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiCitySearchPage;
