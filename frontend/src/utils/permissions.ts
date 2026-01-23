/**
 * Frontend Permissions System
 * Determines what UI elements and features each role can access
 */

import { UserRole } from '../../shared/types';

export enum UIPermission {
  // Dashboard Access
  VIEW_ADMIN_DASHBOARD = 'VIEW_ADMIN_DASHBOARD',
  VIEW_FINANCE_DASHBOARD = 'VIEW_FINANCE_DASHBOARD',
  VIEW_OPERATIONS_DASHBOARD = 'VIEW_OPERATIONS_DASHBOARD',
  VIEW_AGENT_DASHBOARD = 'VIEW_AGENT_DASHBOARD',
  VIEW_CUSTOMER_DASHBOARD = 'VIEW_CUSTOMER_DASHBOARD',
  
  // Navigation Items
  VIEW_USER_MANAGEMENT = 'VIEW_USER_MANAGEMENT',
  VIEW_AGENT_MANAGEMENT = 'VIEW_AGENT_MANAGEMENT',
  VIEW_AGENT_APPROVAL = 'VIEW_AGENT_APPROVAL',
  VIEW_FUND_REQUESTS = 'VIEW_FUND_REQUESTS',
  VIEW_BOOKINGS_ALL = 'VIEW_BOOKINGS_ALL',
  VIEW_BOOKINGS_OWN = 'VIEW_BOOKINGS_OWN',
  VIEW_WALLET = 'VIEW_WALLET',
  VIEW_REPORTS = 'VIEW_REPORTS',
  VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS',
  VIEW_SYSTEM_SETTINGS = 'VIEW_SYSTEM_SETTINGS',
  
  // Actions
  APPROVE_AGENTS = 'APPROVE_AGENTS',
  APPROVE_FUNDS = 'APPROVE_FUNDS',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_MARKUPS = 'MANAGE_MARKUPS',
  FREEZE_WALLETS = 'FREEZE_WALLETS',
  CANCEL_BOOKINGS = 'CANCEL_BOOKINGS',
  MODIFY_BOOKINGS = 'MODIFY_BOOKINGS',
  ISSUE_TICKETS = 'ISSUE_TICKETS',
  HANDLE_SSR = 'HANDLE_SSR',
  GENERATE_VOUCHERS = 'GENERATE_VOUCHERS',
  PROCESS_REFUNDS = 'PROCESS_REFUNDS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  MAKE_BOOKINGS = 'MAKE_BOOKINGS',
  REQUEST_FUNDS = 'REQUEST_FUNDS',
}

/**
 * UI Permission mapping for each role
 */
export const RoleUIPermissions: Record<UserRole, UIPermission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // All permissions
    UIPermission.VIEW_ADMIN_DASHBOARD,
    UIPermission.VIEW_USER_MANAGEMENT,
    UIPermission.VIEW_AGENT_MANAGEMENT,
    UIPermission.VIEW_AGENT_APPROVAL,
    UIPermission.VIEW_FUND_REQUESTS,
    UIPermission.VIEW_BOOKINGS_ALL,
    UIPermission.VIEW_WALLET,
    UIPermission.VIEW_REPORTS,
    UIPermission.VIEW_FINANCIAL_REPORTS,
    UIPermission.VIEW_SYSTEM_SETTINGS,
    UIPermission.APPROVE_AGENTS,
    UIPermission.APPROVE_FUNDS,
    UIPermission.MANAGE_USERS,
    UIPermission.MANAGE_MARKUPS,
    UIPermission.FREEZE_WALLETS,
    UIPermission.CANCEL_BOOKINGS,
    UIPermission.MODIFY_BOOKINGS,
    UIPermission.ISSUE_TICKETS,
    UIPermission.HANDLE_SSR,
    UIPermission.GENERATE_VOUCHERS,
    UIPermission.PROCESS_REFUNDS,
    UIPermission.EXPORT_REPORTS,
    UIPermission.MAKE_BOOKINGS,
  ],

  [UserRole.FINANCE_ADMIN]: [
    UIPermission.VIEW_FINANCE_DASHBOARD,
    UIPermission.VIEW_AGENT_MANAGEMENT, // View only
    UIPermission.VIEW_FUND_REQUESTS,
    UIPermission.VIEW_BOOKINGS_ALL, // For financial reconciliation
    UIPermission.VIEW_WALLET,
    UIPermission.VIEW_REPORTS,
    UIPermission.VIEW_FINANCIAL_REPORTS,
    UIPermission.APPROVE_FUNDS,
    UIPermission.FREEZE_WALLETS,
    UIPermission.PROCESS_REFUNDS,
    UIPermission.EXPORT_REPORTS,
  ],

  [UserRole.OPERATIONS_TEAM]: [
    UIPermission.VIEW_OPERATIONS_DASHBOARD,
    UIPermission.VIEW_AGENT_MANAGEMENT, // View only
    UIPermission.VIEW_BOOKINGS_ALL,
    UIPermission.VIEW_REPORTS, // Operational reports only
    UIPermission.CANCEL_BOOKINGS,
    UIPermission.MODIFY_BOOKINGS,
    UIPermission.ISSUE_TICKETS,
    UIPermission.HANDLE_SSR,
    UIPermission.GENERATE_VOUCHERS,
    UIPermission.EXPORT_REPORTS,
    UIPermission.MAKE_BOOKINGS, // For customer support
  ],

  [UserRole.B2B_AGENT]: [
    UIPermission.VIEW_AGENT_DASHBOARD,
    UIPermission.VIEW_BOOKINGS_OWN,
    UIPermission.VIEW_WALLET,
    UIPermission.MAKE_BOOKINGS,
    UIPermission.REQUEST_FUNDS,
    UIPermission.CANCEL_BOOKINGS, // Own bookings only
    UIPermission.HANDLE_SSR, // For own bookings
  ],

  [UserRole.B2C_CUSTOMER]: [
    UIPermission.VIEW_CUSTOMER_DASHBOARD,
    UIPermission.VIEW_BOOKINGS_OWN,
    UIPermission.MAKE_BOOKINGS,
    UIPermission.CANCEL_BOOKINGS, // Own bookings only
  ],
};

