import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { processShipmentPayment } from '@/lib/services/paymentService';

/**
 * POST /api/payments
 * Initiates and executes simulated payment for a shipment.
 *
 * Rules:
 * - Authentication required (CUSTOMER or ADMIN).
 * - Customer can only pay for their own shipment.
 * - Server determines payment amount from shipment.shippingCost in DB.
 * - Ignores any client-supplied amount.
 * - Rejects duplicate payments.
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to process payment.' },
        { status: 401 }
      );
    }

    if (user.role !== ROLES.CUSTOMER && user.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only customers and admins can process payments.' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { shipmentId, method } = body || {};

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: 'Shipment identifier (shipmentId) is required.' },
        { status: 400 }
      );
    }

    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required (e.g., CARD, UPI, NET_BANKING).' },
        { status: 400 }
      );
    }

    // Call paymentService: encapsulates validation, simulation, and persistence
    const result = await processShipmentPayment({
      shipmentId,
      customerId: user._id,
      userRole: user.role,
      method,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          alreadyPaid: result.alreadyPaid || false,
          existingPayment: result.existingPayment || null,
        },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment simulated and processed successfully.',
        payment: result.payment,
        invoice: result.invoice,
        shipment: result.shipment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Payment API POST Error]:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while processing payment.' },
      { status: 500 }
    );
  }
}
