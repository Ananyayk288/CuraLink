import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createDoctorInSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, age, pin, isVerified } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Doctor name is required' }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    const numAge = Number(age);
    if (!numAge || numAge < 18 || numAge > 120) {
      return NextResponse.json({ success: false, error: 'Please provide a valid age between 18 and 120' }, { status: 400 });
    }

    const pinStr = String(pin || '').trim();
    if (!/^\d{6}$/.test(pinStr)) {
      return NextResponse.json({ success: false, error: 'Security PIN must be exactly 6 digits' }, { status: 400 });
    }

    // 1. Create doctor in local DB store
    const createdDoctor = db.createDoctor({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      age: numAge,
      pin: pinStr,
      isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
    });

    // 2. Direct Updation/Insertion into Supabase PostgreSQL
    const supaDoctor = await createDoctorInSupabase(createdDoctor);

    return NextResponse.json({
      success: true,
      message: 'Doctor account registered successfully!',
      source: supaDoctor ? 'supabase' : 'local',
      data: {
        doctor: {
          id: createdDoctor.id,
          name: createdDoctor.name,
          phone: createdDoctor.phone,
          email: createdDoctor.email,
          age: createdDoctor.age,
          isVerified: createdDoctor.isVerified,
          department: createdDoctor.department,
          license: createdDoctor.license,
          createdAt: createdDoctor.createdAt,
        },
      },
    });
  } catch (err: any) {
    console.error('Error in doctor registration API:', err);
    return NextResponse.json({ success: false, error: err.message || 'Registration failed' }, { status: 500 });
  }
}
