"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Pill, ShieldCheck, Lock, AlertCircle, ArrowRight, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("rajiv.pharmacy@curalink.health");
  const [password, setPassword] = useState("pharmacy123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Invalid credentials");
      }

      router.push("/pharmacy/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleUser: string) => {
    setUsername(roleUser);
    setPassword("password123");
    setTimeout(() => {
      handleLogin();
    }, 50);
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-8 text-white text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-4 shadow-lg">
            <Pill className="w-8 h-8 text-blue-200" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">CuraLink</h2>
          <p className="text-xs text-blue-200 uppercase font-semibold tracking-wider mt-1">
            Licensed Pharmacy Portal
          </p>
          <p className="text-xs text-slate-300 mt-2">
            Safe physical-to-digital medicine dispensing and adherence bridge
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pharmacist Identifier / Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden font-medium"
                  placeholder="e.g. rajiv.pharmacy@curalink.health"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Passcode / Credential
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Dispensing Station"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Personas */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">
              Quick Demo Personas
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("rajiv.pharmacy@curalink.health")}
                className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-left flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Rajiv Sharma, R.Ph</span>
                  </div>
                  <span className="text-[11px] text-blue-700">Role: PHARMACY (Permitted)</span>
                </div>
                <span className="text-blue-600 font-semibold text-[11px]">Instant Login →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("dr.amit@curalink.health")}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-800">Dr. Amit Sen, MD</div>
                  <span className="text-[11px] text-slate-500">Role: DOCTOR (Tests 403 Guard)</span>
                </div>
                <span className="text-slate-500 text-[11px]">Test RBAC →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Safe notice */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Role-guarded endpoint. Session active for 24h.</span>
        </div>
      </div>
    </div>
  );
}
