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

    if (!identifier || !pinOrPassword) {
      return NextResponse.json(
        { success: false, error: 'Identifier and PIN/Password are required.' },
        { status: 400 }
      );
    }

    const trimmedId = identifier.trim();

    // Auto-detect role if not explicitly provided
    if (!role || role === 'auto') {
      if (trimmedId.toUpperCase().startsWith('DOC')) {
        role = 'doctor';
      } else if (trimmedId.toUpperCase().startsWith('CRT')) {
        role = 'careteam';
      } else if (trimmedId.toLowerCase().includes('pharmacy') || trimmedId.toLowerCase().includes('rajiv')) {
        role = 'pharmacy';
      } else {
        role = 'doctor'; // default
      }
    }

    let authResult: { success: boolean; user?: any; error?: string; role?: string };

    if (role === 'doctor') {
      authResult = await authenticateDoctor(trimmedId, pinOrPassword.trim());
    } else if (role === 'careteam') {
      authResult = await authenticateCareTeam(trimmedId, pinOrPassword.trim());
    } else if (role === 'pharmacy') {
      authResult = await authenticatePharmacy(trimmedId, pinOrPassword.trim());
    } else {
      return NextResponse.json({ success: false, error: 'Invalid role specified' }, { status: 400 });
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

    let redirectUrl = doctorUrl;
    if (role === 'doctor') {
      redirectUrl = doctorUrl;
    } else if (role === 'careteam') {
      redirectUrl = careteamUrl;
    } else if (role === 'pharmacy') {
      redirectUrl = pharmacyUrl;
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
