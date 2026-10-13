import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DoctorUser, Patient, Appointment, Prescription, db } from '@/lib/db';

// Supabase client management & direct PostgreSQL synchronization
let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export interface SupabaseConfig {
  url: string | null;
  anonKey: string | null;
  projectId: string | null;
}

export function getSupabaseConfig(): SupabaseConfig {
  let projectId = process.env.SUPABASE_PROJECT_ID || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || null;
  let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;

  if (projectId && !url) {
    url = `https://${projectId}.supabase.co`;
  }

  if (url && !projectId) {
    try {
      const parsed = new URL(url);
      projectId = parsed.hostname.split('.')[0];
    } catch {
      // ignore
    }
  }

  return { url, anonKey, projectId };
}

export function getSupabaseClient(overrideUrl?: string, overrideKey?: string): SupabaseClient | null {
  const config = getSupabaseConfig();
  const targetUrl = overrideUrl || config.url;
  const targetKey = overrideKey || config.anonKey;

  if (!targetUrl || !targetKey || targetKey.length < 10) {
    return null;
  }

  const currentKey = `${targetUrl}:${targetKey}`;
  if (cachedClient && cachedConfigKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(targetUrl, targetKey, {
      auth: { persistSession: false },
    });
    cachedConfigKey = currentKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(overrideUrl?: string, overrideKey?: string): Promise<{
  success: boolean;
  configured: boolean;
  latencyMs?: number;
  message: string;
}> {
  const client = getSupabaseClient(overrideUrl, overrideKey);
  if (!client) {
    return {
      success: false,
      configured: false,
      message: 'Supabase credentials missing or incomplete. Enter Project ID & Anon Key.',
    };
  }

  const start = Date.now();
  try {
    const { error } = await client.from('patients').select('id').limit(1);
    const latency = Date.now() - start;

    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      if (error.code === '42P01') {
        return {
          success: true,
          configured: true,
          latencyMs: latency,
          message: 'Connected to Supabase PostgreSQL! (Run schema migration if tables are not yet created).',
        };
      }
      return {
        success: false,
        configured: true,
        latencyMs: latency,
        message: `Supabase authentication error: ${error.message} (${error.code})`,
      };
    }

    return {
      success: true,
      configured: true,
      latencyMs: latency,
      message: `Successfully connected to Supabase PostgreSQL! Round-trip latency: ${latency}ms.`,
    };
  } catch (err: any) {
    return {
      success: false,
      configured: true,
      message: `Network error reaching Supabase: ${err.message}`,
    };
  }
}

// =========================================================================
// 1. DOCTOR RETRIEVAL & UPDATION (SUPABASE DIRECT)
// =========================================================================

export async function getDoctorFromSupabase(loginId: string): Promise<DoctorUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const term = loginId.trim();
    // Search by ID, Email, or Phone
    const { data, error } = await client
      .from('doctors')
      .select('*')
      .or(`id.ilike.${term},email.ilike.${term},phone.ilike.%${term.replace(/\D/g, '')}%`)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      age: data.age,
      pin: data.pin,
      isVerified: data.is_verified ?? true,
      department: data.department,
      license: data.license,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('getDoctorFromSupabase error:', err);
    return null;
  }
}

export async function createDoctorInSupabase(doctor: DoctorUser): Promise<DoctorUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const row = {
      id: doctor.id,
      name: doctor.name,
      phone: doctor.phone,
      email: doctor.email,
      age: doctor.age,
      pin: doctor.pin,
      is_verified: doctor.isVerified,
      department: doctor.department,
      license: doctor.license,
      created_at: doctor.createdAt || new Date().toISOString(),
    };

    const { data, error } = await client.from('doctors').upsert(row).select().single();
    if (error) {
      console.error('createDoctorInSupabase error:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      age: data.age,
      pin: data.pin,
      isVerified: data.is_verified ?? true,
      department: data.department,
      license: data.license,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('createDoctorInSupabase exception:', err);
    return null;
  }
}

