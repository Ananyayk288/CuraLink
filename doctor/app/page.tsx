'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PREFED_MEDICINES,
  PREFED_DIAGNOSTICS,
  TIMING_COLORS,
  getTimingSlots,
  DOCTOR_PROFILE,
  PrefedMedicine,
  PrefedDiagnostic,
} from '@/lib/constants';
import {
  Activity,
  Calendar,
  Clock,
  User,
  Users,
  FileText,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  Database,
  ExternalLink,
  Search,
  Check,
  X,
  Stethoscope,
  Pill,
  Sparkles,
  ChevronRight,
  ChevronDown,
  History,
  RefreshCw,
  Copy,
  Info,
  LogOut,
  ShieldCheck,
  UserPlus,
  LogIn,
  Menu,
} from 'lucide-react';
import DoctorAuthModal from '@/app/components/DoctorAuthModal';
import { DoctorUser } from '@/lib/db';

interface Patient {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  language: string;
  deviceType: string;
  chronicConditions: string[];
  guardianName?: string;
  guardianPhone?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  tokenNumber: string;
  reasonForVisit: string;
  appointmentTime: string;
  bookingChannel: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  patient?: Patient;
}

interface MedicineRow {
  id: string;
  medicineName: string;
  dosage: string;
  noOfDays: number;
  frequency: string;
  mealRelation: string;
  instructions: string;
}

interface DiagnosticRow {
  id: string;
  testName: string;
  testType: 'SCAN' | 'LAB_TEST';
  urgency: 'ROUTINE' | 'URGENT' | 'STAT';
  instructions: string;
}

