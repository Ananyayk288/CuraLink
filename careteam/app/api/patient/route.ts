import { NextResponse } from 'next/server';
import { getSupabasePatients, updatePatientInSupabase } from '@/lib/supabase';

// GET /api/patient — Retrieve all registered patients from Supabase
export async function GET() {
  try {
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
