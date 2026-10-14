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
  FileText,
  User,
  Pill,
  Check,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { EnrichedInventoryItem } from "@/modules/pharmacy/application/get-inventory.use-case";
import { IdScannerModal } from "@/components/pharmacy/id-scanner-modal";

const PRE_EXISTING_PATIENTS = [
  {
    id: "PAT10001",
    name: "Ramesh Gowda",
    age: 58,
    condition: "Type 2 Diabetes Mellitus & Neuropathy",
    regimenSummary: "Metformin 500mg, Glimepiride 1mg",
    language: "Kannada",
    requiresStickers: true,
    colorHighlights: [
      { label: "Red (Morning)", colorClass: "bg-red-500 text-white", dot: "🔴" },
      { label: "Blue (Night)", colorClass: "bg-blue-600 text-white", dot: "🔵" },
      { label: "Before Food", colorClass: "bg-amber-400 text-amber-950 font-bold", dot: "🟡" },
    ],
  },
  {
    id: "PAT10002",
    name: "Savitha Devi",
    age: 62,
    condition: "Essential Hypertension Stage II",
    regimenSummary: "Amlodipine 10mg, Atorvastatin 10mg",
    language: "Kannada",
    requiresStickers: true,
    colorHighlights: [
      { label: "Red (Morning)", colorClass: "bg-red-500 text-white", dot: "🔴" },
      { label: "Blue (Night)", colorClass: "bg-blue-600 text-white", dot: "🔵" },
    ],
  },
  {
    id: "PAT10003",
    name: "Anand Kumar",
    age: 45,
    condition: "Type 2 Diabetes & Dyslipidemia",
    regimenSummary: "Metformin 500mg, Atorvastatin 20mg",
    language: "English",
    requiresStickers: false,
    colorHighlights: [
      { label: "Red (Morning)", colorClass: "bg-red-500 text-white", dot: "🔴" },
      { label: "Blue (Night)", colorClass: "bg-blue-600 text-white", dot: "🔵" },
    ],
  },
  {
    id: "AV-000001",
    name: "Suresh Patil",
    age: 58,
    condition: "Uncontrolled Diabetes & Dyslipidemia",
    regimenSummary: "Metformin 500mg, Glimepiride 1mg, Atorvastatin 10mg",
    language: "Hindi",
    requiresStickers: true,
    colorHighlights: [
      { label: "Red (Morning)", colorClass: "bg-red-500 text-white", dot: "🔴" },
      { label: "Blue (Night)", colorClass: "bg-blue-600 text-white", dot: "🔵" },
      { label: "Before Food", colorClass: "bg-amber-400 text-amber-950 font-bold", dot: "🟡" },
    ],
  },
  {
    id: "AV-000002",
    name: "Ananya Sharma",
    age: 32,
    condition: "Acute Bacterial Sinusitis",
    regimenSummary: "Amoxicillin 500mg (TDS 7 Days)",
    language: "English",
    requiresStickers: false,
    colorHighlights: [
      { label: "Red (Morning)", colorClass: "bg-red-500 text-white", dot: "🔴" },
      { label: "Green (Afternoon)", colorClass: "bg-emerald-500 text-white", dot: "🟢" },
      { label: "Blue (Night)", colorClass: "bg-blue-600 text-white", dot: "🔵" },
    ],
  },
  {
    id: "AV-000003",
    name: "Vikram Rao",
    age: 62,
    condition: "Primary Hypertension (Revised Rx v2)",
    regimenSummary: "Amlodipine 10mg",
    language: "Kannada",
    requiresStickers: true,
    colorHighlights: [
      { label: "Red (Morning)", colorClass: "bg-red-500 text-white", dot: "🔴" },
    ],
  },
];

function getSlotColorBadges(slots: string[] = [], beforeFood: boolean = false) {
  const badges: { name: string; bg: string; dot: string }[] = [];
  if (slots.includes("MORNING")) {
    badges.push({ name: "Red (Morning)", bg: "bg-red-500 text-white", dot: "🔴" });
  }
  if (slots.includes("AFTERNOON")) {
    badges.push({ name: "Green (Afternoon)", bg: "bg-emerald-500 text-white", dot: "🟢" });
  }
  if (slots.includes("NIGHT")) {
    badges.push({ name: "Blue (Night)", bg: "bg-blue-600 text-white", dot: "🔵" });
  }
  if (beforeFood) {
    badges.push({ name: "Before Food", bg: "bg-amber-400 text-amber-950 font-bold border border-amber-500", dot: "🟡" });
  } else {
    badges.push({ name: "After Food", bg: "bg-slate-100 text-slate-700 font-medium border border-slate-200", dot: "🍽️" });
  }
  return badges;
}

