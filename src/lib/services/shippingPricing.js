/**
 * ShipShaft Centralized Shipping Pricing Utility
 * Deterministic, server-authoritative rate calculator.
 */

export const SERVICE_CONFIGS = {
  standard: {
    displayName: 'Standard Ground',
    baseFee: 100,
    ratePerKg: 3.5,
    multiplier: 1.0,
    estimatedDays: '4-5 Days',
  },
  express: {
    displayName: 'Express Freight',
    baseFee: 180,
    ratePerKg: 5.0,
    multiplier: 1.35,
    estimatedDays: '2-3 Days',
  },
  priority: {
    displayName: 'Priority Air Hub',
    baseFee: 280,
    ratePerKg: 7.5,
    multiplier: 1.75,
    estimatedDays: 'Next Day',
  },
};

/**
 * Normalize client-submitted service type strings to a supported service key.
 * @param {string} service
 * @returns {string}
 */
export function normalizeServiceType(service) {
  if (!service) return 'standard';
  const clean = String(service).toLowerCase().trim();
  if (clean.includes('priority') || clean.includes('air')) return 'priority';
  if (clean.includes('express') || clean.includes('freight')) return 'express';
  return 'standard';
}

/**
 * Calculate volumetric weight using standard IATA formula (L x W x H in cm / 5000).
 * @param {number} length
 * @param {number} width
 * @param {number} height
 * @returns {number}
 */
export function calculateVolumetricWeight(length = 0, width = 0, height = 0) {
  const l = Math.max(0, Number(length) || 0);
  const w = Math.max(0, Number(width) || 0);
  const h = Math.max(0, Number(height) || 0);
  if (!l || !w || !h) return 0;
  return Number(((l * w * h) / 5000).toFixed(2));
}

/**
 * Authoritatively calculate shipping cost based on weight, dimensions, service, and routing.
 *
 * @param {object} params
 * @param {number} params.weight Actual gross weight in kg
 * @param {number} [params.length] Length in cm
 * @param {number} [params.width] Width in cm
 * @param {number} [params.height] Height in cm
 * @param {string} [params.serviceType] Service tier string
 * @param {object} [params.originBranch] Origin Branch document/object
 * @param {object} [params.destinationBranch] Destination Branch document/object
 * @returns {{
 *   totalCost: number,
 *   baseFee: number,
 *   weightCharge: number,
 *   chargeableWeight: number,
 *   volumetricWeight: number,
 *   serviceMultiplier: number,
 *   routeSurcharge: number,
 *   serviceKey: string,
 *   serviceName: string,
 *   estimatedDeliveryDays: string
 * }}
 */
export function calculateShippingCost({
  weight,
  length = 0,
  width = 0,
  height = 0,
  serviceType = 'standard',
  originBranch = null,
  destinationBranch = null,
}) {
  const actualWeight = Math.max(0.1, Number(weight) || 1.0);
  const volumetricWeight = calculateVolumetricWeight(length, width, height);
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  const serviceKey = normalizeServiceType(serviceType);
  const config = SERVICE_CONFIGS[serviceKey] || SERVICE_CONFIGS.standard;

  // Route surcharge calculation
  let routeSurcharge = 0;
  if (originBranch && destinationBranch) {
    const isInternational =
      originBranch.country &&
      destinationBranch.country &&
      originBranch.country.toLowerCase() !== destinationBranch.country.toLowerCase();

    const isInterCity =
      originBranch.city &&
      destinationBranch.city &&
      originBranch.city.toLowerCase() !== destinationBranch.city.toLowerCase();

    if (isInternational) {
      routeSurcharge = 150; // International customs & intercontinental surcharge
    } else if (isInterCity) {
      routeSurcharge = 35; // Inter-city domestic transit surcharge
    }
  }

  const weightCharge = Number((chargeableWeight * config.ratePerKg).toFixed(2));
  const rawTotal = (config.baseFee + weightCharge + routeSurcharge) * config.multiplier;
  const totalCost = Number(rawTotal.toFixed(2));

  return {
    totalCost,
    baseFee: config.baseFee,
    weightCharge,
    chargeableWeight: Number(chargeableWeight.toFixed(2)),
    volumetricWeight,
    serviceMultiplier: config.multiplier,
    routeSurcharge,
    serviceKey,
    serviceName: config.displayName,
    estimatedDeliveryDays: config.estimatedDays,
  };
}
