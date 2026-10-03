import crypto from 'crypto';
import Shipment from '@/lib/models/Shipment';
import { connectDB } from '@/lib/db';

/**
 * Generates an 8-character uppercase alphanumeric code.
 * @returns {string}
 */
function createTrackingCode() {
  // 4 random bytes = 8 hex chars (e.g., "7A4F91C2")
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Generate a collision-resistant, unique ShipShaft tracking number.
 * Format: SHP-XXXXXXXX (e.g. SHP-7A4F91C2)
 *
 * @param {number} [maxAttempts=10]
 * @returns {Promise<string>}
 */
export async function generateUniqueTrackingNumber(maxAttempts = 10) {
  await connectDB();

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = createTrackingCode();
    const candidate = `SHP-${code}`;

    // Verify collision resistance against MongoDB
    const existing = await Shipment.findOne({ trackingNumber: candidate }).lean();
    if (!existing) {
      return candidate;
    }
  }

  // Fallback with timestamp suffix if extreme collisions occur
  const emergencyCode = Date.now().toString(36).toUpperCase().slice(-8);
  return `SHP-${emergencyCode}`;
}
