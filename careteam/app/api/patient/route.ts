import { NextResponse } from 'next/server';
import {
  getSupabasePatients,
  getPatientByUhidFromSupabase,
  getPatientByPhoneFromSupabase,
  searchPatientsInSupabase,
  updatePatientInSupabase,
  deletePatientFromSupabase,
} from '@/lib/supabase';

// GET /api/patient — Retrieve registered patient(s) from Supabase
// Supports query parameters:
// - ?uhid=PAT10001 (returns single patient)
// - ?phone=9845123456 (returns single patient)
// - ?search=keyword (fuzzy searches name, UHID, phone)
// - No params: returns all patients
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uhid = searchParams.get('uhid');
    const phone = searchParams.get('phone');
    const search = searchParams.get('search');

    if (uhid) {
      const patient = await getPatientByUhidFromSupabase(uhid.trim());
      if (!patient) {
        return NextResponse.json(
          { success: false, message: `Patient with UHID '${uhid}' not found in Supabase.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, patient });
    }

    if (phone) {
      const patient = await getPatientByPhoneFromSupabase(phone.trim());
      if (!patient) {
        return NextResponse.json(
          { success: false, message: `Patient with phone '${phone}' not found in Supabase.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, patient });
    }

    if (search) {
      const patients = await searchPatientsInSupabase(search.trim());
      return NextResponse.json({
        success: true,
        patients: patients || [],
        count: patients ? patients.length : 0,
      });
    }

    const patients = await getSupabasePatients();
    if (!patients) {
      return NextResponse.json({
        success: false,
        message: 'Could not fetch from Supabase (check credentials or connection).',
        patients: [],
      });
    }

    return NextResponse.json({
      success: true,
      patients,
      count: patients.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error retrieving patients' },
      { status: 500 }
    );
  }
}

// PATCH /api/patient — Update patient details in Supabase
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { idOrUhid, ...updates } = body;

    if (!idOrUhid) {
      return NextResponse.json(
        { success: false, message: 'Missing patient idOrUhid parameter.' },
        { status: 400 }
      );
    }

    const result = await updatePatientInSupabase(idOrUhid, updates);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to update patient in Supabase.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Patient record successfully updated in Supabase PostgreSQL!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error updating patient' },
      { status: 500 }
    );
  }
}

// DELETE /api/patient — Remove a patient from Supabase (Admin)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idOrUhid = searchParams.get('idOrUhid') || searchParams.get('uhid') || searchParams.get('id');

    if (!idOrUhid) {
      return NextResponse.json(
        { success: false, message: 'Missing patient idOrUhid parameter.' },
        { status: 400 }
      );
    }

    const result = await deletePatientFromSupabase(idOrUhid);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to delete patient from Supabase.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Patient ${idOrUhid} removed from Supabase.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error deleting patient' },
      { status: 500 }
    );
  }
}
