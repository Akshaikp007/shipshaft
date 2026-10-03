import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { getBranchReport } from '@/lib/services/reportService';

/**
 * GET /api/admin/reports/branches
 * Regional hub throughput, destination deliveries, active volume, and attributable revenue.
 * Restricted strictly to ADMIN role.
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
        { success: false, error: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const result = await getBranchReport({ range, from, to });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Admin Reports Branches GET Error]:', error);
    const statusCode = error.statusCode || (error.message && (error.message.includes('Invalid') || error.message.includes('exceeds') || error.message.includes('Missing')) ? 400 : 500);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate branch performance report.' },
      { status: statusCode }
    );
  }
}
