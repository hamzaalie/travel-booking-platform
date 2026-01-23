/**
 * Role-Based Navigation Component
 * Dynamically renders navigation based on user role and permissions
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { UserRole, RoleDisplayNames } from '../../../shared/types';
import { getNavigationItems, hasUIPermission, RoleColors, UIPermission } from '@/utils/permissions';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  DollarSign,
  Plane,
  Wallet,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard className="w-5 h-5" />,
  'User Management': <Users className="w-5 h-5" />,
  'Agent Management': <UserCheck className="w-5 h-5" />,
  'Agent Approval': <UserCheck className="w-5 h-5" />,
  'Fund Requests': <DollarSign className="w-5 h-5" />,
  'All Bookings': <Plane className="w-5 h-5" />,
  'My Bookings': <Plane className="w-5 h-5" />,
  Wallet: <Wallet className="w-5 h-5" />,
  'Financial Reports': <FileText className="w-5 h-5" />,
  Reports: <FileText className="w-5 h-5" />,
  'System Settings': <Settings className="w-5 h-5" />,
  'Search Flights': <Plane className="w-5 h-5" />,
};

interface RoleBasedNavigationProps {
  onLogout: () => void;
  className?: string;
}

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  onLogout,
  className = '',
}) => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user || !user.role) {
    return null;
  }

  const userRole = user.role as UserRole;
  const navItems = getNavigationItems(userRole);
  const roleColors = RoleColors[userRole];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className={`flex flex-col h-full ${className}`}>
      {/* User Info Section */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleColors.bg} ${roleColors.text}`}
            >
              {RoleDisplayNames[userRole]}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-150 ease-in-out
                    ${
                      active
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <span className={active ? 'text-blue-700' : 'text-gray-500'}>
                    {iconMap[item.label] || <LayoutDashboard className="w-5 h-5" />}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="
            w-full flex items-center justify-center space-x-2 px-4 py-2.5
            bg-red-50 hover:bg-red-100 text-red-700 rounded-lg
            text-sm font-medium transition-colors duration-150
          "
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

/**
 * Permission-based conditional render component
 * Shows children only if user has required permission
 */
interface RequirePermissionProps {
  permission: UIPermission | UIPermission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  children,
  fallback = null,
  requireAll = false,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user || !user.role) {
    return <>{fallback}</>;
  }

  const userRole = user.role as UserRole;
  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasAccess = requireAll
    ? permissions.every(p => hasUIPermission(userRole, p))
    : permissions.some(p => hasUIPermission(userRole, p));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Role Badge Component
 * Displays role with appropriate styling
 */
interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  className = '',
}) => {
  const colors = RoleColors[role];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {RoleDisplayNames[role]}
    </span>
  );
};

/**
 * Admin-only wrapper component
 * Shows children only for admin roles (Super Admin, Finance Admin, Operations Team)
 */
interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback = null }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user || !user.role) {
    return <>{fallback}</>;
  }

  const userRole = user.role as UserRole;
  const isAdmin = [
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.OPERATIONS_TEAM,
  ].includes(userRole);

  return isAdmin ? <>{children}</> : <>{fallback}</>;
};

export default RoleBasedNavigation;
