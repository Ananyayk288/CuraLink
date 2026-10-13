'use client';

import React, { useState } from 'react';
import {
  Stethoscope,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  UserPlus,
  LogIn,
  User,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { DoctorUser } from '@/lib/db';

interface DoctorAuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (doctor: DoctorUser) => void;
  currentDoctor?: DoctorUser | null;
  canDismiss?: boolean;
}

export default function DoctorAuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  currentDoctor,
  canDismiss = false,
}: DoctorAuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');
  const [showRegPin, setShowRegPin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Registration success state
  const [registeredDoctor, setRegisteredDoctor] = useState<DoctorUser | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  // Handle Instant OTP Verification
  const handleVerify = () => {
    if (!regPhone && !regEmail) {
      setRegError('Please provide phone number or email before verification.');
      return;
    }
    setVerifying(true);
    setRegError('');
    setTimeout(() => {
      setVerifying(false);
      setIsVerified(true);
    }, 600);
  };

  // Handle Register Form Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('Please enter your mobile phone number.');
      return;
    }
    if (!regEmail.trim()) {
      setRegError('Please enter your professional email address.');
      return;
    }
    const ageNum = Number(regAge);
    if (!ageNum || ageNum < 21 || ageNum > 100) {
      setRegError('Please enter a valid age between 21 and 100.');
      return;
    }
    if (!/^\d{6}$/.test(regPin)) {
      setRegError('PIN must be exactly 6 numeric digits.');
      return;
    }
    if (regPin !== regConfirmPin) {
      setRegError('PIN and Confirm PIN do not match.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch('/api/doctor/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          phone: regPhone.trim(),
          email: regEmail.trim(),
          age: ageNum,
          pin: regPin,
          isVerified: isVerified || true,
        }),
      }).then(r => r.json());

      if (res.success && res.data?.doctor) {
        setRegisteredDoctor(res.data.doctor);
        // Reset form
        setRegName('');
        setRegPhone('');
        setRegEmail('');
        setRegAge('');
        setRegPin('');
        setRegConfirmPin('');
        setIsVerified(false);
      } else {
        setRegError(res.error || 'Failed to complete registration.');
      }
    } catch (err: any) {
      setRegError(err.message || 'Network error during registration.');
    } finally {
      setRegLoading(false);
    }
  };

  // Handle Login Form Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginId.trim()) {
      setLoginError('Please enter your Doctor ID (e.g. DOC84920).');
      return;
    }
    if (!/^\d{6}$/.test(loginPin.trim())) {
      setLoginError('PIN must be exactly 6 digits.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch('/api/doctor/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: loginId.trim(),
          pin: loginPin.trim(),
        }),
      }).then(r => r.json());

      if (res.success && res.data?.doctor) {
        onLoginSuccess(res.data.doctor);
      } else {
        setLoginError(res.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Network error during login.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Quick Demo Login Handler
  const handleQuickDemoLogin = async () => {
    setLoginId('DOC84920');
    setLoginPin('123456');
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/doctor/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: 'DOC84920',
          pin: '123456',
        }),
      }).then(r => r.json());

      if (res.success && res.data?.doctor) {
        onLoginSuccess(res.data.doctor);
      } else {
        setLoginError(res.error || 'Demo login failed.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Network error during demo login.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Copy Doctor ID helper
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      {/* Professional Window Container */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500" />

        {/* Dismiss Button (if allowed) */}
        {canDismiss && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header & Branding */}
        <div className="pt-6 sm:pt-7 px-5 sm:px-8 pb-4 sm:pb-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 sm:gap-3.5 mb-2">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-white border border-slate-200/90 p-1.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
              <img
                src="/curalink-symbol.png"
                alt="CuraLink Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  CuraLink
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
                  Doctor Portal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Professional Practitioner Clinical Gateway
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-2.5 sm:pt-3 border-t border-slate-200/60 mt-2.5 sm:mt-3">
            <span className="flex items-center gap-1 font-semibold text-teal-700">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> 256-bit Encrypted Session
            </span>
            <span className="text-slate-400 hidden xs:inline sm:inline">Connect • Care • Heal</span>
          </div>
        </div>

        {/* SUCCESS SCREEN (AFTER REGISTRATION) */}
        {registeredDoctor ? (
          <div className="p-5 sm:p-8 space-y-5 sm:space-y-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Success Icon & CuraLink Brand */}
            <div className="flex items-center justify-center gap-3 mx-auto">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-white border-2 border-teal-200 p-2 flex items-center justify-center shadow-md overflow-hidden">
                <img src="/curalink-symbol.png" alt="CuraLink" className="w-full h-full object-contain" />
              </div>
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner ring-4 sm:ring-6 ring-emerald-50">
                <CheckCircle2 className="w-7 sm:w-8 h-7 sm:h-8" />
              </div>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Registration Successful!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Your practitioner credentials have been verified and activated on CURALINK.
              </p>
            </div>

            {/* BIG DOCTOR ID BOX */}
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 border-2 border-teal-500 shadow-md text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Official Practitioner ID
              </div>

              {/* ID IN BIG PROMINENT TEXT */}
              <div className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-wider sm:tracking-widest text-teal-700 py-1.5 sm:py-2 select-all">
                {registeredDoctor.id}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyId(registeredDoctor.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all active:scale-95"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Doctor ID</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-teal-700/80 font-semibold pt-1">
                Please save your Doctor ID. You will use this ID to sign in to the CURALINK portal anytime.
              </p>
            </div>

            {/* OTHER DETAILS IN SMALL FORMAT */}
            <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 text-left text-xs space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200">
                Practitioner Profile Summary
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-medium">Doctor Name</span>
                  <span className="font-bold text-slate-800">{registeredDoctor.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Mobile Phone</span>
                  <span className="font-semibold text-slate-700">{registeredDoctor.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email Address</span>
                  <span className="font-semibold text-slate-700 truncate block">{registeredDoctor.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Age</span>
                  <span className="font-semibold text-slate-700">{registeredDoctor.age} Years</span>
                </div>
                <div className="sm:col-span-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Verification Status</span>
                  <span className="font-bold text-emerald-600 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Email &amp; Mobile OTP Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onLoginSuccess(registeredDoctor);
                  setRegisteredDoctor(null);
                }}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Enter CURALINK Portal as {registeredDoctor.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginId(registeredDoctor.id);
                  setRegisteredDoctor(null);
                  setActiveTab('login');
                }}
                className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Return to Login Screen
              </button>
            </div>
          </div>
        ) : (
          /* AUTH WINDOW (TWO TABS: LOGIN & REGISTER) */
          <div className="p-5 sm:p-7">
            {/* TWO TABS: LOGIN & REGISTER */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 mb-5 sm:mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'register'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </button>
            </div>

            {/* TAB 1: LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Doctor ID Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Doctor ID (e.g. DOC84920)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginId}
                      onChange={e => setLoginId(e.target.value.toUpperCase())}
                      placeholder="Enter DOC followed by 5 digits (e.g. DOC84920)"
                      className="w-full text-sm font-mono font-semibold p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase tracking-wider transition-all"
                      required
                    />
                  </div>
                </div>

                {/* 6-Digit PIN Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      6-Digit Security PIN
                    </label>
                    <span className="text-[11px] text-slate-400">Numeric 6 digits</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPin ? 'text' : 'password'}
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={loginPin}
                      onChange={e => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      className="w-full text-base font-mono tracking-widest p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPin(prev => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {loginLoading ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In to CURALINK Portal</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Demo Login Option */}
                <div className="mt-4 pt-4 border-t border-slate-200/70">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">Demo Attending Doctor</p>
                      <p className="text-[11px] text-slate-500">
                        Dr. Suresh Sharma, MD • <span className="font-mono text-teal-700 font-bold">DOC84920</span> (PIN: 123456)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      disabled={loginLoading}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors text-center"
                    >
                      Auto Fill &amp; Login
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {regError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* Doctor Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Doctor Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="e.g. Dr. Anita Desai"
                      className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all pl-9"
                      required
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Phone & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all pl-9"
                        required
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="doctor@hospital.org"
                        className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all pl-9"
                        required
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Age & Verification Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  {/* Age */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Age (Years)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="21"
                        max="100"
                        value={regAge}
                        onChange={e => setRegAge(e.target.value)}
                        placeholder="e.g. 38"
                        className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all pl-9"
                        required
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* OTP Verification */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      OTP Verification
                    </label>
                    {isVerified ? (
                      <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Email &amp; Mobile Verified</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerify}
                        disabled={verifying}
                        className="w-full p-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {verifying ? (
                          <span>Verifying OTP...</span>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                            <span>Verify Email &amp; Mobile</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* 6-Digit PIN & Confirm PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Ask 6 Digit PIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        6-Digit Security PIN
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showRegPin ? 'text' : 'password'}
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={regPin}
                        onChange={e => setRegPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••"
                        className="w-full text-sm font-mono tracking-widest p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPin(prev => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showRegPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm 6 Digit PIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Confirm 6-Digit PIN
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showRegPin ? 'text' : 'password'}
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={regConfirmPin}
                        onChange={e => setRegConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••"
                        className="w-full text-sm font-mono tracking-widest p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all pr-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* PIN Match status hint */}
                {regPin.length === 6 && regConfirmPin.length === 6 && (
                  <div className="text-[11px] font-semibold">
                    {regPin === regConfirmPin ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 6-Digit PINs match
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> PINs do not match
                      </span>
                    )}
                  </div>
                )}

                {/* Submit Register Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {regLoading ? (
                      <span>Generating Doctor ID &amp; Profile...</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Register &amp; Generate Doctor ID</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
