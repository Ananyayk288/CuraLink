import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, ...data } = body;

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role is required.' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const doctorUrl = process.env.NEXT_PUBLIC_DOCTOR_URL || 'http://localhost:3001';
    const careteamUrl = process.env.NEXT_PUBLIC_CARETEAM_URL || 'http://localhost:3002';
    const pharmacyUrl = (process.env.NEXT_PUBLIC_PHARMACY_URL || 'http://localhost:3003') + '/pharmacy/dashboard';

    // 1. REGISTER DOCTOR
    if (role === 'doctor') {
      const { name, email, phone, age, department, license, pin } = data;
      if (!name || !email || !phone || !pin) {
        return NextResponse.json(
          { success: false, error: 'Name, Email, Phone, and 6-digit PIN are required.' },
          { status: 400 }
        );
      }

      // Generate DOC ID: DOC followed by 5 digits
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const docId = `DOC${randomDigits}`;

      const doctorRecord = {
        id: docId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        age: Number(age) || 35,
        department: department || 'General Medicine & Chronic Care',
        license: license || `KMC-${randomDigits}`,
        pin: String(pin).trim(),
        is_verified: true,
      };

      if (client) {
        try {
          await client.from('doctors').insert([doctorRecord]);
        } catch (dbErr: any) {
          console.warn('Supabase doctor registration note:', dbErr.message);
        }
      }

      const qs = new URLSearchParams({
        doctorId: docId,
        doctorName: doctorRecord.name,
        department: doctorRecord.department,
        role: 'doctor',
      }).toString();

      return NextResponse.json({
        success: true,
        role: 'doctor',
        user: doctorRecord,
        redirectUrl: `${doctorUrl}?${qs}`,
        message: `Doctor successfully registered with ID ${docId}!`,
      });
    }

    // 2. REGISTER CARE TEAM FIELDWORKER
    if (role === 'careteam') {
      const { name, age, phone, email, pin, roleName } = data;
      if (!name || !phone || !email || !pin) {
        return NextResponse.json(
          { success: false, error: 'Name, Phone, Email, and 6-digit PIN are required.' },
          { status: 400 }
        );
      }

      // Generate CRT ID: CRT followed by 5 digits
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const crtId = `CRT${randomDigits}`;

      const crtRecord = {
        crt_id: crtId,
        name: name.trim(),
        age: Number(age) || 28,
        phone: phone.trim(),
        email: email.trim(),
        pin: String(pin).trim(),
        role: roleName || 'Care Team Fieldworker',
      };

      if (client) {
        try {
          await client.from('care_team_users').insert([crtRecord]);
        } catch (dbErr: any) {
          console.warn('Supabase care team registration note:', dbErr.message);
        }
      }

      const qs = new URLSearchParams({
        crtId: crtId,
        name: crtRecord.name,
        email: crtRecord.email,
        phone: crtRecord.phone,
        role: 'careteam',
      }).toString();

      return NextResponse.json({
        success: true,
        role: 'careteam',
        user: { ...crtRecord, id: `crt-${Date.now()}` },
        redirectUrl: `${careteamUrl}?${qs}`,
        message: `Care Team Fieldworker successfully registered with ID ${crtId}!`,
      });
    }

    // 3. REGISTER PHARMACIST
    if (role === 'pharmacy') {
      const { fullName, email, phone, facilityId, password } = data;
      if (!fullName || !email || !password) {
        return NextResponse.json(
          { success: false, error: 'Full Name, Email, and Password are required.' },
          { status: 400 }
        );
      }

      const pharmacyRecord = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phone ? phone.trim() : null,
        facility_id: facilityId || 'fac-city-general',
        role: 'PHARMACY',
      };

      if (client) {
        try {
          await client.from('users').insert([pharmacyRecord]);
        } catch (dbErr: any) {
          console.warn('Supabase pharmacy registration note:', dbErr.message);
        }
      }

      const qs = new URLSearchParams({
        name: pharmacyRecord.full_name,
        role: 'pharmacy',
      }).toString();

      return NextResponse.json({
        success: true,
        role: 'pharmacy',
        user: pharmacyRecord,
        redirectUrl: `${pharmacyUrl}?${qs}`,
        message: `Pharmacist successfully registered!`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown role' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
