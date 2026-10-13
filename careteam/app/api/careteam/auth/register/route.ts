import { NextResponse } from 'next/server';
import { saveCareTeamUserToSupabase } from '@/lib/supabase';
import { CareTeamUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, age, phone, email, pin, role } = body;

    if (!name || !phone || !email || !age || !pin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required registration parameters (name, age, phone, email, pin).',
        },
        { status: 400 }
      );
    }

    const pinStr = String(pin).trim();
    if (pinStr.length !== 6 || !/^\d{6}$/.test(pinStr)) {
      return NextResponse.json(
        { success: false, message: 'A 6-digit numeric PIN is required for account security.' },
        { status: 400 }
      );
    }

    // Generate CRT ID starting with CRT followed by 5 digits
    const random5Digits = Math.floor(10000 + Math.random() * 90000);
    const crtId = `CRT${random5Digits}`;

    const user: CareTeamUser = {
      crtId,
      name: name.trim(),
      age: Number(age),
      phone: String(phone).replace(/\D/g, ''),
      email: String(email).trim().toLowerCase(),
      pin: pinStr,
      role: role || 'Care Team Fieldworker',
      createdAt: new Date().toISOString(),
    };

    const supabaseRes = await saveCareTeamUserToSupabase(user);

    return NextResponse.json({
      success: true,
      user,
      supabaseSynced: supabaseRes.success,
      supabaseError: supabaseRes.error,
      message: supabaseRes.success
        ? 'Care Team member successfully registered and committed to Supabase!'
        : 'Registered locally; Supabase credentials pending.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
