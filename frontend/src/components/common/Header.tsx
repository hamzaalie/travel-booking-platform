import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { settingsApi } from '@/services/api';
import {
  LogOut, User, Menu, X, Home, Search, Briefcase,
  Mail, Phone, Smartphone, Plane, Hotel, Car, Globe,
} from 'lucide-react';
import { useState, useMemo } from 'react';
// MULTI-CURRENCY MODEL REMOVED - CurrencySelector disabled
// import CurrencySelector from './CurrencySelector';

const NAV_ICONS: Record<string, any> = {
  home: Home,
  search: Search,
  flights: Plane,
  'search flights': Plane,
  hotels: Hotel,
  'car rental': Car,
  cars: Car,
  esim: Smartphone,
  briefcase: Briefcase,
};

const DEFAULT_HEADER = {
  logo: '/images/logo.png',
  showTopBar: true,
  topBarMessage: '24/7 Customer Support',
  phoneNumber: '+1 (234) 567-890',
  email: 'support@peakpasstravel.com',
  navigationItems: [
    { label: 'Home', href: '/', icon: 'home' },
    { label: 'Search Flights', href: '/search', icon: 'flights' },
    { label: 'Hotels', href: '/hotels', icon: 'hotels' },
    { label: 'Car Rental', href: '/cars', icon: 'cars' },
    { label: 'eSIM', href: '/esim', icon: 'esim' },
  ],
};

const DEFAULT_BRANDING = {
  logo: '/images/logo.png',
};

const DEFAULT_GENERAL = {
  siteName: 'Peakpass Travel',
};

export default function Header() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: headerSettings } = useQuery({
    queryKey: ['public-header-settings'],
    queryFn: async () => {
      try {
        const response: any = await settingsApi.getHeader();
        return response.data || DEFAULT_HEADER;
      } catch {
        return DEFAULT_HEADER;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandingSettings } = useQuery({
    queryKey: ['public-branding-settings'],
    queryFn: async () => {
      try {
        const response: any = await settingsApi.getBranding();
        return response.data || DEFAULT_BRANDING;
      } catch {
        return DEFAULT_BRANDING;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: generalSettings } = useQuery({
    queryKey: ['public-general-settings'],
    queryFn: async () => {
      try {
        const response: any = await settingsApi.getGeneral();
        return response.data || DEFAULT_GENERAL;
      } catch {
        return DEFAULT_GENERAL;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const header = headerSettings || DEFAULT_HEADER;
  const branding = brandingSettings || DEFAULT_BRANDING;
  const general = generalSettings || DEFAULT_GENERAL;

  const logoUrl = header.logo || branding.logo || DEFAULT_HEADER.logo;
  const siteName = general.siteName || DEFAULT_GENERAL.siteName;
  const phoneNumber = header.phoneNumber || DEFAULT_HEADER.phoneNumber;
  const emailAddr = header.email || DEFAULT_HEADER.email;
  const topBarMessage = header.topBarMessage || DEFAULT_HEADER.topBarMessage;
  const showTopBar = header.showTopBar !== false;
  const navItems = useMemo(() => {
    return header.navigationItems?.length > 0
      ? header.navigationItems
      : DEFAULT_HEADER.navigationItems;
  }, [header.navigationItems]);

  const handleLogout = () => {
    dispatch(logout());
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'SUPER_ADMIN':
        return '/admin';
      case 'B2B_AGENT':
        return '/agent';
      case 'B2C_CUSTOMER':
        return '/customer';
      default:
        return '/';
    }
  };

  const getNavIcon = (item: any) => {
    const key = (item.icon || item.label || '').toLowerCase();
    return NAV_ICONS[key] || Globe;
  };

  return (
    <>
      {/* Top Bar */}
      {showTopBar && (
        <div className="bg-gradient-to-r from-primary-950 to-primary-900 text-white py-2 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center space-x-6">
                {phoneNumber && (
                  <a href={`tel:${phoneNumber.replace(/[^\d+]/g, '')}`} className="flex items-center hover:text-accent-400 transition-colors">
                    <Phone className="h-4 w-4 mr-2" />
                    {phoneNumber}
                  </a>
                )}
                {emailAddr && (
                  <a href={`mailto:${emailAddr}`} className="flex items-center hover:text-accent-400 transition-colors">
                    <Mail className="h-4 w-4 mr-2" />
                    {emailAddr}
                  </a>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {/* MULTI-CURRENCY MODEL REMOVED - CurrencySelector disabled */}
                {/* <CurrencySelector /> */}
                {topBarMessage && (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-accent-500 rounded-full mr-2 animate-pulse"></span>
                    {topBarMessage}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img
                src={logoUrl}
                alt={siteName}
                className="h-14 w-auto group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/logo.png'; }}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item: any) => {
                const Icon = getNavIcon(item);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:text-primary-950 hover:bg-accent-50 transition-all duration-200 font-medium"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:text-primary-950 hover:bg-accent-50 transition-all duration-200 font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium ml-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-gray-700 hover:text-primary-950 hover:bg-accent-50 transition-all duration-200 font-medium ml-2"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-6 py-2.5 rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all duration-300 shadow-md hover:shadow-lg font-semibold transform hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-4 py-6 space-y-3">
              {navItems.map((item: any) => {
                const Icon = getNavIcon(item);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-accent-50 hover:text-primary-950 transition-all duration-200 font-medium"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-accent-50 hover:text-primary-950 transition-all duration-200 font-medium"
                  >
                    <User className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-xl border-2 border-primary-950 text-primary-950 hover:bg-accent-50 transition-all duration-200 font-semibold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center bg-gradient-to-r from-accent-500 to-accent-600 text-white px-4 py-3 rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all duration-300 shadow-md font-semibold"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
