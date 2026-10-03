/**
 * ShipShaft - User Roles Constants
 */
export const ROLES = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  AGENT: 'AGENT',
  ADMIN: 'ADMIN',
});

export const ALL_ROLES = Object.freeze(Object.values(ROLES));

export const ROLE_DASHBOARDS = Object.freeze({
  [ROLES.CUSTOMER]: '/dashboard',
  [ROLES.AGENT]: '/agent/dashboard',
  [ROLES.ADMIN]: '/admin',
});

/**
 * Returns the authoritative dashboard destination for a verified role.
 * @param {string} role
 * @returns {string}
 */
export function getDashboardForRole(role) {
  if (role === ROLES.ADMIN) return ROLE_DASHBOARDS[ROLES.ADMIN];
  if (role === ROLES.AGENT) return ROLE_DASHBOARDS[ROLES.AGENT];
  return ROLE_DASHBOARDS[ROLES.CUSTOMER];
}

/**
 * Checks if a requested destination path is permitted for the given role.
 * Prevents admins/agents from being misrouted into customer portals and vice versa.
 * @param {string} role
 * @param {string} path
 * @returns {boolean}
 */
export function isPathAllowedForRole(role, path) {
  if (!path || typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return false;
  }

  // Customer dashboard is strictly for customers
  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    return role === ROLES.CUSTOMER;
  }

  // Customer settings is strictly for customers (admin/agent have dedicated settings)
  if (path === '/settings' || path.startsWith('/settings/')) {
    return role === ROLES.CUSTOMER;
  }

  // Admin routes are strictly for admins
  if (path === '/admin' || path.startsWith('/admin/')) {
    return role === ROLES.ADMIN;
  }

  // Agent routes are strictly for agents and admins
  if (path === '/agent' || path.startsWith('/agent/')) {
    return role === ROLES.AGENT || role === ROLES.ADMIN;
  }

  return true;
}

/**
 * Resolves safe post-login destination URL based on verified role and requested redirect.
 * @param {string} role
 * @param {string|null} redirectParam
 * @returns {string}
 */
export function resolvePostLoginDestination(role, redirectParam) {
  if (redirectParam && isPathAllowedForRole(role, redirectParam)) {
    return redirectParam;
  }
  return getDashboardForRole(role);
}

