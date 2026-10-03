import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/authorization';
import { getPaymentByShipment } from '@/lib/services/paymentService';

/**
 * GET /api/shipments/[id]/payment
 * Retrieves the payment status and details for a specific shipment.
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Shipment identifier is required.' },
        { status: 400 }
      );
    }

    const data = await getPaymentByShipment(id, user._id, user.role);
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Shipment or payment not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      shipment: data.shipment,
      payment: data.payment,
      invoice: data.invoice,
    });
  } catch (error) {
    console.error('[Shipment Payment GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve shipment payment details.' },
      { status: 500 }
    );
  }
}
