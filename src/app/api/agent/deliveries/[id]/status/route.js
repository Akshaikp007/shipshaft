import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import Agent from '@/lib/models/Agent';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { advanceShipmentStatus } from '@/lib/services/shipmentStatusService';

/**
 * PATCH /api/agent/deliveries/[id]/status
 *
 * Status advancement endpoint for assigned delivery agents.
 * Strictly enforces sequential state machine:
 * ASSIGNED -> PICKED_UP -> IN_TRANSIT -> DESTINATION_HUB -> OUT_FOR_DELIVERY.
 *
 * Direct transition to DELIVERED is strictly rejected.
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

    if (user.role !== ROLES.AGENT) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access restricted to authorized delivery agents.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Delivery identifier is required.' },
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

    const agent = await Agent.findOne({ userId: user._id });
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent profile not found.' },
        { status: 404 }
      );
    }

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

    // Verify assignment: Agent can only update shipments assigned to them
    const assignedAgentId = shipment.agentId?.toString();
    if (!assignedAgentId || assignedAgentId !== agent._id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: This shipment is not assigned to you.' },
        { status: 403 }
      );
    }

    const simulateFailure =
      request.headers.get('x-simulate-email-failure') === 'true' || body?.simulateFailure === true;

    // Advance status via state machine service
    const result = await advanceShipmentStatus({
      shipmentId: shipment._id,
      nextStatus,
      actorUser: user,
      location,
      simulateFailure,
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
    console.error('[Agent Update Delivery Status Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update delivery status.',
      },
      { status: error.statusCode || 500 }
    );
  }
}
