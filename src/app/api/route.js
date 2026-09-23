import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      success: true,
      message: 'Welcome to ShipShaft API (Next.js Routes)',
    });
  } catch (error) {
    console.error('[API Route Error]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
