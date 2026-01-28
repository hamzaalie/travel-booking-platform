import SearchForm from '@/components/common/SearchForm';
import PopularDestinations from '@/components/common/PopularDestinations';
import { Plane } from 'lucide-react';

export default function FlightSearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-4 rounded-full">
              <Plane className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Perfect Flight</h1>
          <p className="text-xl text-gray-600">Search thousands of flights with real-time prices</p>
        </div>

        <SearchForm />

        {/* Popular Destinations */}
        <div className="mt-12">
          <PopularDestinations noBg fullWidth />
        </div>
      </div>
    </div>
  );
}
