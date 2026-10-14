import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPatientsFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();
  const lang = (searchParams.get('lang') || '').toUpperCase().trim();

  // Retrieve patients from Supabase directly
  const supaPatients = await getPatientsFromSupabase();
  let list = (supaPatients !== null) ? supaPatients : db.patients;

  if (lang && lang !== 'ALL') {
    list = list.filter(p => p.language.toUpperCase() === lang);
  }

  if (q) {
    list = list.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.chronicConditions.some(c => c.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({
    success: true,
    source: (supaPatients !== null) ? 'supabase' : 'local',
    data: list,
  });
}