/**
 * Check if user has a specific UI permission
 */
export const hasUIPermission = (role: UserRole, permission: UIPermission): boolean => {
  return RoleUIPermissions[role]?.includes(permission) || false;
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyUIPermission = (role: UserRole, permissions: UIPermission[]): boolean => {
  return permissions.some(permission => hasUIPermission(role, permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllUIPermissions = (role: UserRole, permissions: UIPermission[]): boolean => {
  return permissions.every(permission => hasUIPermission(role, permission));
};

/**
 * Get role-specific dashboard route
 */
export const getDashboardRoute = (role: UserRole): string => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return '/admin/dashboard';
    case UserRole.FINANCE_ADMIN:
      return '/finance/dashboard';
    case UserRole.OPERATIONS_TEAM:
      return '/operations/dashboard';
    case UserRole.B2B_AGENT:
      return '/agent/dashboard';
    case UserRole.B2C_CUSTOMER:
      return '/customer/dashboard';
    default:
      return '/';
  }
};

/**
 * Get navigation items based on role
 */
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  permission: UIPermission;
}

export const getNavigationItems = (role: UserRole): NavItem[] => {
  const allItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: getDashboardRoute(role),
      permission: UIPermission.VIEW_ADMIN_DASHBOARD,
    },
    {
      label: 'User Management',
      path: '/admin/users',
      permission: UIPermission.VIEW_USER_MANAGEMENT,
    },
    {
      label: 'Agent Management',
      path: '/admin/agents',
      permission: UIPermission.VIEW_AGENT_MANAGEMENT,
    },
    {
      label: 'Agent Approval',
      path: '/admin/agent-approval',
      permission: UIPermission.VIEW_AGENT_APPROVAL,
    },
    {
      label: 'Fund Requests',
      path: '/admin/fund-requests',
      permission: UIPermission.VIEW_FUND_REQUESTS,
    },
    {
      label: 'All Bookings',
      path: '/admin/bookings',
      permission: UIPermission.VIEW_BOOKINGS_ALL,
    },
    {
      label: 'My Bookings',
      path: '/bookings',
      permission: UIPermission.VIEW_BOOKINGS_OWN,
    },
    {
      label: 'Wallet',
      path: '/agent/wallet',
      permission: UIPermission.VIEW_WALLET,
    },
    {
      label: 'Financial Reports',
      path: '/admin/reports/financial',
      permission: UIPermission.VIEW_FINANCIAL_REPORTS,
    },
    {
      label: 'Reports',
      path: '/admin/reports',
      permission: UIPermission.VIEW_REPORTS,
    },
    {
      label: 'System Settings',
      path: '/admin/settings',
      permission: UIPermission.VIEW_SYSTEM_SETTINGS,
    },
    {
      label: 'Search Flights',
      path: '/flights',
      permission: UIPermission.MAKE_BOOKINGS,
    },
  ];

  // Filter items based on role permissions
  return allItems.filter(item => hasUIPermission(role, item.permission));
};

/**
 * Role-specific colors for UI (badges, indicators)
 */
export const RoleColors: Record<UserRole, { bg: string; text: string; border: string }> = {
  [UserRole.SUPER_ADMIN]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
  },
  [UserRole.FINANCE_ADMIN]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
  },
  [UserRole.OPERATIONS_TEAM]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
  },
  [UserRole.B2B_AGENT]: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
  },
  [UserRole.B2C_CUSTOMER]: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
  },
};
