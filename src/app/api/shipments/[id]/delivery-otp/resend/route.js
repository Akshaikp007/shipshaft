import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { resendDeliveryOtp } from '@/lib/services/otpService';

/**
 * POST /api/shipments/[id]/delivery-otp/resend
 *
 * Controlled OTP Resend Endpoint:
 * Strictly restricted to the Customer who owns the shipment.
 * Enforces 60-second rate limiting cooldown.
 * Only available when shipment is in OUT_FOR_DELIVERY status.
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

    if (user.role !== ROLES.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: OTP resend is only available to registered customers.' },
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

    await connectDB();

    const result = await resendDeliveryOtp({
      shipmentId: id,
      customerUser: user,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          retryAfter: result.retryAfter,
        },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Resend Delivery OTP API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while resending delivery OTP.' },
      { status: 500 }
    );
  }
}
