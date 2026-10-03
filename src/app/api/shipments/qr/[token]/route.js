import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/authorization';
import { resolveShipmentByQr } from '@/lib/services/qrService';

/**
 * GET /api/shipments/qr/[token]
 * Resolves an opaque QR token (or tracking number) and returns authorized shipment data.
 *
 * RBAC Rules:
 * - ADMIN: Can resolve any shipment.
 * - CUSTOMER: Can resolve only shipments they own (customerId === user._id).
 * - AGENT: Can resolve only shipments assigned to them (agentId === currentAgent._id).
 *   If not assigned to them, returns 403 Forbidden ("This shipment is not assigned to you.").
 * - UNAUTHENTICATED: 401 Unauthorized.
 * - INVALID / UNKNOWN: 404 Not Found.
 *
 * Scans are strictly for identification:
 * - NO status change.
 * - NO tracking event creation.
 * - NO OTP generation or validation.
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to scan shipment QR codes.' },
        { status: 401 }
      );
    }

    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'QR token parameter is required.' },
        { status: 400 }
      );
    }

    const result = await resolveShipmentByQr({ token, user });

    return NextResponse.json(result, {
      status: result.statusCode || (result.success ? 200 : 400),
    });
  } catch (error) {
    console.error('[QR Lookup API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resolve QR code.' },
      { status: 500 }
    );
  }
}
