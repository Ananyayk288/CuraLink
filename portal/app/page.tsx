'use client';

import React, { useState } from 'react';
import {
  Stethoscope,
  HeartPulse,
  Pill,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ExternalLink,
  Sparkles,
  KeyRound,
  UserCheck,
  Activity,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

type RoleType = 'doctor' | 'careteam' | 'pharmacy';

interface PortalRoleConfig {
  id: RoleType;
  title: string;
  subtitle: string;
  badge: string;
  port: number;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  borderColor: string;
  demoId: string;
  demoPin: string;
  demoName: string;
  inputPlaceholder: string;
  pinPlaceholder: string;
}

const DOCTOR_URL = process.env.NEXT_PUBLIC_DOCTOR_URL || 'http://localhost:3001';
const CARETEAM_URL = process.env.NEXT_PUBLIC_CARETEAM_URL || 'http://localhost:3002';
const PHARMACY_URL = (process.env.NEXT_PUBLIC_PHARMACY_URL || 'http://localhost:3003') + '/pharmacy/dashboard';

const PORTALS: Record<RoleType, PortalRoleConfig> = {
  doctor: {
    id: 'doctor',
    title: 'Doctor Portal',
    subtitle: 'Clinical Consultation & Prescription Desk',
    badge: 'Clinical Specialist',
    port: 3001,
    url: `${DOCTOR_URL}?doctorId=DOC84920&doctorName=Dr.+Suresh+Sharma%2C+MD&department=Internal+Medicine+%26+Chronic+Care&role=doctor`,
    icon: Stethoscope,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    demoId: 'DOC84920',
    demoPin: '123456',
    demoName: 'Dr. Suresh Sharma, MD',
    inputPlaceholder: 'e.g. DOC84920 or dr.suresh@curalink.health',
    pinPlaceholder: 'Enter 6-digit Doctor PIN (e.g. 123456)',
  },
  careteam: {
    id: 'careteam',
    title: 'Care Team Portal',
    subtitle: 'Fieldworker Triage & Patient Onboarding',
    badge: 'Frontline ASHA Worker',
    port: 3002,
    url: `${CARETEAM_URL}?crtId=CRT10001&name=Meenakshi+Gowda&role=careteam`,
    icon: Users,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    demoId: 'CRT10001',
    demoPin: '123456',
    demoName: 'Meenakshi Gowda (Lead ASHA)',
    inputPlaceholder: 'e.g. CRT10001 or 9845100001',
    pinPlaceholder: 'Enter 6-digit Care Team PIN (e.g. 123456)',
  },
  pharmacy: {
    id: 'pharmacy',
    title: 'Pharmacy Portal',
    subtitle: 'Visual Sticker & Dispensing Counter',
    badge: 'Licensed Pharmacist',
    port: 3003,
    url: `${PHARMACY_URL}?name=Rajiv+Sharma&role=pharmacy`,
    icon: Pill,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    demoId: 'rajiv.pharmacy@curalink.health',
    demoPin: 'pharmacy123',
    demoName: 'Pharmacist Rajiv',
    inputPlaceholder: 'e.g. rajiv.pharmacy@curalink.health',
    pinPlaceholder: 'Enter password or PIN (e.g. pharmacy123)',
  },
};

export default function UnifiedGateway() {
  const [selectedRole, setSelectedRole] = useState<RoleType>('doctor');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regDepartment, setRegDepartment] = useState('General Medicine & Chronic Care');
  const [regLicense, setRegLicense] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [showRegPin, setShowRegPin] = useState(false);

  // Success Modal State
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);

  const activePortal = PORTALS[selectedRole];

  // Quick 1-Click Demo Login
  const handleQuickDemoLogin = (role: RoleType) => {
    const config = PORTALS[role];
    setSelectedRole(role);
    setAuthMode('login');
    setIdentifier(config.demoId);
    setPin(config.demoPin);
    setErrorMsg(null);
  };

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!identifier.trim()) {
      setErrorMsg(`Please enter your ${selectedRole.toUpperCase()} identifier or email.`);
      return;
    }
    const enteredPin = pin.trim() || activePortal.demoPin || '123456';

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          identifier: identifier.trim(),
          pinOrPassword: enteredPin,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials or user not found.');
      }

      setSuccessMsg(`Welcome, ${data.user?.name || data.user?.fullName || 'User'}! Redirecting to ${activePortal.title}...`);

      // Store in localStorage for cross-port session persistence
      if (selectedRole === 'doctor') {
        localStorage.setItem('curalink_doctor_user', JSON.stringify(data.user));
      } else if (selectedRole === 'careteam') {
        localStorage.setItem('curalink_careteam_user', JSON.stringify(data.user));
      } else if (selectedRole === 'pharmacy') {
        localStorage.setItem('curalink_pharmacy_user', JSON.stringify(data.user));
      }

      // Smooth redirection to respective portal
      setTimeout(() => {
        window.location.href = data.redirectUrl || activePortal.url;
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setErrorMsg('Please fill in Name, Email, and Phone number.');
      return;
    }

    if (!regPin.trim() || (selectedRole !== 'pharmacy' && regPin.trim().length !== 6)) {
      setErrorMsg('A valid 6-digit PIN is required.');
      return;
    }

    if (regPin.trim() !== regConfirmPin.trim()) {
      setErrorMsg('PIN confirmation does not match.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        role: selectedRole,
        name: regName.trim(),
        fullName: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        age: regAge ? Number(regAge) : 30,
        department: regDepartment,
        license: regLicense,
        facilityId: 'fac-city-general',
        pin: regPin.trim(),
        password: regPin.trim(),
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      setRegisteredUser(data.user);
      setSuccessMsg(data.message || 'Registration successful!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchRegisteredPortal = () => {
    let launchUrl = activePortal.url;
    if (selectedRole === 'doctor') {
      localStorage.setItem('curalink_doctor_user', JSON.stringify(registeredUser));
      const qs = new URLSearchParams({
        doctorId: registeredUser?.id || 'DOC84920',
        doctorName: registeredUser?.name || 'Dr. Suresh Sharma, MD',
        department: registeredUser?.department || 'Internal Medicine & Chronic Care',
        role: 'doctor',
      }).toString();
      launchUrl = `${activePortal.url}?${qs}`;
    } else if (selectedRole === 'careteam') {
      localStorage.setItem('curalink_careteam_user', JSON.stringify(registeredUser));
      const qs = new URLSearchParams({
        crtId: registeredUser?.crt_id || registeredUser?.crtId || registeredUser?.id || 'CRT10001',
        name: registeredUser?.name || 'Lead ASHA Coordinator',
        email: registeredUser?.email || '',
        phone: registeredUser?.phone || '',
        role: 'careteam',
      }).toString();
      launchUrl = `${activePortal.url}?${qs}`;
    } else if (selectedRole === 'pharmacy') {
      localStorage.setItem('curalink_pharmacy_user', JSON.stringify(registeredUser));
      const qs = new URLSearchParams({
        name: registeredUser?.full_name || registeredUser?.name || 'Rajiv Sharma',
        role: 'pharmacy',
      }).toString();
      launchUrl = `${activePortal.url}?${qs}`;
    }
    window.location.href = launchUrl;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* TOP NAVBAR */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">CuraLink</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                Unified Gateway
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Connected Care Team • Doctor • Pharmacy</p>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full flex-1">
        {/* HERO BRIEFING */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Universal Healthcare Access Gateway
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            One Gateway for Every Caregiver
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Select your clinical role to sign in or register. Upon authentication, you will be seamlessly directed to your dedicated workstation.
          </p>
        </div>

        {/* ROLE SELECTOR TABS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto mb-8">
          {(Object.keys(PORTALS) as RoleType[]).map((role) => {
            const p = PORTALS[role];
            const Icon = p.icon;
            const isSelected = selectedRole === role;

            return (
              <button
                key={role}
                onClick={() => {
                  setSelectedRole(role);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`relative flex flex-col p-4 rounded-2xl text-left border-2 transition-all duration-200 ${
                  isSelected
                    ? `${p.borderColor} ${p.bgLight} shadow-md shadow-blue-500/5 ring-2 ring-blue-500/20`
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-100'} ${p.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    Port {p.port}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.subtitle}</p>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* AUTH CARD */}
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-12">
          {/* Card Header & Tabs */}
          <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${activePortal.bgLight} ${activePortal.color}`}>
                <activePortal.icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {activePortal.badge}
                </span>
                <h2 className="text-lg font-bold text-slate-900">{activePortal.title}</h2>
              </div>
            </div>

            {/* Login / Register Toggle */}
            <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  authMode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Feedback Banners */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {selectedRole === 'doctor' && 'Doctor ID or Email'}
                    {selectedRole === 'careteam' && 'CRT ID or Phone Number'}
                    {selectedRole === 'pharmacy' && 'Pharmacist Email'}
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={activePortal.inputPlaceholder}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {selectedRole === 'pharmacy' ? 'Password / Security PIN' : '6-Digit Security PIN'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showPin ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder={activePortal.pinPlaceholder}
                      maxLength={selectedRole === 'pharmacy' ? 50 : 6}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating & Routing...
                    </>
                  ) : (
                    <>
                      Sign In to {activePortal.title}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Quick 1-Click Demo Section */}
                <div className="pt-4 border-t border-slate-100 mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      ⚡ Quick 1-Click Demo Login
                    </span>
                    <span className="text-[10px] text-slate-400">Pre-seeded accounts</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin(selectedRole)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-left flex items-center justify-between text-xs font-medium text-slate-700 transition-colors"
                  >
                    <span>
                      Use Demo: <strong className="text-slate-900">{activePortal.demoName}</strong> ({activePortal.demoId})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold">
                      PIN: {activePortal.demoPin}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={
                      selectedRole === 'doctor'
                        ? 'e.g. Dr. Ramesh Rao, MD'
                        : selectedRole === 'careteam'
                        ? 'e.g. Sunita Devi'
                        : 'e.g. Pharmacist Ananya'
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="user@curalink.health"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Role Specific Additional Fields */}
                {selectedRole === 'doctor' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Clinical Department
                      </label>
                      <input
                        type="text"
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        placeholder="Internal Medicine / Cardiology"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        KMC License Number
                      </label>
                      <input
                        type="text"
                        value={regLicense}
                        onChange={(e) => setRegLicense(e.target.value)}
                        placeholder="e.g. KMC-98765/MD"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}

                {/* Security PINs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      6-Digit Security PIN
                    </label>
                    <input
                      type={showRegPin ? 'text' : 'password'}
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Confirm PIN
                    </label>
                    <input
                      type={showRegPin ? 'text' : 'password'}
                      value={regConfirmPin}
                      onChange={(e) => setRegConfirmPin(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registering Account...
                    </>
                  ) : (
                    <>
                      Register New {activePortal.badge}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* REGISTRATION SUCCESS MODAL */}
        {registeredUser && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">Account Created!</h3>
              <p className="text-xs text-slate-500 mb-6">
                Your credentials have been generated and registered in Supabase PostgreSQL.
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Generated ID:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-blue-700 text-sm">
                    <span>{registeredUser.id || registeredUser.crtId || registeredUser.email}</span>
                    <button
                      onClick={() => copyToClipboard(registeredUser.id || registeredUser.crtId || registeredUser.email)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Security PIN:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{registeredUser.pin || '••••••'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Role:</span>
                  <span className="font-semibold text-slate-700 text-xs">{activePortal.badge}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaunchRegisteredPortal}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                Launch {activePortal.title} Now
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ECOSYSTEM ARCHITECTURE & DIRECT SHORTCUTS */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Live Ecosystem Workstations
            </h3>
            <span className="text-xs text-slate-400">All services connected via Supabase</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Doctor */}
            <a
              href={PORTALS.doctor.url}
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700">
                  Doctor Desk ↗
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Doctor Portal</h4>
              <p className="text-xs text-slate-500 mb-3">
                Prescription desk, pending queue, medication regimens with sticker slots, and diagnostic orders.
              </p>
              <span className="text-xs font-semibold text-blue-600 group-hover:underline flex items-center gap-1">
                Open Consultation Desk &rarr;
              </span>
            </a>

            {/* Card 2: Care Team */}
            <a
              href={PORTALS.careteam.url}
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-700">
                  Care Team ↗
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Care Team Portal</h4>
              <p className="text-xs text-slate-500 mb-3">
                ASHA field intake, UHID generation (PATxxxxx), guardian details, and automatic consultation queueing.
              </p>
              <span className="text-xs font-semibold text-amber-600 group-hover:underline flex items-center gap-1">
                Open Field Desk &rarr;
              </span>
            </a>

            {/* Card 3: Pharmacy */}
            <a
              href={PORTALS.pharmacy.url}
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Pill className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700">
                  Pharmacy ↗
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Pharmacy Portal</h4>
              <p className="text-xs text-slate-500 mb-3">
                Patient lookup, visual sticker adherence (Morning: Red, Afternoon: Green, Evening: Blue), batch deduction, and atomic receipts.
              </p>
              <span className="text-xs font-semibold text-emerald-600 group-hover:underline flex items-center gap-1">
                Open Dispensing Counter &rarr;
              </span>
            </a>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
        <p>CuraLink Healthcare Ecosystem • Wholly Next.js Architecture • Powered by Supabase PostgreSQL</p>
      </footer>
    </div>
  );
}
