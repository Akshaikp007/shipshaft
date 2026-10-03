import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { assignShipmentToAgent } from '@/lib/services/assignmentService';

/**
 * PATCH /api/admin/shipments/[id]/assign
 * Admin manual assignment / reassignment of a shipment to a delivery agent.
 *
 * Rules:
 * - Admin authorization strictly enforced.
 * - Validates shipment exists and is in an assignable state.
 * - Validates agent belongs to shipment's destination branch.
 * - Creates tracking event and customer notification.
 * - Reassignment replaces previous agent and logs appropriate event.
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
        { success: false, error: 'Forbidden: Only administrators can assign or reassign delivery agents.' },
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
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { agentId } = body || {};
    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Agent ID (agentId) is required for assignment.' },
        { status: 400 }
      );
    }

    const result = await assignShipmentToAgent({
      shipment: id,
      agentId,
      isAutomatic: false,
      adminUserId: user._id,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.isReassignment
        ? 'Shipment successfully reassigned to delivery agent.'
        : 'Shipment successfully assigned to delivery agent.',
      isReassignment: result.isReassignment,
      shipment: result.shipment,
      agent: result.agent,
      trackingEvent: result.trackingEvent,
    });
  } catch (error) {
    console.error('[Admin Assign API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign delivery agent.' },
      { status: 500 }
    );
  }
}
