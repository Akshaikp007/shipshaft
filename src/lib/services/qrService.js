import crypto from 'crypto';
import QRCode from 'qrcode';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import Agent from '@/lib/models/Agent';
import { ROLES } from '@/lib/constants/roles';

export const QR_PAYLOAD_PREFIX = 'SHIPSHAFT:';

/**
 * Generate a cryptographically secure, opaque QR token.
 * Format: SHPQR-<32-hex-chars>
 * e.g. SHPQR-4F1A8C9B3D2E5A7B6C8D0E1F2A3B4C5D
 */
export function generateRawQrToken() {
  const randomHex = crypto.randomBytes(16).toString('hex').toUpperCase();
  return `SHPQR-${randomHex}`;
}

/**
 * Generates a unique QR token verified against the database.
 */
export async function generateUniqueQrToken() {
  await connectDB();
  let token = generateRawQrToken();
  let existing = await Shipment.findOne({ qrToken: token });
  let attempts = 0;

  while (existing && attempts < 5) {
    token = generateRawQrToken();
    existing = await Shipment.findOne({ qrToken: token });
    attempts++;
  }

  return token;
}

/**
 * Formats a QR token into an application payload string.
 * Example: SHIPSHAFT:SHPQR-XXXXXXXXXXXX
 */
export function formatQrPayload(qrToken) {
  if (!qrToken) return '';
  return `${QR_PAYLOAD_PREFIX}${qrToken}`;
}

/**
 * Extracts and normalizes a QR token or tracking number from scanned text.
 * Handles:
 * - SHIPSHAFT:SHPQR-XXXXX
 * - https://.../track?qr=SHPQR-XXXXX
 * - Raw SHPQR-XXXXX
 * - Raw SHP-XXXXXXXX (tracking number fallback)
 */
export function parseScannedQrCode(scannedText) {
  if (!scannedText || typeof scannedText !== 'string') {
    return '';
  }

  const trimmed = scannedText.trim();

  // 1. Deep link / URL containing ?qr=
  if (trimmed.includes('?qr=') || trimmed.includes('&qr=')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const param = url.searchParams.get('qr');
      if (param) return param.trim().toUpperCase();
    } catch {
      // Fallback regex if URL parsing fails
      const match = trimmed.match(/[?&]qr=([^&#]+)/i);
      if (match && match[1]) return decodeURIComponent(match[1]).trim().toUpperCase();
    }
  }

  // 2. Prefixed SHIPSHAFT:<token>
  if (trimmed.toUpperCase().startsWith(QR_PAYLOAD_PREFIX)) {
    return trimmed.slice(QR_PAYLOAD_PREFIX.length).trim().toUpperCase();
  }

  // 3. Raw token or tracking code
  return trimmed.toUpperCase();
}

/**
 * Ensures a shipment has a persisted, stable QR token.
 * If the shipment already has a qrToken, returns it.
 * If not, generates one and updates MongoDB atomically.
 *
 * @param {Object|string} shipmentDocOrId
 * @returns {Promise<string>} qrToken
 */
export async function ensureShipmentQrToken(shipmentDocOrId) {
  await connectDB();

  if (!shipmentDocOrId) return null;

  // If already an object with qrToken
  if (typeof shipmentDocOrId === 'object' && shipmentDocOrId.qrToken) {
    return shipmentDocOrId.qrToken;
  }

  let shipmentId = shipmentDocOrId;
  if (shipmentDocOrId && typeof shipmentDocOrId === 'object') {
    if (shipmentDocOrId._id) {
      shipmentId = shipmentDocOrId._id;
    } else if (mongoose.isValidObjectId(shipmentDocOrId)) {
      shipmentId = shipmentDocOrId;
    }
  }

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) return null;

  if (shipment.qrToken) {
    return shipment.qrToken;
  }

  const newToken = await generateUniqueQrToken();
  await Shipment.findByIdAndUpdate(shipmentId, { $set: { qrToken: newToken } });

  return newToken;
}

/**
 * Generates a base64 DataURL for a QR payload.
 * High error correction (M) for logistics waybill readability.
 *
 * @param {string} payload
 * @returns {Promise<string>} Data URL string (image/png)
 */
export async function generateQrDataUrl(payload) {
  if (!payload) return '';
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
    color: {
      dark: '#001A41', // ShipShaft brand dark navy
      light: '#FFFFFF',
    },
  });
}

/**
 * Generates an SVG string for a QR payload.
 *
 * @param {string} payload
 * @returns {Promise<string>} SVG string
 */
export async function generateQrSvg(payload) {
  if (!payload) return '';
  return QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
    color: {
      dark: '#001A41',
      light: '#FFFFFF',
    },
  });
}

