import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { logger } from '../config/logger';
import { Permission, UserRole, hasPermission, isAdminRole } from './permissions';

/**
 * Authorize by role - checks if user has one of the allowed roles
 * @deprecated Use authorizePermission for granular control
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} to ${req.path}`);
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Authorize by permission - checks if user's role has the required permission
 * This is the preferred method for fine-grained access control
 */
export const authorizePermission = (...requiredPermissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const userRole = req.user.role as UserRole;
    const hasAccess = requiredPermissions.some(permission => 
      hasPermission(userRole, permission)
    );

    if (!hasAccess) {
      logger.warn(
        `Permission denied for user ${req.user.id} (${userRole}) to ${req.path}. ` +
        `Required: ${requiredPermissions.join(' OR ')}`
      );
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this operation',
        required: requiredPermissions,
      });
      return;
    }

    next();
  };
};

/**
 * Authorize admin roles only (SUPER_ADMIN, FINANCE_ADMIN, OPERATIONS_TEAM)
 */
export const authorizeAdmin = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!isAdminRole(req.user.role as UserRole)) {
      logger.warn(`Non-admin access attempt by user ${req.user.id} to ${req.path}`);
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    next();
  };
};

// Check if user can access specific agent resources
export const authorizeAgentAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  const userRole = req.user.role as UserRole;

  // Admin roles can access all agent resources
  if (isAdminRole(userRole)) {
    next();
    return;
  }

  // B2B agents can only access their own resources
  if (req.user.role === 'B2B_AGENT') {
    const agentId = req.params.agentId || req.body.agentId || req.query.agentId;

    if (!agentId || agentId !== req.user.agentId) {
      res.status(403).json({
        success: false,
        error: 'Cannot access other agent resources',
      });
      return;
    }
  }

  next();
};

// Check if user can access specific booking
export const authorizeBookingAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  const userRole = req.user.role as UserRole;

  // Admin and operations team can access all bookings
  if (hasPermission(userRole, Permission.VIEW_ALL_BOOKINGS)) {
    next();
    return;
  }

  const bookingId = req.params.bookingId || req.params.id;
  if (!bookingId) {
    res.status(400).json({
      success: false,
      error: 'Booking ID required',
    });
    return;
  }

  try {
    const { prisma } = await import('../config/database');
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        userId: true,
        agentId: true,
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
      return;
    }

    // Check ownership
    const hasAccess =
      booking.userId === req.user.id ||
      (req.user.role === 'B2B_AGENT' && booking.agentId === req.user.agentId);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Cannot access this booking',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Booking authorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization check failed',
    });
    return;
  }
};

/**
 * Authorize wallet access
 * Admins and finance can see all wallets, agents only their own
 */
export const authorizeWalletAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  const userRole = req.user.role as UserRole;

  // Admins with wallet management permission can access all wallets
  if (hasPermission(userRole, Permission.MANAGE_WALLETS)) {
    next();
    return;
  }

  // Agents can only access their own wallet
  if (req.user.role === 'B2B_AGENT') {
    const agentId = req.params.agentId || req.body.agentId || req.query.agentId;
    
    if (agentId && agentId !== req.user.agentId) {
      res.status(403).json({
        success: false,
        error: 'Cannot access other agent wallets',
      });
      return;
    }
  }

  next();
};
