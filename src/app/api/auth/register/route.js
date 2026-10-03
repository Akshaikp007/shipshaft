import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { ROLES } from '@/lib/constants/roles';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, confirmPassword } = body;

    // Validate presence
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Full name is required.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (!confirmPassword || password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    await connectDB();

    // Check email uniqueness
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // Hash password securely
    const passwordHash = await hashPassword(password);

    // Public registration always enforces CUSTOMER role
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: (phone || '').trim(),
      passwordHash,
      role: ROLES.CUSTOMER,
      isActive: true,
    });

    // Establish authenticated session with HTTP-only cookie
    await createSession(newUser);

    const safeUser = {
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      isActive: newUser.isActive,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully.',
        user: safeUser,
        redirectTo: '/dashboard',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Register API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete registration. Please try again.' },
      { status: 500 }
    );
  }
}
