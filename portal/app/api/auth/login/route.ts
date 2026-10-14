import { NextResponse } from 'next/server';
import {
  authenticateDoctor,
  authenticateCareTeam,
  authenticatePharmacy,
} from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { role, identifier, pinOrPassword } = body;

    const trimmedId = (identifier || '').trim();
    const pin = (pinOrPassword || '123456').trim();

    if (!trimmedId) {
      return NextResponse.json(
        { success: false, error: 'Identifier is required.' },
        { status: 400 }
      );
    }

    // Smart role detection if not provided or if identifier overrides it
    const upperId = trimmedId.toUpperCase();
    const lowerId = trimmedId.toLowerCase();

    if (upperId.startsWith('DOC') || lowerId.includes('suresh') || lowerId.includes('doctor')) {
      role = 'doctor';
    } else if (upperId.startsWith('CRT') || lowerId.includes('meenakshi') || lowerId.includes('asha') || lowerId.includes('care')) {
      role = 'careteam';
    } else if (lowerId.includes('pharmacy') || lowerId.includes('rajiv') || lowerId.includes('pharmacist')) {
      role = 'pharmacy';
    } else if (!role || role === 'auto') {
      role = 'doctor'; // default
    }

    let authResult: { success: boolean; user?: any; error?: string; role?: string } = { success: false };

    // 1. Try selected / detected role
    if (role === 'doctor') {
      authResult = await authenticateDoctor(trimmedId, pin);
    } else if (role === 'careteam') {
      authResult = await authenticateCareTeam(trimmedId, pin);
    } else if (role === 'pharmacy') {
      authResult = await authenticatePharmacy(trimmedId, pin);
    }

    // 2. Cross-role fallback if first attempt failed
    if (!authResult.success) {
      if (role !== 'careteam' && (upperId.startsWith('CRT') || lowerId.includes('meenakshi') || /^\d{10}$/.test(trimmedId))) {
        const ctRes = await authenticateCareTeam(trimmedId, pin);
        if (ctRes.success) {
          authResult = ctRes;
          role = 'careteam';
        }
      }
      if (!authResult.success && role !== 'doctor') {
        const docRes = await authenticateDoctor(trimmedId, pin);
        if (docRes.success) {
          authResult = docRes;
          role = 'doctor';
        }
      }
      if (!authResult.success && role !== 'pharmacy') {
        const phRes = await authenticatePharmacy(trimmedId, pin);
        if (phRes.success) {
          authResult = phRes;
          role = 'pharmacy';
        }
      }
    }

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Determine target portal redirect URL
    const doctorUrl = process.env.NEXT_PUBLIC_DOCTOR_URL || 'http://localhost:3001';
    const careteamUrl = process.env.NEXT_PUBLIC_CARETEAM_URL || 'http://localhost:3002';
    const pharmacyUrl = (process.env.NEXT_PUBLIC_PHARMACY_URL || 'http://localhost:3003') + '/pharmacy/dashboard';

    const user = authResult.user || {};
    let redirectUrl = doctorUrl;
    if (role === 'doctor') {
      const qs = new URLSearchParams({
        doctorId: user.id || 'DOC84920',
        doctorName: user.name || 'Dr. Suresh Sharma, MD',
        department: user.department || 'Internal Medicine & Chronic Care',
        role: 'doctor',
      }).toString();
      redirectUrl = `${doctorUrl}?${qs}`;
    } else if (role === 'careteam') {
      const qs = new URLSearchParams({
        crtId: user.crt_id || user.crtId || user.id || 'CRT10001',
        name: user.name || user.fullName || 'Meenakshi Gowda',
        email: user.email || '',
        phone: user.phone || '',
        role: 'careteam',
      }).toString();
      redirectUrl = `${careteamUrl}?${qs}`;
    } else if (role === 'pharmacy') {
      const qs = new URLSearchParams({
        name: user.full_name || user.fullName || user.name || 'Pharmacist Rajiv',
        role: 'pharmacy',
      }).toString();
      redirectUrl = `${pharmacyUrl}?${qs}`;
    }

    const response = NextResponse.json({
      success: true,
      message: `Successfully authenticated as ${role.toUpperCase()}!`,
      role,
      user: authResult.user,
      redirectUrl,
    });

    // Set auth cookie
    response.cookies.set('curalink_role', role, {
      path: '/',
      sameSite: 'lax',
      maxAge: 86400,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
