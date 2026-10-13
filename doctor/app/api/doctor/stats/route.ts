import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSupabaseConfig, getStatsFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseConfig = getSupabaseConfig();
  const supaStats = await getStatsFromSupabase();

  const hasSupaData = supaStats && (supaStats.enrolled_patients > 0 || supaStats.pending_appointments > 0 || supaStats.total_prescriptions > 0);

  const pendingAppointments = hasSupaData
    ? supaStats!.pending_appointments
    : db.appointments.filter(a => a.status === 'PENDING').length;

  const enrolledPatients = hasSupaData
    ? supaStats!.enrolled_patients
    : db.patients.length;

  return NextResponse.json({
    success: true,
    source: supaStats ? 'supabase' : 'local',
    data: {
      pending_appointments: pendingAppointments,
      enrolled_patients: enrolledPatients,
      total_prescriptions: supaStats?.total_prescriptions ?? db.prescriptions.length,
      supabase: {
        configured: Boolean(supabaseConfig.url && supabaseConfig.anonKey),
        project_id: supabaseConfig.projectId,
      },
    },
  });
}
