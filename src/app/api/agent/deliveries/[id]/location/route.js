import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { recordAgentLocation } from '@/lib/services/locationService';

/**
 * POST /api/agent/deliveries/[id]/location
 * Submits real-time GPS telemetry for an active delivery.
 * Restricted exclusively to the assigned delivery agent.
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

    // Role check: Only AGENT is allowed to submit GPS updates.
    // Customers and Admins receive 403 (Admins cannot impersonate agents for live GPS).
    if (user.role !== ROLES.AGENT) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only authorized delivery agents can submit GPS updates.' },
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

    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { latitude, longitude, accuracy, recordedAt } = body;

    await connectDB();

    const result = await recordAgentLocation({
      shipmentId: id,
      agentUser: user,
      latitude,
      longitude,
      accuracy,
      recordedAt,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Location telemetry recorded successfully.',
        location: result.location,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Agent Location POST API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while recording location.' },
      { status: 500 }
    );
  }
}
