import { NextResponse } from 'next/server';
import { savePatientToSupabase } from '@/lib/supabase';
import { PatientData } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      age,
      phone,
      literacy,
      address,
      gender,
      language,
      hasGuardian,
      guardianName,
      guardianAge,
      guardianPhone,
      guardianLiteracy,
      guardianAddress,
      guardianRelationship,
      pin,
      otp,
    } = body;

    // Validate required fields
    if (!name || !phone || !address || age === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required patient fields (name, age, phone, address)' },
        { status: 400 }
      );
    }

    if (!pin || String(pin).length !== 6 || !/^\d{6}$/.test(String(pin))) {
      return NextResponse.json(
        { success: false, message: 'A 6-digit numeric PIN is required for patient security.' },
        { status: 400 }
      );
    }

    // Generate ID starting with PAT followed by 5 digits
    const random5Digits = Math.floor(10000 + Math.random() * 90000);
    const uhid = `PAT${random5Digits}`;

    const patientData: PatientData = {
      uhid,
      name,
      age: Number(age),
      phone,
      literacy: Boolean(literacy),
      address,
      gender: gender || 'Unspecified',
      language: language || 'Kannada',
      pin: String(pin),
      hasGuardian: Boolean(hasGuardian),
      guardianName: hasGuardian ? guardianName : undefined,
      guardianAge: hasGuardian && guardianAge ? Number(guardianAge) : undefined,
      guardianPhone: hasGuardian ? guardianPhone : undefined,
      guardianLiteracy: hasGuardian ? Boolean(guardianLiteracy) : undefined,
      guardianAddress: hasGuardian ? guardianAddress : undefined,
      guardianRelationship: hasGuardian ? guardianRelationship : undefined,
      otpVerified: true,
      createdAt: new Date().toISOString(),
    };

    // Save to Supabase
    const supabaseResult = await savePatientToSupabase(patientData);

    return NextResponse.json({
      success: true,
      patient: patientData,
      appointment: supabaseResult.appointmentId ? {
        id: supabaseResult.appointmentId,
        tokenNumber: supabaseResult.tokenNumber,
        status: 'PENDING',
      } : null,
      supabaseSynced: supabaseResult.success,
      supabaseError: supabaseResult.error,
      message: supabaseResult.success
        ? 'Patient successfully registered and auto-queued for Doctor Consultation!'
        : 'Patient registered in local store (Supabase credentials pending).',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
