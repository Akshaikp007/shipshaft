import { SHIPMENT_STATUS_LABELS } from '../constants';

/**
 * Formats a monetary amount into a localized currency string using Intl.NumberFormat.
 * @param {number|string} amount - Monetary amount
 * @param {string} currency - default 'INR'
 * @param {Intl.NumberFormatOptions} [options] - Additional formatting options
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'INR', options = {}) {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(numericAmount)) {
    return '₹0.00';
  }
  const minDigits =
    options.minimumFractionDigits !== undefined
      ? options.minimumFractionDigits
      : options.maximumFractionDigits !== undefined
      ? Math.min(2, options.maximumFractionDigits)
      : 2;
  const maxDigits =
    options.maximumFractionDigits !== undefined
      ? options.maximumFractionDigits
      : Math.max(2, minDigits);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    ...options,
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(numericAmount);
}

/**
 * Formats a date into a clean readable date string (e.g., "Sep 23, 2026").
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '—';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

/**
 * Formats a date into a date and time string (e.g., "Sep 23, 2026, 04:30 PM").
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '—';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed);
}

/**
 * Formats a tracking number with standard hyphen separation for readability (e.g., "SHP-2609-1234").
 * @param {string} rawNumber
 * @returns {string}
 */
export function formatTrackingNumber(rawNumber) {
  if (!rawNumber || typeof rawNumber !== 'string') return '';
  const clean = rawNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.startsWith('SHP') && clean.length >= 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
  }
  return clean;
}

/**
 * Formats package weight in kilograms.
 * @param {number} weightInKg
 * @returns {string}
 */
export function formatWeight(weightInKg) {
  if (typeof weightInKg !== 'number' || isNaN(weightInKg)) return '0 kg';
  return `${weightInKg.toFixed(2)} kg`;
}

/**
 * Formats 3D dimensions into a standard string (e.g., "20 × 15 × 10 cm").
 * @param {{ length?: number, width?: number, height?: number }} dimensions
 * @returns {string}
 */
export function formatDimensions(dimensions = {}) {
  const { length = 0, width = 0, height = 0 } = dimensions;
  return `${length} × ${width} × ${height} cm`;
}

/**
 * Returns human-readable label for a shipment status enum.
 * @param {string} status
 * @returns {string}
 */
export function formatStatusLabel(status) {
  return SHIPMENT_STATUS_LABELS[status] || status || 'Unknown';
}
