import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/authorization';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth/password';
import { ROLES } from '@/lib/constants/roles';

/**
 * GET /api/admin/users
 * Returns list of real users from MongoDB.
 * Strictly excludes passwordHash and otpHash.
 */
export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const users = await User.find({})
      .select('-passwordHash -otpHash')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        roleKey: u.role,
        status: u.isActive ? 'ACTIVE' : 'INACTIVE',
        statusLabel: u.isActive ? 'Active' : 'Inactive',
        statusVariant: u.isActive ? 'success' : 'neutral',
        company: u.company || (u.role === ROLES.CUSTOMER ? 'Customer Account' : 'ShipShaft Operations'),
        joinedDate: new Date(u.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        avatar: u.avatar || null,
      })),
    });
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Users API GET Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve users.' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Creates a new user record directly in MongoDB.
 */
export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, email, role, phone, password } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    await connectDB();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ success: false, error: 'User with this email already exists.' }, { status: 400 });
    }

    const assignedRole = Object.values(ROLES).includes(role?.toUpperCase())
      ? role.toUpperCase()
      : ROLES.CUSTOMER;

    const defaultPassword = password || 'User@123456';
    const passwordHash = await hashPassword(defaultPassword);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || '',
      role: assignedRole,
      passwordHash,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: 'ACTIVE',
        statusLabel: 'Active',
        statusVariant: 'success',
      },
    }, { status: 201 });
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Users API POST Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user.' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * Updates a user role or active status.
 */
export async function PATCH(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    await connectDB();
    const update = {};
    if (role && Object.values(ROLES).includes(role.toUpperCase())) {
      update.role = role.toUpperCase();
    }
    if (typeof isActive === 'boolean') {
      update.isActive = isActive;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select('-passwordHash -otpHash')
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Users API PATCH Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user.' }, { status: 500 });
  }
}
