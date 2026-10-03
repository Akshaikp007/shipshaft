import { ALL_ROLES, ALL_SHIPMENT_STATUSES, ALL_PAYMENT_STATUSES } from '../constants';

/**
 * Validates whether an email string is well-formed.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates international/national phone number format.
 * Accepts digits, spaces, hyphens, parentheses, and optional leading +.
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(clean);
}

/**
 * Validates ShipShaft tracking number format.
 * Expects SHP followed by alphanumeric characters (min 8 chars).
 * @param {string} trackingNumber
 * @returns {boolean}
 */
export function isValidTrackingNumber(trackingNumber) {
  if (!trackingNumber || typeof trackingNumber !== 'string') return false;
  const clean = trackingNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^SHP[A-Z0-9]{6,16}$/.test(clean);
}

/**
 * Checks if a string is a valid user role.
 * @param {string} role
 * @returns {boolean}
 */
export function isValidRole(role) {
  return ALL_ROLES.includes(role);
}

/**
 * Checks if a string is a valid shipment status.
 * @param {string} status
 * @returns {boolean}
 */
export function isValidShipmentStatus(status) {
  return ALL_SHIPMENT_STATUSES.includes(status);
}

/**
 * Checks if a string is a valid payment status.
 * @param {string} status
 * @returns {boolean}
 */
export function isValidPaymentStatus(status) {
  return ALL_PAYMENT_STATUSES.includes(status);
}

/**
 * Validates postal/zip code format (alphanumeric, 3-10 chars).
 * @param {string} postalCode
 * @returns {boolean}
 */
export function isValidPostalCode(postalCode) {
  if (!postalCode || typeof postalCode !== 'string') return false;
  return /^[A-Za-z0-9\s\-]{3,10}$/.test(postalCode.trim());
}