// =========================================================================
// 2. PATIENT RETRIEVAL & UPDATION (SUPABASE DIRECT)
// =========================================================================

export async function getPatientsFromSupabase(): Promise<Patient[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('patients')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) return null;

    return data.map((p: any) => ({
      id: p.id,
      uhid: p.uhid,
      name: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      language: p.language,
      deviceType: p.device_type,
      chronicConditions: p.chronic_conditions || [],
      guardianName: p.guardian_name,
      guardianPhone: p.guardian_phone,
      guardianConsent: p.guardian_consent,
    }));
  } catch (err) {
    console.error('getPatientsFromSupabase exception:', err);
    return null;
  }
}

export async function getPatientByIdFromSupabase(id: string): Promise<Patient | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('patients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      uhid: data.uhid,
      name: data.name,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      language: data.language,
      deviceType: data.device_type,
      chronicConditions: data.chronic_conditions || [],
      guardianName: data.guardian_name,
      guardianPhone: data.guardian_phone,
      guardianConsent: data.guardian_consent,
    };
  } catch (err) {
    console.error('getPatientByIdFromSupabase exception:', err);
    return null;
  }
}

// =========================================================================
// 3. APPOINTMENTS RETRIEVAL & UPDATION (SUPABASE DIRECT)
// =========================================================================

export async function getPendingAppointmentsFromSupabase(): Promise<Appointment[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('appointments')
      .select('*, patients(*)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });

    if (error || !data) return null;

    return data.map((apt: any) => ({
      id: apt.id,
      patientId: apt.patient_id,
      tokenNumber: apt.token_number || '',
      reasonForVisit: apt.reason_for_visit || '',
      appointmentTime: apt.appointment_time || '',
      bookingChannel: apt.booking_channel || 'CLINIC_DESK',
      status: apt.status || 'PENDING',
      patient: apt.patients
        ? {
            id: apt.patients.id,
            uhid: apt.patients.uhid,
            name: apt.patients.name,
            age: apt.patients.age,
            gender: apt.patients.gender,
            phone: apt.patients.phone,
            language: apt.patients.language,
            deviceType: apt.patients.device_type,
            chronicConditions: apt.patients.chronic_conditions || [],
            guardianName: apt.patients.guardian_name,
            guardianPhone: apt.patients.guardian_phone,
          }
        : undefined,
    }));
  } catch (err) {
    console.error('getPendingAppointmentsFromSupabase exception:', err);
    return null;
  }
}

export async function updateAppointmentStatusInSupabase(
  appointmentId: string,
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId);

    return !error;
  } catch (err) {
    console.error('updateAppointmentStatusInSupabase exception:', err);
    return false;
  }
}

// =========================================================================
// 4. PRESCRIPTION RETRIEVAL & UPDATION (SUPABASE DIRECT)
// =========================================================================

export async function savePrescriptionToSupabase(payload: {
  prescription: any;
  medicines: any[];
  diagnostics: any[];
  telephonyTrigger?: any;
}): Promise<{ success: boolean; synced: boolean; errors: string[] }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, synced: false, errors: ['Supabase client not configured'] };
  }

  const errors: string[] = [];

  try {
    // 1. Insert Prescription
    const { error: rxErr } = await client.from('prescriptions').upsert(payload.prescription);
    if (rxErr) errors.push(`Prescription error: ${rxErr.message}`);

    // 2. Insert Medicines
    if (payload.medicines && payload.medicines.length > 0) {
      const { error: medErr } = await client.from('prescription_medicines').upsert(payload.medicines);
      if (medErr) errors.push(`Medicines error: ${medErr.message}`);
    }

    // 3. Insert Diagnostics
    if (payload.diagnostics && payload.diagnostics.length > 0) {
      const { error: diagErr } = await client.from('prescription_diagnostics').upsert(payload.diagnostics);
      if (diagErr) errors.push(`Diagnostics error: ${diagErr.message}`);
    }

    // 4. Insert Telephony Trigger
    if (payload.telephonyTrigger) {
      const { error: trigErr } = await client.from('telephony_triggers').upsert(payload.telephonyTrigger);
      if (trigErr) errors.push(`Telephony Trigger error: ${trigErr.message}`);
    }

    return {
      success: errors.length === 0,
      synced: errors.length === 0,
      errors,
    };
  } catch (err: any) {
    errors.push(`Exception: ${err.message}`);
    return { success: false, synced: false, errors };
  }
}

