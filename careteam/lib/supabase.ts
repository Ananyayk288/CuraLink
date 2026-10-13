import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PatientData, EscalationData, CareTeamUser } from './types';

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export interface SupabaseConfig {
  url: string | null;
  anonKey: string | null;
}

export function getSupabaseConfig(overrideUrl?: string, overrideKey?: string): SupabaseConfig {
  let url = overrideUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || null;
  let anonKey = overrideKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || null;
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || process.env.SUPABASE_PROJECT_ID || null;

  if (projectId && !url) {
    url = `https://${projectId}.supabase.co`;
  }

  // Check localStorage if in browser
  if (typeof window !== 'undefined' && (!url || !anonKey)) {
    const savedUrl = localStorage.getItem('curalink_supabase_url');
    const savedKey = localStorage.getItem('curalink_supabase_key');
    if (savedUrl && !url) url = savedUrl;
    if (savedKey && !anonKey) anonKey = savedKey;
  }

  return { url, anonKey };
}

export function getSupabaseClient(overrideUrl?: string, overrideKey?: string): SupabaseClient | null {
  const config = getSupabaseConfig(overrideUrl, overrideKey);
  if (!config.url || !config.anonKey || config.anonKey.length < 10) {
    return null;
  }

  const currentKey = `${config.url}:${config.anonKey}`;
  if (cachedClient && cachedConfigKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: { persistSession: false },
    });
    cachedConfigKey = currentKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(overrideUrl?: string, overrideKey?: string): Promise<{
  connected: boolean;
  message: string;
}> {
  const client = getSupabaseClient(overrideUrl, overrideKey);
  if (!client) {
    return {
      connected: false,
      message: 'Supabase credentials missing. Enter Project URL and Anon Key in .env.local or UI.',
    };
  }

  try {
    const { error } = await client.from('patients').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          connected: true,
          message: 'Connected to Supabase! (Tables pending — run the SQL migration script from Settings to initialize).',
        };
      }
      return {
        connected: false,
        message: `Supabase error: ${error.message} (${error.code})`,
      };
    }
    return {
      connected: true,
      message: 'Successfully connected to Supabase PostgreSQL!',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Network error reaching Supabase: ${err.message}`,
    };
  }
}

// Write Patient record to Supabase
export async function savePatientToSupabase(patient: PatientData): Promise<{
  success: boolean;
  supabaseId?: string;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const payload = {
      uhid: patient.uhid,
      name: patient.name,
      age: Number(patient.age),
      phone: patient.phone,
      literacy: Boolean(patient.literacy),
      address: patient.address,
      gender: patient.gender || 'Unspecified',
      language: patient.language || 'Kannada',
      pin: patient.pin || null,
      guardian_name: patient.hasGuardian ? patient.guardianName : null,
      guardian_age: patient.hasGuardian && patient.guardianAge ? Number(patient.guardianAge) : null,
      guardian_phone: patient.hasGuardian ? patient.guardianPhone : null,
      guardian_literacy: patient.hasGuardian ? Boolean(patient.guardianLiteracy) : null,
      guardian_address: patient.hasGuardian ? patient.guardianAddress : null,
      guardian_relationship: patient.hasGuardian ? patient.guardianRelationship : null,
      otp_verified: true,
      registered_by: 'Care Team Portal',
    };

    const { data, error } = await client
      .from('patients')
      .upsert([payload], { onConflict: 'uhid' })
      .select();

    if (error) {
      console.error('Supabase patient insert error:', error);
      return { success: false, error: error.message };
    }

    const patientId = data?.[0]?.id;

    // Also insert into guardians table if guardian was provided
    if (patient.hasGuardian && patient.guardianName && patientId) {
      try {
        await client.from('guardians').insert([
          {
            patient_id: patientId,
            name: patient.guardianName,
            age: Number(patient.guardianAge) || 0,
            phone: patient.guardianPhone || '',
            literacy: Boolean(patient.guardianLiteracy),
            address: patient.guardianAddress || patient.address,
            relationship: patient.guardianRelationship || 'Guardian',
          },
        ]);
      } catch (gErr) {
        console.warn('Guardian table insert notice:', gErr);
      }
    }

    // Also insert into appointments table so doctor desk sees the pending appointment
    try {
      const aptId = `apt-${patient.uhid}`;
      const tokenNum = `TOKEN-${String(patient.uhid).replace(/\D/g, '').slice(-2) || '01'}`;
      await client.from('appointments').upsert([
        {
          id: aptId,
          patient_id: patientId || patient.uhid,
          doctor_id: null,
          token_number: tokenNum,
          reason_for_visit: 'Care Team Intake & Clinical Triage Consultation',
          appointment_time: 'Today • Walk-in',
          booking_channel: 'CARE_TEAM_FIELD',
          status: 'PENDING',
          created_at: new Date().toISOString(),
        },
      ], { onConflict: 'id' });
    } catch (aptErr) {
      console.warn('Auto-appointment creation notice:', aptErr);
    }

    return { success: true, supabaseId: patientId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Write Escalation record to Supabase
export async function saveEscalationToSupabase(escalation: EscalationData): Promise<{
  success: boolean;
  supabaseId?: string;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const payload = {
      patient_id: escalation.patientId,
      patient_name: escalation.patientName,
      patient_phone: escalation.patientPhone,
      category: escalation.category,
      priority: escalation.priority,
      target: escalation.target,
      notes: escalation.notes,
      status: escalation.status || 'PENDING',
      escalated_by: escalation.escalatedBy || 'Care Team Coordinator',
    };

    const { data, error } = await client.from('escalations').insert([payload]).select();

    if (error) {
      console.error('Supabase escalation insert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, supabaseId: data?.[0]?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Fetch patients from Supabase with fallback
export async function getSupabasePatients(): Promise<PatientData[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      uhid: row.uhid,
      name: row.name,
      age: row.age,
      phone: row.phone,
      literacy: row.literacy,
      address: row.address,
      gender: row.gender,
      language: row.language,
      pin: row.pin,
      hasGuardian: !!row.guardian_name,
      guardianName: row.guardian_name,
      guardianAge: row.guardian_age,
      guardianPhone: row.guardian_phone,
      guardianLiteracy: row.guardian_literacy,
      guardianAddress: row.guardian_address,
      guardianRelationship: row.guardian_relationship,
      otpVerified: row.otp_verified,
      createdAt: row.created_at,
    }));
  } catch {
    return null;
  }
}

// Fetch escalations from Supabase with fallback
export async function getSupabaseEscalations(): Promise<EscalationData[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('escalations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      category: row.category,
      priority: row.priority,
      target: row.target,
      notes: row.notes,
      status: row.status,
      escalatedBy: row.escalated_by,
      createdAt: row.created_at,
    }));
  } catch {
    return null;
  }
}

// Update Escalation status directly in Supabase (PENDING -> ACKNOWLEDGED -> RESOLVED)
export async function updateEscalationStatusInSupabase(
  id: string,
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED'
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const { error } = await client
      .from('escalations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Supabase escalation update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Update Patient record directly in Supabase
export async function updatePatientInSupabase(
  idOrUhid: string,
  updates: Partial<PatientData>
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.age !== undefined) payload.age = Number(updates.age);
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.literacy !== undefined) payload.literacy = Boolean(updates.literacy);
    if (updates.language !== undefined) payload.language = updates.language;
    if (updates.pin !== undefined) payload.pin = updates.pin;
    if (updates.guardianName !== undefined) payload.guardian_name = updates.guardianName;
    if (updates.guardianPhone !== undefined) payload.guardian_phone = updates.guardianPhone;
    if (updates.guardianAddress !== undefined) payload.guardian_address = updates.guardianAddress;

    const query = client.from('patients').update(payload);
    const { error } = idOrUhid.startsWith('PAT')
      ? await query.eq('uhid', idOrUhid)
      : await query.eq('id', idOrUhid);

    if (error) {
      console.error('Supabase patient update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Retrieve single patient by UHID directly from Supabase
export async function getPatientByUhidFromSupabase(uhid: string): Promise<PatientData | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('patients')
      .select('*')
      .eq('uhid', uhid)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      uhid: data.uhid,
      name: data.name,
      age: data.age,
      phone: data.phone,
      literacy: data.literacy,
      address: data.address,
      gender: data.gender,
      language: data.language,
      pin: data.pin,
      hasGuardian: !!data.guardian_name,
      guardianName: data.guardian_name,
      guardianAge: data.guardian_age,
      guardianPhone: data.guardian_phone,
      guardianLiteracy: data.guardian_literacy,
      guardianAddress: data.guardian_address,
      guardianRelationship: data.guardian_relationship,
      otpVerified: data.otp_verified,
      createdAt: data.created_at,
    };
  } catch {
    return null;
  }
}

// Save Care Team User to Supabase
export async function saveCareTeamUserToSupabase(user: CareTeamUser): Promise<{
  success: boolean;
  supabaseId?: string;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const payload = {
      crt_id: user.crtId,
      name: user.name,
      age: Number(user.age),
      phone: user.phone,
      email: user.email.toLowerCase(),
      pin: user.pin,
      role: user.role || 'Care Team Fieldworker',
    };

    const { data, error } = await client
      .from('care_team_users')
      .upsert([payload], { onConflict: 'crt_id' })
      .select();

    if (error) {
      console.error('Supabase care team user insert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, supabaseId: data?.[0]?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Authenticate Care Team User from Supabase by CRT ID or Phone or Email
export async function authenticateCareTeamUserFromSupabase(
  identifier: string,
  pin: string
): Promise<{ success: boolean; user?: CareTeamUser; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const trimmed = identifier.trim();
    const query = client.from('care_team_users').select('*');

    const { data, error } = trimmed.toUpperCase().startsWith('CRT')
      ? await query.eq('crt_id', trimmed.toUpperCase()).limit(1)
      : trimmed.includes('@')
      ? await query.eq('email', trimmed.toLowerCase()).limit(1)
      : await query.eq('phone', trimmed).limit(1);

    if (error || !data || data.length === 0) {
      return { success: false, error: 'No Care Team account found with this ID/Phone/Email' };
    }

    const matched = data[0];
    if (matched.pin !== pin) {
      return { success: false, error: 'Incorrect 6-digit PIN' };
    }

    return {
      success: true,
      user: {
        id: matched.id,
        crtId: matched.crt_id,
        name: matched.name,
        age: matched.age,
        phone: matched.phone,
        email: matched.email,
        pin: matched.pin,
        role: matched.role,
        createdAt: matched.created_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Retrieve single patient by phone number directly from Supabase
export async function getPatientByPhoneFromSupabase(phone: string): Promise<PatientData | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const { data, error } = await client
      .from('patients')
      .select('*')
      .ilike('phone', `%${cleanPhone.slice(-10)}%`)
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const row = data[0];
    return {
      id: row.id,
      uhid: row.uhid,
      name: row.name,
      age: row.age,
      phone: row.phone,
      literacy: row.literacy,
      address: row.address,
      gender: row.gender,
      language: row.language,
      pin: row.pin,
      hasGuardian: !!row.guardian_name,
      guardianName: row.guardian_name,
      guardianAge: row.guardian_age,
      guardianPhone: row.guardian_phone,
      guardianLiteracy: row.guardian_literacy,
      guardianAddress: row.guardian_address,
      guardianRelationship: row.guardian_relationship,
      otpVerified: row.otp_verified,
      createdAt: row.created_at,
    };
  } catch {
    return null;
  }
}

// Search patients in Supabase by name, UHID, or phone
export async function searchPatientsInSupabase(queryText: string): Promise<PatientData[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const q = queryText.trim();
    const { data, error } = await client
      .from('patients')
      .select('*')
      .or(`name.ilike.%${q}%,uhid.ilike.%${q}%,phone.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      uhid: row.uhid,
      name: row.name,
      age: row.age,
      phone: row.phone,
      literacy: row.literacy,
      address: row.address,
      gender: row.gender,
      language: row.language,
      pin: row.pin,
      hasGuardian: !!row.guardian_name,
      guardianName: row.guardian_name,
      guardianAge: row.guardian_age,
      guardianPhone: row.guardian_phone,
      guardianLiteracy: row.guardian_literacy,
      guardianAddress: row.guardian_address,
      guardianRelationship: row.guardian_relationship,
      otpVerified: row.otp_verified,
      createdAt: row.created_at,
    }));
  } catch {
    return null;
  }
}

