import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import Agent from '@/lib/models/Agent';
import TrackingEvent from '@/lib/models/TrackingEvent';
import '@/lib/models/Branch';
import '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';

/**
 * GET /api/agent/deliveries/[id]
 * Retrieves details of a specific delivery assigned to the authenticated agent.
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

    if (user.role !== ROLES.AGENT && user.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access restricted to assigned agents and administrators.' },
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

    let agent = null;
    if (user.role === ROLES.AGENT) {
      agent = await Agent.findOne({ userId: user._id });
      if (!agent) {
        return NextResponse.json(
          { success: false, error: 'Agent profile not found.' },
          { status: 404 }
        );
      }
    }

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { trackingNumber: id.toUpperCase().trim() }] }
      : { trackingNumber: id.toUpperCase().trim() };

    const shipment = await Shipment.findOne(query)
      .populate('destinationBranchId', 'name code city state address phone')
      .populate('originBranchId', 'name code city state address phone')
      .populate('agentId', 'employeeId vehicleType vehicleNumber')
      .lean();

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Delivery record not found.' },
        { status: 404 }
      );
    }

    // Authorization check: If AGENT, must be the assigned agent
    if (user.role === ROLES.AGENT) {
      const assignedAgentId = shipment.agentId?._id?.toString() || shipment.agentId?.toString();
      if (!assignedAgentId || assignedAgentId !== agent._id.toString()) {
        return NextResponse.json(
          { success: false, error: 'Delivery record not found.' },
          { status: 404 }
        );
      }
    }

    const trackingEvents = await TrackingEvent.find({ shipmentId: shipment._id })
      .sort({ createdAt: 1 })
      .populate('branchId', 'name code city state')
      .lean();

    return NextResponse.json({
      success: true,
      delivery: {
        _id: shipment._id.toString(),
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        serviceType: shipment.serviceType,
        shippingCost: shipment.shippingCost,
        receiverName: shipment.receiverName,
        receiverPhone: shipment.receiverPhone,
        receiverAddress: shipment.receiverAddress,
        senderName: shipment.senderName,
        senderPhone: shipment.senderPhone,
        senderAddress: shipment.senderAddress,
        originBranch: shipment.originBranchId,
        destinationBranch: shipment.destinationBranchId,
        package: {
          description: shipment.packageDescription,
          weight: shipment.weight,
          length: shipment.length,
          width: shipment.width,
          height: shipment.height,
        },
        expectedDeliveryDate: shipment.expectedDeliveryDate,
        agent: shipment.agentId,
        createdAt: shipment.createdAt,
      },
      trackingEvents: trackingEvents.map((t) => ({
        _id: t._id.toString(),
        status: t.status,
        description: t.description,
        location: t.location,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Agent Delivery Details GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve delivery details.' },
      { status: 500 }
    );
  }
}
