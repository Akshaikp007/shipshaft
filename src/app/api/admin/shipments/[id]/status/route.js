import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { advanceShipmentStatus } from '@/lib/services/shipmentStatusService';

/**
 * PATCH /api/admin/shipments/[id]/status
 *
 * Admin status advancement endpoint.
 * Validates sequential state machine.
 * Direct mutation to DELIVERED is strictly prohibited.
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    if (user.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access restricted to administrators.' },
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

    const { status: nextStatus, location } = body || {};
    if (!nextStatus) {
      return NextResponse.json(
        { success: false, error: 'Target status is required.' },
        { status: 400 }
      );
    }

    if (nextStatus === 'DELIVERED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Direct transition to DELIVERED is prohibited. Delivery completion strictly requires recipient OTP verification at /api/shipments/[id]/verify-otp.',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { trackingNumber: id.toUpperCase().trim() }] }
      : { trackingNumber: id.toUpperCase().trim() };

    const shipment = await Shipment.findOne(query);
    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment record not found.' },
        { status: 404 }
      );
    }

    const result = await advanceShipmentStatus({
      shipmentId: shipment._id,
      nextStatus,
      actorUser: user,
      location,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      shipment: {
        id: result.shipment._id.toString(),
        trackingNumber: result.shipment.trackingNumber,
        status: result.shipment.status,
      },
    });
  } catch (error) {
    console.error('[Admin Update Shipment Status Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update shipment status.',
      },
      { status: error.statusCode || 500 }
    );
  }
}
