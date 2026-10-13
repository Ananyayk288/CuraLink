import { NextResponse } from 'next/server';
import {
  saveCareTeamUserToSupabase,
  getCareTeamUsersFromSupabase,
  authenticateCareTeamUserFromSupabase,
} from '@/lib/supabase';
import { CareTeamUser } from '@/lib/types';

// GET /api/careteam — Retrieve registered care team fieldworkers from Supabase (sanitized)
export async function GET() {
  try {
    const users = await getCareTeamUsersFromSupabase();
    if (!users) {
      return NextResponse.json({
        success: false,
        message: 'Could not fetch Care Team accounts from Supabase (check credentials).',
        users: [],
      });
    }

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error retrieving care team users' },
      { status: 500 }
    );
  }
}

// POST /api/careteam — Register new Care Team member or verify login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'register', name, age, phone, email, pin, identifier } = body;

    // Login Action
    if (action === 'login') {
      if (!identifier || !pin) {
        return NextResponse.json(
          { success: false, message: 'Missing identifier (CRT ID / Phone / Email) or PIN.' },
          { status: 400 }
        );
      }

      const authRes = await authenticateCareTeamUserFromSupabase(identifier, pin);
      if (!authRes.success || !authRes.user) {
        return NextResponse.json(
          { success: false, message: authRes.error || 'Authentication failed.' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: authRes.user,
        message: 'Care Team member authenticated successfully!',
      });
    }

    // Register Action
    if (!name || !phone || !email || !age || !pin) {
      return NextResponse.json(
        { success: false, message: 'Missing required registration parameters (name, age, phone, email, pin).' },
        { status: 400 }
      );
    }

    if (String(pin).length !== 6 || !/^\d{6}$/.test(String(pin))) {
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
      name,
      age: Number(age),
      phone: String(phone).replace(/\D/g, ''),
      email: String(email).toLowerCase(),
      pin: String(pin),
      role: body.role || 'Care Team Fieldworker',
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
