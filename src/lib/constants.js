/**
 * ShipShaft - Core System Constants & Enums
 * Re-exports centralized constants and includes UI-level status presentation helpers.
 */

export * from './constants/index';

import { SHIPMENT_STATUS } from './constants/shipmentStatus';

/**
 * Sequential shipment status lifecycle order
 */
export const SHIPMENT_STATUS_SEQUENCE = Object.freeze([
  SHIPMENT_STATUS.BOOKED,
  SHIPMENT_STATUS.PAYMENT_CONFIRMED,
  SHIPMENT_STATUS.ASSIGNED,
  SHIPMENT_STATUS.PICKED_UP,
  SHIPMENT_STATUS.ORIGIN_HUB,
  SHIPMENT_STATUS.IN_TRANSIT,
  SHIPMENT_STATUS.DESTINATION_HUB,
  SHIPMENT_STATUS.OUT_FOR_DELIVERY,
  SHIPMENT_STATUS.DELIVERED,
]);

/**
 * User-friendly display labels for shipment statuses
 */
export const SHIPMENT_STATUS_LABELS = Object.freeze({
  [SHIPMENT_STATUS.BOOKED]: 'Booked',
  [SHIPMENT_STATUS.PAYMENT_CONFIRMED]: 'Payment Confirmed',
  [SHIPMENT_STATUS.ASSIGNED]: 'Agent Assigned',
  [SHIPMENT_STATUS.PICKED_UP]: 'Picked Up',
  [SHIPMENT_STATUS.ORIGIN_HUB]: 'At Origin Hub',
  [SHIPMENT_STATUS.IN_TRANSIT]: 'In Transit',
  [SHIPMENT_STATUS.DESTINATION_HUB]: 'At Destination Hub',
  [SHIPMENT_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [SHIPMENT_STATUS.DELIVERED]: 'Delivered',
});

/**
 * Color metadata mapping for status pills / badges
 */
export const SHIPMENT_STATUS_VARIANTS = Object.freeze({
  [SHIPMENT_STATUS.BOOKED]: 'neutral',
  [SHIPMENT_STATUS.PAYMENT_CONFIRMED]: 'info',
  [SHIPMENT_STATUS.ASSIGNED]: 'info',
  [SHIPMENT_STATUS.PICKED_UP]: 'warning',
  [SHIPMENT_STATUS.ORIGIN_HUB]: 'warning',
  [SHIPMENT_STATUS.IN_TRANSIT]: 'warning',
  [SHIPMENT_STATUS.DESTINATION_HUB]: 'warning',
  [SHIPMENT_STATUS.OUT_FOR_DELIVERY]: 'accent',
  [SHIPMENT_STATUS.DELIVERED]: 'success',
});

export const PAYMENT_METHODS = Object.freeze({
  CARD: 'CARD',
  UPI: 'UPI',
  NET_BANKING: 'NET_BANKING',
  WALLET: 'WALLET',
  CASH: 'CASH',
});

/**
 * Delivery Agent Vehicle Types
 */
export const VEHICLE_TYPES = Object.freeze({
  BIKE: 'BIKE',
  VAN: 'VAN',
  TRUCK: 'TRUCK',
});

/**
 * OTP Configuration Constants
 */
export const OTP_CONFIG = Object.freeze({
  LENGTH: 6,
  EXPIRY_MINUTES: 15,
  MAX_VERIFICATION_ATTEMPTS: 3,
});
