import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import TrackingEvent from '@/lib/models/TrackingEvent';
import Branch from '@/lib/models/Branch';
import { getCurrentUser } from '@/lib/auth/authorization';
import { calculateShippingCost } from '@/lib/services/shippingPricing';
import { generateUniqueTrackingNumber } from '@/lib/services/trackingNumber';
import { SHIPMENT_STATUS } from '@/lib/constants/shipmentStatus';
import { ROLES } from '@/lib/constants/roles';
import { generateUniqueQrToken } from '@/lib/services/qrService';

/**
 * POST /api/shipments
 * Creates a new shipment for the authenticated customer.
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to book a shipment.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      senderName,
      senderPhone,
      senderAddress,
      receiverName,
      receiverPhone,
      receiverAddress,
      packageDescription,
      weight,
      length,
      width,
      height,
      serviceType,
      originBranchId,
      destinationBranchId,
    } = body;

    // 1. Validation - Required sender fields
    if (!senderName || typeof senderName !== 'string' || !senderName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Sender name is required.' },
        { status: 400 }
      );
    }
    if (!senderPhone || typeof senderPhone !== 'string' || !senderPhone.trim()) {
      return NextResponse.json(
        { success: false, error: 'Sender phone number is required.' },
        { status: 400 }
      );
    }
    if (!senderAddress || typeof senderAddress !== 'string' || !senderAddress.trim()) {
      return NextResponse.json(
        { success: false, error: 'Sender address is required.' },
        { status: 400 }
      );
    }

    // 2. Validation - Required receiver fields
    if (!receiverName || typeof receiverName !== 'string' || !receiverName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Receiver name is required.' },
        { status: 400 }
      );
    }
    if (!receiverPhone || typeof receiverPhone !== 'string' || !receiverPhone.trim()) {
      return NextResponse.json(
        { success: false, error: 'Receiver phone number is required.' },
        { status: 400 }
      );
    }
    if (!receiverAddress || typeof receiverAddress !== 'string' || !receiverAddress.trim()) {
      return NextResponse.json(
        { success: false, error: 'Receiver address is required.' },
        { status: 400 }
      );
    }

    // 3. Validation - Weight
    const numWeight = Number(weight);
    if (isNaN(numWeight) || numWeight <= 0) {
      return NextResponse.json(
        { success: false, error: 'Package weight must be a positive number greater than 0.' },
        { status: 400 }
      );
    }

    // 4. Validation - Dimensions (if provided)
    const numLength = length !== undefined && length !== '' ? Number(length) : 0;
    const numWidth = width !== undefined && width !== '' ? Number(width) : 0;
    const numHeight = height !== undefined && height !== '' ? Number(height) : 0;
    if (numLength < 0 || numWidth < 0 || numHeight < 0) {
      return NextResponse.json(
        { success: false, error: 'Package dimensions cannot be negative.' },
        { status: 400 }
      );
    }

    await connectDB();

    // 5. Validation - Branch existence and ObjectId validity
    if (!originBranchId || !mongoose.isValidObjectId(originBranchId)) {
      return NextResponse.json(
        { success: false, error: 'A valid origin branch must be selected.' },
        { status: 400 }
      );
    }
    if (!destinationBranchId || !mongoose.isValidObjectId(destinationBranchId)) {
      return NextResponse.json(
        { success: false, error: 'A valid destination branch must be selected.' },
        { status: 400 }
      );
    }

    const [originBranch, destBranch] = await Promise.all([
      Branch.findById(originBranchId).lean(),
      Branch.findById(destinationBranchId).lean(),
    ]);

    if (!originBranch || !originBranch.isActive) {
      return NextResponse.json(
        { success: false, error: 'Selected origin branch does not exist or is inactive.' },
        { status: 400 }
      );
    }
    if (!destBranch || !destBranch.isActive) {
      return NextResponse.json(
        { success: false, error: 'Selected destination branch does not exist or is inactive.' },
        { status: 400 }
      );
    }

    // 6. Server-side authoritative pricing (Never trust client shippingCost)
    const pricingResult = calculateShippingCost({
      weight: numWeight,
      length: numLength,
      width: numWidth,
      height: numHeight,
      serviceType: serviceType || 'standard',
      originBranch,
      destinationBranch: destBranch,
    });
    const shippingCost = pricingResult.totalCost;

    // 7. Server-side unique tracking number generation
    const trackingNumber = await generateUniqueTrackingNumber();

    // 8. Server-side unique opaque QR token generation (Never client-generated)
    const qrToken = await generateUniqueQrToken();

    // 9. Calculate expected delivery window
    const daysToAdd = pricingResult.serviceKey === 'priority' ? 1 : pricingResult.serviceKey === 'express' ? 3 : 5;
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + daysToAdd);

    // 10. Atomic / Safe Creation of Shipment and Initial Tracking Event
    let createdShipment = null;

    try {
      createdShipment = await Shipment.create({
        trackingNumber,
        qrToken,
        customerId: user._id, // Authoritative customer ID derived strictly from session
        originBranchId: originBranch._id,
        destinationBranchId: destBranch._id,
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        senderAddress: senderAddress.trim(),
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        receiverAddress: receiverAddress.trim(),
        packageDescription: (packageDescription || 'General Cargo').trim(),
        weight: numWeight,
        length: numLength,
        width: numWidth,
        height: numHeight,
        serviceType: pricingResult.serviceName,
        shippingCost,
        status: SHIPMENT_STATUS.BOOKED, // Always starts as BOOKED
        expectedDeliveryDate,
      });

      // Initial Tracking Event
      await TrackingEvent.create({
        shipmentId: createdShipment._id,
        status: SHIPMENT_STATUS.BOOKED,
        description: 'Shipment booked successfully',
        location: `${originBranch.city}, ${originBranch.state}`,
        branchId: originBranch._id,
      });
    } catch (creationError) {
      // Safe cleanup rollback if tracking event or shipment creation failed
      if (createdShipment && createdShipment._id) {
        await Shipment.findByIdAndDelete(createdShipment._id).catch(() => {});
      }
      console.error('[Shipment Booking Creation Error]:', creationError);
      return NextResponse.json(
        { success: false, error: 'Failed to record shipment. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Shipment booked successfully.',
        trackingNumber,
        shipment: {
          _id: createdShipment._id.toString(),
          trackingNumber: createdShipment.trackingNumber,
          status: createdShipment.status,
          shippingCost: createdShipment.shippingCost,
          serviceType: createdShipment.serviceType,
          expectedDeliveryDate: createdShipment.expectedDeliveryDate,
          qrToken: createdShipment.qrToken,
          createdAt: createdShipment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Shipment Booking API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while booking the shipment.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shipments
 * Retrieves shipments belonging to the authenticated customer.
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view shipments.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Filter by customer ownership (ADMIN can see all, CUSTOMER sees only own)
    const query = {};
    if (user.role === ROLES.CUSTOMER) {
      query.customerId = user._id;
    } else if (user.role === ROLES.AGENT) {
      query.agentId = user._id;
    }

    // Status filter
    if (status && status.toUpperCase() !== 'ALL') {
      if (status.toUpperCase() === 'ACTIVE') {
        query.status = { $in: [SHIPMENT_STATUS.BOOKED, SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.OUT_FOR_DELIVERY] };
      } else {
        query.status = status.toUpperCase();
      }
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { trackingNumber: searchRegex },
        { receiverName: searchRegex },
        { senderName: searchRegex },
        { receiverAddress: searchRegex },
      ];
    }

    const [shipments, total] = await Promise.all([
      Shipment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('originBranchId', 'name code city state country')
        .populate({
          path: 'agentId',
          select: 'employeeId vehicleType vehicleNumber',
          populate: { path: 'userId', select: 'name email phone' },
        })
        .lean(),
      Shipment.countDocuments(query),
    ]);

    const formattedShipments = shipments.map((s) => ({
      _id: s._id.toString(),
      id: s.trackingNumber,
      trackingNumber: s.trackingNumber,
      status: s.status,
      serviceType: s.serviceType,
      shippingCost: s.shippingCost,
      sender: {
        name: s.senderName,
        phone: s.senderPhone,
        address: s.senderAddress,
      },
      receiver: {
        name: s.receiverName,
        phone: s.receiverPhone,
        address: s.receiverAddress,
      },
      destination: s.destinationBranchId
        ? `${s.destinationBranchId.city}, ${s.destinationBranchId.state}`
        : s.receiverAddress,
      origin: s.originBranchId
        ? `${s.originBranchId.city}, ${s.originBranchId.state}`
        : s.senderAddress,
      originBranch: s.originBranchId,
      destinationBranch: s.destinationBranchId,
      agent: s.agentId
        ? {
            _id: s.agentId._id.toString(),
            id: s.agentId.employeeId,
            employeeId: s.agentId.employeeId,
            name: s.agentId.userId?.name || s.agentId.employeeId,
            vehicleType: s.agentId.vehicleType,
            vehicleNumber: s.agentId.vehicleNumber,
          }
        : null,
      package: {
        description: s.packageDescription,
        weight: s.weight,
        dimensions: `${s.length || 0}x${s.width || 0}x${s.height || 0} cm`,
      },
      expectedDeliveryDate: s.expectedDeliveryDate,
      qrToken: s.qrToken,
      createdAt: s.createdAt,
    }));


    return NextResponse.json({
      success: true,
      shipments: formattedShipments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Shipments List API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve shipments.' },
      { status: 500 }
    );
  }
}
