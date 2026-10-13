import { NextResponse } from 'next/server';
import { authenticateCareTeamUserFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, pin } = body;

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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
