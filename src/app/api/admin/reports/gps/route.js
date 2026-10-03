import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { getGpsReport } from '@/lib/services/reportService';

/**
 * GET /api/admin/reports/gps
 * Operational telemetry overview: active out-for-delivery, fresh vs stale signals, active transmitting agents.
 * Strict Privacy Rule: Never exposes precise agent GPS coordinates.
 * Restricted strictly to ADMIN role.
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

    if (user.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();

    const result = await getGpsReport();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Admin Reports GPS GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate GPS telemetry report.' },
      { status: 500 }
    );
  }
}
