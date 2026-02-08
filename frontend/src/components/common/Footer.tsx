import { Link } from 'react-router-dom';
import { 
  Plane, Mail, Phone, MapPin, Facebook, Twitter, Instagram, 
  Linkedin, Youtube, Globe, Clock, Shield, Award 
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company This need to be added pr    opeor jbjbasdInfo */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-xl">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold">TravelBooking</h3>
                <p className="text-xs text-gray-400">Your Journey Partner</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed">
              The most advanced B2B & B2C travel booking platform with Amadeus GDS integration, 
              trusted by travel agencies worldwide.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-gray-800 p-2.5 rounded-lg hover:bg-primary-600 transition-all duration-300 hover:scale-110">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 p-2.5 rounded-lg hover:bg-primary-600 transition-all duration-300 hover:scale-110">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 p-2.5 rounded-lg hover:bg-primary-600 transition-all duration-300 hover:scale-110">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 p-2.5 rounded-lg hover:bg-primary-600 transition-all duration-300 hover:scale-110">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 p-2.5 rounded-lg hover:bg-primary-600 transition-all duration-300 hover:scale-110">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-display font-bold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/search" className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center">
                  Search Flights
                </Link>
              </li>
              <li>
                <Link to="/hotels" className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center">
                  Hotels
                </Link>
              </li>
              <li>
                <Link to="/cars" className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center">
                  Car Rental
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-display font-bold mb-6 text-white">Services</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center">
                  B2B Agent Portal
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center">
                  B2C Customer Booking
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center">
                  Corporate Travel
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center">
                  Group Bookings
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center">
                  Travel Insurance
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center">
                  Visa Assistance
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-display font-bold mb-6 text-white">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 leading-relaxed">
                  123 Travel Street, Suite 100<br />
                  New York, NY 10001, USA
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary-500 flex-shrink-0" />
                <a href="tel:+1234567890" className="text-gray-400 hover:text-white transition-colors">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary-500 flex-shrink-0" />
                <a href="mailto:support@travelbooking.com" className="text-gray-400 hover:text-white transition-colors">
                  support@travelbooking.com
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-primary-500 flex-shrink-0" />
                <span className="text-gray-400">24/7 Support Available</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
            <div className="flex items-center space-x-2 text-gray-400">
              <Shield className="h-6 w-6 text-green-500" />
              <div>
                <div className="text-xs font-semibold text-white">SSL Secured</div>
                <div className="text-xs">256-bit Encryption</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Award className="h-6 w-6 text-blue-500" />
              <div>
                <div className="text-xs font-semibold text-white">PCI Certified</div>
                <div className="text-xs">Secure Payments</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Globe className="h-6 w-6 text-purple-500" />
              <div>
                <div className="text-xs font-semibold text-white">IATA Accredited</div>
                <div className="text-xs">Trusted Partner</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Clock className="h-6 w-6 text-orange-500" />
              <div>
                <div className="text-xs font-semibold text-white">24/7 Support</div>
                <div className="text-xs">Always Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm text-center md:text-left">
              <p>&copy; {currentYear} TravelBooking Platform. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
              <Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Powered by Amadeus GDS | Integrated with leading payment gateways worldwide</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
