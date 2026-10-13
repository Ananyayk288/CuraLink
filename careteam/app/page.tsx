'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  AlertTriangle,
  Users,
  ShieldAlert,
  CheckCircle2,
  Phone,
  BookOpen,
  MapPin,
  Calendar,
  Send,
  Database,
  ExternalLink,
  Search,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Copy,
  Info,
  Clock,
  ArrowRight,
  FileText,
  Key,
  Flame,
  Settings,
  ChevronDown,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Mail,
  UserCheck,
  ShieldCheck,
  User,
} from 'lucide-react';
import { PatientData, EscalationData, EscalationPriority, EscalationCategory, CareTeamUser } from '@/lib/types';
import { careTeamStore, HARDCODED_OTP } from '@/lib/store';
import { testSupabaseConnection, getSupabaseConfig } from '@/lib/supabase';

export default function CareTeamPortal() {
  // Navigation Tabs: 'register' | 'escalate'
  const [activeTab, setActiveTab] = useState<'register' | 'escalate'>('register');

  // Supabase Status & Settings
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<string>('Testing connection...');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>('');
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);

  // Store data
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [escalations, setEscalations] = useState<EscalationData[]>([]);

  // -------------------------------------------------------------
  // CARE TEAM AUTHENTICATION STATE
  // -------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<CareTeamUser | null>(null);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');

  // Care Team Registration Form
  const [crtName, setCrtName] = useState<string>('');
  const [crtAge, setCrtAge] = useState<string>('');
  const [crtPhone, setCrtPhone] = useState<string>('');
  const [crtEmail, setCrtEmail] = useState<string>('');
  const [crtPin, setCrtPin] = useState<string>('');
  const [crtConfirmPin, setCrtConfirmPin] = useState<string>('');
  const [showCrtPin, setShowCrtPin] = useState<boolean>(false);
  const [showCrtConfirmPin, setShowCrtConfirmPin] = useState<boolean>(false);
  const [crtAuthError, setCrtAuthError] = useState<string | null>(null);
  const [isSubmittingCrt, setIsSubmittingCrt] = useState<boolean>(false);

  // Care Team Hardcoded Verification Modal
  const [showCrtVerifyModal, setShowCrtVerifyModal] = useState<boolean>(false);
  const [crtEnteredOtp, setCrtEnteredOtp] = useState<string>('');
  const [crtOtpError, setCrtOtpError] = useState<string | null>(null);

  // Care Team Registration Successful Screen
  const [crtSuccessUser, setCrtSuccessUser] = useState<CareTeamUser | null>(null);
  const [showCrtSuccessModal, setShowCrtSuccessModal] = useState<boolean>(false);
  const [copiedCrtId, setCopiedCrtId] = useState<boolean>(false);

  // Care Team Login Form
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPin, setLoginPin] = useState<string>('');
  const [showLoginPin, setShowLoginPin] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // -------------------------------------------------------------
  // FORM 1: Register Patient State
  // -------------------------------------------------------------
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientLiteracy, setPatientLiteracy] = useState<boolean>(true); // default true
  const [patientAddress, setPatientAddress] = useState('');
  const [patientGender, setPatientGender] = useState('Female');
  const [patientLanguage, setPatientLanguage] = useState('Kannada');
  const [patientPin, setPatientPin] = useState<string>('');
  const [confirmPatientPin, setConfirmPatientPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [showConfirmPin, setShowConfirmPin] = useState<boolean>(false);

  // Guardian Section
  const [hasGuardian, setHasGuardian] = useState<boolean>(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianAge, setGuardianAge] = useState<string>('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianLiteracy, setGuardianLiteracy] = useState<boolean>(true);
  const [guardianAddress, setGuardianAddress] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Son');

  // OTP & Success Modal State
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [enteredPatientOtp, setEnteredPatientOtp] = useState<string>('');
  const [enteredGuardianOtp, setEnteredGuardianOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmittingPatient, setIsSubmittingPatient] = useState<boolean>(false);
  const [registrationSuccessData, setRegistrationSuccessData] = useState<PatientData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // -------------------------------------------------------------
  // FORM 2: Escalate Issue State
  // -------------------------------------------------------------
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');
  const [escalationCategory, setEscalationCategory] = useState<EscalationCategory>('SEVERE_SYMPTOMS');
  const [escalationPriority, setEscalationPriority] = useState<EscalationPriority>('CRITICAL');
  const [escalationTarget, setEscalationTarget] = useState<string>('Dr. Shivakumar (PHC Chief)');
  const [escalationNotes, setEscalationNotes] = useState<string>('');
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState<boolean>(false);
  const [escalationSuccessMsg, setEscalationSuccessMsg] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Initial Load & Refresh
  // -------------------------------------------------------------
  const reloadData = () => {
    setPatients(careTeamStore.getPatients());
    setEscalations(careTeamStore.getEscalations());
  };

  const checkConnection = async () => {
    const config = getSupabaseConfig();
    if (config.url) setSupabaseUrlInput(config.url);
    if (config.anonKey) setSupabaseKeyInput(config.anonKey);

    const res = await testSupabaseConnection();
    setSupabaseConnected(res.connected);
    setSupabaseStatusMsg(res.message);

    if (res.connected) {
      await careTeamStore.syncFromSupabase();
      reloadData();
    }
  };

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await careTeamStore.syncFromSupabase();
      reloadData();
    } catch (err: any) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateEscalationStatus = async (
    id: string,
    newStatus: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED'
  ) => {
    if (!id) return;
    try {
      await careTeamStore.updateEscalationStatus(id, newStatus);
      reloadData();
    } catch (err: any) {
      alert('Error updating status in Supabase: ' + err.message);
    }
  };

  useEffect(() => {
    const active = careTeamStore.getCurrentUser();
    if (active) {
      setCurrentUser(active);
    }
    reloadData();
    checkConnection();
  }, []);

  // -------------------------------------------------------------
  // CARE TEAM AUTHENTICATION HANDLERS
  // -------------------------------------------------------------
  const handleStartCrtRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setCrtAuthError(null);

    if (!crtName.trim()) {
      setCrtAuthError('Please enter full name.');
      return;
    }
    if (!crtAge.trim() || isNaN(Number(crtAge)) || Number(crtAge) < 18 || Number(crtAge) > 100) {
      setCrtAuthError('Please enter a valid age (18 - 100).');
      return;
    }
    const cleanPhone = crtPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setCrtAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!crtEmail.trim() || !emailRegex.test(crtEmail.trim())) {
      setCrtAuthError('Please enter a valid official/work email address.');
      return;
    }
    if (!crtPin.trim() || !/^\d{6}$/.test(crtPin.trim())) {
      setCrtAuthError('Please enter a valid 6-digit numeric PIN (e.g. 123456).');
      return;
    }
    if (crtPin.trim() !== crtConfirmPin.trim()) {
      setCrtAuthError('PIN confirmation does not match the 6-digit PIN entered above.');
      return;
    }

    // Validation passed - open hardcoded verification modal
    setCrtOtpError(null);
    setCrtEnteredOtp('');
    setShowCrtVerifyModal(true);
  };

  const handleAutoFillCrtOtp = () => {
    setCrtEnteredOtp(HARDCODED_OTP);
  };

  const handleConfirmCrtVerificationAndRegister = async () => {
    if (crtEnteredOtp.trim() !== HARDCODED_OTP) {
      setCrtOtpError(`Invalid verification code. Please enter hardcoded code: ${HARDCODED_OTP}`);
      return;
    }

    setIsSubmittingCrt(true);
    setCrtOtpError(null);

    try {
      const res = await careTeamStore.registerCareTeamUser({
        name: crtName.trim(),
        age: Number(crtAge),
        phone: crtPhone.trim(),
        email: crtEmail.trim(),
        pin: crtPin.trim(),
      });

      setIsSubmittingCrt(false);
      setShowCrtVerifyModal(false);
      setCrtSuccessUser(res.user);
      setShowCrtSuccessModal(true);
      setCurrentUser(res.user);
      reloadData();

      // Clear registration form
      setCrtName('');
      setCrtAge('');
      setCrtPhone('');
      setCrtEmail('');
      setCrtPin('');
      setCrtConfirmPin('');
    } catch (err: any) {
      setIsSubmittingCrt(false);
      setCrtOtpError(err.message || 'Error completing Care Team registration.');
    }
  };

  const handleLoginCrt = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your CRT ID, Phone, or Email.');
      return;
    }
    if (!loginPin.trim() || !/^\d{6}$/.test(loginPin.trim())) {
      setLoginError('Please enter your 6-digit PIN.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await careTeamStore.loginCareTeamUser(loginIdentifier.trim(), loginPin.trim());
      setIsLoggingIn(false);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        reloadData();
      } else {
        setLoginError(res.message || 'Invalid credentials or PIN mismatch.');
      }
    } catch (err: any) {
      setIsLoggingIn(false);
      setLoginError(err.message || 'Authentication error.');
    }
  };

  const handleQuickDemoLogin = () => {
    setLoginIdentifier('CRT10001');
    setLoginPin('123456');
    setLoginError(null);
  };

  const handleLogout = () => {
    careTeamStore.logoutUser();
    setCurrentUser(null);
    setAuthMode('login');
  };

  // Filtered patients for dropdown/search in Escalate tab
  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients;
    const q = patientSearchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.uhid?.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [patients, patientSearchQuery]);

  const currentlySelectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId || p.uhid === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Copy address to guardian
  const handleCopyPatientAddress = () => {
    setGuardianAddress(patientAddress);
  };

  // -------------------------------------------------------------
  // Patient Registration Handlers
  // -------------------------------------------------------------
  const handleOpenOtpModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Please enter patient name');
      return;
    }
    if (!patientAge || isNaN(Number(patientAge))) {
      alert('Please enter a valid patient age');
      return;
    }
    if (!patientPhone.trim()) {
      alert('Please enter patient phone number');
      return;
    }
    if (!patientAddress.trim()) {
      alert('Please enter patient residential address');
      return;
    }

    if (!patientPin.trim() || patientPin.trim().length !== 6 || !/^\d{6}$/.test(patientPin.trim())) {
      alert('Please enter a valid 6-digit numeric PIN for the patient (e.g. 123456).');
      return;
    }

    if (patientPin.trim() !== confirmPatientPin.trim()) {
      alert('PIN mismatch! The Confirmation PIN must match the 6-digit PIN entered above.');
      return;
    }

    if (hasGuardian) {
      if (!guardianName.trim() || !guardianPhone.trim()) {
        alert('Please provide Guardian Name and Phone Number, or uncheck "Include Guardian".');
        return;
      }
    }

    setOtpError(null);
    setEnteredPatientOtp('');
    setEnteredGuardianOtp('');
    setShowOtpModal(true);
  };

  const handleAutoFillOtp = () => {
    setEnteredPatientOtp(HARDCODED_OTP);
    if (hasGuardian && guardianPhone) {
      setEnteredGuardianOtp(HARDCODED_OTP);
    }
  };

  const handleConfirmOtpAndRegister = async () => {
    // Validate hardcoded OTP
    if (enteredPatientOtp.trim() !== HARDCODED_OTP) {
      setOtpError(`Invalid Patient OTP. Must match hardcoded OTP: ${HARDCODED_OTP}`);
      return;
    }

    if (hasGuardian && guardianPhone) {
      if (enteredGuardianOtp.trim() !== HARDCODED_OTP) {
        setOtpError(`Invalid Guardian OTP. Must match hardcoded OTP: ${HARDCODED_OTP}`);
        return;
      }
    }

    setIsSubmittingPatient(true);
    setOtpError(null);

    try {
      const payload: PatientData = {
        name: patientName.trim(),
        age: Number(patientAge),
        phone: patientPhone.trim(),
        literacy: patientLiteracy,
        address: patientAddress.trim(),
        gender: patientGender,
        language: patientLanguage,
        pin: patientPin.trim(),
        hasGuardian,
        guardianName: hasGuardian ? guardianName.trim() : undefined,
        guardianAge: hasGuardian && guardianAge ? Number(guardianAge) : undefined,
        guardianPhone: hasGuardian ? guardianPhone.trim() : undefined,
        guardianLiteracy: hasGuardian ? guardianLiteracy : undefined,
        guardianAddress: hasGuardian ? (guardianAddress.trim() || patientAddress.trim()) : undefined,
        guardianRelationship: hasGuardian ? guardianRelationship : undefined,
      };

      const result = await careTeamStore.registerPatient(payload);
      await careTeamStore.syncFromSupabase();
      reloadData();

      setIsSubmittingPatient(false);
      setShowOtpModal(false);
      setRegistrationSuccessData(result.patient);
      setShowSuccessModal(true);

      // Pre-select this patient in Escalate tab for seamless workflow
      setSelectedPatientId(result.patient.id || result.patient.uhid || '');

      // Reset Form fields
      setPatientName('');
      setPatientAge('');
      setPatientPhone('');
      setPatientAddress('');
      setPatientPin('');
      setConfirmPatientPin('');
      setHasGuardian(false);
      setGuardianName('');
      setGuardianAge('');
      setGuardianPhone('');
      setGuardianAddress('');
    } catch (err: any) {
      setIsSubmittingPatient(false);
      setOtpError(err.message || 'Error completing registration');
    }
  };

  // -------------------------------------------------------------
  // Escalation Handlers
  // -------------------------------------------------------------
  const handleSubmitEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select or search a patient to escalate an issue for.');
      return;
    }
    if (!escalationNotes.trim()) {
      alert('Please provide clinical notes and reason for escalation.');
      return;
    }

    const patient = currentlySelectedPatient;
    if (!patient) {
      alert('Selected patient not found.');
      return;
    }

    setIsSubmittingEscalation(true);
    try {
      const payload: EscalationData = {
        patientId: patient.id || patient.uhid || 'pt-unknown',
        patientName: patient.name,
        patientPhone: patient.phone,
        category: escalationCategory,
        priority: escalationPriority,
        target: escalationTarget,
        notes: escalationNotes.trim(),
        status: 'PENDING',
        escalatedBy: currentUser ? `${currentUser.name} (${currentUser.crtId})` : 'Care Team Fieldworker',
      };

      const res = await careTeamStore.createEscalation(payload);
      await careTeamStore.syncFromSupabase();
      reloadData();
      setIsSubmittingEscalation(false);
      setEscalationNotes('');
      setEscalationSuccessMsg(`Issue successfully escalated for ${patient.name}! Ticket ID: ${res.escalation.id}`);

      setTimeout(() => {
        setEscalationSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      setIsSubmittingEscalation(false);
      alert('Failed to escalate issue: ' + err.message);
    }
  };

  // Save runtime Supabase credentials
  const handleSaveSupabaseConfig = async () => {
    if (typeof window !== 'undefined') {
      if (supabaseUrlInput.trim()) {
        localStorage.setItem('curalink_supabase_url', supabaseUrlInput.trim());
      }
      if (supabaseKeyInput.trim()) {
        localStorage.setItem('curalink_supabase_key', supabaseKeyInput.trim());
      }
    }
    setShowConfigModal(false);
    await checkConnection();
  };

  const sqlSchemaText = `-- CURALINK SQL SCHEMA FOR SUPABASE
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Care Team Users Table
CREATE TABLE IF NOT EXISTS care_team_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crt_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pin VARCHAR(6) NOT NULL,
  role TEXT DEFAULT 'Care Team Fieldworker',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uhid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT NOT NULL,
  literacy BOOLEAN NOT NULL DEFAULT true,
  address TEXT NOT NULL,
  gender TEXT DEFAULT 'Unspecified',
  language TEXT DEFAULT 'Kannada',
  pin VARCHAR(6) DEFAULT '123456',
  guardian_name TEXT,
  guardian_age INTEGER,
  guardian_phone TEXT,
  guardian_literacy BOOLEAN DEFAULT true,
  guardian_address TEXT,
  guardian_relationship TEXT,
  otp_verified BOOLEAN DEFAULT true,
  registered_by TEXT DEFAULT 'Care Team Fieldworker',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Guardians Table
CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT NOT NULL,
  literacy BOOLEAN NOT NULL DEFAULT true,
  address TEXT NOT NULL,
  relationship TEXT DEFAULT 'Guardian',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Escalations Table
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('ROUTINE', 'URGENT', 'CRITICAL')),
  target TEXT NOT NULL,
  notes TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACKNOWLEDGED', 'RESOLVED')),
  escalated_by TEXT DEFAULT 'Care Team Coordinator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE care_team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all care_team_users" ON care_team_users;
CREATE POLICY "Allow anon all care_team_users" ON care_team_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all patients" ON patients;
CREATE POLICY "Allow anon all patients" ON patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all guardians" ON guardians;
CREATE POLICY "Allow anon all guardians" ON guardians FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all escalations" ON escalations;
CREATE POLICY "Allow anon all escalations" ON escalations FOR ALL USING (true) WITH CHECK (true);`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 overflow-x-hidden">
      {/* ------------------------------------------------------------- */}
      {/* HEADER BAR */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[3.75rem] py-2 gap-2">
            {/* Logo & Portal Identity */}
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 truncate">
                    CURALINK
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                    Care Team
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden sm:block">
                  Frontline Community Care & Rapid Field Escalation
                </p>
              </div>
            </div>

            {/* Supabase Status Indicator & Config Button + User Badge */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
              <button
                onClick={() => setShowConfigModal(true)}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex-shrink-0 ${
                  supabaseConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
                title={supabaseStatusMsg}
              >
                <Database className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden md:inline">
                  {supabaseConnected ? 'Supabase Connected' : 'Supabase (Setup)'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
              </button>

              <button
                onClick={() => setShowConfigModal(true)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg flex-shrink-0"
                title="Configure Database & Keys"
              >
                <Settings className="w-4 h-4" />
              </button>

              {currentUser && (
                <div className="flex items-center space-x-1.5 sm:space-x-2 pl-2 sm:pl-3 border-l border-slate-200 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                    <p className="text-[11px] font-mono text-emerald-700 font-semibold">{currentUser.crtId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title={`Log Out (${currentUser.crtId})`}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TWO PRIMARY TABS (Shown when authenticated) */}
          {currentUser && (
            <div className="flex space-x-1 border-t border-slate-100 pt-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-3 sm:px-5 border-b-2 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                  activeTab === 'register'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Register Patient</span>
                <span className="ml-1 bg-slate-200/80 text-slate-700 text-[10px] sm:text-xs py-0.5 px-1.5 sm:px-2 rounded-full font-bold">
                  {patients.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('escalate')}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-3 sm:px-5 border-b-2 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                  activeTab === 'escalate'
                    ? 'border-rose-600 text-rose-700 bg-rose-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Escalate Issue</span>
                <span className="ml-1 bg-rose-100 text-rose-700 text-[10px] sm:text-xs py-0.5 px-1.5 sm:px-2 rounded-full font-bold">
                  {escalations.length}
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA */}
      {/* ------------------------------------------------------------- */}
      {!currentUser ? (
        <main className="max-w-xl mx-auto px-3 sm:px-6 mt-4 sm:mt-10">
          {/* Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 sm:p-8 text-white relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-tight">CURALINK Access Gateway</h1>
                  <p className="text-[11px] sm:text-xs text-emerald-100 font-medium">Frontline Healthcare Worker & Triage Terminal</p>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-white/90 leading-relaxed mt-2">
                Authorized field workstation for patient onboarding, vernacular accessibility routing, and direct physician escalation.
              </p>
            </div>

            {/* Auth Mode Toggle (Register first by default) */}
            <div className="flex border-b border-slate-200 bg-slate-50/60 p-1 sm:p-1.5 gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setCrtAuthError(null);
                }}
                className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  authMode === 'register'
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">1. Staff Registration</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setLoginError(null);
                }}
                className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  authMode === 'login'
                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">2. Terminal Sign In</span>
              </button>
            </div>

            {/* TAB CONTENT: 1. REGISTER */}
            {authMode === 'register' && (
              <form onSubmit={handleStartCrtRegistration} className="p-4 sm:p-8 space-y-4 sm:space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Care Team Staff Registration</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Register first to generate your official Care Team ID (format: CRT + 5 digits)
                  </p>
                </div>

                {crtAuthError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{crtAuthError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Nayak"
                      value={crtName}
                      onChange={(e) => setCrtName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                      required
                    />
                  </div>

                  {/* Age & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Age */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Age *</label>
                      <input
                        type="number"
                        min="18"
                        max="100"
                        placeholder="e.g. 32"
                        value={crtAge}
                        onChange={(e) => setCrtAge(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-semibold text-slate-500">+91</span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="98450 11223"
                          value={crtPhone}
                          onChange={(e) => setCrtPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Email ID *</label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                      <input
                        type="email"
                        placeholder="e.g. ramesh.nayak@curalink.health"
                        value={crtEmail}
                        onChange={(e) => setCrtEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Security PIN and Confirm PIN Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* 6-Digit PIN */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">6-Digit PIN *</label>
                        <span className="text-[10px] text-slate-400 font-medium">For terminal login</span>
                      </div>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                        <input
                          type={showCrtPin ? 'text' : 'password'}
                          maxLength={6}
                          placeholder="••••••"
                          value={crtPin}
                          onChange={(e) => setCrtPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs font-mono tracking-widest text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCrtPin(!showCrtPin)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600"
                        >
                          {showCrtPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm 6-Digit PIN */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Confirm PIN *</label>
                        <span className="text-[10px] text-slate-400 font-medium">Must match</span>
                      </div>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                        <input
                          type={showCrtConfirmPin ? 'text' : 'password'}
                          maxLength={6}
                          placeholder="••••••"
                          value={crtConfirmPin}
                          onChange={(e) => setCrtConfirmPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs font-mono tracking-widest text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCrtConfirmPin(!showCrtConfirmPin)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600"
                        >
                          {showCrtConfirmPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
                  >
                    <span>Proceed to Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setCrtAuthError(null);
                      }}
                      className="font-bold text-emerald-600 hover:underline"
                    >
                      Sign In with your CRT ID or Phone
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* TAB CONTENT: 2. SIGN IN */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginCrt} className="p-4 sm:p-8 space-y-4 sm:space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Care Team Terminal Sign In</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sign in with your registered CRT ID, phone number, or email and 6-digit PIN.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">CRT ID / Phone / Email *</label>
                    <input
                      type="text"
                      placeholder="e.g. CRT10001 or 9845100001"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">6-Digit PIN *</label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                      <input
                        type={showLoginPin ? 'text' : 'password'}
                        maxLength={6}
                        placeholder="••••••"
                        value={loginPin}
                        onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs font-mono tracking-widest text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPin(!showLoginPin)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600"
                      >
                        {showLoginPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>{isLoggingIn ? 'Verifying...' : 'Sign In to CURALINK'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Evaluator / Demo Helper */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-700" />
                      <span>Judge / Evaluator Demo Account</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition shadow-sm"
                    >
                      ⚡ 1-Click Fill
                    </button>
                  </div>
                  <div className="text-[11px] text-amber-800 font-mono space-y-0.5">
                    <p>CRT ID: <span className="font-bold">CRT10001</span> | PIN: <span className="font-bold">123456</span></p>
                    <p className="text-[10px] text-amber-700">Pre-seeded coordinator: Meenakshi Gowda</p>
                  </div>
                </div>

                <div className="text-center pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setLoginError(null);
                      }}
                      className="font-bold text-teal-600 hover:underline"
                    >
                      Register your Care Team account
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        {/* ========================================================= */}
        {/* TAB 1: REGISTER PATIENT */}
        {/* ========================================================= */}
        {activeTab === 'register' && (
          <div className="space-y-6">
            <form onSubmit={handleOpenOtpModal} className="space-y-6">
              {/* Card 1: Patient Primary Details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/80 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-base font-bold text-slate-800">
                      1. Patient Personal Details
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500">
                    Mandatory enrollment section
                  </span>
                </div>

                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Gowda"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm outline-none transition"
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Age (Years) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="125"
                      placeholder="e.g. 58"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm outline-none transition"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Phone Number <span className="text-rose-500">*</span></span>
                      <span className="text-[11px] text-slate-400 font-normal">SMS / Telephony</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="98451 23456"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm outline-none transition font-mono"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Gender
                    </label>
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm outline-none transition bg-white"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Preferred Language */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Preferred Language
                    </label>
                    <select
                      value={patientLanguage}
                      onChange={(e) => setPatientLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm outline-none transition bg-white"
                    >
                      <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                      <option value="English">English</option>
                    </select>
                  </div>

                  {/* Literacy Toggle (Boolean requirement) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Literacy Status <span className="text-rose-500">*</span></span>
                      <span className="text-[11px] text-slate-500">Audio/IVR Decision</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPatientLiteracy(true)}
                        className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                          patientLiteracy
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Literate (Yes)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPatientLiteracy(false)}
                        className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                          !patientLiteracy
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Illiterate (Voice IVR)</span>
                      </button>
                    </div>
                  </div>

                  {/* 6-Digit Security PIN */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Set 6-Digit PIN <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {patientPin.length}/6 digits
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={patientPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setPatientPin(val);
                        }}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm outline-none transition font-mono tracking-widest font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                        title={showPin ? 'Hide PIN' : 'Show PIN'}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Security PIN for patient verification & IVR calls
                    </p>
                  </div>

                  {/* Confirm 6-Digit Security PIN */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Confirm 6-Digit PIN <span className="text-rose-500">*</span></span>
                      </span>
                      {confirmPatientPin.length === 6 && (
                        <span
                          className={`text-[11px] font-bold ${
                            patientPin === confirmPatientPin ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {patientPin === confirmPatientPin ? '✓ Matched' : '✗ Mismatch'}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPin ? 'text' : 'password'}
                        required
                        maxLength={6}
                        placeholder="Re-enter 6-digit PIN"
                        value={confirmPatientPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setConfirmPatientPin(val);
                        }}
                        className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm outline-none transition font-mono tracking-widest font-bold ${
                          confirmPatientPin.length === 6 && patientPin !== confirmPatientPin
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                            : confirmPatientPin.length === 6 && patientPin === confirmPatientPin
                            ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 bg-emerald-50/20'
                            : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                        title={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                      >
                        {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Re-enter the exact same 6-digit security PIN
                    </p>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Residential Address / Village / Locality <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Near Maramma Temple, Ramanagara Rural Taluk, Bengaluru Rural District"
                      value={patientAddress}
                      onChange={(e) => setPatientAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Guardian Details Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/80 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <h2 className="text-base font-bold text-slate-800">
                        2. Guardian / Primary Caregiver Details
                      </h2>
                      <p className="text-xs text-slate-500">
                        Captures caregiver information for joint SMS/OTP notifications and chronic follow-up
                      </p>
                    </div>
                  </div>

                  {/* Switch to enable guardian */}
                  <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm hover:border-slate-400 transition self-start sm:self-auto flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={hasGuardian}
                      onChange={(e) => setHasGuardian(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Include Guardian
                    </span>
                  </label>
                </div>

                {hasGuardian ? (
                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 bg-slate-50/30 animate-fade-in">
                    {/* Guardian Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Guardian Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={hasGuardian}
                        placeholder="e.g. Suresh Gowda"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm outline-none transition"
                      />
                    </div>

                    {/* Guardian Age */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Guardian Age
                      </label>
                      <input
                        type="number"
                        min="18"
                        max="125"
                        placeholder="e.g. 32"
                        value={guardianAge}
                        onChange={(e) => setGuardianAge(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm outline-none transition"
                      />
                    </div>

                    {/* Guardian Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                        <span>Guardian Phone <span className="text-rose-500">*</span></span>
                        <span className="text-[11px] text-indigo-600 font-semibold">Dual OTP Target</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">
                          +91
                        </span>
                        <input
                          type="tel"
                          required={hasGuardian}
                          placeholder="98451 23457"
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                          className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm outline-none transition font-mono"
                        />
                      </div>
                    </div>

                    {/* Relationship */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Relationship to Patient
                      </label>
                      <select
                        value={guardianRelationship}
                        onChange={(e) => setGuardianRelationship(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm outline-none transition bg-white"
                      >
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Neighbor / Community Helper">Neighbor / Community Helper</option>
                      </select>
                    </div>

                    {/* Guardian Literacy */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Guardian Literacy Status
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setGuardianLiteracy(true)}
                          className={`flex items-center justify-center space-x-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                            guardianLiteracy
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Literate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuardianLiteracy(false)}
                          className={`flex items-center justify-center space-x-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                            !guardianLiteracy
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Illiterate</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Button to copy patient address */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={handleCopyPatientAddress}
                        className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-sm transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Address from Patient</span>
                      </button>
                    </div>

                    {/* Guardian Address */}
                    <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Guardian Address
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Leave blank to use patient address or specify guardian residence"
                        value={guardianAddress}
                        onChange={(e) => setGuardianAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm outline-none transition"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50/50">
                    <p className="text-sm text-slate-500">
                      No guardian added. If patient is elderly, pediatric, or illiterate, click{' '}
                      <button
                        type="button"
                        onClick={() => setHasGuardian(true)}
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        "Include Guardian"
                      </button>{' '}
                      to link a caregiver.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 flex items-start sm:items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <span>Submitting triggers hardcoded OTP (123456) verification before database commit</span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 sm:px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm transform hover:-translate-y-0.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Proceed to OTP Verification</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ESCALATE ISSUE */}
        {/* ========================================================= */}
        {activeTab === 'escalate' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left 7 Cols: Escalation Form */}
            <div className="lg:col-span-7 space-y-6">
              {escalationSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center space-x-3 text-emerald-900 shadow-sm animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm font-semibold">{escalationSuccessMsg}</p>
                </div>
              )}

              <form
                onSubmit={handleSubmitEscalation}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="bg-rose-50/70 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-800">
                      Emergency Clinical & Triage Escalation
                    </h2>
                  </div>
                  <span className="self-start sm:self-auto text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                    Direct Clinical Alert
                  </span>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Patient Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Select Registered Patient <span className="text-rose-500">*</span></span>
                      <span className="text-xs text-slate-500">
                        {patients.length} patients in registry
                      </span>
                    </label>

                    {/* Search & Select Combobox */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search patient by name, UHID, or phone number..."
                          value={patientSearchQuery}
                          onChange={(e) => setPatientSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-200 outline-none"
                        />
                      </div>

                      <select
                        required
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm outline-none transition bg-white"
                      >
                        <option value="">-- Choose a patient --</option>
                        {filteredPatients.map((p) => (
                          <option key={p.id || p.uhid} value={p.id || p.uhid}>
                            {p.uhid} — {p.name} ({p.age}y, {p.phone}) {p.literacy ? '' : '⚠️ Illiterate'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Patient Mini-Profile Preview */}
                    {currentlySelectedPatient && (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 flex items-center space-x-2 flex-wrap">
                            <span>{currentlySelectedPatient.name}</span>
                            <span className="font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                              {currentlySelectedPatient.uhid}
                            </span>
                          </div>
                          <p className="text-slate-500 mt-0.5 break-words">
                            Age: {currentlySelectedPatient.age} | Tel: {currentlySelectedPatient.phone} |{' '}
                            {currentlySelectedPatient.literacy ? 'Literate' : 'Illiterate (Voice Support)'}
                          </p>
                          {currentlySelectedPatient.hasGuardian && (
                            <p className="text-indigo-600 mt-0.5 font-medium break-words">
                              Guardian: {currentlySelectedPatient.guardianName} ({currentlySelectedPatient.guardianRelationship}) — {currentlySelectedPatient.guardianPhone}
                            </p>
                          )}
                        </div>
                        <span className="self-start sm:self-auto text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded-md text-[11px] whitespace-nowrap flex-shrink-0">
                          Active Case
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Priority / Severity Level */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Triage Severity & Urgency <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setEscalationPriority('ROUTINE')}
                        className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-center transition ${
                          escalationPriority === 'ROUTINE'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[11px] sm:text-xs font-bold">ROUTINE</span>
                        <span className="text-[9px] sm:text-[10px] opacity-80 mt-0.5">Within 48h</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEscalationPriority('URGENT')}
                        className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-center transition ${
                          escalationPriority === 'URGENT'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[11px] sm:text-xs font-bold">URGENT</span>
                        <span className="text-[9px] sm:text-[10px] opacity-80 mt-0.5">Within 12h</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEscalationPriority('CRITICAL')}
                        className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-center transition ${
                          escalationPriority === 'CRITICAL'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[11px] sm:text-xs font-bold flex items-center justify-center space-x-1">
                          <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          <span>CRITICAL</span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] opacity-80 mt-0.5">Immediate</span>
                      </button>
                    </div>
                  </div>

                  {/* Category of Escalation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Incident Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={escalationCategory}
                        onChange={(e) => setEscalationCategory(e.target.value as EscalationCategory)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm outline-none transition bg-white"
                      >
                        <option value="SEVERE_SYMPTOMS">Severe Symptoms / Chest Pain / Breathlessness</option>
                        <option value="MISSED_MEDICATION">Missed Critical Medication (Non-adherence)</option>
                        <option value="ABNORMAL_VITALS">Abnormal Vitals (BP &gt; 180 / Sugar Spike)</option>
                        <option value="ADVERSE_REACTION">Suspected Adverse Drug Reaction / Allergy</option>
                        <option value="HOME_VISIT_REQUIRED">Urgent Home Visit Needed (Immobile / Bedridden)</option>
                        <option value="SOCIAL_BARRIER">Financial or Transportation Inability</option>
                        <option value="OTHER">Other Clinical Escalation</option>
                      </select>
                    </div>

                    {/* Escalation Target */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Escalate To <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={escalationTarget}
                        onChange={(e) => setEscalationTarget(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm outline-none transition bg-white"
                      >
                        <option value="Dr. Shivakumar (PHC Chief)">Dr. Shivakumar (PHC Chief Physician)</option>
                        <option value="Dr. Radhika Rao (Specialist)">Dr. Radhika Rao (Specialist / Tele-Consult)</option>
                        <option value="Taluk Emergency EMS">Taluk Emergency Ambulance & EMS</option>
                        <option value="Care Coordinator">Care Coordinator / ASHA Supervisor</option>
                        <option value="PHC Pharmacy Officer">PHC Pharmacy Officer (Med Refill)</option>
                      </select>
                    </div>
                  </div>

                  {/* Clinical Notes / Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Field Observations & Incident Notes <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Detail the patient's complaints, vital signs recorded, medications skipped, or immediate danger signs..."
                      value={escalationNotes}
                      onChange={(e) => setEscalationNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm outline-none transition"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingEscalation}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-rose-600/20 transition-all text-sm flex items-center justify-center space-x-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {isSubmittingEscalation ? 'Dispatching Escalation...' : 'Dispatch Escalation Ticket'}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right 5 Cols: Live Escalation Queue / Feed */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                    Live Escalation Queue ({escalations.length})
                  </h3>
                </div>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className={`p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition ${
                    isSyncing ? 'animate-spin text-emerald-600' : ''
                  }`}
                  title="Refresh from Supabase PostgreSQL"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {escalations.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-sm">No Active Escalations</p>
                  <p className="text-xs mt-1">All field cases are stable and within routine protocols.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {escalations.map((esc) => {
                    const isCritical = esc.priority === 'CRITICAL';
                    const isUrgent = esc.priority === 'URGENT';

                    return (
                      <div
                        key={esc.id}
                        className={`bg-white rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                          isCritical
                            ? 'border-rose-300 bg-rose-50/20'
                            : isUrgent
                            ? 'border-amber-300 bg-amber-50/20'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-sm text-slate-900">
                                {esc.patientName}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isCritical
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : isUrgent
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {esc.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Target: <strong className="text-slate-700">{esc.target}</strong>
                            </p>
                          </div>

                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {esc.status || 'PENDING'}
                          </span>
                        </div>

                        <div className="mt-2.5 text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-100">
                          <p className="font-semibold text-slate-800 mb-1 text-[11px] uppercase tracking-wide text-slate-500">
                            Category: {esc.category.replace(/_/g, ' ')}
                          </p>
                          <p className="italic">"{esc.notes}"</p>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                          <span>By: {esc.escalatedBy || 'Care Team'}</span>
                          <span>
                            {esc.createdAt ? new Date(esc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>

                        {/* Interactive Status Updation in Supabase */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            Status in DB:
                          </span>
                          <div className="flex flex-wrap items-center gap-1">
                            {esc.status !== 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateEscalationStatus(esc.id || '', 'PENDING')}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title="Set to PENDING in Supabase"
                              >
                                Reopen
                              </button>
                            )}
                            {esc.status !== 'ACKNOWLEDGED' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateEscalationStatus(esc.id || '', 'ACKNOWLEDGED')}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 transition"
                                title="Set to ACKNOWLEDGED in Supabase"
                              >
                                Acknowledge
                              </button>
                            )}
                            {esc.status !== 'RESOLVED' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateEscalationStatus(esc.id || '', 'RESOLVED')}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
                                title="Set to RESOLVED in Supabase"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CARE TEAM HARDCODED VERIFICATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {showCrtVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-2xl border border-slate-100 text-center relative max-h-[92dvh] overflow-y-auto">
            <button
              onClick={() => setShowCrtVerifyModal(false)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full transition"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">Verify Care Team Identity</h3>
            <p className="text-xs text-slate-500 mt-1">
              Simulated verification code dispatched to:
            </p>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 text-left space-y-1">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                <span className="font-mono font-semibold">+91 {crtPhone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                <span className="truncate">{crtEmail}</span>
              </div>
            </div>

            {/* Quick Demo Fill Helper */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <span className="font-medium text-center sm:text-left">Hardcoded Demo Code: <strong>{HARDCODED_OTP}</strong></span>
              <button
                type="button"
                onClick={handleAutoFillCrtOtp}
                className="w-full sm:w-auto px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition shadow-sm text-center"
              >
                Auto-Fill Code
              </button>
            </div>

            {crtOtpError && (
              <p className="mt-3 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {crtOtpError}
              </p>
            )}

            {/* Code Input */}
            <div className="mt-4">
              <input
                type="text"
                maxLength={6}
                value={crtEnteredOtp}
                onChange={(e) => setCrtEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center font-mono text-xl sm:text-2xl font-extrabold tracking-[0.25em] sm:tracking-[0.4em] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border-2 border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
              />
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setShowCrtVerifyModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCrtVerificationAndRegister}
                disabled={isSubmittingCrt}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {isSubmittingCrt ? 'Registering...' : 'Verify & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CARE TEAM REGISTRATION SUCCESSFUL SCREEN */}
      {/* ------------------------------------------------------------- */}
      {showCrtSuccessModal && crtSuccessUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl border border-slate-100 text-center relative max-h-[92dvh] overflow-y-auto">
            {/* Close button in top-right */}
            <button
              onClick={() => setShowCrtSuccessModal(false)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition"
              title="Close and Enter Portal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success icon */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Registration Successful!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Care Team member verified and recorded in CURALINK registry
            </p>

            {/* BIG ID DISPLAY */}
            <div className="mt-4 sm:mt-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-700">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
                GENERATED CARE TEAM ID
              </p>
              <div className="mt-2 flex items-center justify-center space-x-2 sm:space-x-3">
                <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wider text-emerald-300 break-all sm:break-normal">
                  {crtSuccessUser.crtId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(crtSuccessUser.crtId);
                    setCopiedCrtId(true);
                    setTimeout(() => setCopiedCrtId(false), 2500);
                  }}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm border border-slate-700 flex-shrink-0"
                  title="Copy Care Team ID"
                >
                  {copiedCrtId ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {copiedCrtId && (
                <p className="text-[11px] text-emerald-400 font-medium mt-1">
                  ✓ Copied Care Team ID to clipboard!
                </p>
              )}
            </div>

            {/* OTHER DETAILS IN SMALL TEXT - EXCLUDING PIN FIELD */}
            <div className="mt-4 sm:mt-5 bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Staff Full Name:</span>
                <span className="font-bold text-slate-800">{crtSuccessUser.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Age:</span>
                <span className="font-semibold text-slate-800">{crtSuccessUser.age} years</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Registered Phone:</span>
                <span className="font-mono font-semibold text-slate-800">+91 {crtSuccessUser.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Official Email:</span>
                <span className="font-medium text-slate-800 break-all sm:break-normal text-right pl-2">{crtSuccessUser.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Designation / Role:</span>
                <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  {crtSuccessUser.role || 'Care Team Fieldworker'}
                </span>
              </div>
            </div>

            {/* Enter Portal Action */}
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={() => setShowCrtSuccessModal(false)}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
              >
                <span>Enter CURALINK Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* HARDCODED OTP VERIFICATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl border border-slate-100 space-y-4 sm:space-y-6 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Verify Patient & Guardian OTP
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dual SMS verification to finalize field enrollment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mock Telephony Dispatch Visualizer */}
            <div className="space-y-2 bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 text-xs text-emerald-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-bold text-emerald-800">
                <span className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Simulated SMS Telephony Dispatch</span>
                </span>
                <span className="self-start sm:self-auto bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px]">
                  Hardcoded Demo OTP: {HARDCODED_OTP}
                </span>
              </div>

              <div className="mt-2 space-y-1">
                <p>
                  📲 <strong>Patient ({patientName}):</strong> Sent OTP to{' '}
                  <code className="font-mono font-bold">+91 {patientPhone}</code>
                </p>
                {hasGuardian && guardianPhone && (
                  <p>
                    📲 <strong>Guardian ({guardianName}):</strong> Sent OTP to{' '}
                    <code className="font-mono font-bold">+91 {guardianPhone}</code>
                  </p>
                )}
              </div>
            </div>

            {/* Error banner if entered OTP wrong */}
            {otpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {/* OTP Inputs */}
            <div className="space-y-4">
              {/* Patient OTP */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Enter Patient OTP (+91 {patientPhone})</span>
                  <span className="text-emerald-700 font-mono text-xs">Code: {HARDCODED_OTP}</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={enteredPatientOtp}
                  onChange={(e) => setEnteredPatientOtp(e.target.value)}
                  className="w-full text-center text-lg sm:text-xl tracking-widest font-mono font-bold py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                />
              </div>

              {/* Guardian OTP (if entered) */}
              {hasGuardian && guardianPhone && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span>Enter Guardian OTP (+91 {guardianPhone})</span>
                    <span className="text-indigo-700 font-mono text-xs">Code: {HARDCODED_OTP}</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={enteredGuardianOtp}
                    onChange={(e) => setEnteredGuardianOtp(e.target.value)}
                    className="w-full text-center text-lg sm:text-xl tracking-widest font-mono font-bold py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
              )}

              {/* Auto-fill button for fast demo */}
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 border border-slate-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Auto-Fill Mock OTP ({HARDCODED_OTP})</span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 text-slate-600 hover:bg-slate-100 font-bold text-sm rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmittingPatient}
                onClick={handleConfirmOtpAndRegister}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
              >
                {isSubmittingPatient ? (
                  <span>Syncing to Supabase...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Register</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* GENERATED PATIENT ID SUCCESS MODAL (FRONT OF SCREEN) */}
      {/* ------------------------------------------------------------- */}
      {showSuccessModal && registrationSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl border border-slate-100 text-center relative max-h-[92dvh] overflow-y-auto">
            {/* Top Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Checkmark Icon */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Registration Successful!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Patient registered and verified in the health registry
            </p>

            {/* Prominent Generated Patient ID card */}
            <div className="mt-4 sm:mt-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-700">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
                GENERATED PATIENT ID
              </p>
              <div className="mt-2 flex items-center justify-center space-x-2 sm:space-x-3">
                <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wider text-emerald-300 break-all sm:break-normal">
                  {registrationSuccessData.uhid}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (registrationSuccessData.uhid) {
                      navigator.clipboard.writeText(registrationSuccessData.uhid);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2500);
                    }
                  }}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm border border-slate-700 flex-shrink-0"
                  title="Copy Patient ID"
                >
                  {copiedId ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {copiedId && (
                <p className="text-[11px] text-emerald-400 font-medium mt-1">
                  ✓ Copied Patient ID to clipboard!
                </p>
              )}
            </div>

            {/* Patient & Security Summary */}
            <div className="mt-4 sm:mt-5 bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-bold text-slate-800">
                  {registrationSuccessData.name} ({registrationSuccessData.age} yrs, {registrationSuccessData.gender})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Registered Phone:</span>
                <span className="font-mono font-semibold text-slate-800">+91 {registrationSuccessData.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">6-Digit Security PIN:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {registrationSuccessData.pin || '123456'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Literacy & Language:</span>
                <span className="font-medium text-slate-700">
                  {registrationSuccessData.literacy ? 'Literate (SMS)' : 'Illiterate (Voice IVR)'} • {registrationSuccessData.language}
                </span>
              </div>
              {registrationSuccessData.hasGuardian && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Guardian:</span>
                  <span className="font-medium text-indigo-700">
                    {registrationSuccessData.guardianName} ({registrationSuccessData.guardianRelationship}) — +91 {registrationSuccessData.guardianPhone}
                  </span>
                </div>
              )}
            </div>

            {/* Prominent Close Action */}
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-md transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUPABASE SETTINGS & SQL SCHEMA DRAWER/MODAL */}
      {/* ------------------------------------------------------------- */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-slate-100 space-y-5 sm:space-y-6 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Supabase PostgreSQL Configuration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provide credentials or run SQL migration script
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Connection Status Banner */}
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 ${
                supabaseConnected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {supabaseConnected
                    ? 'Connected to Supabase PostgreSQL'
                    : 'Supabase Credentials Pending'}
                </p>
                <p className="mt-0.5">{supabaseStatusMsg}</p>
                <p className="mt-1 text-[11px] text-slate-600">
                  Note: The portal works seamlessly in local storage mode right now. Once you enter your Supabase keys below or in <code>.env.local</code>, it will automatically sync all records to Supabase!
                </p>
              </div>
            </div>

            {/* Credentials Inputs */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Dynamic Supabase Keys (Optional Runtime Override)
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Supabase Project URL (e.g. <code>https://xyz.supabase.co</code>)
                </label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Supabase Anon Key (Public Key)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSupabaseConfig}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Save & Test Connection
                </button>
              </div>
            </div>

            {/* SQL Migration Script Box */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. SQL Schema Migration Script
                </h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sqlSchemaText);
                    setCopiedSchema(true);
                    setTimeout(() => setCopiedSchema(false), 3000);
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs text-teal-700 hover:text-teal-900 font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSchema ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Run this once in your Supabase SQL Editor to initialize <code>patients</code>, <code>guardians</code>, and <code>escalations</code> tables with Row Level Security.
              </p>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48">
                {sqlSchemaText}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
