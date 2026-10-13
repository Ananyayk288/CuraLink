"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Scan,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { EnrichedInventoryItem } from "@/modules/pharmacy/application/get-inventory.use-case";
import { IdScannerModal } from "@/components/pharmacy/id-scanner-modal";

export default function PharmacyDashboardPage() {
  const router = useRouter();
  const [patientIdInput, setPatientIdInput] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Counter metrics
  const [inventory, setInventory] = useState<EnrichedInventoryItem[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const invRes = await fetch("/api/v1/pharmacy/inventory").then((r) => r.json());
      if (invRes.items) setInventory(invRes.items);
    } catch (err) {
      console.error("Dashboard metrics fetch error:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleLookup = async (idToSearch?: string) => {
    const rawId = idToSearch !== undefined ? idToSearch : patientIdInput;
    const normalized = (rawId || "").trim().toUpperCase();

    if (!normalized) {
      setSearchError("Please enter or scan a Patient ID.");
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const res = await fetch("/api/v1/pharmacy/patient-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: normalized }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setSearchError("Too many search requests. Please wait a moment before searching again.");
        } else {
          setSearchError(data.error?.message || "No active prescription found for this ID");
        }
        return;
      }

      // Exact active prescription found -> navigate to dispensing workspace
      router.push(`/pharmacy/patient/${normalized}`);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "No active prescription found for this ID");
    } finally {
      setSearching(false);
    }
  };

  const handleScanDetected = (detectedId: string) => {
    setPatientIdInput(detectedId);
    handleLookup(detectedId);
  };

  const lowStockCount = inventory.filter((i) => i.isLowStock).length;
  const staleStockCount = inventory.filter((i) => i.freshness.isEstimate).length;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-8">
      {/* Welcome & Security Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>CuraLink Care Coordination Engine Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pharmacy Dispensing Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Patient privacy and safety first: enter or scan a patient ID to dispense only the active,
            latest committed prescription revision. Browsing or patient listing is strictly restricted.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-slate-300">
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero-Browsing Privacy Policy</span>
            </span>
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Latest Committed Revision Only</span>
            </span>
          </div>
        </div>
      </div>

      {/* Central Patient ID Search Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md">
        <div className="max-w-xl mx-auto text-center space-y-2 mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Look Up Patient Prescription
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter the exact 6-digit Patient ID (format: <code className="font-mono font-bold text-slate-800">AV-XXXXXX</code>) or scan physical patient barcode/QR card.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="max-w-xl mx-auto space-y-4"
        >
          <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={patientIdInput}
                onChange={(e) => {
                  setPatientIdInput(e.target.value.toUpperCase());
                  if (searchError) setSearchError(null);
                }}
                placeholder="e.g. AV-000001"
                maxLength={9}
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base sm:text-lg font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal focus:bg-white focus:border-blue-600 focus:outline-hidden transition-all"
              />
              {patientIdInput && (
                <button
                  type="button"
                  onClick={() => {
                    setPatientIdInput("");
                    setSearchError(null);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 min-w-[44px] justify-center"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex-1 sm:flex-none px-4 py-3.5 min-h-[48px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                title="Scan Patient Barcode or QR Card"
              >
                <Scan className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Scan ID</span>
              </button>

              <button
                type="submit"
                disabled={searching}
                className="flex-1 sm:flex-none px-6 py-3.5 min-h-[48px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                {searching ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Look Up</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Error Generic Alert */}
          {searchError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-900 text-xs sm:text-sm animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-semibold">{searchError}</span>
            </div>
          )}

          {/* Quick Demo Seed Pills */}
          <div className="pt-2 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Test Patient IDs:
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { id: "AV-000001", label: "Suresh (Mandatory Stickers)" },
                { id: "AV-000002", label: "Ananya (Standard)" },
                { id: "AV-000003", label: "Vikram (Revised Notice)" },
                { id: "AV-000005", label: "Rahul (Draft Only / 404)" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPatientIdInput(p.id);
                    handleLookup(p.id);
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-700 transition-colors"
                >
                  <span className="font-bold">{p.id}</span>
                  <span className="text-[10px] text-slate-500 ml-1.5">({p.label})</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* 2 Status Metric Tiles Below Search (Low Stock & Stale Stock) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {/* Metric 1: Low Stock Alerts */}
        <Link
          href="/pharmacy/inventory?lowStock=true"
          className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all group min-h-[48px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Low Stock Alerts
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {loadingMetrics ? "..." : lowStockCount}
            </span>
            <span className="text-xs text-slate-500">items below safety threshold</span>
          </div>
          <div className="mt-3 text-xs text-amber-600 font-semibold flex items-center gap-1">
            <span>Review inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Metric 2: Stale Stock Alerts */}
        <Link
          href="/pharmacy/inventory"
          className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-400 hover:shadow-md transition-all group min-h-[48px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Aging / Stale Stock
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {loadingMetrics ? "..." : staleStockCount}
            </span>
            <span className="text-xs text-slate-500">audit needed (&gt;24h)</span>
          </div>
          <div className="mt-3 text-xs text-purple-600 font-semibold flex items-center gap-1">
            <span>Audit stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* ID Scanner Modal */}
      <IdScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanDetected}
      />
    </div>
  );
}
