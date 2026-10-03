import React from 'react';
import { notFound, redirect } from 'next/navigation';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import Agent from '@/lib/models/Agent';
import TrackingEvent from '@/lib/models/TrackingEvent';
import '@/lib/models/Branch';
import '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { getEligibleAgentsForBranch } from '@/lib/services/assignmentService';
import AdminShipmentDetailsClient from '@/components/admin/AdminShipmentDetailsClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Shipment #${id} Management | ShipShaft Admin`,
    description: `Administrative manifest and tracking lifecycle for shipment #${id}.`,
  };
}

export default async function AdminShipmentDetailsPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== ROLES.ADMIN) {
    redirect('/login?redirect=/admin/shipments');
  }

  await connectDB();

  const isObjectId = mongoose.isValidObjectId(id);
  const query = isObjectId
    ? { $or: [{ _id: id }, { trackingNumber: id.toUpperCase().trim() }] }
    : { trackingNumber: id.toUpperCase().trim() };

  const dbShipment = await Shipment.findOne(query)
    .populate('originBranchId', 'name code city state address phone')
    .populate('destinationBranchId', 'name code city state address phone')
    .populate({
      path: 'agentId',
      populate: [
        { path: 'userId', select: 'name email phone avatar' },
        { path: 'branchId', select: 'name code city state' },
      ],
    })
    .lean();

  let shipment = null;
  let availableAgents = [];

  if (dbShipment) {
    const trackingEvents = await TrackingEvent.find({ shipmentId: dbShipment._id })
      .sort({ createdAt: 1 })
      .populate('branchId', 'name code city state')
      .lean();

    // Robust agent document resolution
    let agentDoc = dbShipment.agentId;
    if (agentDoc && (!agentDoc.employeeId || !agentDoc.userId)) {
      const rawId = agentDoc._id || agentDoc;
      const loaded = await Agent.findById(rawId)
        .populate('userId', 'name email phone avatar')
        .populate('branchId', 'name code city state')
        .lean();
      if (loaded) {
        agentDoc = loaded;
      }
    }

    // Retrieve eligible agents for this shipment's destination branch
    const rawEligible = await getEligibleAgentsForBranch(
      dbShipment.destinationBranchId?._id || dbShipment.destinationBranchId
    );

    availableAgents = rawEligible.map((a) => ({
      _id: a._id.toString(),
      id: a.employeeId,
      employeeId: a.employeeId,
      name: a.userId?.name || a.employeeId,
      branchCode: a.branchId?.code,
    }));

    // Authoritative 8-stage lifecycle mapping
    const CANONICAL_LIFECYCLE = [
      { key: 'BOOKED', label: 'Booked' },
      { key: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed' },
      { key: 'ASSIGNED', label: 'Assigned' },
      { key: 'PICKED_UP', label: 'Picked Up' },
      { key: 'IN_TRANSIT', label: 'In Transit' },
      { key: 'DESTINATION_HUB', label: 'Destination Hub' },
      { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
      { key: 'DELIVERED', label: 'Delivered' },
    ];

    const currentIdx = CANONICAL_LIFECYCLE.findIndex((s) => s.key === dbShipment.status);
    const isDelivered = dbShipment.status === 'DELIVERED';

    const timelineSteps = CANONICAL_LIFECYCLE.map((stage, idx) => {
      const matchingEvt = trackingEvents.find((e) => e.status === stage.key);

      let milestoneStatus = 'upcoming';
      if (isDelivered || idx < currentIdx) {
        milestoneStatus = 'completed';
      } else if (idx === currentIdx) {
        milestoneStatus = 'current';
      }

      let timestamp = null;
      if (matchingEvt) {
        timestamp = new Date(matchingEvt.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } else if (idx === 0) {
        timestamp = new Date(dbShipment.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }

      let location = matchingEvt?.location;
      if (!location && idx <= currentIdx) {
        if (stage.key === 'BOOKED' || stage.key === 'PICKED_UP') {
          location = dbShipment.originBranchId?.city || 'Origin Facility';
        } else if (stage.key === 'DESTINATION_HUB' || stage.key === 'OUT_FOR_DELIVERY' || stage.key === 'DELIVERED') {
          location = dbShipment.destinationBranchId?.city || 'Destination Hub';
        } else {
          location = 'Transit Logistics Network';
        }
      }

      return {
        step: stage.label,
        title: stage.label,
        status: milestoneStatus,
        timestamp,
        location,
        description:
          matchingEvt?.description ||
          (milestoneStatus === 'upcoming' ? 'Pending milestone' : 'Status verified'),
      };
    });

    shipment = {
      id: dbShipment.trackingNumber,
      trackingNumber: dbShipment.trackingNumber,
      status: dbShipment.status,
      statusLabel: dbShipment.status.replace(/_/g, ' '),
      statusVariant:
        dbShipment.status === 'DELIVERED'
          ? 'success'
          : dbShipment.status === 'ASSIGNED'
          ? 'primary'
          : 'warning',
      customerName: dbShipment.senderName,
      sender: {
        company: dbShipment.senderName,
        address: dbShipment.senderAddress,
        phone: dbShipment.senderPhone,
      },
      recipient: {
        name: dbShipment.receiverName,
        address: dbShipment.receiverAddress,
        phone: dbShipment.receiverPhone,
      },
      origin: dbShipment.originBranchId?.city || 'Origin',
      destination: dbShipment.destinationBranchId?.city || 'Destination',
      originFull: dbShipment.originBranchId?.name
        ? `${dbShipment.originBranchId.name} (${dbShipment.originBranchId.code})`
        : dbShipment.senderAddress,
      destinationFull: dbShipment.destinationBranchId?.name
        ? `${dbShipment.destinationBranchId.name} (${dbShipment.destinationBranchId.code})`
        : dbShipment.receiverAddress,
      date: new Date(dbShipment.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      estimatedDelivery: dbShipment.expectedDeliveryDate
        ? new Date(dbShipment.expectedDeliveryDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : 'Pending',
      amount: `$${Number(dbShipment.shippingCost || 0).toFixed(2)}`,
      agent: agentDoc
        ? {
            _id: agentDoc._id.toString(),
            id: agentDoc.employeeId || agentDoc._id.toString(),
            name: agentDoc.userId?.name || agentDoc.employeeId || 'Assigned Courier',
            employeeId: agentDoc.employeeId || 'N/A',
            phone: agentDoc.userId?.phone || 'N/A',
            email: agentDoc.userId?.email || 'N/A',
            branch: agentDoc.branchId?.name
              ? `${agentDoc.branchId.name} (${agentDoc.branchId.code})`
              : dbShipment.destinationBranchId?.name
              ? `${dbShipment.destinationBranchId.name} (${dbShipment.destinationBranchId.code})`
              : 'Destination Hub',
            branchCode: agentDoc.branchId?.code || '',
            vehicleType: agentDoc.vehicleType || 'Delivery Van',
            vehicleNumber: agentDoc.vehicleNumber || 'N/A',
            availability: agentDoc.availability || 'AVAILABLE',
            status: agentDoc.status || 'ACTIVE',
          }
        : null,
      timeline: timelineSteps,
      trackingHistory: trackingEvents.map((t) => ({
        _id: t._id.toString(),
        status: t.status,
        statusLabel: t.status.replace(/_/g, ' '),
        date: new Date(t.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        location: t.location || 'Logistics Terminal',
        description: t.description || 'Status update logged',
      })),
    };
  } else {
    notFound();
  }

  return (
    <AdminShipmentDetailsClient
      shipment={shipment}
      availableAgents={availableAgents}
    />
  );
}
