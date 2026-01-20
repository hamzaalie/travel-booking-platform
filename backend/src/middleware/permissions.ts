/**
 * Role-Based Access Control (RBAC) Permissions System
 * Defines granular permissions for each user role
 */

export enum Permission {
  // User Management
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_USERS = 'VIEW_USERS',
  UPDATE_USER_ROLES = 'UPDATE_USER_ROLES',
  
  // Agent Management
  MANAGE_AGENTS = 'MANAGE_AGENTS',
  APPROVE_AGENTS = 'APPROVE_AGENTS',
  VIEW_ALL_AGENTS = 'VIEW_ALL_AGENTS',
  MANAGE_AGENT_MARKUPS = 'MANAGE_AGENT_MARKUPS',
  
  // Financial Operations
  MANAGE_WALLETS = 'MANAGE_WALLETS',
  APPROVE_FUND_REQUESTS = 'APPROVE_FUND_REQUESTS',
  VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS',
  PROCESS_REFUNDS = 'PROCESS_REFUNDS',
  VIEW_REVENUE_ANALYTICS = 'VIEW_REVENUE_ANALYTICS',
  EXPORT_FINANCIAL_DATA = 'EXPORT_FINANCIAL_DATA',
  MANAGE_INVOICES = 'MANAGE_INVOICES',
  VIEW_COMMISSIONS = 'VIEW_COMMISSIONS',
  
  // Booking Operations
  VIEW_ALL_BOOKINGS = 'VIEW_ALL_BOOKINGS',
  MANAGE_BOOKINGS = 'MANAGE_BOOKINGS',
  CANCEL_BOOKINGS = 'CANCEL_BOOKINGS',
  MODIFY_BOOKINGS = 'MODIFY_BOOKINGS',
  ISSUE_TICKETS = 'ISSUE_TICKETS',
  HANDLE_SSR = 'HANDLE_SSR', // Special Service Requests
  GENERATE_VOUCHERS = 'GENERATE_VOUCHERS',
  
  // Customer Support
  VIEW_CUSTOMER_DETAILS = 'VIEW_CUSTOMER_DETAILS',
  HANDLE_COMPLAINTS = 'HANDLE_COMPLAINTS',
  PROCESS_AMENDMENTS = 'PROCESS_AMENDMENTS',
  
  // System Configuration
  MANAGE_SYSTEM_SETTINGS = 'MANAGE_SYSTEM_SETTINGS',
  MANAGE_GLOBAL_MARKUPS = 'MANAGE_GLOBAL_MARKUPS',
  MANAGE_API_KEYS = 'MANAGE_API_KEYS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  
  // Reporting
  GENERATE_REPORTS = 'GENERATE_REPORTS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  VIEW_AGENT_PERFORMANCE = 'VIEW_AGENT_PERFORMANCE',
  VIEW_SYSTEM_METRICS = 'VIEW_SYSTEM_METRICS',
  
  // Agent-Specific
  MANAGE_OWN_BOOKINGS = 'MANAGE_OWN_BOOKINGS',
  VIEW_OWN_WALLET = 'VIEW_OWN_WALLET',
  REQUEST_FUNDS = 'REQUEST_FUNDS',
  VIEW_OWN_COMMISSIONS = 'VIEW_OWN_COMMISSIONS',
  MANAGE_SUB_AGENTS = 'MANAGE_SUB_AGENTS',
  
  // Customer-Specific
  MAKE_BOOKINGS = 'MAKE_BOOKINGS',
  VIEW_OWN_BOOKINGS = 'VIEW_OWN_BOOKINGS',
  CANCEL_OWN_BOOKINGS = 'CANCEL_OWN_BOOKINGS',
}

export type UserRole = 'SUPER_ADMIN' | 'FINANCE_ADMIN' | 'OPERATIONS_TEAM' | 'B2B_AGENT' | 'B2C_CUSTOMER';

