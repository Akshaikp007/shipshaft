import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import Agent from '@/lib/models/Agent';
import TrackingEvent from '@/lib/models/TrackingEvent';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';

/**
 * GET /api/shipments/[id]
 * Retrieves a single shipment and its tracking events.
 * Enforces customer ownership: Customer can only retrieve their own shipment.
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view shipment details.' },
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

    // Query by either ObjectId or Tracking Number
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { trackingNumber: id.toUpperCase().trim() }] }
      : { trackingNumber: id.toUpperCase().trim() };

    const shipment = await Shipment.findOne(query)
      .populate('customerId', 'name email phone')
      .populate('originBranchId', 'name code city state country address phone')
      .populate('destinationBranchId', 'name code city state country address phone')
      .populate({
        path: 'agentId',
        populate: [
          { path: 'userId', select: 'name email phone avatar' },
          { path: 'branchId', select: 'name code city state' },
        ],
      })
      .lean();

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found.' },
        { status: 404 }
      );
    }

    // RBAC Ownership Enforcement:
    // A CUSTOMER can only access shipments they own
    const shipmentOwnerId = shipment.customerId?._id?.toString() || shipment.customerId?.toString();
    const isOwner = shipmentOwnerId === user._id.toString();
    const isAdmin = user.role === ROLES.ADMIN;
    
    let isAssignedAgent = false;
    if (user.role === ROLES.AGENT) {
      const agentProfile = await Agent.findOne({ userId: user._id }).lean();
      if (agentProfile && shipment.agentId) {
        const assignedAgentId = shipment.agentId._id
          ? shipment.agentId._id.toString()
          : shipment.agentId.toString();
        isAssignedAgent = assignedAgentId === agentProfile._id.toString();
      }
    }

    if (!isOwner && !isAdmin && !isAssignedAgent) {
      // Return 404 to avoid leaking existence of unauthorized shipment IDs
      return NextResponse.json(
        { success: false, error: 'Shipment not found.' },
        { status: 404 }
      );
    }

    // Retrieve associated tracking events
    const trackingEvents = await TrackingEvent.find({ shipmentId: shipment._id })
      .sort({ createdAt: 1 })
      .populate('branchId', 'name code city state')
      .lean();

    return NextResponse.json({
      success: true,
      shipment: {
        _id: shipment._id.toString(),
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        serviceType: shipment.serviceType,
        shippingCost: shipment.shippingCost,
        sender: {
          name: shipment.senderName,
          phone: shipment.senderPhone,
          address: shipment.senderAddress,
        },
        receiver: {
          name: shipment.receiverName,
          phone: shipment.receiverPhone,
          address: shipment.receiverAddress,
        },
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
        deliveredAt: shipment.deliveredAt,
        agent: shipment.agentId
          ? {
              _id: shipment.agentId._id.toString(),
              id: shipment.agentId.employeeId || shipment.agentId._id.toString(),
              employeeId: shipment.agentId.employeeId,
              name: shipment.agentId.userId?.name || shipment.agentId.employeeId || 'Assigned Courier',
              phone: shipment.agentId.userId?.phone,
              email: shipment.agentId.userId?.email,
              branch: shipment.agentId.branchId?.name,
              vehicleType: shipment.agentId.vehicleType,
              vehicleNumber: shipment.agentId.vehicleNumber,
            }
          : null,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt,
      },
      trackingEvents: trackingEvents.map((e) => ({
        _id: e._id.toString(),
        status: e.status,
        description: e.description,
        location: e.location,
        branch: e.branchId,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Shipment Details API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve shipment details.' },
      { status: 500 }
    );
  }
}
