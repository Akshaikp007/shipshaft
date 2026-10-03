import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/authorization';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error('[Session API Error]:', error);
    return NextResponse.json(
      { authenticated: false, user: null, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone } = body;

    await connectDB();
    const update = {};
    if (name && typeof name === 'string' && name.trim()) {
      update.name = name.trim();
    }
    if (phone && typeof phone === 'string') {
      update.phone = phone.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, { $set: update }, { new: true })
      .select('-passwordHash -otpHash')
      .lean();

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Session API PATCH Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user profile.' },
      { status: 500 }
    );
  }
}
