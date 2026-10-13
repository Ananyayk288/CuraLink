import { PatientData, EscalationData, CareTeamUser } from './types';
import {
  savePatientToSupabase,
  saveEscalationToSupabase,
  getSupabasePatients,
  getSupabaseEscalations,
  updateEscalationStatusInSupabase,
  saveCareTeamUserToSupabase,
  authenticateCareTeamUserFromSupabase,
} from './supabase';

export const HARDCODED_OTP = '123456';

// Seed Care Team users so user can test login immediately
const INITIAL_CARE_TEAM_USERS: CareTeamUser[] = [
  {
    id: 'usr-meenakshi-01',
    crtId: 'CRT10001',
    name: 'Meenakshi Gowda',
    age: 32,
    phone: '9845100001',
    email: 'meenakshi@curalink.health',
    pin: '123456',
    role: 'Lead ASHA Field Coordinator',
    createdAt: new Date().toISOString(),
  },
];

// Seed patients so Care Team can immediately test Escalate Issue
const INITIAL_PATIENTS: PatientData[] = [
  {
    id: 'pt-ramesh-001',
    uhid: 'PAT10001',
    name: 'Ramesh Gowda',
    age: 58,
    phone: '+91 98451 23456',
    literacy: false, // Illiterate - Needs voice IVR
    address: 'Near Maramma Temple, Ramanagara District, Karnataka',
    gender: 'Male',
    language: 'Kannada',
    pin: '123456',
    hasGuardian: true,
    guardianName: 'Suresh Gowda',
    guardianAge: 32,
    guardianPhone: '+91 98451 23457',
    guardianLiteracy: true,
    guardianAddress: 'Same as patient address',
    guardianRelationship: 'Son',
    otpVerified: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'pt-kamalamma-002',
    uhid: 'PAT10002',
    name: 'Kamalamma Devi',
    age: 64,
    phone: '+91 98450 87654',
    literacy: false,
    address: 'House #42, Doddaballapura Rural, Karnataka',
    gender: 'Female',
    language: 'Kannada',
    pin: '123456',
    hasGuardian: true,
    guardianName: 'Anitha Devi',
    guardianAge: 38,
    guardianPhone: '+91 98450 87655',
    guardianLiteracy: true,
    guardianAddress: 'House #42, Doddaballapura Rural, Karnataka',
    guardianRelationship: 'Daughter',
    otpVerified: true,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'pt-mohammed-003',
    uhid: 'PAT10003',
    name: 'Mohammed Rafiq',
    age: 52,
    phone: '+91 97412 34567',
    literacy: true,
    address: 'Tipu Nagar, Shivamogga, Karnataka',
    gender: 'Male',
    language: 'English',
    pin: '123456',
    hasGuardian: false,
    otpVerified: true,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

const INITIAL_ESCALATIONS: EscalationData[] = [
  {
    id: 'esc-001',
    patientId: 'PAT10001',
    patientName: 'Ramesh Gowda',
    patientPhone: '+91 98451 23456',
    category: 'ABNORMAL_VITALS',
    priority: 'CRITICAL',
    target: 'Dr. Shivakumar (PHC Chief)',
    notes: 'Severe systolic spike (185/110 mmHg) recorded during field visit. Complaining of blurred vision.',
    status: 'PENDING',
    escalatedBy: 'Meenakshi (ASHA Lead)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'esc-002',
    patientId: 'PAT10002',
    patientName: 'Kamalamma Devi',
    patientPhone: '+91 98450 87654',
    category: 'MISSED_MEDICATION',
    priority: 'URGENT',
    target: 'Care Coordinator',
    notes: 'Ran out of Metformin 500mg 3 days ago. Unable to visit taluk pharmacy due to knee pain.',
    status: 'ACKNOWLEDGED',
    escalatedBy: 'Basavaraj (Field Coordinator)',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

// In-Memory & LocalStorage state store
class CareTeamStore {
  private patients: PatientData[] = [...INITIAL_PATIENTS];
  private escalations: EscalationData[] = [...INITIAL_ESCALATIONS];
  private users: CareTeamUser[] = [...INITIAL_CARE_TEAM_USERS];
  private currentUser: CareTeamUser | null = null;
  private isBrowser: boolean = typeof window !== 'undefined';

  constructor() {
    if (this.isBrowser) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const savedPatients = localStorage.getItem('curalink_patients') || localStorage.getItem('careteam_patients');
      if (savedPatients) {
        this.patients = JSON.parse(savedPatients);
      }
      const savedEscalations = localStorage.getItem('curalink_escalations') || localStorage.getItem('careteam_escalations');
      if (savedEscalations) {
        this.escalations = JSON.parse(savedEscalations);
      }
      const savedUsers = localStorage.getItem('curalink_users') || localStorage.getItem('careteam_users');
      if (savedUsers) {
        this.users = JSON.parse(savedUsers);
      }
      // Do not auto-login on startup: require explicit credentials sign-in
      this.currentUser = null;
      localStorage.removeItem('curalink_current_user');
      localStorage.removeItem('careteam_current_user');
    } catch {
      // Fallback
    }
  }

  private saveToStorage() {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem('curalink_patients', JSON.stringify(this.patients));
      localStorage.setItem('curalink_escalations', JSON.stringify(this.escalations));
      localStorage.setItem('curalink_users', JSON.stringify(this.users));
      if (this.currentUser) {
        localStorage.setItem('curalink_current_user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('curalink_current_user');
      }
    } catch {
      // Ignore
    }
  }

  // --- Care Team Authentication ---
  public getCurrentUser(): CareTeamUser | null {
    return this.currentUser;
  }

  public setCurrentUser(user: CareTeamUser | null) {
    this.currentUser = user;
    this.saveToStorage();
  }

  public logoutUser() {
    this.currentUser = null;
    this.saveToStorage();
  }

  public async registerCareTeamUser(data: {
    name: string;
    age: number;
    phone: string;
    email: string;
    pin: string;
  }): Promise<{ user: CareTeamUser; supabaseSynced: boolean; error?: string }> {
    // Generate ID starting with CRT followed by 5 digits
    const random5Digits = Math.floor(10000 + Math.random() * 90000);
    const crtId = `CRT${random5Digits}`;
    const id = `crt-${Date.now()}`;

    const newUser: CareTeamUser = {
      id,
      crtId,
      name: data.name,
      age: Number(data.age),
      phone: data.phone,
      email: data.email,
      pin: data.pin,
      role: 'Care Team Fieldworker',
      createdAt: new Date().toISOString(),
    };

    this.users.unshift(newUser);
    // User must sign in explicitly with their generated CRT ID and 6-digit PIN
    this.saveToStorage();

    // Sync to Supabase
    const supabaseRes = await saveCareTeamUserToSupabase(newUser);

    return {
      user: newUser,
      supabaseSynced: supabaseRes.success,
      error: supabaseRes.error,
    };
  }

  public async loginCareTeamUser(
    identifier: string,
    pin: string
  ): Promise<{ success: boolean; user?: CareTeamUser; message?: string }> {
    const trimmed = identifier.trim();

    // 1. Try Supabase first if available
    const remoteAuth = await authenticateCareTeamUserFromSupabase(trimmed, pin);
    if (remoteAuth.success && remoteAuth.user) {
      this.currentUser = remoteAuth.user;
      // Add to local cache if missing
      if (!this.users.some((u) => u.crtId === remoteAuth.user!.crtId)) {
        this.users.unshift(remoteAuth.user);
      }
      this.saveToStorage();
      return { success: true, user: remoteAuth.user };
    }

    if (!remoteAuth.success && remoteAuth.error === 'Incorrect 6-digit PIN') {
      return { success: false, message: 'Incorrect 6-digit PIN.' };
    }

    // 2. Fallback to local user store
    const matched = this.users.find((u) => {
      const matchId = u.crtId.toUpperCase() === trimmed.toUpperCase();
      const matchPhone = u.phone === trimmed || u.phone.replace(/\D/g, '') === trimmed.replace(/\D/g, '');
      const matchEmail = u.email.toLowerCase() === trimmed.toLowerCase();
      return matchId || matchPhone || matchEmail;
    });

    if (!matched) {
      return { success: false, message: 'No Care Team account found with this ID/Phone/Email.' };
    }

    if (matched.pin !== pin) {
      return { success: false, message: 'Incorrect 6-digit PIN.' };
    }

    this.currentUser = matched;
    this.saveToStorage();
    return { success: true, user: matched };
  }

  // --- Patients Store ---
  public getPatients(): PatientData[] {
    return [...this.patients];
  }

  public getEscalations(): EscalationData[] {
    return [...this.escalations];
  }

  public async registerPatient(data: PatientData): Promise<{
    patient: PatientData;
    supabaseSynced: boolean;
    error?: string;
  }> {
    // Generate ID starting with PAT followed by 5 digits
    const random5Digits = Math.floor(10000 + Math.random() * 90000);
    const uhid = `PAT${random5Digits}`;
    const id = `pt-care-${Date.now()}`;

    const newPatient: PatientData = {
      ...data,
      id,
      uhid,
      otpVerified: true,
      createdAt: new Date().toISOString(),
    };

    // Prepend to local list
    this.patients.unshift(newPatient);
    this.saveToStorage();

    // Sync to Supabase
    const supabaseRes = await savePatientToSupabase(newPatient);

    return {
      patient: newPatient,
      supabaseSynced: supabaseRes.success,
      error: supabaseRes.error,
    };
  }

  public async createEscalation(data: EscalationData): Promise<{
    escalation: EscalationData;
    supabaseSynced: boolean;
    error?: string;
  }> {
    const id = `esc-${Date.now()}`;
    const newEscalation: EscalationData = {
      ...data,
      id,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.escalations.unshift(newEscalation);
    this.saveToStorage();

    // Sync to Supabase
    const supabaseRes = await saveEscalationToSupabase(newEscalation);

    return {
      escalation: newEscalation,
      supabaseSynced: supabaseRes.success,
      error: supabaseRes.error,
    };
  }

  public async updateEscalationStatus(
    id: string,
    status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED'
  ): Promise<{ success: boolean; error?: string }> {
    const idx = this.escalations.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.escalations[idx] = {
        ...this.escalations[idx],
        status,
      };
      this.saveToStorage();
    }

    const supabaseRes = await updateEscalationStatusInSupabase(id, status);
    return supabaseRes;
  }

  public async syncFromSupabase(): Promise<{ patientsCount: number; escalationsCount: number }> {
    const remotePatients = await getSupabasePatients();
    if (remotePatients && remotePatients.length > 0) {
      this.patients = remotePatients;
      this.saveToStorage();
    }

    const remoteEscalations = await getSupabaseEscalations();
    if (remoteEscalations && remoteEscalations.length > 0) {
      this.escalations = remoteEscalations;
      this.saveToStorage();
    }

    return {
      patientsCount: this.patients.length,
      escalationsCount: this.escalations.length,
    };
  }
}

export const careTeamStore = new CareTeamStore();
