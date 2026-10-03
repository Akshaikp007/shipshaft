import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Notification from '@/lib/models/Notification';
import { getCurrentUser } from '@/lib/auth/authorization';

/**
 * GET /api/notifications
 * Retrieves notifications for the authenticated user.
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

    await connectDB();

    const { searchParams } = new URL(request.url);
    const query =
      user.role === 'ADMIN' && searchParams.get('all') === 'true'
        ? {}
        : { $or: [{ recipientId: user._id }, { userId: user._id }] };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('relatedShipmentId', 'trackingNumber')
      .lean();

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n) => ({
        _id: n._id.toString(),
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        relatedShipmentId: n.relatedShipmentId?._id
          ? n.relatedShipmentId._id.toString()
          : n.relatedShipmentId
          ? n.relatedShipmentId.toString()
          : null,
        trackingNumber: n.relatedShipmentId?.trackingNumber || null,
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Notifications GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve notifications.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Creates a notification (broadcast or system alert).
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, message, type } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required.' },
        { status: 400 }
      );
    }

    await connectDB();

    const newNotif = await Notification.create({
      recipientId: user._id,
      title: title.trim(),
      message: message.trim(),
      type: type || 'SYSTEM',
      read: false,
    });

    return NextResponse.json({
      success: true,
      notification: newNotif,
    });
  } catch (error) {
    console.error('[Notifications POST Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Marks notifications as read for the authenticated user.
 */
export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    await connectDB();

    let notificationId = null;
    try {
      const body = await request.json();
      notificationId = body?.id;
    } catch {
      // If empty body, mark all read
    }

    if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId, recipientId: user._id },
        { $set: { read: true } }
      );
    } else {
      await Notification.updateMany(
        { recipientId: user._id, read: false },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications updated.',
    });
  } catch (error) {
    console.error('[Notifications PATCH Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications.' },
      { status: 500 }
    );
  }
}
