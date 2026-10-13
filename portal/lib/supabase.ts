import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes('your-project') || anonKey.length < 15) {
    return null;
  }

  if (cachedClient) return cachedClient;

  try {
    cachedClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    return cachedClient;
  } catch (err) {
    console.error('Portal Supabase init error:', err);
    return null;
  }
}

// 1. Doctor Auth
export async function authenticateDoctor(identifier: string, pin: string) {
  const client = getSupabaseClient();
  const trimmed = identifier.trim();

  if (client) {
    try {
      const { data, error } = await client
        .from('doctors')
        .select('*')
        .or(`id.ilike.${trimmed},email.ilike.${trimmed},phone.eq.${trimmed}`)
        .limit(1)
        .maybeSingle();

      if (data) {
        if (data.pin === pin) {
          return { success: true, user: data, role: 'doctor' };
        } else {
          return { success: false, error: 'Incorrect 6-digit Doctor PIN' };
        }
      }
    } catch (err: any) {
      console.warn('Supabase doctor auth notice:', err.message);
    }
  }

  // Fallback demo doctor
  if ((trimmed.toUpperCase() === 'DOC84920' || trimmed.toLowerCase() === 'dr.suresh@curalink.health') && pin === '123456') {
    return {
      success: true,
      user: {
        id: 'DOC84920',
        name: 'Dr. Suresh Sharma, MD',
        email: 'dr.suresh@curalink.health',
        phone: '+91 98450 11223',
        department: 'Internal Medicine & Chronic Care',
        pin: '123456',
      },
      role: 'doctor',
    };
  }

  return { success: false, error: 'Doctor account not found' };
}

// 2. Care Team Auth
export async function authenticateCareTeam(identifier: string, pin: string) {
  const client = getSupabaseClient();
  const trimmed = identifier.trim();

  if (client) {
    try {
      const { data, error } = await client
        .from('care_team_users')
        .select('*')
        .or(`crt_id.ilike.${trimmed},email.ilike.${trimmed},phone.eq.${trimmed}`)
        .limit(1)
        .maybeSingle();

      if (data) {
        if (data.pin === pin) {
          return {
            success: true,
            user: {
              id: data.id,
              crtId: data.crt_id,
              name: data.name,
              age: data.age,
              phone: data.phone,
              email: data.email,
              role: data.role,
            },
            role: 'careteam',
          };
        } else {
          return { success: false, error: 'Incorrect 6-digit Care Team PIN' };
        }
      }
    } catch (err: any) {
      console.warn('Supabase care team auth notice:', err.message);
    }
  }

  // Fallback demo care team
  if ((trimmed.toUpperCase() === 'CRT10001' || trimmed.toLowerCase().includes('meenakshi')) && pin === '123456') {
    return {
      success: true,
      user: {
        id: 'crt-meenakshi',
        crtId: 'CRT10001',
        name: 'Meenakshi Gowda',
        age: 32,
        phone: '+91 98451 00001',
        email: 'meenakshi@curalink.health',
        role: 'Lead ASHA Field Coordinator',
      },
      role: 'careteam',
    };
  }

  return { success: false, error: 'Care Team account not found' };
}

// 3. Pharmacy Auth
export async function authenticatePharmacy(identifier: string, passwordOrPin: string) {
  const client = getSupabaseClient();
  const trimmed = identifier.trim();

  if (client) {
    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .or(`email.ilike.${trimmed},full_name.ilike.${trimmed}`)
        .eq('role', 'PHARMACY')
        .limit(1)
        .maybeSingle();

      if (data) {
        return {
          success: true,
          user: {
            id: data.id,
            fullName: data.full_name,
            email: data.email,
            facilityId: data.facility_id,
            role: 'PHARMACY',
          },
          role: 'pharmacy',
        };
      }
    } catch (err: any) {
      console.warn('Supabase pharmacy auth notice:', err.message);
    }
  }

  // Fallback demo pharmacy
  if (
    trimmed.toLowerCase().includes('rajiv') ||
    trimmed.toLowerCase().includes('pharmacy') ||
    trimmed === 'rajiv.pharmacy@curalink.health'
  ) {
    return {
      success: true,
      user: {
        id: 'c0a80101-0000-0000-0000-000000000001',
        fullName: 'Pharmacist Rajiv',
        email: 'rajiv.pharmacy@curalink.health',
        facilityId: 'fac-city-general',
        role: 'PHARMACY',
      },
      role: 'pharmacy',
    };
  }

  return { success: false, error: 'Pharmacist account not found' };
}
