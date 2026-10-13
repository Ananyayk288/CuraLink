import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSupabaseConfig, getStatsFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseConfig = getSupabaseConfig();
  const supaStats = await getStatsFromSupabase();

  if (supaStats !== null) {
    return NextResponse.json({
      success: true,
      source: 'supabase',
      data: {
        pending_appointments: supaStats.pending_appointments,
        enrolled_patients: supaStats.enrolled_patients,
        total_prescriptions: supaStats.total_prescriptions,
        supabase: {
          configured: Boolean(supabaseConfig.url && supabaseConfig.anonKey),
          project_id: supabaseConfig.projectId,
        },
      },
    });
  }

  return NextResponse.json({
    success: true,
    source: 'local',
    data: {
      pending_appointments: db.appointments.filter(a => a.status === 'PENDING').length,
      enrolled_patients: db.patients.length,
      total_prescriptions: db.prescriptions.length,
      supabase: {
        configured: Boolean(supabaseConfig.url && supabaseConfig.anonKey),
        project_id: supabaseConfig.projectId,
      },
    },
  });
}
