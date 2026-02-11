import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  LayoutDashboard,
  Plane,
  Wallet,
  Users,
  Settings,
  BarChart3,
  RefreshCw,
  Percent,
  Building2,
  FileText,
  BookOpen,
  Coins,
  Smartphone,
  Globe,
  CreditCard,
  MapPin,
  Wifi,
  Shield,
  Armchair,
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  const getMenuItems = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/customers', icon: Users, label: 'Customers' },
        { path: '/admin/b2b-users', icon: Building2, label: 'B2B Users' },
        { path: '/admin/b2b-portal', icon: Shield, label: 'B2B Portal' },
        { path: '/admin/agents', icon: Users, label: 'Agent Approvals' },
        { path: '/admin/agents/markup', icon: Percent, label: 'Agent Markup' },
        { path: '/admin/bookings', icon: Plane, label: 'All Bookings' },
        { path: '/admin/booking-customize', icon: Armchair, label: 'Booking Customize' },
        { path: '/admin/flight-changes', icon: RefreshCw, label: 'Flight Changes' },
        { path: '/admin/fund-requests', icon: Wallet, label: 'Fund Requests' },
        { path: '/admin/refunds', icon: RefreshCw, label: 'Refunds' },
        { path: '/admin/esim', icon: Smartphone, label: 'eSIM Orders' },
        { path: '/admin/esim-commission', icon: Percent, label: 'eSIM Commission' },
        { path: '/admin/payment-gateways', icon: CreditCard, label: 'Payment Gateways' },
        { path: '/admin/api-management', icon: Wifi, label: 'API Management' },
        { path: '/admin/popular-destinations', icon: MapPin, label: 'Destinations' },
        { path: '/admin/currencies', icon: Coins, label: 'Currencies' },
        { path: '/admin/markups', icon: Settings, label: 'Global Markups' },
        { path: '/admin/pages', icon: FileText, label: 'Pages' },
        { path: '/admin/blog', icon: BookOpen, label: 'Blog' },
        { path: '/admin/settings', icon: Globe, label: 'Site Settings' },
        { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
      ];
    }
    
    if (user?.role === 'B2B_AGENT') {
      return [
        { path: '/agent', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/agent/bookings', icon: Plane, label: 'My Bookings' },
        { path: '/agent/wallet', icon: Wallet, label: 'Wallet' },
        { path: '/agent/markups', icon: Settings, label: 'My Markups' },
      ];
    }
    
    return [
      { path: '/customer', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/customer/bookings', icon: Plane, label: 'My Bookings' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 shadow-sm">
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {user?.role === 'SUPER_ADMIN' ? 'Admin Panel' : user?.role === 'B2B_AGENT' ? 'Agent Portal' : 'My Account'}
          </h2>
        </div>
        
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent-50 text-primary-950 font-medium border-l-4 border-accent-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-accent-500' : 'text-gray-400'}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
