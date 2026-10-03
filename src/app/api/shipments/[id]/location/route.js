import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/authorization';
import { getLatestShipmentLocation } from '@/lib/services/locationService';

/**
 * GET /api/shipments/[id]/location
 * Retrieves the latest real-time GPS location for a shipment.
 * Authorized for:
 *  - Owning Customer
 *  - Assigned Agent
 *  - Administrator
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view shipment location.' },
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

    await connectDB();

    const result = await getLatestShipmentLocation({
      shipmentId: id,
      user,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      trackingActive: result.trackingActive,
      locationFresh: result.locationFresh,
      staleThresholdSeconds: result.staleThresholdSeconds,
      shipmentStatus: result.shipmentStatus,
      location: result.location,
    });
  } catch (error) {
    console.error('[Shipment Location GET API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching shipment location.' },
      { status: 500 }
    );
  }
}