export default function PharmacyDashboardPage() {
  const router = useRouter();
  const [patientIdInput, setPatientIdInput] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Instant Recent Medical Prescription Preview state
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);
  const [loadingPrescription, setLoadingPrescription] = useState<boolean>(false);

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

  const handleSelectPatient = async (id: string) => {
    setPatientIdInput(id);
    setSearchError(null);
    setLoadingPrescription(true);
    setSelectedPrescription(null);

    try {
      const res = await fetch(`/api/v1/pharmacy/patient/${id}/active`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "No active prescription found for this patient.");
      }
      setSelectedPrescription(data);
    } catch (err: any) {
      setSearchError(err instanceof Error ? err.message : "Failed to load prescription.");
    } finally {
      setLoadingPrescription(false);
    }
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

          {/* SUGGESTED PRE-EXISTING PATIENT IDs */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Pre-Existing Patient Profiles (1-Click Lookup):</span>
              </span>
              <span className="text-[11px] text-slate-400">Click to view recent prescription & colour code</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-left">
              {PRE_EXISTING_PATIENTS.map((p) => {
                const isSelected = selectedPrescription?.patient?.id === p.id || patientIdInput === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPatient(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all group ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-sm"
                        : "bg-slate-50/80 hover:bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 group-hover:border-blue-200">
                        {p.id}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{p.language} • {p.age}y</span>
                    </div>

                    <div className="font-bold text-slate-900 text-xs truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{p.condition}</div>

                    <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex flex-wrap items-center gap-1">
                      {p.colorHighlights.map((c, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.colorClass}`}
                        >
                          <span>{c.dot}</span>
                          <span>{c.label}</span>
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>

      {/* LOADING PRESCRIPTION FEEDBACK */}
      {loadingPrescription && (
        <div className="p-8 bg-white border border-blue-200 rounded-3xl shadow-md text-center space-y-3 animate-pulse">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Fetching Recent Medical Prescription & Colour Code...
          </h3>
          <p className="text-xs text-slate-400">
            Loading latest committed clinical regimen and physical dose sticker map
          </p>
        </div>
      )}

      {/* RECENT MEDICAL PRESCRIPTION PREVIEW (WITH UNIVERSAL COLOUR CODE) */}
      {selectedPrescription && (
        <div className="bg-white rounded-3xl border-2 border-blue-500 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header of Prescription */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                  Active Clinical Prescription
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">
                  Revision #{selectedPrescription.prescription?.revision || 1}
                </span>
                {selectedPrescription.patient?.requiresStickers ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Dose Time Stickers Required</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                    Standard Packaging
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                {selectedPrescription.patient?.displayName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Patient ID: <strong className="font-mono text-slate-800">{selectedPrescription.patient?.id}</strong> • 
                Language: <strong className="text-slate-800">{selectedPrescription.patient?.preferredLanguage}</strong> • 
                Physician: <strong className="text-blue-700">{selectedPrescription.prescription?.doctorName}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPrescription(null)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => router.push(`/pharmacy/patient/${selectedPrescription.patient.id}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
              >
                <span>Open Dispensing Counter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Color Code Legend */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>Prescription Dose Colour Codes:</span>
            </span>
            <div className="flex flex-wrap items-center gap-2 font-bold text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-red-500 text-white shadow-xs">
                🔴 Morning (Red)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-xs">
                🟢 Afternoon (Green)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white shadow-xs">
                🔵 Night (Blue)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 border border-amber-500 shadow-xs">
                🟡 Before Food
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                🍽️ After Food
              </span>
            </div>
          </div>

          {/* Prescribed Medicines List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              Prescribed Medications ({selectedPrescription.medicineLines?.length || 0} lines):
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {selectedPrescription.medicineLines?.map((line: any, idx: number) => {
                const med = line.medicine;
                const slots = line.stickerPlan?.slots || med.doseSlots || [];
                const beforeFood = Boolean(line.stickerPlan?.beforeFood ?? med.beforeFood);
                const colorBadges = getSlotColorBadges(slots, beforeFood);

                return (
                  <div key={med.id || idx} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900">{med.medicineName}</h4>
                        <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          {med.dosage}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 pl-8">
                        <span>Frequency: <strong className="text-slate-900">{med.frequency}</strong></span>
                        <span>•</span>
                        <span>Duration: <strong className="text-slate-900">{med.duration}</strong></span>
                        <span>•</span>
                        <span>Prescribed Qty: <strong className="text-slate-900">{med.quantityPrescribed || 30} units</strong></span>
                      </div>
                    </div>

                    {/* Universal Colour Code Visual Badges */}
                    <div className="flex flex-wrap items-center gap-2 pl-8 md:pl-0 shrink-0">
                      {colorBadges.map((badge, bIdx) => (
                        <span
                          key={bIdx}
                          className={`px-3 py-1 rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 ${badge.bg}`}
                        >
                          <span>{badge.dot}</span>
                          <span>{badge.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-500">
              Prescription status: <strong className="text-emerald-700 font-bold uppercase">{selectedPrescription.prescription?.status || 'COMMITTED'}</strong>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/pharmacy/patient/${selectedPrescription.patient.id}`)}
              className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
            >
              <span>Dispense & Affix Visual Stickers Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
