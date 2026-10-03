import { redirect } from 'next/navigation';
import { getSession } from './session';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { ROLES } from '@/lib/constants/roles';

/**
 * Retrieve the currently authenticated user from the database.
 * Returns only safe user fields without passwordHash or internal sensitive data.
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session || !session.userId) {
    return null;
  }

  try {
    await connectDB();
    const user = await User.findById(session.userId).lean();
    if (!user || !user.isActive) {
      return null;
    }

    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      avatar: user.avatar || '',
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error('[Auth Error] Failed to retrieve current user:', error.message);
    return null;
  }
}

/**
 * Enforce authentication on a server page/component.
 * Redirects unauthenticated users to /login.
 * @param {string} redirectUrl Optional path to redirect to
 * @returns {Promise<object>} Authenticated safe user object
 */
export async function requireAuth(redirectUrl = '/login') {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectUrl);
  }
  return user;
}

/**
 * Enforce role-based access control.
 * Verifies that the authenticated user possesses one of the allowed roles.
 * @param {string|string[]} allowedRoles Role or array of allowed roles
 * @param {string} fallbackUrl Optional redirect URL if unauthorized
 * @returns {Promise<object>} Authenticated safe user object
 */
export async function requireRole(allowedRoles, fallbackUrl) {
  const user = await requireAuth();
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!rolesArray.includes(user.role)) {
    // Determine default fallback route based on user's actual role
    let target = fallbackUrl;
    if (!target) {
      if (user.role === ROLES.CUSTOMER) target = '/dashboard';
      else if (user.role === ROLES.AGENT) target = '/agent/dashboard';
      else if (user.role === ROLES.ADMIN) target = '/admin';
      else target = '/login';
    }
    redirect(target);
  }

  return user;
}

/**
 * Enforce Admin role specifically.
 * @param {string} fallbackUrl
 * @returns {Promise<object>} Authenticated safe admin user
 */
export async function requireAdmin(fallbackUrl = '/admin') {
  return requireRole(ROLES.ADMIN, fallbackUrl);
}

/**
 * Verify whether a user is authorized to view or modify a shipment.
 * @param {object} user Authenticated user
 * @param {object} shipment Target shipment object
 * @returns {boolean}
 */
export function canAccessShipment(user, shipment) {
  if (!user || !shipment) return false;
  if (user.role === ROLES.ADMIN) return true;

  const customerId = shipment.customerId?._id?.toString() || shipment.customerId?.toString();
  if (user.role === ROLES.CUSTOMER && customerId === user._id) {
    return true;
  }

  const agentId = shipment.agentId?._id?.toString() || shipment.agentId?.toString();
  if (user.role === ROLES.AGENT && agentId === user._id) {
    return true;
  }

  return false;
}

/**
 * Verify whether a user is authorized to view or download an invoice.
 * @param {object} user Authenticated user
 * @param {object} invoice Target invoice object
 * @returns {boolean}
 */
export function canAccessInvoice(user, invoice) {
  if (!user || !invoice) return false;
  if (user.role === ROLES.ADMIN) return true;

  const customerId = invoice.customerId?._id?.toString() || invoice.customerId?.toString();
  if (user.role === ROLES.CUSTOMER && customerId === user._id) {
    return true;
  }

  return false;
}

/**
 * Verify whether a user is authorized to access a payment record.
 * @param {object} user Authenticated user
 * @param {object} payment Target payment object
 * @returns {boolean}
 */
export function canAccessPayment(user, payment) {
  if (!user || !payment) return false;
  if (user.role === ROLES.ADMIN) return true;

  const customerId = payment.customerId?._id?.toString() || payment.customerId?.toString();
  if (user.role === ROLES.CUSTOMER && customerId === user._id) {
    return true;
  }

  return false;
}

/**
 * Verify whether a user is authorized to access a notification.
 * @param {object} user Authenticated user
 * @param {object} notification Target notification object
 * @returns {boolean}
 */
export function canAccessNotification(user, notification) {
  if (!user || !notification) return false;
  if (user.role === ROLES.ADMIN) return true;

  const recipientId = notification.userId?._id?.toString() || notification.userId?.toString();
  if (recipientId === user._id) {
    return true;
  }

  return false;
}

/**
 * Verify whether an agent is authorized to operate on a shipment (status change, scan, delivery).
 * @param {object} user Authenticated user
 * @param {object} shipment Target shipment object
 * @returns {boolean}
 */
export function canAgentOperateOnShipment(user, shipment) {
  if (!user || !shipment) return false;
  if (user.role === ROLES.ADMIN) return true;

  if (user.role === ROLES.AGENT) {
    const assignedAgentId = shipment.agentId?._id?.toString() || shipment.agentId?.toString();
    return assignedAgentId === user._id;
  }

  return false;
}

