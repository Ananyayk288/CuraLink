export interface PatientData {
  id?: string;
  uhid?: string;
  name: string;
  age: number;
  phone: string;
  literacy: boolean; // true = Literate, false = Illiterate (Needs voice/IVR)
  address: string;
  gender?: string;
  language?: string;
  pin?: string; // 6-digit access PIN
  
  // Guardian details (optional section)
  hasGuardian?: boolean;
  guardianName?: string;
  guardianAge?: number;
  guardianPhone?: string;
  guardianLiteracy?: boolean;
  guardianAddress?: string;
  guardianRelationship?: string;

  otpVerified?: boolean;
  createdAt?: string;
}

export type EscalationPriority = 'ROUTINE' | 'URGENT' | 'CRITICAL';

export type EscalationCategory = 
  | 'SEVERE_SYMPTOMS'
  | 'MISSED_MEDICATION'
  | 'ABNORMAL_VITALS'
  | 'ADVERSE_REACTION'
  | 'HOME_VISIT_REQUIRED'
  | 'SOCIAL_BARRIER'
  | 'OTHER';

export interface EscalationData {
  id?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  category: EscalationCategory;
  priority: EscalationPriority;
  target: string;
  notes: string;
  status?: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  escalatedBy?: string;
  createdAt?: string;
}

export interface OTPVerificationPayload {
  patientPhone: string;
  guardianPhone?: string;
  patientOtp: string;
  guardianOtp?: string;
}

export interface CareTeamUser {
  id?: string;
  crtId: string; // e.g. CRT followed by 5 digits
  name: string;
  age: number;
  phone: string;
  email: string;
  pin: string; // 6-digit PIN
  role?: string;
  createdAt?: string;
}
