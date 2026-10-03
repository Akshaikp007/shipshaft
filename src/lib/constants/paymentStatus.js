/**
 * ShipShaft - Payment Status Constants
 */
export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  SUCCESS: 'PAID', // Alias for SUCCESS
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

export const ALL_PAYMENT_STATUSES = Object.freeze([
  'PENDING',
  'PROCESSING',
  'PAID',
  'SUCCESS',
  'FAILED',
  'REFUNDED',
]);

