import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import Agent from '@/lib/models/Agent';
import '@/lib/models/Branch';
import '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';

/**
 * GET /api/agent/deliveries
 * Retrieves deliveries assigned strictly to the authenticated delivery agent.
 */
export async function GET(request) {
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
        { success: false, error: 'Forbidden: Only delivery agents can access this queue.' },
        { status: 403 }
      );
    }

    await connectDB();

    // Resolve Agent record associated with this user
    const agent = await Agent.findOne({ userId: user._id });
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent profile not found for authenticated user.' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'ALL' | 'ASSIGNED' | 'ACTIVE' | 'COMPLETED'
    const search = searchParams.get('search')?.trim().toLowerCase();

    // Base query: strictly limited to the authenticated agent's assigned shipments
    const query = { agentId: agent._id };

    if (filter === 'ASSIGNED') {
      query.status = 'ASSIGNED';
    } else if (filter === 'ACTIVE') {
      query.status = { $in: ['ASSIGNED', 'PICKED_UP', 'ORIGIN_HUB', 'IN_TRANSIT', 'DESTINATION_HUB', 'OUT_FOR_DELIVERY'] };
    } else if (filter === 'COMPLETED') {
      query.status = 'DELIVERED';
    }

    const shipments = await Shipment.find(query)
      .populate('destinationBranchId', 'name code city state address')
      .populate('originBranchId', 'name code city state address')
      .sort({ updatedAt: -1 })
      .lean();

    // Optional in-memory search across trackingNumber, receiverName, destination address
    const filtered = search
      ? shipments.filter((s) => {
          return (
            s.trackingNumber?.toLowerCase().includes(search) ||
            s.receiverName?.toLowerCase().includes(search) ||
            s.receiverAddress?.toLowerCase().includes(search) ||
            s.destinationBranchId?.city?.toLowerCase().includes(search)
          );
        })
      : shipments;

    return NextResponse.json({
      success: true,
      agent: {
        _id: agent._id.toString(),
        employeeId: agent.employeeId,
        vehicleType: agent.vehicleType,
        vehicleNumber: agent.vehicleNumber,
        status: agent.status,
        availability: agent.availability,
      },
      deliveries: filtered.map((s) => ({
        id: s._id.toString(),
        _id: s._id.toString(),
        trackingNumber: s.trackingNumber,
        status: s.status,
        serviceType: s.serviceType,
        shippingCost: s.shippingCost,
        receiverName: s.receiverName,
        receiverPhone: s.receiverPhone,
        receiverAddress: s.receiverAddress,
        senderName: s.senderName,
        senderAddress: s.senderAddress,
        originCity: s.originBranchId?.city || 'Origin',
        destinationCity: s.destinationBranchId?.city || 'Destination',
        destinationFull: s.destinationBranchId?.name
          ? `${s.destinationBranchId.name} (${s.destinationBranchId.code})`
          : s.receiverAddress,
        weight: s.weight,
        packageDescription: s.packageDescription,
        expectedDeliveryDate: s.expectedDeliveryDate,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    console.error('[Agent Deliveries GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve deliveries queue.' },
      { status: 500 }
    );
  }
}
