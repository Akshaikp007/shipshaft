import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { verifyDeliveryOtp } from '@/lib/services/otpService';

/**
 * POST /api/shipments/[id]/verify-otp
 *
 * Delivery Handover Verification Endpoint:
 * Strictly restricted to the authorized Delivery Agent assigned to this shipment.
 * Verifies customer-provided 6-digit OTP against the stored SHA-256 hash.
 * On success, transitions shipment status: OUT_FOR_DELIVERY -> DELIVERED.
 */
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    if (user.role !== ROLES.AGENT) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only authorized delivery agents can verify delivery OTP.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Shipment identifier is required.' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { otp } = body || {};
    if (!otp) {
      return NextResponse.json(
        { success: false, error: 'OTP code is required.' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await verifyDeliveryOtp({
      shipmentId: id,
      otp,
      agentUser: user,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        shipment: result.shipment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Verify Delivery OTP API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error verifying delivery OTP.' },
      { status: 500 }
    );
  }
}
