import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPendingAppointmentsFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Retrieve pending appointments from Supabase directly
  const supaApts = await getPendingAppointmentsFromSupabase();

  if (supaApts && supaApts.length > 0) {
    return NextResponse.json({
      success: true,
      source: 'supabase',
      data: supaApts,
    });
  }

  const pending = db.appointments
    .filter(a => a.status === 'PENDING')
    .map(apt => {
      const patient = db.patients.find(p => p.id === apt.patientId);
      return {
        ...apt,
        patient: patient || null,
      };
    });

  return NextResponse.json({
    success: true,
    source: 'local',
    data: pending,
  });
}
