import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import TrackingEvent from '@/lib/models/TrackingEvent';
import '@/lib/models/Branch';

/**
 * GET /api/track/[trackingNumber]
 * Public tracking endpoint.
 * Returns only non-sensitive, authoritative public tracking milestones and status.
 * Never exposes customer personal information, payment amounts, OTPs, or exact GPS coordinates.
 */
export async function GET(request, { params }) {
  try {
    const { trackingNumber } = await params;
    if (!trackingNumber) {
      return NextResponse.json(
        { success: false, error: 'Tracking number is required.' },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedNumber = trackingNumber.trim().toUpperCase();
    const isObjectId = mongoose.isValidObjectId(normalizedNumber);
    const query = isObjectId
      ? { $or: [{ _id: normalizedNumber }, { trackingNumber: normalizedNumber }] }
      : { trackingNumber: normalizedNumber };

    const shipment = await Shipment.findOne(query)
      .populate('originBranchId', 'name code city state')
      .populate('destinationBranchId', 'name code city state')
      .lean();

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found.' },
        { status: 404 }
      );
    }

    // Retrieve real tracking events from database
    const events = await TrackingEvent.find({ shipmentId: shipment._id })
      .sort({ createdAt: 1 })
      .populate('branchId', 'name code city state')
      .lean();

    const originCity = shipment.originBranchId?.city || 'Origin Terminal';
    const originHub = shipment.originBranchId
      ? `${shipment.originBranchId.name} (${shipment.originBranchId.code})`
      : 'ShipShaft Processing Facility';

    const destinationCity = shipment.destinationBranchId?.city || 'Destination Hub';
    const destinationHub = shipment.destinationBranchId
      ? `${shipment.destinationBranchId.name} (${shipment.destinationBranchId.code})`
      : 'Destination Dispatch Center';

    // Map real tracking events to public timeline steps
    const steps = events.map((ev, index) => {
      let icon = 'check';
      if (ev.status === 'BOOKED') icon = 'inventory_2';
      else if (ev.status === 'PAYMENT_CONFIRMED') icon = 'payments';
      else if (ev.status === 'ASSIGNED') icon = 'badge';
      else if (ev.status === 'PICKED_UP') icon = 'archive';
      else if (ev.status === 'IN_TRANSIT') icon = 'local_shipping';
      else if (ev.status === 'DESTINATION_HUB') icon = 'warehouse';
      else if (ev.status === 'OUT_FOR_DELIVERY') icon = 'directions_bike';
      else if (ev.status === 'DELIVERED') icon = 'home';

      const isLatest = index === events.length - 1;
      const isDelivered = shipment.status === 'DELIVERED';

      return {
        id: ev._id.toString(),
        title: ev.status.replace(/_/g, ' '),
        timestamp: new Date(ev.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        description: ev.description || `Consignment status: ${ev.status.replace(/_/g, ' ')}`,
        status: isDelivered ? 'completed' : isLatest ? 'current' : 'completed',
        icon,
        location: ev.location || (ev.branchId ? `${ev.branchId.name}, ${ev.branchId.city}` : null),
      };
    });

    const publicShipment = {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      statusLabel: shipment.status.replace(/_/g, ' '),
      carrier: 'ShipShaft Precision Express',
      serviceType: shipment.serviceType,
      eta: shipment.expectedDeliveryDate
        ? new Date(shipment.expectedDeliveryDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Pending dispatch',
      origin: {
        city: originCity,
        hub: originHub,
      },
      destination: {
        city: destinationCity,
        hub: destinationHub,
      },
      telemetry: {
        status: shipment.status === 'OUT_FOR_DELIVERY' ? 'Active Doorstep Telemetry' : 'Stationary Node',
      },
      steps,
      createdAt: shipment.createdAt,
    };

    return NextResponse.json({
      success: true,
      shipment: publicShipment,
    });
  } catch (error) {
    console.error('[Public Tracking API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error retrieving tracking information.' },
      { status: 500 }
    );
  }
}
