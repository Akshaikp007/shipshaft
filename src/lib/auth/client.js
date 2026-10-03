/**
 * ShipShaft Client Auth Utilities
 */

/**
 * Invalidate the authenticated server session.
 * @returns {Promise<boolean>}
 */
export async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.ok;
  } catch (error) {
    console.error('[Auth Client] Logout error:', error);
    return false;
  }
}
