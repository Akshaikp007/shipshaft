import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Agent from '@/lib/models/Agent';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';

/**
 * GET /api/agent/availability
 * Returns current authenticated delivery agent's availability status.
 */
export async function GET() {
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
        { success: false, error: 'Forbidden: Only delivery agents can check this status.' },
        { status: 403 }
      );
    }

    await connectDB();
    const agent = await Agent.findOne({ userId: user._id }).populate('branchId', 'name code city');
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent profile not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      availability: agent.availability || 'AVAILABLE',
      isAvailable: agent.isAvailable,
      status: agent.status,
      employeeId: agent.employeeId,
      branchName: agent.branchId?.name,
      branchCode: agent.branchId?.code,
      vehicleType: agent.vehicleType || 'Company Fleet',
      vehicleNumber: agent.vehicleNumber || 'N/A',
    });
  } catch (error) {
    console.error('[Agent Availability GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch availability status.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agent/availability
 * Allows an authenticated delivery agent to toggle their availability status:
 * 'AVAILABLE' | 'BUSY' | 'OFFLINE'
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

    if (user.role !== ROLES.AGENT) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only delivery agents can update their availability.' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body.' },
        { status: 400 }
      );
    }

    const { availability } = body || {};
    const validStates = ['AVAILABLE', 'BUSY', 'OFFLINE'];
    const normalizedState = (availability || '').toUpperCase().trim();

    if (!validStates.includes(normalizedState)) {
      return NextResponse.json(
        { success: false, error: `Invalid availability. Choose one of: ${validStates.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    const isAvailable = normalizedState === 'AVAILABLE';
    const status = normalizedState === 'OFFLINE' ? 'OFFLINE' : (normalizedState === 'BUSY' ? 'TRANSIT' : 'ACTIVE');

    const agent = await Agent.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          availability: normalizedState,
          isAvailable,
          status,
        },
      },
      { new: true }
    );

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent profile not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Availability updated to ${normalizedState}.`,
      availability: agent.availability,
      isAvailable: agent.isAvailable,
      status: agent.status,
    });
  } catch (error) {
    console.error('[Agent Availability PATCH Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update availability.' },
      { status: 500 }
    );
  }
}
