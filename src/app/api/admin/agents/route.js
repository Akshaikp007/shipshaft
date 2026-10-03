import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Agent from '@/lib/models/Agent';
import User from '@/lib/models/User';
import Branch from '@/lib/models/Branch';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { getAgentWorkload } from '@/lib/services/assignmentService';
import { hashPassword } from '@/lib/auth/password';

/**
 * GET /api/admin/agents
 * Admin endpoint to list all agents with workload, branch, and status.
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

    if (user.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    const filter = {};
    if (branchId) {
      filter.branchId = branchId;
    }

    const rawAgents = await Agent.find(filter)
      .populate('userId', 'name email phone avatar isActive role')
      .populate('branchId', 'name code city state address')
      .sort({ employeeId: 1 })
      .lean();

    const agentsWithWorkload = await Promise.all(
      rawAgents.map(async (agent) => {
        const workload = await getAgentWorkload(agent._id);
        return {
          _id: agent._id.toString(),
          employeeId: agent.employeeId,
          name: agent.userId?.name || 'Unknown Agent',
          email: agent.userId?.email,
          phone: agent.userId?.phone,
          avatar: agent.userId?.avatar,
          isActive: agent.userId?.isActive && agent.status !== 'OFFLINE',
          status: agent.status,
          availability: agent.availability || (agent.isAvailable ? 'AVAILABLE' : 'OFFLINE'),
          vehicleType: agent.vehicleType,
          vehicleNumber: agent.vehicleNumber,
          branch: agent.branchId
            ? {
                _id: agent.branchId._id.toString(),
                name: agent.branchId.name,
                code: agent.branchId.code,
                city: agent.branchId.city,
              }
            : null,
          workload,
          createdAt: agent.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      agents: agentsWithWorkload,
    });
  } catch (error) {
    console.error('[Admin Agents GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve agents list.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/agents
 * Enroll a new delivery agent.
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, phone, branchId, vehicleType, vehicleNumber } = body;

    if (!name || !email || !branchId) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and branch are required.' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Selected branch hub does not exist.' },
        { status: 404 }
      );
    }

    // Check if user already exists or create new user
    let agentUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!agentUser) {
      const defaultPassword = 'Password@123';
      const passwordHash = await hashPassword(defaultPassword);
      agentUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : '',
        passwordHash,
        role: ROLES.AGENT,
        isActive: true,
      });
    } else {
      agentUser.role = ROLES.AGENT;
      if (phone) agentUser.phone = phone.trim();
      await agentUser.save();
    }

    // Generate unique employee ID
    const count = await Agent.countDocuments();
    const employeeId = `AGT-${String(count + 1).padStart(3, '0')}`;

    const newAgent = await Agent.create({
      userId: agentUser._id,
      branchId: branch._id,
      employeeId,
      vehicleType: vehicleType || 'Company Electric Van',
      vehicleNumber: vehicleNumber || `KL-07-AGT-${count + 1}`,
      availability: 'AVAILABLE',
      isAvailable: true,
      status: 'ACTIVE',
    });

    return NextResponse.json({
      success: true,
      agent: {
        _id: newAgent._id.toString(),
        employeeId: newAgent.employeeId,
        name: agentUser.name,
        email: agentUser.email,
        phone: agentUser.phone,
        status: newAgent.status,
        branch: {
          _id: branch._id.toString(),
          name: branch.name,
          code: branch.code,
          city: branch.city,
        },
      },
    });
  } catch (error) {
    console.error('[Admin Agents POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enroll agent.' },
      { status: 500 }
    );
  }
}
