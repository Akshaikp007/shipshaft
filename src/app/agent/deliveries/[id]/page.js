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
import DeliveryDetailsClient from '@/components/agent/DeliveryDetailsClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Delivery #${id} | ShipShaft Agent`,
    description: `Delivery verification and details for shipment #${id}.`,
  };
}

export default async function DeliveryDetailsPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirect=/agent/deliveries/${id}`);
  }

  if (user.role !== ROLES.AGENT && user.role !== ROLES.ADMIN) {
    redirect('/login');
  }

  await connectDB();

  let agent = null;
  if (user.role === ROLES.AGENT) {
    agent = await Agent.findOne({ userId: user._id }).lean();
  }

  const isObjectId = mongoose.isValidObjectId(id);
  const query = isObjectId
    ? { $or: [{ _id: id }, { trackingNumber: id.toUpperCase().trim() }] }
    : { trackingNumber: id.toUpperCase().trim() };

  const dbShipment = await Shipment.findOne(query)
    .populate('destinationBranchId', 'name code city state address phone')
    .populate('originBranchId', 'name code city state address phone')
    .populate('agentId', 'employeeId vehicleType vehicleNumber')
    .lean();

  let shipment = null;

  if (dbShipment) {
    // Authorization Check: Agent can ONLY view shipments assigned to them!
    if (user.role === ROLES.AGENT) {
      const assignedAgentId =
        dbShipment.agentId?._id?.toString() || dbShipment.agentId?.toString();
      if (!agent || assignedAgentId !== agent._id.toString()) {
        notFound();
      }
    }

    const trackingEvents = await TrackingEvent.find({ shipmentId: dbShipment._id })
      .sort({ createdAt: 1 })
      .lean();

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
      recipient: {
        name: dbShipment.receiverName,
        address: dbShipment.receiverAddress,
        phone: dbShipment.receiverPhone,
        company: 'Consignee Recipient',
        city: dbShipment.destinationBranchId?.city || 'Destination Hub',
      },
      destinationFull: dbShipment.destinationBranchId?.name
        ? `${dbShipment.destinationBranchId.name} (${dbShipment.destinationBranchId.code}) - ${dbShipment.receiverAddress}`
        : dbShipment.receiverAddress,
      origin: dbShipment.originBranchId?.city || 'Origin Hub',
      service: {
        tier: dbShipment.serviceType || 'Standard Express',
      },
      pricing: {
        total: dbShipment.shippingCost,
      },
      packageInfo: {
        category: dbShipment.packageDescription || 'General Cargo',
        type: 'Express Parcel Box',
        grossWeight: `${dbShipment.weight} kg`,
        dimensions: `${dbShipment.length || 0} x ${dbShipment.width || 0} x ${dbShipment.height || 0} cm`,
        quantity: 1,
      },
      timeline: trackingEvents.map((t) => ({
        status: t.status.replace(/_/g, ' '),
        date: new Date(t.createdAt).toLocaleString(),
        location: t.location || 'Logistics Hub',
        description: t.description || 'Waypoint recorded',
      })),
    };
  } else {
    notFound();
  }

  return <DeliveryDetailsClient shipment={shipment} />;
}
