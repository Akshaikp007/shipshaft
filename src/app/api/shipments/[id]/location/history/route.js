import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/authorization';
import { getShipmentLocationHistory } from '@/lib/services/locationService';

/**
 * GET /api/shipments/[id]/location/history
 * Retrieves historical GPS telemetry for a shipment.
 * Query parameter: ?limit=50 (server maximum capped at 100).
 * Sorted chronologically ascending (recordedAt: 1).
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view location history.' },
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

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');

    await connectDB();

    const result = await getShipmentLocationHistory({
      shipmentId: id,
      user,
      limit: limitParam,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      history: result.history,
    });
  } catch (error) {
    console.error('[Shipment Location History GET API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching location history.' },
      { status: 500 }
    );
  }
}
