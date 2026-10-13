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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      {/* Professional Window Container with warm cream and soft rounded edges */}
      <div className="w-full max-w-lg bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#E8E2D5] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Soft Sky-Blue Gradient Header Wash */}
        <div className="bg-gradient-to-b from-[#C8E0FD]/85 via-[#EBF3FD]/60 to-[#FAF7F2] pt-6 sm:pt-7 px-5 sm:px-8 pb-4 border-b border-[#E8E2D5]/70 relative">
          {/* Circular Dismiss Button (if allowed) */}
          {canDismiss && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 w-10 h-10 rounded-full bg-white border border-[#E8E2D5] text-slate-500 hover:text-slate-900 shadow-2xs flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Modal Branding Header */}
          <div className="flex items-center gap-3 sm:gap-3.5 mb-2">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-white border border-[#E8E2D5] p-2 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
              <img
                src="/curalink-symbol.png"
                alt="CuraLink Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                  CuraLink
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                  Doctor Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Professional Practitioner Clinical Gateway
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 pt-2.5 border-t border-[#E8E2D5]/60 mt-2.5 font-medium">
            <span className="flex items-center gap-1.5 font-bold text-blue-700">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> 256-bit Encrypted Session
            </span>
            <span className="text-slate-500 hidden xs:inline sm:inline">Connect • Care • Heal</span>
          </div>
        </div>

        {/* SUCCESS SCREEN (AFTER REGISTRATION) */}
        {registeredDoctor ? (
          <div className="p-5 sm:p-8 space-y-5 sm:space-y-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Success Icon & CuraLink Brand */}
            <div className="flex items-center justify-center gap-3 mx-auto">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-white border-2 border-blue-200 p-2 flex items-center justify-center shadow-md overflow-hidden">
                <img src="/curalink-symbol.png" alt="CuraLink" className="w-full h-full object-contain" />
              </div>
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner ring-4 sm:ring-6 ring-emerald-50">
                <CheckCircle2 className="w-7 sm:w-8 h-7 sm:h-8" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                Registration Successful!
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 max-w-sm mx-auto font-medium">
                Your practitioner credentials have been verified and activated on CURALINK.
              </p>
            </div>

            {/* BIG DOCTOR ID BOX (MATCHING PHOTO AESTHETIC) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-blue-500/80 shadow-md text-center space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-blue-600" /> Official Practitioner ID
              </div>

              {/* ID IN BIG PROMINENT TEXT */}
              <div className="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-wider sm:tracking-widest text-blue-600 py-2 sm:py-3 select-all">
                {registeredDoctor.id}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyId(registeredDoctor.id)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all active:scale-95"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Doctor ID</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs sm:text-sm text-blue-700/80 font-medium pt-1">
                Please save your Doctor ID. You will use this ID to sign in to the CURALINK portal anytime.
              </p>
            </div>

            {/* OTHER DETAILS IN CLEAR FORMAT */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8E2D5] text-left text-sm space-y-3 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1.5 border-b border-[#E8E2D5]">
                Practitioner Profile Summary
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 block font-medium">Doctor Name</span>
                  <span className="font-black text-slate-900 text-sm sm:text-base">{registeredDoctor.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Mobile Phone</span>
                  <span className="font-mono font-bold text-slate-800">+91 {registeredDoctor.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Email Address</span>
                  <span className="font-medium text-slate-800 truncate block">{registeredDoctor.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Age</span>
                  <span className="font-bold text-slate-800">{registeredDoctor.age} Years</span>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-[#E8E2D5] flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Verification Status</span>
                  <span className="font-bold text-emerald-600 inline-flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Email &amp; Mobile Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Actions with electric blue rounded-full CTA */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onLoginSuccess(registeredDoctor);
                  setRegisteredDoctor(null);
                }}
                className="w-full py-4.5 px-6 rounded-full font-black text-base bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Enter CURALINK Portal as {registeredDoctor.name}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginId(registeredDoctor.id);
                  setRegisteredDoctor(null);
                  setActiveTab('login');
                }}
                className="w-full py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Return to Login Screen
              </button>
            </div>
          </div>
        ) : (
          /* AUTH WINDOW (TWO TABS: LOGIN & REGISTER) */
          <div className="p-5 sm:p-7">
            {/* SEGMENTED PILL CONTROL (MATCHING SCREENSHOT'S "UPCOMING / PAST" TRACK) */}
            <div className="grid grid-cols-2 p-1.5 bg-[#EDE7DC] rounded-full border border-[#E8E2D5] mb-5 sm:mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all ${
                  activeTab === 'login'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900'
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
                className={`flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all ${
                  activeTab === 'register'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900'
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
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 font-semibold flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Doctor ID Field */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Doctor ID (e.g. DOC84920)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginId}
                      onChange={e => setLoginId(e.target.value.toUpperCase())}
                      placeholder="Enter DOC followed by 5 digits (e.g. DOC84920)"
                      className="w-full text-base font-mono font-semibold p-3.5 rounded-2xl border border-[#E8E2D5] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 uppercase tracking-wider transition-all text-slate-900 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* 6-Digit PIN Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-bold uppercase tracking-wider text-slate-700">
                      6-Digit Security PIN
                    </label>
                    <span className="text-xs text-slate-500 font-medium">Numeric 6 digits</span>
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
                      className="w-full text-lg font-mono tracking-widest p-3.5 rounded-2xl border border-[#E8E2D5] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all pr-12 text-slate-900 shadow-2xs font-bold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPin(prev => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5"
                    >
                      {showLoginPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Login Button with rounded-full electric blue */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-4 px-6 rounded-full font-black text-base bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    {loginLoading ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Sign In to CURALINK Portal</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Demo Login Option */}
                <div className="mt-4 pt-4 border-t border-[#E8E2D5]">
                  <div className="p-4 rounded-3xl bg-white border border-[#E8E2D5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">Demo Attending Doctor</p>
                      <p className="text-xs text-slate-600 font-medium">
                        Dr. Suresh Sharma, MD • <span className="font-mono text-blue-700 font-bold">DOC84920</span> (PIN: 123456)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      disabled={loginLoading}
                      className="w-full sm:w-auto px-4.5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors text-center shrink-0"
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
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* Doctor Name */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Doctor Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="e.g. Dr. Anita Desai"
                      className="w-full text-base font-semibold p-3.5 rounded-2xl border border-[#E8E2D5] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all pl-10 text-slate-900 shadow-2xs"
                      required
                    />
                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Phone & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full text-base font-semibold p-3.5 rounded-2xl border border-[#E8E2D5] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all pl-10 text-slate-900 shadow-2xs font-mono"
                        required
                      />
                      <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="doctor@hospital.org"
                        className="w-full text-base font-semibold p-3.5 rounded-2xl border border-[#E8E2D5] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all pl-10 text-slate-900 shadow-2xs"
                        required
                      />
                      <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Age & Verification Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
                  {/* Age */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                        className="w-full text-base font-semibold p-3.5 rounded-2xl border border-[#E8E2D5] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all pl-10 text-slate-900 shadow-2xs"
                        required
                      />
                      <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* OTP Verification */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      OTP Verification
                    </label>
                    {isVerified ? (
                      <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Email &amp; Mobile Verified</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerify}
                        disabled={verifying}
                        className="w-full p-3.5 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        {verifying ? (
                          <span>Verifying OTP...</span>
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                            <span>Verify Email &amp; Mobile</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* 6-Digit PIN & Confirm PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Ask 6 Digit PIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-bold uppercase tracking-wider text-slate-700">
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
                        className="w-full text-base font-mono tracking-widest p-3.5 rounded-2xl border border-[#E8E2D5] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all pr-12 text-slate-900 shadow-2xs font-bold"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPin(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5"
                      >
                        {showRegPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm 6 Digit PIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-bold uppercase tracking-wider text-slate-700">
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
                        className="w-full text-base font-mono tracking-widest p-3.5 rounded-2xl border border-[#E8E2D5] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all pr-12 text-slate-900 shadow-2xs font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* PIN Match status hint */}
                {regPin.length === 6 && regConfirmPin.length === 6 && (
                  <div className="text-xs font-semibold">
                    {regPin === regConfirmPin ? (
                      <span className="text-emerald-600 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> 6-Digit PINs match
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1.5">
                        <X className="w-4 h-4" /> PINs do not match
                      </span>
                    )}
                  </div>
                )}

                {/* Submit Register Button with rounded-full electric blue */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-4.5 px-6 rounded-full font-black text-base bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    {regLoading ? (
                      <span>Generating Doctor ID &amp; Profile...</span>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
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