export async function getPatientPrescriptionsFromSupabase(patientId: string): Promise<any[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: prescriptions, error: rxErr } = await client
      .from('prescriptions')
      .select('*, prescription_medicines(*), prescription_diagnostics(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (rxErr || !prescriptions) return null;

    return prescriptions.map((rx: any) => ({
      id: rx.id,
      patientId: rx.patient_id,
      doctorId: rx.doctor_id,
      doctorName: rx.doctor_name,
      status: rx.status,
      prescriptionType: rx.prescription_type,
      symptomsNotes: rx.symptoms_notes,
      followUpDate: rx.follow_up_date,
      followUpNotes: rx.follow_up_notes,
      telephonyTriggerEnabled: rx.telephony_trigger_enabled,
      telephonyTriggeredAt: rx.telephony_triggered_at,
      createdAt: rx.created_at,
      medicines: (rx.prescription_medicines || []).map((m: any) => ({
        id: m.id,
        prescriptionId: m.prescription_id,
        medicineName: m.medicine_name,
        dosage: m.dosage,
        frequency: m.frequency,
        noOfDays: m.no_of_days,
        mealRelation: m.meal_relation,
        instructions: m.instructions,
        dispenseStatus: m.dispense_status,
      })),
      diagnostics: (rx.prescription_diagnostics || []).map((d: any) => ({
        id: d.id,
        prescriptionId: d.prescription_id,
        testType: d.test_type,
        testName: d.test_name,
        instructions: d.instructions,
        urgency: d.urgency,
        status: d.status,
      })),
    }));
  } catch (err) {
    console.error('getPatientPrescriptionsFromSupabase exception:', err);
    return null;
  }
}

export async function getPatientMedicationHistoryFromSupabase(patientId: string): Promise<any[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('prescription_medicines')
      .select('*, prescriptions!inner(patient_id, doctor_id, doctor_name, created_at, prescription_type)')
      .eq('prescriptions.patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((item: any) => ({
      id: item.id,
      prescriptionId: item.prescription_id,
      medicineName: item.medicine_name,
      dosage: item.dosage,
      frequency: item.frequency,
      noOfDays: item.no_of_days,
      mealRelation: item.meal_relation,
      instructions: item.instructions,
      dispenseStatus: item.dispense_status,
      doctorId: item.prescriptions?.doctor_id,
      doctorName: item.prescriptions?.doctor_name,
      prescribedDate: item.prescriptions?.created_at,
      prescriptionType: item.prescriptions?.prescription_type,
    }));
  } catch (err) {
    console.error('getPatientMedicationHistoryFromSupabase exception:', err);
    return null;
  }
}

// =========================================================================
// 5. STATS RETRIEVAL (SUPABASE DIRECT)
// =========================================================================

export async function getStatsFromSupabase(): Promise<{
  pending_appointments: number;
  enrolled_patients: number;
  total_prescriptions: number;
} | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [aptsRes, ptsRes, rxRes] = await Promise.all([
      client.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      client.from('patients').select('*', { count: 'exact', head: true }),
      client.from('prescriptions').select('*', { count: 'exact', head: true }),
    ]);

    return {
      pending_appointments: aptsRes.count ?? 0,
      enrolled_patients: ptsRes.count ?? 0,
      total_prescriptions: rxRes.count ?? 0,
    };
  } catch (err) {
    console.error('getStatsFromSupabase exception:', err);
    return null;
  }
}

// Backward compatibility alias
export const syncPrescriptionToSupabase = savePrescriptionToSupabase;