/**
 * Permission mapping for each role
 * Implements principle of least privilege
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  /**
   * SUPER_ADMIN - Full system access
   * Can manage all aspects of the platform
   */
  SUPER_ADMIN: [
    // All permissions
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.UPDATE_USER_ROLES,
    Permission.MANAGE_AGENTS,
    Permission.APPROVE_AGENTS,
    Permission.VIEW_ALL_AGENTS,
    Permission.MANAGE_AGENT_MARKUPS,
    Permission.MANAGE_WALLETS,
    Permission.APPROVE_FUND_REQUESTS,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.PROCESS_REFUNDS,
    Permission.VIEW_REVENUE_ANALYTICS,
    Permission.EXPORT_FINANCIAL_DATA,
    Permission.MANAGE_INVOICES,
    Permission.VIEW_COMMISSIONS,
    Permission.VIEW_ALL_BOOKINGS,
    Permission.MANAGE_BOOKINGS,
    Permission.CANCEL_BOOKINGS,
    Permission.MODIFY_BOOKINGS,
    Permission.ISSUE_TICKETS,
    Permission.HANDLE_SSR,
    Permission.GENERATE_VOUCHERS,
    Permission.VIEW_CUSTOMER_DETAILS,
    Permission.HANDLE_COMPLAINTS,
    Permission.PROCESS_AMENDMENTS,
    Permission.MANAGE_SYSTEM_SETTINGS,
    Permission.MANAGE_GLOBAL_MARKUPS,
    Permission.MANAGE_API_KEYS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_AGENT_PERFORMANCE,
    Permission.VIEW_SYSTEM_METRICS,
  ],

  /**
   * FINANCE_ADMIN - Financial operations only
   * Cannot manage users or system settings
   * Focus: Money, reports, invoices, commissions
   */
  FINANCE_ADMIN: [
    Permission.VIEW_USERS, // View only, no manage
    Permission.VIEW_ALL_AGENTS, // View for reporting
    Permission.MANAGE_WALLETS,
    Permission.APPROVE_FUND_REQUESTS,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.PROCESS_REFUNDS,
    Permission.VIEW_REVENUE_ANALYTICS,
    Permission.EXPORT_FINANCIAL_DATA,
    Permission.MANAGE_INVOICES,
    Permission.VIEW_COMMISSIONS,
    Permission.VIEW_ALL_BOOKINGS, // For financial reconciliation
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_AGENT_PERFORMANCE, // For commission calculations
    Permission.VIEW_AUDIT_LOGS, // Financial audit trail
  ],

  /**
   * OPERATIONS_TEAM - Booking operations and customer support
   * Cannot access financial data or user management
   * Focus: Bookings, tickets, SSR, vouchers, customer service
   */
  OPERATIONS_TEAM: [
    Permission.VIEW_USERS, // Limited view for customer support
    Permission.VIEW_ALL_AGENTS, // To assist agent bookings
    Permission.VIEW_ALL_BOOKINGS,
    Permission.MANAGE_BOOKINGS,
    Permission.CANCEL_BOOKINGS,
    Permission.MODIFY_BOOKINGS,
    Permission.ISSUE_TICKETS,
    Permission.HANDLE_SSR, // Seat selection, meals, baggage, assistance
    Permission.GENERATE_VOUCHERS,
    Permission.VIEW_CUSTOMER_DETAILS,
    Permission.HANDLE_COMPLAINTS,
    Permission.PROCESS_AMENDMENTS,
    Permission.GENERATE_REPORTS, // Operational reports only
    Permission.EXPORT_REPORTS,
  ],

  /**
   * B2B_AGENT - Agent operations
   * Can only manage their own resources
   */
  B2B_AGENT: [
    Permission.MANAGE_OWN_BOOKINGS,
    Permission.VIEW_OWN_WALLET,
    Permission.REQUEST_FUNDS,
    Permission.VIEW_OWN_COMMISSIONS,
    Permission.MANAGE_SUB_AGENTS, // Future: Sub-agent management
    Permission.MAKE_BOOKINGS,
    Permission.CANCEL_OWN_BOOKINGS,
    Permission.HANDLE_SSR, // Can add SSR to their bookings
  ],

  /**
   * B2C_CUSTOMER - Self-service customer
   * Can only manage their own bookings
   */
  B2C_CUSTOMER: [
    Permission.MAKE_BOOKINGS,
    Permission.VIEW_OWN_BOOKINGS,
    Permission.CANCEL_OWN_BOOKINGS,
  ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return RolePermissions[role]?.includes(permission) || false;
};

/**
 * Check if a role has any of the specified permissions (OR logic)
 */
export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions (AND logic)
 */
export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return RolePermissions[role] || [];
};

/**
 * Check if a role is an admin role (has elevated privileges)
 */
export const isAdminRole = (role: UserRole): boolean => {
  return ['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_TEAM'].includes(role);
};

/**
 * Check if a role can access financial data
 */
export const canAccessFinancials = (role: UserRole): boolean => {
  return hasPermission(role, Permission.VIEW_FINANCIAL_REPORTS);
};

/**
 * Check if a role can manage system settings
 */
export const canManageSystem = (role: UserRole): boolean => {
  return hasPermission(role, Permission.MANAGE_SYSTEM_SETTINGS);
};
