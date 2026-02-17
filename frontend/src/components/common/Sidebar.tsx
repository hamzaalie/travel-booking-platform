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
  X,
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
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
        { path: '/agent/documents', icon: FileText, label: 'Documents' },
      ];
    }
    
    return [
      { path: '/customer', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/customer/bookings', icon: Plane, label: 'My Bookings' },
      { path: '/customer/esim', icon: Smartphone, label: 'My eSIMs' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 shadow-sm">
      <div className="h-full flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {user?.role === 'SUPER_ADMIN' ? 'Admin Panel' : user?.role === 'B2B_AGENT' ? 'Agent Portal' : 'My Account'}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100 text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
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
