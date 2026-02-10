import { Link } from 'react-router-dom';
import { 
  Plane, Shield, Wallet, TrendingUp, HeadphonesIcon, 
  Award, Users, CheckCircle, Star, ArrowRight, Zap, Lock, CreditCard,
  BarChart3, Smartphone
} from 'lucide-react';
import SearchForm from '@/components/common/SearchForm';
import PopularDestinations from '@/components/common/PopularDestinations';

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section with Search Form */}
      <div className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-accent-600 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full mb-6 border border-white/20">
              <Star className="h-4 w-4 text-yellow-400 mr-2" />
              <span className="text-sm font-semibold">Trusted by 1000+ Travel Agencies Worldwide</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              Book Your Dream
              <span className="block bg-gradient-to-r from-accent-300 via-accent-400 to-accent-500 bg-clip-text text-transparent">
                Journey Today
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-accent-100 max-w-3xl mx-auto leading-relaxed">
              Experience seamless travel booking with real-time availability, competitive prices, 
              and 24/7 customer support. Your perfect trip is just a click away.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-sm font-medium">Instant Confirmation</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-sm font-medium">Best Price Guarantee</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-sm font-medium">Secure Payment</span>
              </div>
            </div>
          </div>

          {/* Search Form Card */}
          <div className="max-w-5xl mx-auto animate-slide-up">
            <SearchForm />
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto">
            <path fill="#f9fafb" fillOpacity="1" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      {/* Popular Destinations Slider */}
      <PopularDestinations />

      {/* Features Section */}
      <div className="section bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title font-display">
              Why Choose <span className="gradient-text">Peakpass Travel</span>
            </h2>
            <p className="section-subtitle">
              Experience the most advanced travel booking platform with cutting-edge technology 
              and unparalleled customer service
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card card-hover text-center group">
              <div className="bg-gradient-to-br from-primary-500 to-primary-950 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Plane className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">GDS Integration</h3>
              <p className="text-gray-600 leading-relaxed">Amadeus API integration for real-time flight availability across 500+ airlines worldwide</p>
            </div>

            <div className="card card-hover text-center group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Wallet className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">Smart Wallet</h3>
              <p className="text-gray-600 leading-relaxed">Secure digital wallet with immutable ledger and instant fund transfers for B2B agents</p>
            </div>

            <div className="card card-hover text-center group">
              <div className="bg-gradient-to-br from-accent-500 to-accent-500 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">Dynamic Pricing</h3>
              <p className="text-gray-600 leading-relaxed">Multi-layer markup engine with agent-specific controls and real-time pricing updates</p>
            </div>

            <div className="card card-hover text-center group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">Secure Payments</h3>
              <p className="text-gray-600 leading-relaxed">Multiple payment gateways with PCI DSS compliance and fraud protection</p>
            </div>

            <div className="card card-hover text-center group">
              <div className="bg-gradient-to-br from-primary-900 to-primary-950 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">Instant Booking</h3>
              <p className="text-gray-600 leading-relaxed">Lightning-fast booking process with instant confirmation and e-ticket delivery</p>
            </div>

            <div className="card card-hover text-center group">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <HeadphonesIcon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">24/7 Support</h3>
              <p className="text-gray-600 leading-relaxed">Round-the-clock customer support via phone, email, and live chat in multiple languages</p>
            </div>

            <div className="card card-hover text-center group">
              <div className="bg-gradient-to-br from-primary-900 to-primary-950 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">Analytics Dashboard</h3>
              <p className="text-gray-600 leading-relaxed">Comprehensive reporting with real-time insights, revenue tracking, and performance metrics</p>
            </div>

            <div className="card card-hover text-center group">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Smartphone className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">Mobile Ready</h3>
              <p className="text-gray-600 leading-relaxed">Fully responsive design optimized for mobile devices with native app experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="section bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title font-display">How It Works</h2>
            <p className="section-subtitle">Book your perfect trip in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center relative">
              <div className="bg-primary-950 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Search & Compare</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Enter your travel details and instantly compare flights from hundreds of airlines. 
                Filter by price, duration, or stops to find your perfect match.
              </p>
              {/* Arrow for desktop */}
              <div className="hidden md:block absolute top-8 -right-6 text-primary-300">
                <ArrowRight className="h-8 w-8" />
              </div>
            </div>

            <div className="text-center relative">
              <div className="bg-primary-950 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Select & Customize</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Choose your preferred flight, add extras like baggage or meals, and enter passenger 
                details. Review everything before proceeding to payment.
              </p>
              {/* Arrow for desktop */}
              <div className="hidden md:block absolute top-8 -right-6 text-primary-300">
                <ArrowRight className="h-8 w-8" />
              </div>
            </div>

            <div className="text-center">
              <div className="bg-primary-950 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Pay & Fly</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Complete your secure payment and receive instant confirmation with your e-ticket. 
                Track your booking and manage everything from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Security Section */}
      <div className="section bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-3xl p-12 border-2 border-primary-100">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
                Your Trust, Our Priority
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Industry-leading security measures to protect your data and transactions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Lock className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">SSL Encrypted</h3>
                <p className="text-gray-600">256-bit SSL encryption ensures all your data is transmitted securely</p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <CreditCard className="h-8 w-8 text-primary-950" />
                </div>
                <h3 className="text-xl font-bold mb-3">PCI Compliant</h3>
                <p className="text-gray-600">Fully PCI DSS certified for secure payment processing and data handling</p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Award className="h-8 w-8 text-accent-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Verified Platform</h3>
                <p className="text-gray-600">Certified by leading industry bodies and trusted by millions worldwide</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="section bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title font-display">What Our Customers Say</h2>
            <p className="section-subtitle">Join thousands of satisfied travelers who trust us</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100">
              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed italic">
                "The easiest booking experience ever! Found the perfect flight at an amazing price. 
                The customer support team was incredibly helpful throughout the entire process."
              </p>
              <div className="flex items-center">
                <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center text-primary-900 font-bold text-lg mr-4">
                  SM
                </div>
                <div>
                  <div className="font-bold">Sarah Martinez</div>
                  <div className="text-sm text-gray-500">Business Traveler</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100">
              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed italic">
                "As a travel agent, this platform has transformed my business. The B2B features 
                and wallet system make managing bookings effortless. Highly recommended!"
              </p>
              <div className="flex items-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-700 font-bold text-lg mr-4">
                  JD
                </div>
                <div>
                  <div className="font-bold">James Davidson</div>
                  <div className="text-sm text-gray-500">Travel Agency Owner</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100">
              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed italic">
                "Booked a family vacation with complete peace of mind. The interface is intuitive, 
                prices are competitive, and the instant confirmation gave us confidence."
              </p>
              <div className="flex items-center">
                <div className="bg-accent-100 w-12 h-12 rounded-full flex items-center justify-center text-accent-600 font-bold text-lg mr-4">
                  EP
                </div>
                <div>
                  <div className="font-bold">Emily Peterson</div>
                  <div className="text-sm text-gray-500">Family Traveler</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="section bg-gradient-to-r from-primary-950 via-primary-950 to-accent-500 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-accent-100 max-w-2xl mx-auto leading-relaxed">
            Join over 1,000 travel agencies and millions of travelers who trust Peakpass Travel 
            for their flight reservations
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/search" 
              className="inline-flex items-center justify-center bg-white text-primary-900 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
            >
              <Plane className="mr-3 h-6 w-6" />
              Search Flights Now
            </Link>
            <Link 
              to="/register" 
              className="inline-flex items-center justify-center bg-transparent text-white px-10 py-5 rounded-2xl font-bold text-lg border-3 border-white hover:bg-white hover:text-primary-900 transition-all duration-300 shadow-2xl transform hover:-translate-y-1"
            >
              <Users className="mr-3 h-6 w-6" />
              Create Free Account
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <span>Free cancellation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