/**
 * Resolves a shipment by QR token or tracking number with RBAC enforcement.
 *
 * Authorization rules:
 * - Admin: Can resolve any shipment.
 * - Customer: Can resolve only shipments they own (customerId === user._id).
 * - Agent: Can resolve only shipments assigned to them (agentId === agent._id).
 *
 * @param {Object} options
 * @param {string} options.token - Scanned QR token or tracking number
 * @param {Object} options.user - Authenticated user from session
 * @returns {Promise<Object>} { success, statusCode, shipment, error }
 */
export async function resolveShipmentByQr({ token, user }) {
  await connectDB();

  if (!token || typeof token !== 'string') {
    return {
      success: false,
      statusCode: 400,
      error: 'QR token or identifier is required.',
    };
  }

  if (!user) {
    return {
      success: false,
      statusCode: 401,
      error: 'Authentication required to scan shipment QR codes.',
    };
  }

  const normalizedToken = parseScannedQrCode(token);

  // Search by qrToken first, or fallback to trackingNumber
  const query = {
    $or: [
      { qrToken: normalizedToken },
      { trackingNumber: normalizedToken },
    ],
  };

  const shipment = await Shipment.findOne(query)
    .populate('originBranchId', 'name code city state')
    .populate('destinationBranchId', 'name code city state')
    .populate('customerId', 'name email phone')
    .populate({
      path: 'agentId',
      populate: { path: 'userId', select: 'name email phone' },
    });

  if (!shipment) {
    return {
      success: false,
      statusCode: 404,
      error: 'Invalid QR code. Shipment not found.',
    };
  }

  // Enforce Authorization:
  const userIdStr = user._id.toString();

  // 1. Admin: Unrestricted access
  if (user.role === ROLES.ADMIN) {
    return buildAuthorizedQrResponse(shipment, user.role);
  }

  // 2. Customer: Must own the shipment
  if (user.role === ROLES.CUSTOMER) {
    const ownerIdStr = shipment.customerId?._id?.toString() || shipment.customerId?.toString();
    if (ownerIdStr !== userIdStr) {
      return {
        success: false,
        statusCode: 403,
        error: 'Forbidden: You do not have permission to view this shipment.',
      };
    }
    return buildAuthorizedQrResponse(shipment, user.role);
  }

  // 3. Agent: Must be assigned to this shipment
  if (user.role === ROLES.AGENT) {
    const agent = await Agent.findOne({ userId: user._id });
    if (!agent) {
      return {
        success: false,
        statusCode: 403,
        error: 'Forbidden: Delivery agent profile not found.',
      };
    }

    const assignedAgentIdStr = shipment.agentId?._id?.toString() || shipment.agentId?.toString();
    const currentAgentIdStr = agent._id.toString();

    if (!assignedAgentIdStr || assignedAgentIdStr !== currentAgentIdStr) {
      return {
        success: false,
        statusCode: 403,
        error: 'This shipment is not assigned to you.',
        notAssigned: true,
      };
    }

    return buildAuthorizedQrResponse(shipment, user.role);
  }

  return {
    success: false,
    statusCode: 403,
    error: 'Unauthorized access.',
  };
}

/**
 * Builds a clean, sanitized response payload for identified shipment.
 * Strictly excludes passwordHash, OTP secrets, payment keys, etc.
 */
function buildAuthorizedQrResponse(shipment, role) {
  const originName = shipment.originBranchId?.name
    ? `${shipment.originBranchId.name} (${shipment.originBranchId.code})`
    : shipment.senderAddress;

  const destinationName = shipment.destinationBranchId?.name
    ? `${shipment.destinationBranchId.name} (${shipment.destinationBranchId.code})`
    : shipment.receiverAddress;

  return {
    success: true,
    statusCode: 200,
    shipment: {
      id: shipment._id.toString(),
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      statusLabel: shipment.status.replace(/_/g, ' '),
      serviceType: shipment.serviceType,
      receiverName: shipment.receiverName,
      receiverPhone: role === ROLES.AGENT || role === ROLES.ADMIN ? shipment.receiverPhone : undefined,
      receiverAddress: shipment.receiverAddress,
      senderName: shipment.senderName,
      senderAddress: shipment.senderAddress,
      origin: originName,
      destination: destinationName,
      originCity: shipment.originBranchId?.city || 'Origin',
      destinationCity: shipment.destinationBranchId?.city || 'Destination',
      packageDescription: shipment.packageDescription,
      weight: shipment.weight,
      expectedDeliveryDate: shipment.expectedDeliveryDate,
      assignedAgent: shipment.agentId
        ? {
            id: shipment.agentId._id?.toString(),
            employeeId: shipment.agentId.employeeId,
            name: shipment.agentId.userId?.name,
          }
        : null,
      qrToken: shipment.qrToken,
    },
  };
}
