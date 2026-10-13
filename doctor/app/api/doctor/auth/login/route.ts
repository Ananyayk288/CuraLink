import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDoctorFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loginId, pin } = body;

    if (!loginId || !loginId.trim()) {
      return NextResponse.json({ success: false, error: 'Please enter your Doctor ID (e.g. DOC84920)' }, { status: 400 });
    }

    const pinStr = String(pin || '').trim();
    if (!/^\d{6}$/.test(pinStr)) {
      return NextResponse.json({ success: false, error: 'Security PIN must be exactly 6 digits' }, { status: 400 });
    }

    // 1. Direct Retrieval from Supabase PostgreSQL
    let doctor = await getDoctorFromSupabase(loginId.trim());
    let source = 'supabase';

    // 2. Fallback to local DB store if not found in Supabase
    if (!doctor) {
      doctor = db.findDoctor(loginId) || null;
      source = 'local';
    }

    if (!doctor) {
      return NextResponse.json({
        success: false,
        error: `No practitioner found matching "${loginId}". Please check your Doctor ID or register a new account.`,
      }, { status: 404 });
    }

    if (doctor.pin !== pinStr) {
      return NextResponse.json({
        success: false,
        error: 'Incorrect 6-digit security PIN. Please try again.',
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      source,
      data: {
        doctor: {
          id: doctor.id,
          name: doctor.name,
          phone: doctor.phone,
          email: doctor.email,
          age: doctor.age,
          isVerified: doctor.isVerified,
          department: doctor.department,
          license: doctor.license,
          createdAt: doctor.createdAt,
        },
      },
    });
  } catch (err: any) {
    console.error('Error in doctor login API:', err);
    return NextResponse.json({ success: false, error: err.message || 'Login failed' }, { status: 500 });
  }
}
