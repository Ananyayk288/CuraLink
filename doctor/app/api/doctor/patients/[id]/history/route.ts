import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getPatientByIdFromSupabase,
  getPatientPrescriptionsFromSupabase,
  getPatientMedicationHistoryFromSupabase,
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const patientId = params.id;

  // Retrieve patient from Supabase directly with fallback
  let patient = await getPatientByIdFromSupabase(patientId);
  if (!patient) {
    patient = db.patients.find(p => p.id === patientId || p.uhid === patientId) || null;
  }

  if (!patient) {
    return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
  }

  // Retrieve prescriptions & medications from Supabase directly with fallback
  let prescriptions = await getPatientPrescriptionsFromSupabase(patientId);
  let medicationHistory: any[] | null = await getPatientMedicationHistoryFromSupabase(patientId);

  let source = 'supabase';
  if (!prescriptions || prescriptions.length === 0) {
    source = 'local';
    prescriptions = db.prescriptions.filter(p => p.patientId === patientId);
    medicationHistory = [];
    prescriptions.forEach(rx => {
      rx.medicines.forEach(med => {
        medicationHistory!.push({
          ...med,
          doctorId: rx.doctorId,
          doctorName: rx.doctorName,
          prescribedDate: rx.createdAt,
          prescriptionType: rx.prescriptionType,
        });
      });
    });
  } else if (!medicationHistory || medicationHistory.length === 0) {
    medicationHistory = [];
    prescriptions.forEach(rx => {
      (rx.medicines || []).forEach((med: any) => {
        medicationHistory!.push({
          ...med,
          doctorId: rx.doctorId,
          doctorName: rx.doctorName,
          prescribedDate: rx.createdAt,
          prescriptionType: rx.prescriptionType,
        });
      });
    });
  }

  return NextResponse.json({
    success: true,
    source,
    data: {
      patient,
      prescriptions,
      medications: medicationHistory || [],
    },
  });
}