export default function DoctorPortal() {
  // Active Doctor Session & Authentication Window State
  const [currentDoctor, setCurrentDoctor] = useState<DoctorUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'command' | 'prescription' | 'architecture' | 'supabase'>('command');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Photo-matching Date & Time Selector state (Reference UI)
  const [selectedMonth, setSelectedMonth] = useState('July');
  const [selectedDay, setSelectedDay] = useState(17);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM');
  const [activityTab, setActivityTab] = useState<'upcoming' | 'past'>('upcoming');

  // Core Data State
  const [stats, setStats] = useState({
    pending_appointments: 0,
    enrolled_patients: 0,
    supabase: { configured: false, project_id: '' },
  });
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Prescription Workspace State
  const [rxSubTab, setRxSubTab] = useState<'directory' | 'new' | 'rxHistory' | 'medHistory'>('new');
  const [isPrescriptionDraftActive, setIsPrescriptionDraftActive] = useState(false);
  const [rxMode, setRxMode] = useState<'NORMAL' | 'SCAN_TEST'>('NORMAL');
  const [symptomsNotes, setSymptomsNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [telephonyTriggerEnabled, setTelephonyTriggerEnabled] = useState(true);

  // Diagnostics and Dropdown Refs
  const diagSearchContainerRef = React.useRef<HTMLDivElement>(null);

  // Medication Regimen Rows (Medical Thing)
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    {
      id: 'row-1',
      medicineName: 'Metformin Hydrochloride',
      dosage: '500mg',
      noOfDays: 30,
      frequency: '1-0-1',
      mealRelation: 'After Food',
      instructions: 'Take after breakfast and dinner',
    },
  ]);

  // Autocomplete search states
  const [medQuery, setMedQuery] = useState<{ [key: string]: string }>({});
  const [activeMedDropdown, setActiveMedDropdown] = useState<string | null>(null);
  const [isImportDropdownOpen, setIsImportDropdownOpen] = useState(false);

  // Diagnostics Rows
  const [diagnostics, setDiagnostics] = useState<DiagnosticRow[]>([]);
  const [diagSearch, setDiagSearch] = useState('');
  const [diagDropdownOpen, setDiagDropdownOpen] = useState(false);

  // Close dropdowns if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (diagSearchContainerRef.current && !diagSearchContainerRef.current.contains(target)) {
        setDiagDropdownOpen(false);
      }
      if (activeMedDropdown && !target.closest('[data-med-dropdown]')) {
        setActiveMedDropdown(null);
      }
      if (isImportDropdownOpen && !target.closest('[data-import-dropdown]')) {
        setIsImportDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMedDropdown, isImportDropdownOpen]);

  // Patient Histories
  const [rxHistory, setRxHistory] = useState<any[]>([]);
  const [medHistory, setMedHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Patients Directory Filter
  const [patientSearch, setPatientSearch] = useState('');
  const [patientLangFilter, setPatientLangFilter] = useState('ALL');

  // Supabase Settings Modal
  const [supabaseProjectId, setSupabaseProjectId] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState('');
  const [supabaseTesting, setSupabaseTesting] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [statsRes, aptsRes, ptsRes, supaRes] = await Promise.all([
        fetch('/api/doctor/stats').then(r => r.json()),
        fetch('/api/doctor/pending-appointments').then(r => r.json()),
        fetch('/api/doctor/patients').then(r => r.json()),
        fetch('/api/supabase/config').then(r => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (aptsRes.success) setPendingAppointments(aptsRes.data);
      if (ptsRes.success) {
        setPatients(ptsRes.data);
        if (ptsRes.data.length > 0 && !selectedPatient) {
          setSelectedPatient(ptsRes.data[0]);
        }
      }
      if (supaRes.success) {
        setSupabaseProjectId(supaRes.data.project_id || '');
        setSupabaseUrl(supaRes.data.url || '');
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
    // Load persisted doctor session if available
    try {
      const stored = localStorage.getItem('curalink_doctor_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          setCurrentDoctor(parsed);
          setIsAuthModalOpen(false);
        }
      }
    } catch (e) {
      console.error('Error loading doctor session:', e);
    }
  }, []);

  // Doctor Auth Handlers
  const handleLoginSuccess = (doctor: DoctorUser) => {
    setCurrentDoctor(doctor);
    setIsAuthModalOpen(false);
    try {
      localStorage.setItem('curalink_doctor_session', JSON.stringify(doctor));
    } catch (e) {
      console.error(e);
    }
    showToast(`Signed in as ${doctor.name} (${doctor.id})`, 'success');
  };

  const handleSignOut = () => {
    setCurrentDoctor(null);
    setIsAuthModalOpen(true);
    try {
      localStorage.removeItem('curalink_doctor_session');
    } catch (e) {
      console.error(e);
    }
    showToast('Signed out of CURALINK clinical session.', 'info');
  };

  // Fetch Patient History when selected patient changes
  useEffect(() => {
    if (!selectedPatient) return;
    setHistoryLoading(true);
    fetch(`/api/doctor/patients/${selectedPatient.id}/history`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setRxHistory(res.data.prescriptions || []);
          setMedHistory(res.data.medications || []);
        }
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, [selectedPatient?.id]);

  // Select patient from queue and open Prescription tab
  const handleStartPrescription = (patient: Patient, appointmentId?: string) => {
    setSelectedPatient(patient);
    setSelectedAppointmentId(appointmentId || null);
    setActiveTab('prescription');
    setRxSubTab('new');
    setIsPrescriptionDraftActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Medicine Regimen Handlers
  const addMedicineRow = () => {
    const newId = `row-${Date.now()}`;
    setMedicines(prev => [
      ...prev,
      {
        id: newId,
        medicineName: '',
        dosage: '',
        noOfDays: 15,
        frequency: '1-0-1',
        mealRelation: 'After Food',
        instructions: '',
      },
    ]);
    setActiveMedDropdown(newId);
    setTimeout(() => {
      const inputEl = document.getElementById(`med-input-${newId}`);
      if (inputEl) inputEl.focus();
    }, 60);
  };

  const removeMedicineRow = (id: string) => {
    if (medicines.length <= 1) {
      showToast('Prescription must have at least one medication in Normal mode.', 'error');
      return;
    }
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  const updateMedicine = (id: string, field: keyof MedicineRow, value: any) => {
    setMedicines(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const selectPrefedMedicine = (rowId: string, item: PrefedMedicine) => {
    setMedicines(prev =>
      prev.map(m =>
        m.id === rowId
          ? {
              ...m,
              medicineName: item.name,
              dosage: item.dosage,
              frequency: item.defaultFreq,
              mealRelation: item.defaultMeal,
            }
          : m
      )
    );
    setMedQuery(prev => ({ ...prev, [rowId]: item.name }));
    setActiveMedDropdown(null);
  };

  // Filter medications previously prescribed by the ATTENDING doctor for the selected patient
  const doctorPrescribedMeds = useMemo(() => {
    if (!medHistory || medHistory.length === 0) return [];

    // Active doctor profile identity
    const activeDocId = currentDoctor?.id || DOCTOR_PROFILE.id; // e.g. DOC84920 or doc-1
    const activeDocName = currentDoctor?.name || DOCTOR_PROFILE.name;

    const filtered = medHistory.filter(med => {
      // Must match active doctor's ID or name
      if (
        med.doctorId &&
        (med.doctorId === activeDocId ||
          (activeDocId === 'DOC84920' && med.doctorId === 'doc-1') ||
          (med.doctorId === 'doc-1' && activeDocName.toLowerCase().includes('suresh')))
      ) {
        return true;
      }
      if (med.doctorName) {
        const nameLower = med.doctorName.toLowerCase();
        if (nameLower.includes(activeDocName.toLowerCase())) return true;
        if (activeDocName.toLowerCase().includes('suresh') && nameLower.includes('suresh')) return true;
      }
      return false;
    });

    // Deduplicate by medicineName + dosage so the dropdown stays clean and concise,
    // preserving the most recent prescription
    const uniqueMap = new Map<string, any>();
    filtered.forEach(med => {
      const key = `${(med.medicineName || '').trim().toLowerCase()}__${(med.dosage || '').trim().toLowerCase()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, med);
      }
    });

    return Array.from(uniqueMap.values());
  }, [medHistory, currentDoctor]);

  // Import single medicine from doctor's medical history
  const handleImportMedicine = (importedMed: any) => {
    // If the only row in current draft is empty, replace it; otherwise append a new row
    const isFirstRowEmpty =
      medicines.length === 1 &&
      (!medicines[0].medicineName || medicines[0].medicineName.trim() === '');

    const targetRowId = isFirstRowEmpty ? medicines[0].id : `row-${Date.now()}`;

    const newRowData: MedicineRow = {
      id: targetRowId,
      medicineName: importedMed.medicineName || '',
      dosage: importedMed.dosage || '',
      noOfDays: importedMed.noOfDays || 15,
      frequency: importedMed.frequency || '1-0-1',
      mealRelation: importedMed.mealRelation || 'After Food',
      instructions: importedMed.instructions || '',
    };

    if (isFirstRowEmpty) {
      setMedicines([newRowData]);
    } else {
      setMedicines(prev => [...prev, newRowData]);
    }

    setMedQuery(prev => ({
      ...prev,
      [targetRowId]: importedMed.medicineName || '',
    }));

    setIsImportDropdownOpen(false);
    showToast(`Imported ${importedMed.medicineName} (${importedMed.dosage || 'Standard dose'}) from your previous prescription.`, 'success');
  };

  // Import all medications previously prescribed by this doctor
  const handleImportAllDoctorMedicines = () => {
    if (doctorPrescribedMeds.length === 0) return;

    const isFirstRowEmpty =
      medicines.length === 1 &&
      (!medicines[0].medicineName || medicines[0].medicineName.trim() === '');

    const newRows: MedicineRow[] = doctorPrescribedMeds.map((med, idx) => ({
      id: isFirstRowEmpty && idx === 0 ? medicines[0].id : `row-${Date.now()}-${idx}`,
      medicineName: med.medicineName || '',
      dosage: med.dosage || '',
      noOfDays: med.noOfDays || 15,
      frequency: med.frequency || '1-0-1',
      mealRelation: med.mealRelation || 'After Food',
      instructions: med.instructions || '',
    }));

    if (isFirstRowEmpty) {
      setMedicines(newRows);
    } else {
      const existingNames = new Set(medicines.map(m => m.medicineName.toLowerCase().trim()));
      const toAdd = newRows.filter(nr => !existingNames.has(nr.medicineName.toLowerCase().trim()));
      if (toAdd.length === 0) {
        showToast('All your previous medications are already in this prescription.', 'info');
        setIsImportDropdownOpen(false);
        return;
      }
      setMedicines(prev => [...prev, ...toAdd]);
    }

    const updatedQuery = { ...medQuery };
    newRows.forEach(r => {
      updatedQuery[r.id] = r.medicineName;
    });
    setMedQuery(updatedQuery);

    setIsImportDropdownOpen(false);
    showToast(`Imported ${newRows.length} medication(s) prescribed by you.`, 'success');
  };

  // Diagnostics Handlers
  const addDiagnostic = (diag: PrefedDiagnostic) => {
    if (diagnostics.some(d => d.testName === diag.name)) {
      showToast(`${diag.name} already added to order list.`, 'info');
      return;
    }
    setDiagnostics(prev => [
      ...prev,
      {
        id: `diag-${Date.now()}-${Math.random()}`,
        testName: diag.name,
        testType: diag.type,
        urgency: 'ROUTINE',
        instructions: diag.instructions,
      },
    ]);
    setDiagSearch('');
    setDiagDropdownOpen(false);
  };

  const removeDiagnostic = (id: string) => {
    setDiagnostics(prev => prev.filter(d => d.id !== id));
  };

  const updateDiagnosticUrgency = (id: string, urgency: 'ROUTINE' | 'URGENT' | 'STAT') => {
    setDiagnostics(prev =>
      prev.map(d => (d.id === id ? { ...d, urgency } : d))
    );
  };

  // Submit Prescription
  const [submitting, setSubmitting] = useState(false);
  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      showToast('Please select a patient first.', 'error');
      return;
    }

    if (rxMode === 'NORMAL') {
      const invalidMed = medicines.find(m => !m.medicineName.trim());
      if (invalidMed) {
        showToast('Please fill in or select all medicine names in the table.', 'error');
        return;
      }
    }

    if (rxMode === 'SCAN_TEST' && diagnostics.length === 0) {
      showToast('Please add at least one scan or lab test in Scan/Lab Test mode.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patient_id: selectedPatient.id,
        appointment_id: selectedAppointmentId,
        prescription_type: rxMode,
        doctor_id: currentDoctor?.id || DOCTOR_PROFILE.id,
        doctor_name: currentDoctor?.name || DOCTOR_PROFILE.name,
        symptoms_notes: rxMode === 'NORMAL' ? symptomsNotes : '',
        follow_up_date: followUpDate,
        follow_up_notes: followUpNotes,
        telephony_trigger_enabled: telephonyTriggerEnabled,
        medicines: rxMode === 'NORMAL' ? medicines : [],
        diagnostics: rxMode === 'SCAN_TEST' ? diagnostics : [],
      };

      const res = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json());

      if (res.success) {
        showToast('Prescription submitted successfully with Doctor sign-off!', 'success');
        // Reset form
        setSymptomsNotes('');
        setFollowUpDate('');
        setFollowUpNotes('');
        setDiagnostics([]);
        setMedicines([
          {
            id: `row-${Date.now()}`,
            medicineName: '',
            dosage: '',
            noOfDays: 15,
            frequency: '1-0-1',
            mealRelation: 'After Food',
            instructions: '',
          },
        ]);
        setSelectedAppointmentId(null);
        setIsPrescriptionDraftActive(false);
        // Refresh data & patient history
        loadInitialData();
        if (selectedPatient?.id) {
          fetch(`/api/doctor/patients/${selectedPatient.id}/history`)
            .then(r => r.json())
            .then(histRes => {
              if (histRes.success) {
                setRxHistory(histRes.data.prescriptions || []);
                setMedHistory(histRes.data.medications || []);
              }
            })
            .catch(console.error);
        }
        // Switch to history tab to view committed record
        setRxSubTab('rxHistory');
      } else {
        showToast(res.error || 'Failed to submit prescription', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Submission error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Test Supabase Connection
  const handleTestSupabase = async () => {
    setSupabaseTesting(true);
    setSupabaseStatusMsg('');
    try {
      const res = await fetch('/api/supabase/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: supabaseUrl,
          anon_key: supabaseAnonKey,
        }),
      }).then(r => r.json());

      if (res.success) {
        setSupabaseStatusMsg(`✓ ${res.message}`);
        showToast('Supabase connected successfully!', 'success');
        setStats(prev => ({
          ...prev,
          supabase: { configured: true, project_id: supabaseProjectId },
        }));
      } else {
        setSupabaseStatusMsg(`✕ ${res.message}`);
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setSupabaseStatusMsg(`✕ Error: ${err.message}`);
    } finally {
      setSupabaseTesting(false);
    }
  };

  // Save Supabase Configuration
  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: supabaseProjectId,
          anon_key: supabaseAnonKey,
          url: supabaseUrl,
        }),
      }).then(r => r.json());

      if (res.success) {
        showToast('Supabase configuration saved!', 'success');
        handleTestSupabase();
      } else {
        showToast('Failed to save configuration', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Filtered Patients List
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesLang = patientLangFilter === 'ALL' || p.language.toUpperCase() === patientLangFilter;
      const q = patientSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.chronicConditions.some(c => c.toLowerCase().includes(q));
      return matchesLang && matchesSearch;
    });
  }, [patients, patientSearch, patientLangFilter]);

  // Symptoms Character & Word Count Limit (Max 500 characters / 100 words)
  const symptomsCharCount = symptomsNotes.length;
  const symptomsWordCount = symptomsNotes.trim() ? symptomsNotes.trim().split(/\s+/).length : 0;
  const isSymptomsNearLimit = symptomsCharCount > 450 || symptomsWordCount > 90;
  const isSymptomsOverLimit = symptomsCharCount > 500 || symptomsWordCount > 100;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF7F2] text-slate-900">
      {/* ============================================================== */}
      {/* 1. DESKTOP LEFT-DOCKED NAVIGATION SIDEBAR (HIDDEN ON MOBILE) */}
      {/* ============================================================== */}
      <aside className="hidden lg:flex w-72 bg-[#FAF7F2] border-r border-[#E8E2D5] flex-col justify-between shrink-0 select-none shadow-xs z-30">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-[#E8E2D5]/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-[#E8E2D5] p-1.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                <img
                  src="/curalink-symbol.png"
                  alt="CuraLink Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                    CuraLink
                  </h1>
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                    Doctor
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Connect • Care • Heal
                </span>
              </div>
            </div>
          </div>

          {/* Large Navigation Tabs */}
          <nav className="p-4 space-y-2">
            {/* Command Center */}
            <button
              onClick={() => setActiveTab('command')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-base transition-all ${
                activeTab === 'command'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-700 hover:bg-[#F3EFE6] hover:text-slate-950'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Activity className={`w-5 h-5 ${activeTab === 'command' ? 'text-white' : 'text-slate-500'}`} />
                <span>Command Center</span>
              </div>
              {stats.pending_appointments > 0 && (
                <span className={`text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full ${
                  activeTab === 'command' ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {stats.pending_appointments}
                </span>
              )}
            </button>

            {/* Prescription */}
            <button
              onClick={() => setActiveTab('prescription')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-base transition-all ${
                activeTab === 'prescription'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-700 hover:bg-[#F3EFE6] hover:text-slate-950'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Pill className={`w-5 h-5 ${activeTab === 'prescription' ? 'text-white' : 'text-slate-500'}`} />
                <span>Prescription Desk</span>
              </div>
              {selectedPatient && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full max-w-[100px] truncate ${
                  activeTab === 'prescription' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-800'
                }`}>
                  {selectedPatient.name.split(' ')[0]}
                </span>
              )}
            </button>

            <div className="pt-2 pb-1 border-t border-[#E8E2D5]/70"></div>

            {/* AI Telephony Architecture */}
            <button
              onClick={() => setActiveTab('architecture')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-base transition-all ${
                activeTab === 'architecture'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-700 hover:bg-[#F3EFE6] hover:text-slate-950'
              }`}
            >
              <Sparkles className={`w-5 h-5 ${activeTab === 'architecture' ? 'text-white' : 'text-blue-500'}`} />
              <span>Calling Architecture</span>
            </button>

            {/* Supabase Settings */}
            <button
              onClick={() => setActiveTab('supabase')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-base transition-all ${
                activeTab === 'supabase'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-700 hover:bg-[#F3EFE6] hover:text-slate-950'
              }`}
            >
              <Database className={`w-5 h-5 ${activeTab === 'supabase' ? 'text-white' : 'text-emerald-600'}`} />
              <span>Supabase Sync</span>
            </button>
          </nav>
        </div>

        {/* Doctor Card in Sidebar (Photo-matching Dr. Reginald Leiw layout) */}
        <div className="p-4 m-3 rounded-3xl bg-white border border-[#E8E2D5] shadow-xs">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                {currentDoctor?.name
                  ? currentDoctor.name.replace('Dr.', '').trim().slice(0, 2).toUpperCase()
                  : 'SS'}
              </div>
              <div className="overflow-hidden min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate leading-tight">
                  {currentDoctor?.name || DOCTOR_PROFILE.name}
                </div>
                <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  Consultant • Chronic Care
                </div>
                <div className="text-xs font-mono text-blue-600 font-bold truncate flex items-center gap-1 mt-0.5">
                  <span className="bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {currentDoctor?.id || 'DOC84920'}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-2xs"
              title="Doctor Profile / Switch"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-2.5 border-t border-[#E8E2D5] mt-2.5">
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${stats.supabase.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {stats.supabase.configured ? 'Supabase Active' : 'Local Mock'}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors font-bold"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MOBILE SLIDE-OUT DRAWER OVERLAY */}
      {/* ============================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 sm:w-80 bg-[#FAF7F2] shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-left duration-200 border-r border-[#E8E2D5]">
            <div>
              <div className="p-5 border-b border-[#E8E2D5] flex items-center justify-between bg-gradient-to-b from-[#C8E0FD]/60 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-[#E8E2D5] p-1.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                    <img
                      src="/curalink-symbol.png"
                      alt="CuraLink Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base font-black text-slate-900 leading-tight">
                        CuraLink
                      </h2>
                      <span className="bg-blue-100 text-blue-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                        Doctor
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Connect • Care • Heal
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-white border border-[#E8E2D5] text-slate-500 hover:text-slate-900 shadow-2xs flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="p-4 space-y-1.5">
                <button
                  onClick={() => {
                    setActiveTab('command');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    activeTab === 'command'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-[#F3EFE6]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Activity className={`w-5 h-5 ${activeTab === 'command' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Command Center</span>
                  </div>
                  {stats.pending_appointments > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      activeTab === 'command' ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {stats.pending_appointments}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('prescription');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    activeTab === 'prescription'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-[#F3EFE6]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Pill className={`w-5 h-5 ${activeTab === 'prescription' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Prescription Desk</span>
                  </div>
                  {selectedPatient && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full max-w-[90px] truncate ${
                      activeTab === 'prescription' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {selectedPatient.name.split(' ')[0]}
                    </span>
                  )}
                </button>

                <div className="pt-2 pb-1 border-t border-[#E8E2D5]" />

                <button
                  onClick={() => {
                    setActiveTab('architecture');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    activeTab === 'architecture'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-[#F3EFE6]'
                  }`}
                >
                  <Sparkles className={`w-5 h-5 ${activeTab === 'architecture' ? 'text-white' : 'text-blue-500'}`} />
                  <span>Calling Architecture</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('supabase');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    activeTab === 'supabase'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-[#F3EFE6]'
                  }`}
                >
                  <Database className={`w-5 h-5 ${activeTab === 'supabase' ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Supabase Sync</span>
                </button>
              </nav>
            </div>

            <div className="p-4 border-t border-[#E8E2D5] bg-white m-3 rounded-3xl shadow-xs">
              <div className="flex items-center justify-between mb-2.5 gap-2">
                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                    {currentDoctor?.name
                      ? currentDoctor.name.replace('Dr.', '').trim().slice(0, 2).toUpperCase()
                      : 'SS'}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate">
                      {currentDoctor?.name || DOCTOR_PROFILE.name}
                    </div>
                    <div className="text-[10px] font-mono text-blue-600 font-bold truncate">
                      {currentDoctor?.id || 'DOC84920'} • <span className="font-sans text-emerald-600">✓ Verified</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-2 border-t border-[#E8E2D5]">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${stats.supabase.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {stats.supabase.configured ? 'Supabase Active' : 'Local Mock'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="text-blue-600 hover:underline text-[11px] font-bold"
                >
                  Switch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FAF7F2]">
        {/* Mobile Top Header Bar with sky-blue gradient wash and circular buttons */}
        <header className="lg:hidden bg-gradient-to-b from-[#C8E0FD]/85 via-[#EBF3FD]/60 to-[#FAF7F2] border-b border-[#E8E2D5]/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 rounded-full bg-white border border-[#E8E2D5] text-slate-700 shadow-2xs flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              title="Open Navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-white border border-[#E8E2D5] p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                <img
                  src="/curalink-symbol.png"
                  alt="CuraLink"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-slate-900 leading-tight">
                  CuraLink
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-blue-600 -mt-0.5">
                  Doctor Portal
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E2D5] text-blue-700 text-[11px] font-bold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-mono">{currentDoctor?.id || 'DOC84920'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-10 h-10 rounded-full bg-white border border-[#E8E2D5] text-slate-700 shadow-2xs flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              title="Switch Doctor Profile"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Top Floating Toast Notification */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-300'
                : 'bg-blue-50 text-blue-800 border-blue-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 pb-24 lg:pb-8">
          {/* ========================================================== */}
          {/* VIEW: COMMAND CENTER (MATCHING REFERENCE UI) */}
          {/* ========================================================== */}
          {activeTab === 'command' && (
            <div className="space-y-6">
              {/* TOP HEADER: Clinical Station Banner (Optimized for both Desktop & Mobile) */}
              <div className="rounded-3xl bg-gradient-to-b from-[#C8E0FD]/85 via-[#EBF3FD]/55 to-white border border-[#E8E2D5] p-5 sm:p-7 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                        OPD Consultation Station
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">• Room 302 • Clinical Shift Active</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      {currentDoctor?.name || 'Dr. Suresh Sharma, MD'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Consultant in Chronic Disease Care &amp; General Medicine • Live OPD Queue Management
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
                    <button
                      type="button"
                      onClick={loadInitialData}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#E8E2D5] text-slate-700 text-xs font-bold shadow-2xs hover:bg-[#F3EFE6] transition-all active:scale-95"
                      title="Refresh Queue & Schedule"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                      <span>Refresh</span>
                    </button>

                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#E8E2D5] text-blue-700 text-xs font-bold shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-mono">{currentDoctor?.id || 'DOC84920'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition-all active:scale-95"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Switch Doctor</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* DUAL WORKSTATION GRID: Left Column = Live Queue & Tools; Right Column = Doctor & Scheduler Widget */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ======================================================== */}
                {/* MAIN COLUMN (LEFT ON DESKTOP, ORDER 2 ON MOBILE) */}
                {/* ======================================================== */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6 order-2 lg:order-1">
                  {/* Quick Metric KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Pending Appointments Card */}
                    <div
                      onClick={() => {
                        const firstPending = pendingAppointments[0];
                        if (firstPending && firstPending.patient) {
                          handleStartPrescription(firstPending.patient, firstPending.id);
                        } else {
                          setActiveTab('prescription');
                        }
                      }}
                      className="bg-white p-5 rounded-3xl border border-[#E8E2D5] hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Pending Queue
                        </span>
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Clock className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-900">
                          {pendingAppointments.length}
                        </span>
                        <span className="text-xs font-semibold text-amber-600">
                          In Line
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                        <span>Click to prescribe</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Enrolled Patients Card */}
                    <div
                      onClick={() => {
                        setActiveTab('prescription');
                        setRxSubTab('directory');
                      }}
                      className="bg-white p-5 rounded-3xl border border-[#E8E2D5] hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Enrolled Patients
                        </span>
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-900">
                          {patients.length}
                        </span>
                        <span className="text-xs font-semibold text-blue-600">
                          Active Roster
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                        <span>View directory</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Prescription Desk Card */}
                    <div
                      onClick={() => {
                        setActiveTab('prescription');
                        setRxSubTab('new');
                        setIsPrescriptionDraftActive(true);
                      }}
                      className="bg-white p-5 rounded-3xl border border-[#E8E2D5] hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Prescription Desk
                        </span>
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Pill className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-900">
                          Rx
                        </span>
                        <span className="text-xs font-semibold text-purple-600">
                          Ready
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                        <span>New order</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* Today's Live Consultation Queue (Front and Center on Laptop) */}
                  <div className="bg-white rounded-3xl border border-[#E8E2D5] shadow-xs overflow-hidden">
                    <div className="px-6 py-4.5 border-b border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between bg-[#FAF8F5] gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                          <Activity className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900">
                            Today&apos;s Live Consultation Queue
                          </h3>
                          <p className="text-xs text-slate-400 font-medium">
                            Attending outpatient consultation order • Auto-synced
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {pendingAppointments.length} Patients In Queue
                        </span>
                      </div>
                    </div>

                    {pendingAppointments.length === 0 ? (
                      <div className="p-12 text-center text-slate-500">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <p className="font-bold text-slate-800">All appointments completed for today!</p>
                        <p className="text-xs text-slate-400 mt-1">Check back later or view enrolled patients.</p>
                      </div>
                    ) : (
                      <>
                        {/* Mobile Appointments Card List (< md screens) */}
                        <div className="block md:hidden divide-y divide-[#E8E2D5]">
                          {pendingAppointments.map(apt => (
                            <div key={apt.id} className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">
                                    {apt.patient ? apt.patient.name : 'Unknown Patient'}
                                  </div>
                                  {apt.patient && (
                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                      <span className="font-mono">{apt.patient.uhid}</span>
                                      <span>•</span>
                                      <span>{apt.patient.age}y / {apt.patient.gender}</span>
                                    </div>
                                  )}
                                </div>
                                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-[#E8E2D5] shrink-0">
                                  {apt.tokenNumber}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs gap-2">
                                <span className="text-slate-700 font-medium line-clamp-1">
                                  {apt.reasonForVisit}
                                </span>
                                {apt.patient && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                    {apt.patient.language}
                                  </span>
                                )}
                              </div>

                              <div className="pt-2 flex items-center justify-between border-t border-[#E8E2D5]/70">
                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{apt.appointmentTime}</span>
                                </span>
                                {apt.patient && (
                                  <button
                                    onClick={() => handleStartPrescription(apt.patient!, apt.id)}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25 transition-all active:scale-95"
                                  >
                                    <Pill className="w-3.5 h-3.5" />
                                    <span>Prescribe</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Appointments Table (md: and up screens) */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-[#E8E2D5]">
                              <tr>
                                <th className="px-6 py-3.5">Token &amp; Time</th>
                                <th className="px-6 py-3.5">Patient Details</th>
                                <th className="px-6 py-3.5">Language</th>
                                <th className="px-6 py-3.5">Reason for Visit</th>
                                <th className="px-6 py-3.5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8E2D5]">
                              {pendingAppointments.map(apt => (
                                <tr key={apt.id} className="hover:bg-blue-50/40 transition-colors">
                                  <td className="px-6 py-4">
                                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-[#E8E2D5] mr-2">
                                      {apt.tokenNumber}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      {apt.appointmentTime}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    {apt.patient ? (
                                      <div>
                                        <div className="font-bold text-slate-900">
                                          {apt.patient.name}
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                          <span>{apt.patient.uhid}</span>
                                          <span>•</span>
                                          <span>{apt.patient.age}y / {apt.patient.gender}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400">Loading patient...</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    {apt.patient && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        {apt.patient.language}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-xs text-slate-700 font-medium">
                                      {apt.reasonForVisit}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {apt.patient && (
                                      <button
                                        onClick={() => handleStartPrescription(apt.patient!, apt.id)}
                                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25 transition-all active:scale-95"
                                      >
                                        <Pill className="w-3.5 h-3.5" />
                                        <span>Prescribe</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ======================================================== */}
                {/* COMPANION COLUMN (RIGHT ON DESKTOP, ORDER 1 ON MOBILE) */}
                {/* ======================================================== */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6 order-1 lg:order-2">
                  {/* Photo-Matching Doctor Card (Dr. Reginald Leiw Layout) */}
                  <div className="bg-white rounded-3xl border border-[#E8E2D5] p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 sm:gap-4 hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-3.5 sm:gap-4 overflow-hidden min-w-0">
                      <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-base sm:text-lg shadow-2xs shrink-0">
                        {currentDoctor?.name
                          ? currentDoctor.name.replace('Dr.', '').trim().slice(0, 2).toUpperCase()
                          : 'RL'}
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <h2 className="font-extrabold text-slate-900 text-base sm:text-lg truncate leading-tight">
                          {currentDoctor?.name || 'Dr. Reginald Leiw'}
                        </h2>
                        <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                          Consultant • Chronic Care &amp; Internal Medicine
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">
                            $120.00
                          </span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[11px] font-mono text-blue-600 font-semibold">
                            {currentDoctor?.id || 'DOC84920'}
                          </span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Verified
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 shadow-2xs"
                      title="Switch Practitioner"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Segmented Control Toggle (Matching Screen 2's "Upcoming" vs "Past" Pill Bar) */}
                  <div className="flex justify-center sm:justify-start">
                    <div className="inline-flex p-1.5 bg-[#EDE7DC] rounded-full border border-[#E8E2D5] gap-1 shadow-2xs w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setActivityTab('upcoming')}
                        className={`flex-1 sm:flex-initial px-6 py-2 rounded-full text-xs font-bold transition-all text-center ${
                          activityTab === 'upcoming'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Upcoming
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityTab('past')}
                        className={`flex-1 sm:flex-initial px-6 py-2 rounded-full text-xs font-bold transition-all text-center ${
                          activityTab === 'past'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Past
                      </button>
                    </div>
                  </div>

                  {/* UPCOMING VIEW (DATE & TIME CAROUSEL + TIME SLOTS CHIPS) */}
                  {activityTab === 'upcoming' && (
                    <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 sm:p-6 shadow-xs space-y-5">
                      {/* Month Carousel */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Date &amp; Time
                          </span>
                          <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{selectedMonth} 2026</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                          {['April', 'May', 'June', 'July', 'August', 'September'].map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setSelectedMonth(m)}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                                selectedMonth === m
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-[#FAF8F5] text-slate-600 hover:bg-slate-100 border border-[#E8E2D5]'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Day Carousel with vertical pill & dots */}
                      <div>
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                          {[
                            { day: 15, name: 'Tue', dots: ['#F59E0B'] },
                            { day: 16, name: 'Wed', dots: ['#F59E0B', '#3B82F6'] },
                            { day: 17, name: 'Thu', dots: ['#F59E0B', '#F97316', '#3B82F6', '#4338CA'] },
                            { day: 18, name: 'Fri', dots: ['#3B82F6'] },
                            { day: 19, name: 'Sat', dots: ['#10B981'] },
                            { day: 20, name: 'Sun', dots: [] },
                            { day: 21, name: 'Mon', dots: ['#F59E0B', '#3B82F6'] },
                            { day: 22, name: 'Tue', dots: ['#3B82F6'] },
                          ].map(item => {
                            const isSelected = selectedDay === item.day;
                            return (
                              <button
                                key={item.day}
                                type="button"
                                onClick={() => setSelectedDay(item.day)}
                                className={`flex flex-col items-center justify-center min-w-[56px] py-3 px-3 rounded-2xl transition-all shrink-0 ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600'
                                    : 'bg-white text-slate-700 border border-[#E8E2D5] hover:bg-blue-50/50 shadow-2xs'
                                }`}
                              >
                                <span className="text-base font-black leading-none mb-1">
                                  {item.day}
                                </span>
                                <span className={`text-[11px] font-semibold leading-none ${
                                  isSelected ? 'text-white/90' : 'text-slate-400'
                                }`}>
                                  {item.name}
                                </span>

                                {/* Tiny indicator dots below the date */}
                                <div className="flex items-center gap-1 mt-2 h-1.5">
                                  {item.dots.length > 0 ? (
                                    item.dots.map((dotColor, idx) => (
                                      <span
                                        key={idx}
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: isSelected ? '#FFFFFF' : dotColor }}
                                      />
                                    ))
                                  ) : (
                                    <span className="w-1.5 h-1.5 opacity-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Time Slots ("Select a Time" Chips Grid) */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Select a Time
                          </span>
                          <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Select a Time</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
                            '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
                            '1:00 PM', '1:30 PM'
                          ].map(slot => {
                            const isSelectedSlot = selectedTimeSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedTimeSlot(slot)}
                                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center border ${
                                  isSelectedSlot
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                                    : 'bg-blue-50/40 hover:bg-blue-100 text-blue-700 border-blue-200/80 shadow-2xs'
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Big Electric Blue Pill CTA Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const firstPending = pendingAppointments[0];
                            if (firstPending && firstPending.patient) {
                              handleStartPrescription(firstPending.patient, firstPending.id);
                            } else {
                              setActiveTab('prescription');
                            }
                          }}
                          className="w-full py-3.5 px-6 rounded-full font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all text-center flex items-center justify-center gap-2 active:scale-98"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Book an Appointment ({selectedDay} {selectedMonth} at {selectedTimeSlot})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PAST VIEW (EXACT REPLICA OF REFERENCE PHOTO SCREEN 2: "ACTIVITY") */}
                  {activityTab === 'past' && (
                    <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 shadow-xs text-center space-y-5">
                      {/* Big Squircle Portrait Container */}
                      <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[28px] bg-[#EDE6D8] border-2 border-[#E8E2D5] overflow-hidden mx-auto flex items-center justify-center shadow-inner relative">
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-t from-slate-900/10 to-transparent">
                          <div className="w-16 h-16 rounded-full bg-white/90 border border-blue-200 flex items-center justify-center text-blue-600 shadow-md">
                            <Stethoscope className="w-8 h-8" />
                          </div>
                          <span className="font-extrabold text-xs sm:text-sm text-slate-800 mt-2.5">
                            {currentDoctor?.name || 'Dr. Suresh Sharma, MD'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Attending Clinical Consultant
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                          No Past Activity
                        </h3>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                          Ready to explore DA offering? Discover our Products &amp; Services
                        </p>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActivityTab('upcoming');
                            const firstPending = pendingAppointments[0];
                            if (firstPending && firstPending.patient) {
                              handleStartPrescription(firstPending.patient, firstPending.id);
                            }
                          }}
                          className="w-full py-3.5 px-6 rounded-full font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all text-center flex items-center justify-center gap-2 active:scale-98"
                        >
                          <span>Book an Appointment</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: PRESCRIPTION WORKSPACE (3 TABS) */}
          {/* ========================================================== */}
          {activeTab === 'prescription' && (
            <div className="space-y-6">
              {/* Patient Banner with Selector */}
              <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-lg sm:text-xl shrink-0 shadow-2xs">
                      {selectedPatient ? selectedPatient.name.charAt(0) : 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                          {selectedPatient ? selectedPatient.name : 'Select a Patient'}
                        </h2>
                        {selectedPatient && (
                          <>
                            <span className="font-mono text-[11px] sm:text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-[#E8E2D5]">
                              {selectedPatient.uhid}
                            </span>
                            <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {selectedPatient.language}
                            </span>
                          </>
                        )}
                      </div>
                      {selectedPatient && (
                        <div className="mt-1 flex items-center gap-2 sm:gap-3 text-xs text-slate-500 flex-wrap">
                          <span>{selectedPatient.age}y / {selectedPatient.gender}</span>
                          <span>•</span>
                          <span>{selectedPatient.phone}</span>
                          <span>•</span>
                          <span className="text-blue-700 font-semibold truncate max-w-xs">
                            {selectedPatient.chronicConditions.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Switch Patient Quick Dropdown & Browse Directory */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setRxSubTab('directory')}
                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-2xs ${
                        rxSubTab === 'directory'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25'
                          : 'border-[#E8E2D5] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-slate-700'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Browse Directory</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500 hidden md:inline">Quick Switch:</span>
                      <select
                        value={selectedPatient?.id || ''}
                        onChange={e => {
                          const pt = patients.find(p => p.id === e.target.value);
                          if (pt) {
                            setSelectedPatient(pt);
                            setSelectedAppointmentId(null);
                          }
                        }}
                        className="text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-full sm:w-auto"
                      >
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.uhid} - {p.language})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 TABS SEGMENTED PILL CONTROL (MATCHING SCREENSHOT AESTHETIC) */}
              <div className="flex overflow-x-auto pb-1 scrollbar-none">
                <div className="inline-flex p-1.5 bg-[#EDE7DC] rounded-full border border-[#E8E2D5] gap-1 shadow-2xs">
                  {/* Tab: Patient Directory */}
                  <button
                    onClick={() => setRxSubTab('directory')}
                    className={`px-5 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      rxSubTab === 'directory'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Patient Directory</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      rxSubTab === 'directory' ? 'bg-white/20 text-white' : 'bg-[#DDD5C7] text-slate-700'
                    }`}>
                      {filteredPatients.length}
                    </span>
                  </button>

                  {/* Tab: New Prescription */}
                  <button
                    onClick={() => {
                      setRxSubTab('new');
                      setIsPrescriptionDraftActive(true);
                    }}
                    className={`px-5 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      rxSubTab === 'new'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Prescription</span>
                  </button>

                  {/* Tab: Prescription History */}
                  <button
                    onClick={() => setRxSubTab('rxHistory')}
                    className={`px-5 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      rxSubTab === 'rxHistory'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Prescription History</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      rxSubTab === 'rxHistory' ? 'bg-white/20 text-white' : 'bg-[#DDD5C7] text-slate-700'
                    }`}>
                      {rxHistory.length}
                    </span>
                  </button>

                  {/* Tab: Medication History */}
                  <button
                    onClick={() => setRxSubTab('medHistory')}
                    className={`px-5 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      rxSubTab === 'medHistory'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Medication History</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      rxSubTab === 'medHistory' ? 'bg-white/20 text-white' : 'bg-[#DDD5C7] text-slate-700'
                    }`}>
                      {medHistory.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* TAB 0: PATIENT DIRECTORY */}
              {rxSubTab === 'directory' && (
                <div className="space-y-6">
                  {/* Search & Language Filters */}
                  <div className="bg-white p-4 rounded-3xl border border-[#E8E2D5] flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between shadow-xs">
                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={patientSearch}
                        onChange={e => setPatientSearch(e.target.value)}
                        placeholder="Search by name, UHID, phone, or condition..."
                        className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full md:w-auto scrollbar-none">
                      {['ALL', 'KANNADA', 'HINDI', 'TELUGU', 'TAMIL', 'MARATHI', 'ENGLISH'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => setPatientLangFilter(lang)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                            patientLangFilter === lang
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-[#F3EFE6] border border-[#E8E2D5]'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patients Grid with photo-matching rounded-3xl white cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredPatients.map(pt => {
                      const isSelected = selectedPatient?.id === pt.id;
                      return (
                        <div
                          key={pt.id}
                          className={`bg-white rounded-3xl border p-5 space-y-4 hover:shadow-md transition-all flex flex-col justify-between shadow-xs ${
                            isSelected
                              ? 'border-blue-500 ring-2 ring-blue-500/20'
                              : 'border-[#E8E2D5] hover:border-blue-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                                  {pt.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                                      {pt.name}
                                    </h3>
                                    {isSelected && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="font-mono text-[11px] font-bold text-slate-500">
                                      {pt.uhid}
                                    </span>
                                    <span>•</span>
                                    <span className="text-xs text-slate-500">
                                      {pt.age}y / {pt.gender}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                {pt.language}
                              </span>
                            </div>

                            <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                              <div>
                                <strong className="text-slate-700">Phone:</strong> {pt.phone}
                              </div>
                              <div>
                                <strong className="text-slate-700">Conditions:</strong>{' '}
                                <span className="text-blue-700 font-semibold">
                                  {pt.chronicConditions.join(', ')}
                                </span>
                              </div>
                              {pt.guardianName && (
                                <div>
                                  <strong className="text-slate-700">Caregiver:</strong> {pt.guardianName}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400">
                              Device: {pt.deviceType}
                            </span>
                            <button
                              onClick={() => handleStartPrescription(pt)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25 transition-all active:scale-95"
                            >
                              <Pill className="w-3.5 h-3.5" />
                              <span>Select & Prescribe</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 1: NEW PRESCRIPTION */}
              {rxSubTab === 'new' && (
                !isPrescriptionDraftActive ? (
                  /* Empty state when no prescription is active */
                  <div className="bg-white rounded-3xl border border-[#E8E2D5] p-8 sm:p-12 text-center space-y-4 shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                      <Pill className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {selectedPatient ? `No Active Prescription Draft for ${selectedPatient.name}` : 'Select a Patient to Begin'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Click below to begin drafting a new prescription, enter medication dosing, order scans/tests, and set automated adherence triggers.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPrescriptionDraftActive(true)}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all active:scale-95"
                      >
                        <Plus className="w-5 h-5" />
                        <span>New Prescription</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRxSubTab('directory')}
                        className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full font-extrabold text-sm bg-[#EDE7DC] hover:bg-[#E8E2D5] text-slate-800 transition-all active:scale-95"
                      >
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>Browse Patient Directory</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Active Prescription Form */
                  <form onSubmit={handleSubmitPrescription} className="space-y-4 sm:space-y-6">
                    {/* Order Mode Switcher (2 modes: Normal Prescription & Scan / Lab Test) */}
                    <div className="bg-white p-4 rounded-3xl border border-[#E8E2D5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 max-w-3xl">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Prescription Mode:
                        </span>
                        <div className="flex-1 grid grid-cols-2 p-1 bg-[#EDE7DC] rounded-full border border-[#E8E2D5] gap-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setRxMode('NORMAL')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold transition-all ${
                              rxMode === 'NORMAL'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span className="text-lg leading-none">💊</span>
                            <span>Normal Prescription</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRxMode('SCAN_TEST')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold transition-all ${
                              rxMode === 'SCAN_TEST'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span className="text-lg leading-none">🔬</span>
                            <span>Scan / Lab Test</span>
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPrescriptionDraftActive(false)}
                        className="text-xs font-bold px-4 py-2.5 rounded-full border border-[#E8E2D5] text-slate-500 hover:bg-slate-100 transition-all whitespace-nowrap text-center justify-center flex items-center"
                      >
                        Clear / Discard Draft
                      </button>
                    </div>

                    {/* Mode 1: NORMAL PRESCRIPTION */}
                    {rxMode === 'NORMAL' && (
                      <div className="space-y-6">
                        {/* Patient Symptoms Textarea (with Word / Character Limit) */}
                        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E2D5] space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              Patient Symptoms & Clinical Notes
                            </label>
                            <div className="text-[11px] font-semibold flex items-center gap-2">
                              <span className={isSymptomsOverLimit ? 'text-red-600 font-bold' : isSymptomsNearLimit ? 'text-amber-600' : 'text-slate-400'}>
                                {symptomsCharCount}/500 chars • {symptomsWordCount}/100 words
                              </span>
                              {isSymptomsOverLimit && (
                                <span className="text-red-600 font-bold">(Exceeds DB limit)</span>
                              )}
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            value={symptomsNotes}
                            onChange={e => setSymptomsNotes(e.target.value)}
                            placeholder="Enter patient reported symptoms, duration, and observations (e.g. polyuria, morning dizziness, resting blood pressure)..."
                            className="w-full text-sm p-3.5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-900"
                          />
                        </div>

                        {/* "Medical Thing" (Medication Regimen Table - Extended Size) */}
                        <div className="bg-white rounded-3xl border border-[#E8E2D5] overflow-visible shadow-xs">
                          <div className="px-4 sm:px-7 py-3.5 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-3">
                            <div>
                              <h3 className="font-bold text-base sm:text-lg text-slate-900">
                                Medication Regimen (Tablets &amp; Dosing)
                              </h3>
                              <div className="flex items-center gap-3 sm:gap-4 mt-1 text-[11px] sm:text-xs font-bold text-slate-600 flex-wrap">
                                <span className="text-slate-400">Tablet Timing:</span>
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Morning
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Afternoon
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Night
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Import from Medical History Button & Dropdown */}
                              <div className="relative" data-import-dropdown>
                                <button
                                  type="button"
                                  onClick={() => setIsImportDropdownOpen(prev => !prev)}
                                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-all shadow-xs"
                                  title={`Import medications previously prescribed by ${DOCTOR_PROFILE.name}`}
                                >
                                  <History className="w-4 h-4 text-sky-600" />
                                  <span className="hidden xs:inline">Import from History</span>
                                  <span className="xs:hidden">Import</span>
                                  {doctorPrescribedMeds.length > 0 && (
                                    <span className="w-5 h-5 rounded-full bg-sky-200/80 text-sky-800 text-[10px] font-extrabold flex items-center justify-center">
                                      {doctorPrescribedMeds.length}
                                    </span>
                                  )}
                                  <ChevronDown className={`w-3.5 h-3.5 text-sky-600 transition-transform ${isImportDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isImportDropdownOpen && (
                                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2.5rem)] sm:w-96 max-h-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                      <div>
                                        <p className="text-xs font-bold text-slate-800">Prescribed by {DOCTOR_PROFILE.name}</p>
                                        <p className="text-[10px] text-slate-500">Only showing medications from your prior prescriptions</p>
                                      </div>
                                      {doctorPrescribedMeds.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={handleImportAllDoctorMedicines}
                                          className="text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                                        >
                                          Import All
                                        </button>
                                      )}
                                    </div>

                                    <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-100">
                                      {historyLoading ? (
                                        <div className="p-6 text-center text-xs text-slate-400">
                                          <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-600" />
                                          Loading medical history...
                                        </div>
                                      ) : doctorPrescribedMeds.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-slate-500">
                                          <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-1.5 opacity-80" />
                                          <p className="font-semibold text-slate-700">No Past Prescriptions by You</p>
                                          <p className="text-[11px] text-slate-400 mt-1">
                                            No prior medications found prescribed by {DOCTOR_PROFILE.name} for {selectedPatient ? selectedPatient.name : 'this patient'}.
                                          </p>
                                        </div>
                                      ) : (
                                        doctorPrescribedMeds.map((med, idx) => {
                                          const slots = getTimingSlots(med.frequency);
                                          return (
                                            <button
                                              key={`import-med-${idx}`}
                                              type="button"
                                              onClick={() => handleImportMedicine(med)}
                                              className="w-full text-left px-4 py-3 hover:bg-blue-50/60 transition-colors flex items-start justify-between gap-3 group"
                                            >
                                              <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 truncate">
                                                    {med.medicineName}
                                                  </span>
                                                  {med.dosage && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                                      {med.dosage}
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                                                  <span className="font-semibold text-slate-700">{med.frequency}</span>
                                                  <span>•</span>
                                                  <span>{med.mealRelation || 'After Food'}</span>
                                                  <span>•</span>
                                                  <span>{med.noOfDays || 15} days</span>
                                                  {med.prescribedDate && (
                                                    <>
                                                      <span>•</span>
                                                      <span className="text-slate-400">
                                                        {new Date(med.prescribedDate).toLocaleDateString('en-IN', {
                                                          day: 'numeric',
                                                          month: 'short',
                                                          year: 'numeric',
                                                        })}
                                                      </span>
                                                    </>
                                                  )}
                                                </div>
                                                {med.instructions && (
                                                  <p className="text-[10px] text-slate-400 italic truncate max-w-[280px]">
                                                    &ldquo;{med.instructions}&rdquo;
                                                  </p>
                                                )}
                                              </div>
                                              <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                                                <div className="flex items-center gap-1">
                                                  {slots.map(slot => (
                                                    <span
                                                      key={slot.key}
                                                      className={`w-2 h-2 rounded-full ${slot.dotClass}`}
                                                      title={slot.label}
                                                    />
                                                  ))}
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                                                  + Import
                                                </span>
                                              </div>
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={addMedicineRow}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Add Medicine</span>
                              </button>
                            </div>
                          </div>

                          {/* MOBILE VIEW: Individual Responsive Medicine Cards */}
                          <div className="block md:hidden p-3.5 space-y-4 divide-y divide-slate-100">
                            {medicines.map((row, index) => {
                              const currentSlots = getTimingSlots(row.frequency);
                              const currentQuery = medQuery[row.id] !== undefined ? medQuery[row.id] : row.medicineName;
                              const matchingMedicines = PREFED_MEDICINES.filter(m =>
                                m.name.toLowerCase().includes(currentQuery.toLowerCase())
                              );

                              return (
                                <div key={row.id} className={`${index > 0 ? 'pt-4' : ''} space-y-3`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                      Medicine #{index + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeMedicineRow(row.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Remove</span>
                                    </button>
                                  </div>

                                  {/* Mobile Autocomplete Search Input */}
                                  <div className="relative" data-med-dropdown>
                                    <input
                                      id={`med-input-mobile-${row.id}`}
                                      type="text"
                                      value={currentQuery}
                                      onChange={e => {
                                        setMedQuery(prev => ({ ...prev, [row.id]: e.target.value }));
                                        updateMedicine(row.id, 'medicineName', e.target.value);
                                        setActiveMedDropdown(row.id);
                                      }}
                                      onFocus={() => setActiveMedDropdown(row.id)}
                                      placeholder="Search medicine name (e.g. Metformin)..."
                                      className="w-full text-sm font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    {row.dosage && (
                                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dose:</span>
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                          {row.dosage}
                                        </span>
                                      </div>
                                    )}

                                    {/* Mobile Dropdown Suggestions */}
                                    {activeMedDropdown === row.id && matchingMedicines.length > 0 && (
                                      <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 z-50 divide-y divide-slate-100 ring-1 ring-black/5">
                                        {matchingMedicines.slice(0, 6).map((item, idx) => (
                                          <div
                                            key={idx}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              selectPrefedMedicine(row.id, item);
                                            }}
                                            className="p-3 hover:bg-blue-50 active:bg-blue-100 cursor-pointer text-xs flex items-center justify-between"
                                          >
                                            <div className="min-w-0 pr-2">
                                              <div className="font-bold text-slate-800 truncate">{item.name}</div>
                                              <div className="text-[11px] text-slate-500 mt-0.5">
                                                {item.dosage} • {item.defaultFreq} • {item.defaultMeal}
                                              </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-md shrink-0">
                                              Select
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Mobile Dosing Grid */}
                                  <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        Days
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="180"
                                        value={row.noOfDays}
                                        onChange={e => updateMedicine(row.id, 'noOfDays', Number(e.target.value))}
                                        className="w-full text-sm font-semibold p-2.5 rounded-xl border border-slate-200 text-center bg-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        Meal Timing
                                      </label>
                                      <select
                                        value={row.mealRelation}
                                        onChange={e => updateMedicine(row.id, 'mealRelation', e.target.value)}
                                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
                                      >
                                        <option value="After Food">After Food</option>
                                        <option value="Before Food">Before Food</option>
                                        <option value="Empty Stomach">Empty Stomach</option>
                                        <option value="With Food">With Food</option>
                                        <option value="Before Bed">Before Bed</option>
                                      </select>
                                    </div>

                                    <div className="col-span-2">
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        Frequency
                                      </label>
                                      <select
                                        value={row.frequency}
                                        onChange={e => updateMedicine(row.id, 'frequency', e.target.value)}
                                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
                                      >
                                        <option value="1-0-1">1-0-1 (Twice Daily - Morn &amp; Night)</option>
                                        <option value="1-0-0">1-0-0 (Once Daily - Morning Only)</option>
                                        <option value="0-1-0">0-1-0 (Once Daily - Afternoon Only)</option>
                                        <option value="0-0-1">0-0-1 (Once Daily - Night Only)</option>
                                        <option value="1-1-1">1-1-1 (Thrice Daily - Morn, Aft &amp; Night)</option>
                                        <option value="1-1-0">1-1-0 (Twice Daily - Morn &amp; Aft)</option>
                                        <option value="0-1-1">0-1-1 (Twice Daily - Aft &amp; Night)</option>
                                        <option value="SOS">SOS (As Needed)</option>
                                      </select>
                                      <div className="flex items-center gap-1.5 pt-1.5">
                                        {currentSlots.map(slot => (
                                          <span
                                            key={slot.key}
                                            className={`w-3 h-3 rounded-full ${slot.dotClass} shadow-xs inline-block ring-2 ring-white`}
                                            title={slot.key.toUpperCase()}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* DESKTOP VIEW: Table - Longer, Roomier Size */}
                          <div className="hidden md:block overflow-visible min-h-[160px]">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                  <th className="px-6 py-4 w-5/12 min-w-[340px]">Medicine Name (Pre-fed Autocomplete)</th>
                                  <th className="px-5 py-4 w-28">No. of Days</th>
                                  <th className="px-6 py-4 w-60">Frequency</th>
                                  <th className="px-5 py-4 w-48">Meal Relation</th>
                                  <th className="px-4 py-4 text-center w-14">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {medicines.map((row) => {
                                  const currentSlots = getTimingSlots(row.frequency);
                                  const currentQuery = medQuery[row.id] !== undefined ? medQuery[row.id] : row.medicineName;
                                  const matchingMedicines = PREFED_MEDICINES.filter(m =>
                                    m.name.toLowerCase().includes(currentQuery.toLowerCase())
                                  );

                                  return (
                                    <tr key={row.id} className={`hover:bg-slate-50/50 transition-colors ${activeMedDropdown === row.id ? 'relative z-30' : 'relative z-10'}`}>
                                      {/* Column 1: Medicine Name with Suggestions */}
                                      <td className="px-6 py-4 relative">
                                        <div className="relative" data-med-dropdown>
                                          <input
                                            id={`med-input-${row.id}`}
                                            type="text"
                                            value={currentQuery}
                                            onChange={e => {
                                              setMedQuery(prev => ({ ...prev, [row.id]: e.target.value }));
                                              updateMedicine(row.id, 'medicineName', e.target.value);
                                              setActiveMedDropdown(row.id);
                                            }}
                                            onFocus={() => setActiveMedDropdown(row.id)}
                                            placeholder="Type medicine name (e.g. Metformin)..."
                                            className="w-full text-base font-semibold p-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />

                                          {/* Dosage indicator when populated or imported */}
                                          {row.dosage && (
                                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dose:</span>
                                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                                                {row.dosage}
                                              </span>
                                              {row.instructions && (
                                                <span className="text-[11px] text-slate-400 italic truncate max-w-xs">
                                                  ({row.instructions})
                                                </span>
                                              )}
                                            </div>
                                          )}

                                          {/* Suggestions Dropdown - Floating freely outside the table & card */}
                                          {activeMedDropdown === row.id && matchingMedicines.length > 0 && (
                                            <div
                                              className="absolute left-0 top-full mt-2 w-full min-w-[420px] max-h-72 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 divide-y divide-slate-100 ring-1 ring-black/5"
                                              style={{ minWidth: '420px' }}
                                            >
                                               <div className="px-4 py-2.5 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between border-b border-slate-100">
                                                <span>Pre-fed Medicine Database ({matchingMedicines.length})</span>
                                                <span className="text-[10px] text-blue-600 font-semibold">Click to select dosing &amp; meal timing</span>
                                              </div>
                                              {matchingMedicines.slice(0, 8).map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    selectPrefedMedicine(row.id, item);
                                                  }}
                                                  className="p-3.5 hover:bg-blue-50/80 cursor-pointer text-xs flex items-center justify-between transition-colors"
                                                >
                                                  <div>
                                                    <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                      <span>{item.name}</span>
                                                      <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                                                        {item.category}
                                                      </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 font-medium">
                                                      <span>{item.dosage}</span>
                                                      <span>•</span>
                                                      <span>{item.defaultFreq}</span>
                                                      <span>•</span>
                                                      <span>{item.defaultMeal}</span>
                                                    </div>
                                                  </div>
                                                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 hover:bg-blue-200 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">
                                                    Select
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </td>

                                      {/* Column 2: Number of Days */}
                                      <td className="px-5 py-4">
                                        <input
                                          type="number"
                                          min="1"
                                          max="180"
                                          value={row.noOfDays}
                                          onChange={e => updateMedicine(row.id, 'noOfDays', Number(e.target.value))}
                                          className="w-24 text-base font-semibold p-3.5 rounded-xl border border-slate-200 text-center bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </td>

                                      {/* Column 3: Frequency & Coloured Dots Only (No colour text) */}
                                      <td className="px-6 py-4">
                                        <div className="space-y-2">
                                          <select
                                            value={row.frequency}
                                            onChange={e => updateMedicine(row.id, 'frequency', e.target.value)}
                                            className="w-full text-sm font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          >
                                            <option value="1-0-1">1-0-1 (Twice Daily - Morn &amp; Night)</option>
                                            <option value="1-0-0">1-0-0 (Once Daily - Morning Only)</option>
                                            <option value="0-1-0">0-1-0 (Once Daily - Afternoon Only)</option>
                                            <option value="0-0-1">0-0-1 (Once Daily - Night Only)</option>
                                            <option value="1-1-1">1-1-1 (Thrice Daily - Morn, Aft &amp; Night)</option>
                                            <option value="1-1-0">1-1-0 (Twice Daily - Morn &amp; Aft)</option>
                                            <option value="0-1-1">0-1-1 (Twice Daily - Aft &amp; Night)</option>
                                            <option value="SOS">SOS (As Needed)</option>
                                          </select>

                                          {/* Coloured dots only without colour text */}
                                          <div className="flex items-center gap-2 pt-0.5">
                                            {currentSlots.length === 0 ? (
                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                SOS
                                              </span>
                                            ) : (
                                              currentSlots.map(slot => (
                                                <span
                                                  key={slot.key}
                                                  className={`w-3.5 h-3.5 rounded-full ${slot.dotClass} shadow-xs inline-block ring-2 ring-white`}
                                                  title={slot.key.toUpperCase()}
                                                />
                                              ))
                                            )}
                                          </div>
                                        </div>
                                      </td>

                                      {/* Column 4: Meal Relation Dropdown */}
                                      <td className="px-5 py-4">
                                        <select
                                          value={row.mealRelation}
                                          onChange={e => updateMedicine(row.id, 'mealRelation', e.target.value)}
                                          className="w-full text-sm font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                          <option value="After Food">After Food</option>
                                          <option value="Before Food">Before Food</option>
                                          <option value="Empty Stomach">Empty Stomach</option>
                                          <option value="With Food">With Food</option>
                                          <option value="Before Bed">Before Bed</option>
                                        </select>
                                      </td>

                                      {/* Column 5: Action */}
                                      <td className="px-4 py-4 text-center">
                                        <button
                                          type="button"
                                          onClick={() => removeMedicineRow(row.id)}
                                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Remove medicine"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mode 2: SCAN / LAB TEST (No Primary Diagnosis, No Symptoms) */}
                    {rxMode === 'SCAN_TEST' && (
                      <div className="space-y-6">
                        {/* Notice Banner */}
                        <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3 shadow-2xs">
                          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm">Diagnostic Investigation Workflow</div>
                            <p className="mt-0.5 text-blue-800">
                              Submitting this order sets a specialized AI telephony trigger that instructs the calling agent to phone the patient and dispatch an SMS to get the scan done, plus an automated reminder to bring the physical scan report to their appointment.
                            </p>
                          </div>
                        </div>

                        {/* Diagnostic Investigation Selector with 30+ Pre-fed Tests */}
                        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E2D5] space-y-4 shadow-xs">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              Search & Add Diagnostic Scan or Lab Test
                            </label>
                            <span className="text-xs text-slate-400">
                              30+ Pre-fed investigations available
                            </span>
                          </div>

                          {/* Searchable input with dropdown - closes when typing region is not active */}
                          <div className="relative" ref={diagSearchContainerRef}>
                            <div className="relative">
                              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                              <input
                                type="text"
                                value={diagSearch}
                                onChange={e => {
                                  setDiagSearch(e.target.value);
                                  setDiagDropdownOpen(true);
                                }}
                                onFocus={() => setDiagDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setDiagDropdownOpen(false), 200)}
                                onKeyDown={e => {
                                  if (e.key === 'Escape') setDiagDropdownOpen(false);
                                }}
                                placeholder="Type to search diagnostic test (e.g. Chest X-Ray, 2D ECHO, HbA1c, CBC, MRI)..."
                                className="w-full text-sm font-semibold pl-10 pr-4 py-2.5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 transition-all"
                              />
                            </div>

                            {/* Dropdown with results - closes immediately when not active */}
                            {diagDropdownOpen && (
                              <div className="absolute left-0 top-full mt-1.5 w-full max-h-72 overflow-y-auto bg-white rounded-2xl shadow-xl border border-[#E8E2D5] z-50 divide-y divide-slate-100">
                                {PREFED_DIAGNOSTICS.filter(d =>
                                  !diagSearch ||
                                  d.name.toLowerCase().includes(diagSearch.toLowerCase()) ||
                                  d.category.toLowerCase().includes(diagSearch.toLowerCase())
                                ).map((item, idx) => (
                                  <div
                                    key={idx}
                                    onMouseDown={() => addDiagnostic(item)}
                                    className="p-3 hover:bg-blue-50/70 cursor-pointer text-xs flex items-center justify-between transition-colors"
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800">{item.name}</span>
                                        <span
                                          className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                            item.type === 'SCAN'
                                              ? 'bg-purple-100 text-purple-700'
                                              : 'bg-emerald-100 text-emerald-700'
                                          }`}
                                        >
                                          {item.type}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-0.5">
                                        {item.category} • {item.instructions}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Ordered Diagnostics Table */}
                          {diagnostics.length > 0 ? (
                            <div className="rounded-xl border border-slate-200 overflow-x-auto mt-4">
                              <table className="w-full text-left text-xs min-w-[520px]">
                                <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                  <tr>
                                    <th className="px-4 py-3">Investigation</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Urgency</th>
                                    <th className="px-4 py-3">Clinical Instructions</th>
                                    <th className="px-3 py-3 text-center">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {diagnostics.map(diag => (
                                    <tr key={diag.id} className="hover:bg-slate-50/50">
                                      <td className="px-4 py-3 font-bold text-slate-900">
                                        {diag.testName}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                            diag.testType === 'SCAN'
                                              ? 'bg-purple-100 text-purple-800'
                                              : 'bg-emerald-100 text-emerald-800'
                                          }`}
                                        >
                                          {diag.testType}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <select
                                          value={diag.urgency}
                                          onChange={e => updateDiagnosticUrgency(diag.id, e.target.value as any)}
                                          className="font-semibold p-1.5 rounded-lg border border-slate-200 bg-white"
                                        >
                                          <option value="ROUTINE">Routine</option>
                                          <option value="URGENT">Urgent</option>
                                          <option value="STAT">Stat / Immediate</option>
                                        </select>
                                      </td>
                                      <td className="px-4 py-3 text-slate-600">
                                        {diag.instructions}
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => removeDiagnostic(diag.id)}
                                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                              No investigations selected yet. Type in the box above to add scans or lab tests.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Doctor Follow-Up Option */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E8E2D5] space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>Add Follow-Up Scheduling for Doctor</span>
                        </label>
                        <span className="text-xs text-slate-400">Optional</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            Follow-up Date
                          </label>
                          <input
                            type="date"
                            value={followUpDate}
                            onChange={e => setFollowUpDate(e.target.value)}
                            className="w-full text-xs font-semibold p-3 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            Doctor Follow-up Notes / Targets
                          </label>
                          <input
                            type="text"
                            value={followUpNotes}
                            onChange={e => setFollowUpNotes(e.target.value)}
                            placeholder="e.g. Review HbA1c and Serum Creatinine lab reports; check BP response..."
                            className="w-full text-xs font-semibold p-3 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* AI Telephony Calling & SMS Trigger Switch */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E8E2D5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">
                            Activate AI Voice Call &amp; SMS Agent on Submit
                          </div>
                          <div className="text-xs text-slate-500">
                            Generates trigger in Supabase. AI agent places voice call in {selectedPatient?.language || 'vernacular'} &amp; dispatches SMS summary.
                          </div>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={telephonyTriggerEnabled}
                          onChange={e => setTelephonyTriggerEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Submission & Doctor Sign-Off Banner with bold electric blue pill button */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-3xl border border-[#E8E2D5] shadow-xs">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center shrink-0 shadow-2xs">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Attending Physician Sign-Off
                          </div>
                          <div className="text-base font-extrabold text-slate-900 mt-0.5">
                            {currentDoctor?.name || DOCTOR_PROFILE.name}
                          </div>
                          <div className="text-xs text-slate-400 font-medium">
                            {DOCTOR_PROFILE.department} • <span className="font-mono text-blue-600 font-bold">{currentDoctor?.id || DOCTOR_PROFILE.id}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || isSymptomsOverLimit}
                        className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-8 py-4 rounded-full font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Signing &amp; Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Save &amp; Finalize Prescription</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )
              )}

              {/* TAB 2: PRESCRIPTION HISTORY (READ-ONLY) */}
              {rxSubTab === 'rxHistory' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900">
                      Prescription History for {selectedPatient?.name}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">Read-Only Clinical Archive</span>
                  </div>

                  {historyLoading ? (
                    <div className="p-12 text-center text-slate-400">Loading prescription archive...</div>
                  ) : rxHistory.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-[#E8E2D5]">
                      No past prescriptions found for this patient.
                    </div>
                  ) : (
                    rxHistory.map((rx: any) => (
                      <div key={rx.id} className="bg-white rounded-3xl border border-[#E8E2D5] p-6 space-y-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-[#E8E2D5]/70 pb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-[#E8E2D5]">
                              {rx.id}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                rx.prescriptionType === 'SCAN_TEST'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {rx.prescriptionType === 'SCAN_TEST' ? '🔬 Scan / Lab Test' : '💊 Normal Prescription'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-semibold flex items-center gap-3">
                            <span>Doctor: <strong className="text-slate-800">{rx.doctorName || DOCTOR_PROFILE.name}</strong></span>
                            <span>•</span>
                            <span>Date: {new Date(rx.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {rx.symptomsNotes && (
                          <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                            <strong className="text-slate-900 block mb-1">Symptoms Recorded:</strong>
                            {rx.symptomsNotes}
                          </div>
                        )}

                        {/* Medicines Table with Color Badges */}
                        {rx.medicines && rx.medicines.length > 0 && (
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-2.5">Medicine</th>
                                  <th className="px-4 py-2.5">Days</th>
                                  <th className="px-4 py-2.5">Frequency & Timing</th>
                                  <th className="px-4 py-2.5">Meal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {rx.medicines.map((m: any) => {
                                  const slots = getTimingSlots(m.frequency);
                                  return (
                                    <tr key={m.id}>
                                      <td className="px-4 py-2.5 font-bold text-slate-900">
                                        {m.medicineName} {m.dosage}
                                      </td>
                                      <td className="px-4 py-2.5 font-semibold text-slate-700">
                                        {m.noOfDays} days
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {slots.length === 0 ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">SOS</span>
                                          ) : (
                                            slots.map(s => (
                                              <span
                                                key={s.key}
                                                className={`w-3.5 h-3.5 rounded-full ${s.dotClass} shadow-xs inline-block ring-2 ring-white`}
                                                title={s.key.toUpperCase()}
                                              />
                                            ))
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2.5 text-slate-600">
                                        {m.mealRelation}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Diagnostics Ordered */}
                        {rx.diagnostics && rx.diagnostics.length > 0 && (
                          <div className="border border-purple-200 bg-purple-50/30 rounded-xl p-3 text-xs space-y-2">
                            <strong className="text-purple-900 block font-bold">Ordered Investigations:</strong>
                            <div className="flex flex-wrap gap-2">
                              {rx.diagnostics.map((d: any) => (
                                <span
                                  key={d.id}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-900 font-bold"
                                >
                                  {d.testName} ({d.urgency || 'ROUTINE'})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Follow up & Telephony Status */}
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
                          <div>
                            {rx.followUpDate && (
                              <span>Follow-up: <strong>{rx.followUpDate}</strong> ({rx.followUpNotes})</span>
                            )}
                          </div>
                          <div>
                            {rx.telephonyTriggerEnabled && (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>AI Voice Call & SMS Dispatched</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: MEDICATION HISTORY (READ-ONLY) */}
              {rxSubTab === 'medHistory' && (
                <div className="bg-white rounded-3xl border border-[#E8E2D5] shadow-xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-base text-slate-900">
                      Chronological Medication History for {selectedPatient?.name}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">Read-Only</span>
                  </div>

                  {medHistory.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      No medication records found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-5 py-3.5">Medicine Name & Dosage</th>
                            <th className="px-5 py-3.5">Frequency & Timing</th>
                            <th className="px-4 py-3.5">Duration</th>
                            <th className="px-4 py-3.5">Meal Instruction</th>
                            <th className="px-4 py-3.5">Prescribed Date</th>
                            <th className="px-5 py-3.5">Doctor</th>
                            <th className="px-4 py-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {medHistory.map((med: any, idx: number) => {
                            const slots = getTimingSlots(med.frequency);
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3.5 font-bold text-slate-900">
                                  {med.medicineName} {med.dosage}
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {slots.length === 0 ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">SOS</span>
                                    ) : (
                                      slots.map(s => (
                                        <span
                                          key={s.key}
                                          className={`w-3.5 h-3.5 rounded-full ${s.dotClass} shadow-xs inline-block ring-2 ring-white`}
                                          title={s.key.toUpperCase()}
                                        />
                                      ))
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 font-semibold text-slate-700">
                                  {med.noOfDays} days
                                </td>
                                <td className="px-4 py-3.5 text-slate-600">
                                  {med.mealRelation}
                                </td>
                                <td className="px-4 py-3.5 text-slate-500">
                                  {new Date(med.prescribedDate).toLocaleDateString()}
                                </td>
                                <td className="px-5 py-3.5 font-semibold text-slate-800">
                                  {med.doctorName || DOCTOR_PROFILE.name}
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {med.dispenseStatus || 'ACTIVE'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: AI TELEPHONY ARCHITECTURE (FRIEND'S SPECIFICATION) */}
          {/* ========================================================== */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              {/* Headline with NO tagline */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  AI Telephony Architecture
                </h2>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`
AI CALLING AGENT & SMS TRIGGER ARCHITECTURE SPECIFICATION
1. Doctor submits prescription in Doctor Portal (Next.js).
2. Data saved to Supabase table: 'telephony_triggers'.
3. Calling Agent worker subscribes to Postgres Realtime / polls queued records.
4. Telephony agent places outbound voice call in patient's preferred language.
5. Automated SMS summary sent simultaneously.
                    `);
                    showToast('Architecture summary copied to clipboard!', 'success');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Summary for Friend</span>
                </button>
              </div>

              {/* Architecture Blueprint Card */}
              <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 space-y-6 shadow-xs text-sm">
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-slate-900">
                    System Architecture &amp; Trigger Pipeline
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    This document describes how the AI Calling Agent integrates with the Doctor Portal via Supabase triggers. When the doctor clicks <strong>Save &amp; Finalize Prescription</strong>, the portal registers an actionable payload in Supabase that your calling agent consumes to trigger a voice phone call and dispatch an SMS.
                  </p>
                </div>

                {/* 3 Steps Pipeline */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      Step 1: Doctor Portal
                    </span>
                    <div className="font-bold text-slate-900 text-sm">Medication &amp; Scan Order</div>
                    <p className="text-xs text-slate-600">
                      Doctor enters medicines (tablets, days, frequency with red/green/blue timing codes, meal instruction) or diagnostic tests (CT, ECG, CBC).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                      Step 2: Supabase Trigger
                    </span>
                    <div className="font-bold text-slate-900 text-sm">PostgreSQL Row Insert</div>
                    <p className="text-xs text-slate-600">
                      Record inserted into <code className="font-mono text-indigo-800">telephony_triggers</code> with status <code className="font-mono text-indigo-800">&quot;QUEUED&quot;</code> and structured JSON payload.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                      Step 3: AI Calling Agent
                    </span>
                    <div className="font-bold text-slate-900 text-sm">Voice Call + Normal SMS</div>
                    <p className="text-xs text-slate-600">
                      Worker initiates Twilio/Exotel outbound call in patient&apos;s language, speaks dosing schedule, and sends normal SMS summary.
                    </p>
                  </div>
                </div>

                {/* JSON Trigger Schema */}
                <div className="space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    JSON Schema for Calling Agent Worker
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto">
{`{
  "trigger_id": "trig-rx-1728892019-123",
  "prescription_id": "rx-1728892019-123",
  "patient_id": "pt-ramesh-001",
  "patient_phone": "+91 98801 12345",
  "preferred_language": "KANNADA",
  "trigger_type": "MEDICATION_ADHERENCE",
  "doctor_name": "Dr. Suresh Sharma, MD",
  "payload": {
    "medicines": [
      {
        "name": "Metformin Hydrochloride 500mg",
        "days": 30,
        "frequency": "1-0-1",
        "meal": "After Food",
        "timing_colors": ["Red (Morning)", "Blue (Night)"]
      }
    ],
    "diagnostics": [
      {
        "name": "HbA1c (Glycated Hemoglobin)",
        "urgency": "ROUTINE",
        "special_instruction": "Take scan report to next doctor appointment"
      }
    ],
    "follow_up_date": "2026-11-12"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: SUPABASE SETTINGS */}
          {/* ========================================================== */}
          {activeTab === 'supabase' && (
            <div className="space-y-6">
              {/* Headline with NO tagline */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Supabase Synchronization
                </h2>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    stats.supabase.configured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {stats.supabase.configured ? 'Connected' : 'Offline / Local Ready'}
                </span>
              </div>

              {/* Settings & Tables Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Configuration Form */}
                <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 sm:p-6 space-y-6 shadow-xs">
                  <div className="border-b border-[#E8E2D5]/70 pb-3">
                    <h3 className="font-bold text-base text-slate-900">Supabase API Connection</h3>
                    <p className="text-xs text-slate-500">Provide your Supabase URL &amp; Public Anon Key for live cloud sync</p>
                  </div>
                  <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Supabase Project ID
                      </label>
                      <input
                        type="text"
                        value={supabaseProjectId}
                        onChange={e => {
                          setSupabaseProjectId(e.target.value);
                          if (e.target.value && !supabaseUrl) {
                            setSupabaseUrl(`https://${e.target.value}.supabase.co`);
                          }
                        }}
                        placeholder="e.g. xyzabcopqrs"
                        className="w-full text-sm font-semibold p-3.5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 transition-all"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Auto-constructs https://&lt;project_id&gt;.supabase.co
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Supabase Project URL
                      </label>
                      <input
                        type="text"
                        value={supabaseUrl}
                        onChange={e => setSupabaseUrl(e.target.value)}
                        placeholder="https://xyzabcopqrs.supabase.co"
                        className="w-full text-sm font-semibold p-3.5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Supabase Anon / Public Key
                      </label>
                      <input
                        type="password"
                        value={supabaseAnonKey}
                        onChange={e => setSupabaseAnonKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full text-sm font-mono p-3.5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 transition-all"
                      />
                    </div>

                    {supabaseStatusMsg && (
                      <div
                        className={`p-3.5 rounded-2xl text-xs font-semibold ${
                          supabaseStatusMsg.startsWith('✓')
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {supabaseStatusMsg}
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-full font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all active:scale-95"
                      >
                        Save Configuration
                      </button>
                      <button
                        type="button"
                        onClick={handleTestSupabase}
                        disabled={supabaseTesting}
                        className="px-5 py-3 rounded-full font-bold text-xs border border-[#E8E2D5] text-slate-700 hover:bg-[#F3EFE6] transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        {supabaseTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>Test Connection</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Column 2: Managed Cloud Tables & SQL Migration Card */}
                <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 sm:p-6 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]/70">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">PostgreSQL Cloud Tables</h3>
                        <p className="text-xs text-slate-500">All data retrieval and updation syncs across these 10 tables</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        10 Tables Active
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-800">doctors</span>
                          <p className="text-[10px] text-slate-500">Doctor accounts, DOCxxxxx IDs, 6-digit PINs, credentials</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                          Auth &amp; Profile
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-800">patients</span>
                          <p className="text-[10px] text-slate-500">Demographics, UHID, chronic conditions, phone, literacy</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                          Directory
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-800">appointments</span>
                          <p className="text-[10px] text-slate-500">Daily OPD queue, tokens, visit reasons, booking channels</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                          OPD Queue
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-800">prescriptions</span>
                          <p className="text-[10px] text-slate-500">Doctor sign-offs, clinical notes, follow-ups (SQL immutable)</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                          Clinical Orders
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-800">prescription_medicines</span>
                          <p className="text-[10px] text-slate-500">Medication regimen, dosage, frequency, meal relation, days</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                          Dosing &amp; Regimen
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-800">prescription_diagnostics</span>
                          <p className="text-[10px] text-slate-500">Scans, radiology, ECG, ECHO, and laboratory orders</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                          Investigations
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-800">telephony_triggers</span>
                          <p className="text-[10px] text-slate-500">Outbound adherence AI voice calls and SMS reminders</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                          AI Telephony
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-800">escalations</span>
                          <p className="text-[10px] text-slate-500">Field triage alerts escalated from ASHA care coordinators</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                          Field Triage
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-800">care_team_users</span>
                          <p className="text-[10px] text-slate-500">CRT ID fieldworker credentials &amp; frontline logins</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                          Care Team Auth
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8E2D5]/70 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">
                      doctor/supabase/schema.sql
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        fetch('/api/supabase/schema')
                          .then(r => r.text())
                          .then(sql => {
                            navigator.clipboard.writeText(sql);
                            showToast('Supabase schema.sql copied to clipboard!', 'success');
                          })
                          .catch(() => {
                            showToast('SQL schema ready in doctor/supabase/schema.sql', 'info');
                          });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL Schema</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============================================================== */}
      {/* FLOATING MOBILE BOTTOM NAVIGATION DOCK (PHOTO MATCHING) */}
      {/* ============================================================== */}
      <nav className="lg:hidden fixed bottom-4 inset-x-0 z-40 px-3 pointer-events-none flex justify-center">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl border border-[#E8E2D5] rounded-full p-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex items-center justify-around pointer-events-auto">
          {/* Command */}
          <button
            type="button"
            onClick={() => setActiveTab('command')}
            className={`transition-all ${
              activeTab === 'command'
                ? 'bg-blue-600 text-white rounded-full px-4 py-2 flex items-center gap-1.5 font-bold shadow-md shadow-blue-500/30 text-xs sm:text-sm'
                : 'w-10 h-10 rounded-full text-slate-500 hover:text-slate-900 hover:bg-[#F6F2EA] flex items-center justify-center'
            }`}
            title="Command Center"
          >
            <Activity className="w-4.5 h-4.5 shrink-0" />
            {activeTab === 'command' && <span>Command</span>}
          </button>

          {/* Prescription */}
          <button
            type="button"
            onClick={() => setActiveTab('prescription')}
            className={`transition-all ${
              activeTab === 'prescription'
                ? 'bg-blue-600 text-white rounded-full px-4 py-2 flex items-center gap-1.5 font-bold shadow-md shadow-blue-500/30 text-xs sm:text-sm'
                : 'w-10 h-10 rounded-full text-slate-500 hover:text-slate-900 hover:bg-[#F6F2EA] flex items-center justify-center'
            }`}
            title="Prescription Desk"
          >
            <Pill className="w-4.5 h-4.5 shrink-0" />
            {activeTab === 'prescription' && <span>Rx Desk</span>}
          </button>

          {/* Architecture */}
          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`transition-all ${
              activeTab === 'architecture'
                ? 'bg-blue-600 text-white rounded-full px-4 py-2 flex items-center gap-1.5 font-bold shadow-md shadow-blue-500/30 text-xs sm:text-sm'
                : 'w-10 h-10 rounded-full text-slate-500 hover:text-slate-900 hover:bg-[#F6F2EA] flex items-center justify-center'
            }`}
            title="AI Telephony Architecture"
          >
            <Sparkles className="w-4.5 h-4.5 shrink-0" />
            {activeTab === 'architecture' && <span>Calling</span>}
          </button>

          {/* Supabase */}
          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`transition-all ${
              activeTab === 'supabase'
                ? 'bg-blue-600 text-white rounded-full px-4 py-2 flex items-center gap-1.5 font-bold shadow-md shadow-blue-500/30 text-xs sm:text-sm'
                : 'w-10 h-10 rounded-full text-slate-500 hover:text-slate-900 hover:bg-[#F6F2EA] flex items-center justify-center'
            }`}
            title="Supabase Sync"
          >
            <Database className="w-4.5 h-4.5 shrink-0" />
            {activeTab === 'supabase' && <span>Sync</span>}
          </button>
        </div>
      </nav>

      {/* Professional Doctor Authentication Window */}
      <DoctorAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentDoctor={currentDoctor}
        canDismiss={Boolean(currentDoctor)}
      />
    </div>
  );
}