// Retrieve escalations for a specific patient
export async function getEscalationsByPatientIdFromSupabase(
  patientIdOrUhid: string
): Promise<EscalationData[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('escalations')
      .select('*')
      .or(`patient_id.eq.${patientIdOrUhid},patient_name.ilike.%${patientIdOrUhid}%`)
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      category: row.category,
      priority: row.priority,
      target: row.target,
      notes: row.notes,
      status: row.status,
      escalatedBy: row.escalated_by,
      createdAt: row.created_at,
    }));
  } catch {
    return null;
  }
}

// Retrieve all Care Team users from Supabase
export async function getCareTeamUsersFromSupabase(): Promise<CareTeamUser[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('care_team_users')
      .select('id, crt_id, name, age, phone, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      crtId: row.crt_id,
      name: row.name,
      age: row.age,
      phone: row.phone,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
    }));
  } catch {
    return null;
  }
}

// Delete patient from Supabase (Administrative)
export async function deletePatientFromSupabase(
  idOrUhid: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const query = client.from('patients').delete();
    const { error } = idOrUhid.startsWith('PAT')
      ? await query.eq('uhid', idOrUhid)
      : await query.eq('id', idOrUhid);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Delete escalation from Supabase
export async function deleteEscalationFromSupabase(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const { error } = await client.from('escalations').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Realtime Subscriptions via Supabase Channels
// -------------------------------------------------------------
export function subscribeToEscalations(
  onChange: (payload: { eventType: string; new: any; old: any }) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('realtime_escalations_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'escalations' },
        (payload) => {
          onChange({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to subscribe to escalations realtime channel:', err);
    return null;
  }
}

export function subscribeToPatients(
  onChange: (payload: { eventType: string; new: any; old: any }) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('realtime_patients_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        (payload) => {
          onChange({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to subscribe to patients realtime channel:', err);
    return null;
  }
}


