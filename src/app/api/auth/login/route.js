import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { comparePassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { seedInitialAuthUsers } from '@/lib/auth/seed';
import { ROLES } from '@/lib/constants/roles';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    await connectDB();
    // Ensure initial test accounts exist if needed
    await seedInitialAuthUsers();

    // Query user and explicitly select passwordHash (which is select: false)
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check password match
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check account status
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Establish authenticated session with HTTP-only cookie
    await createSession(user);

    // Determine target route based on authoritative role
    let redirectTo = '/dashboard';
    if (user.role === ROLES.AGENT) {
      redirectTo = '/agent/dashboard';
    } else if (user.role === ROLES.ADMIN) {
      redirectTo = '/admin';
    }

    const safeUser = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      avatar: user.avatar || '',
      isActive: user.isActive,
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful.',
      user: safeUser,
      redirectTo,
    });
  } catch (error) {
    console.error('[Login API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
