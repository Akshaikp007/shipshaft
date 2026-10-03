import { NextResponse } from 'next/server';
import { getAllBranches } from '@/lib/services/branchService';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { connectDB } from '@/lib/db';
import Branch from '@/lib/models/Branch';

export async function GET() {
  try {
    const branches = await getAllBranches();
    return NextResponse.json({
      success: true,
      branches: branches.map((b) => ({
        _id: b._id.toString(),
        name: b.name,
        code: b.code,
        city: b.city,
        state: b.state,
        country: b.country,
        address: b.address,
        phone: b.phone,
        isActive: b.isActive,
      })),
    });
  } catch (error) {
    console.error('[Branches API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve branches.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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
    const body = await request.json();
    const { name, code, city, state, country, address, phone } = body;

    if (!name || !code || !city) {
      return NextResponse.json(
        { success: false, error: 'Name, code, and city are required.' },
        { status: 400 }
      );
    }

    await connectDB();
    const normalizedCode = code.trim().toUpperCase();
    const existing = await Branch.findOne({ code: normalizedCode });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Branch with code ${normalizedCode} already exists.` },
        { status: 400 }
      );
    }

    const newBranch = await Branch.create({
      name: name.trim(),
      code: normalizedCode,
      city: city.trim(),
      state: state?.trim() || 'General',
      country: country?.trim() || 'India',
      address: address?.trim() || `${city} Logistics Hub`,
      phone: phone?.trim() || '+91 80 0000 0000',
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      branch: {
        _id: newBranch._id.toString(),
        name: newBranch.name,
        code: newBranch.code,
        city: newBranch.city,
        state: newBranch.state,
        country: newBranch.country,
        address: newBranch.address,
        phone: newBranch.phone,
        isActive: newBranch.isActive,
      },
    }, { status: 201 });
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('[Create Branch API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create branch.' },
      { status: 500 }
    );
  }
}
