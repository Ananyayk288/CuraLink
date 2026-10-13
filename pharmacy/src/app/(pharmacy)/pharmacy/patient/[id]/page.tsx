"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Sparkles,
  PackageCheck,
  RefreshCw,
  Clock,
  Info,
  Check,
} from "lucide-react";
import { PatientLookupResult } from "@/modules/pharmacy/application/lookup-patient-active-prescription.use-case";
import { getPhysicalStickersForMedicine } from "@/modules/pharmacy/domain/config/sticker-slot-config";
import { useIdleTimer } from "@/lib/use-idle-timer";

export default function DispensingWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [data, setData] = useState<PatientLookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states per medicine line
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [confirmedStickers, setConfirmedStickers] = useState<Record<string, boolean>>({});
  const [confirmingStickerId, setConfirmingStickerId] = useState<string | null>(null);

  // Atomic whole-prescription dispense state
  const [dispenseSubmitting, setDispenseSubmitting] = useState(false);
  const [lastReceiptNo, setLastReceiptNo] = useState<string | null>(null);
  const [dispenseSuccessMessage, setDispenseSuccessMessage] = useState<string | null>(null);

  // 2-minute idle timer: auto-clear and return to patient search
  useIdleTimer({
    timeoutMs: 120000,
    onIdle: () => {
      router.push("/pharmacy/dashboard");
    },
    enabled: true,
  });

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/pharmacy/patient/${id}/active`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "No active prescription found for this ID");
      }
      setData(json);

      // Initialize form defaults per medicine line
      const initQuantities: Record<string, number> = {};
      const initConfirmed: Record<string, boolean> = {};

      json.medicineLines.forEach((line: PatientLookupResult["medicineLines"][0]) => {
        const medId = line.medicine.id;
        const prescribedQty = line.medicine.quantityPrescribed || 30;
        initQuantities[medId] = prescribedQty;
        initConfirmed[medId] = Boolean(line.isStickerConfirmed);

        // If line is already dispensed, store receipt number
        if (line.dispenseEvent?.receiptNo && !lastReceiptNo) {
          setLastReceiptNo(line.dispenseEvent.receiptNo);
        }
      });

      setQuantities((prev) => ({ ...initQuantities, ...prev }));
      setConfirmedStickers((prev) => ({ ...initConfirmed, ...prev }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No active prescription found for this ID");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 max-w-md mx-auto">
        <RefreshCw className="w-9 h-9 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="font-bold text-slate-800 text-base">Loading active prescription workspace...</p>
        <p className="text-xs text-slate-400 mt-1">Verifying latest committed clinical revision</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-center shadow-md">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">No active prescription found</h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2">{error || "No active prescription found for this ID"}</p>
        <button
          type="button"
          onClick={() => router.push("/pharmacy/dashboard")}
          className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Search</span>
        </button>
      </div>
    );
  }

  const isPrescriptionDispensed =
    data.prescription.isFullyDispensed || data.prescription.status === "DISPENSED";

  // Check if patient requires stickers and whether any medicine has missing sticker plan
  const requiresStickers = Boolean(data.patient.requiresStickers);
  const missingPlanMedicine = requiresStickers
    ? data.medicineLines.find(
        (l) => !l.stickerPlan || !l.stickerPlan.slots || l.stickerPlan.slots.length === 0
      )
    : null;
  const hasMissingStickerPlan = Boolean(missingPlanMedicine);

  // Sticker progress
  const totalMedicines = data.medicineLines.length;
  const confirmedCount = data.medicineLines.filter(
    (l) => Boolean(confirmedStickers[l.medicine.id])
  ).length;
  const allStickersConfirmed =
    !requiresStickers || (!hasMissingStickerPlan && confirmedCount === totalMedicines);

  // Handle confirming physical stickers for a medicine
  const handleConfirmStickers = async (prescriptionMedicineId: string) => {
    try {
      setConfirmingStickerId(prescriptionMedicineId);
      const res = await fetch("/api/v1/pharmacy/stickers/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionMedicineId }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error?.message || "Failed to confirm stickers");
      }

      setConfirmedStickers((prev) => ({
        ...prev,
        [prescriptionMedicineId]: true,
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to confirm stickers");
    } finally {
      setConfirmingStickerId(null);
    }
  };

  // Evaluate dispense button enablement and reason
  let canDispensePrescription = true;
  let dispenseDisabledReason: string | null = null;

  if (isPrescriptionDispensed) {
    canDispensePrescription = false;
    dispenseDisabledReason = "Prescription already dispensed";
  } else if (requiresStickers && hasMissingStickerPlan) {
    canDispensePrescription = false;
    dispenseDisabledReason = "Sticker plan missing, contact the doctor";
  } else if (requiresStickers && !allStickersConfirmed) {
    canDispensePrescription = false;
    dispenseDisabledReason = `Stickers pending: ${confirmedCount} of ${totalMedicines} medicines confirmed`;
  } else {
    for (const line of data.medicineLines) {
      const med = line.medicine;
      const qty = quantities[med.id];

      if (!qty || qty <= 0 || !Number.isInteger(qty)) {
        canDispensePrescription = false;
        dispenseDisabledReason = `Positive whole quantity required for ${med.medicineName}`;
        break;
      }

      // Auto-resolve available batch
      const batch =
        line.availableBatches?.find((b) => {
          const isNotExpired = new Date(b.expiryDate).getTime() > Date.now();
          const hasEnough = b.stockQuantity >= qty;
          return isNotExpired && hasEnough;
        }) || line.availableBatches?.[0];

      if (batch && new Date(batch.expiryDate).getTime() < Date.now()) {
        canDispensePrescription = false;
        dispenseDisabledReason = `Inventory for ${med.medicineName} is expired`;
        break;
      }

      if (batch && batch.stockQuantity < qty) {
        canDispensePrescription = false;
        dispenseDisabledReason = `Insufficient stock for ${med.medicineName} (${batch.stockQuantity} available, ${qty} requested)`;
        break;
      }
    }
  }

  // Handle atomic whole-prescription dispense
  const handleDispenseWholePrescription = async () => {
    if (!canDispensePrescription || dispenseSubmitting) return;

    try {
      setDispenseSubmitting(true);
      setDispenseSuccessMessage(null);

      const idempotencyKey = `disp-${data.prescription.id}-${Date.now()}`;
      const items = data.medicineLines.map((line) => {
        const med = line.medicine;
        const qty = quantities[med.id] || med.quantityPrescribed || 30;
        const batch =
          line.availableBatches?.find((b) => {
            const isNotExpired = new Date(b.expiryDate).getTime() > Date.now();
            const hasEnough = b.stockQuantity >= qty;
            return isNotExpired && hasEnough;
          }) || line.availableBatches?.[0];

        const batchNum =
          batch?.batchNumber ||
          `B-${med.medicineName.substring(0, 3).toUpperCase()}-2026`;
        const expiryDate =
          batch?.expiryDate ||
          new Date(Date.now() + 180 * 86400000).toISOString().substring(0, 10);

        return {
          prescriptionMedicineId: med.id,
          batchNumber: batchNum,
          quantity: qty,
          expiryDate,
        };
      });

      const res = await fetch("/api/v1/pharmacy/dispense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          prescriptionId: data.prescription.id,
          items,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error?.message || "Dispense transaction failed");
      }

      setLastReceiptNo(resJson.receiptNo);
      setDispenseSuccessMessage(
        `Prescription dispensed successfully! Receipt: ${resJson.receiptNo}`
      );
      await fetchWorkspace();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Dispense transaction failed");
    } finally {
      setDispenseSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-32 sm:pb-24">
      {/* Top Header Navigation: Clear / New Search */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/pharmacy/dashboard")}
          className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Clear / New Search</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Session Auto-Clears in 2m Idle</span>
        </div>
      </div>

      {/* Revised Prescription Notice Banner (ONLY shown if replaced one that was partly dispensed) */}
      {data.prescription.hasRevisedNotice && (
        <div className="p-4 sm:p-5 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-start gap-3.5 text-amber-950 shadow-sm animate-in fade-in duration-200">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm sm:text-base text-amber-900">
              This prescription was revised. Dispense only what is shown here.
            </h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              The treating physician updated this prescription. Previous revisions and older dispensations have been superseded. Only dispense the active medicines listed below.
            </p>
          </div>
        </div>
      )}

      {/* Dispense Success Notification */}
      {dispenseSuccessMessage && (
        <div className="p-4 sm:p-5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center justify-between gap-4 text-emerald-950 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm sm:text-base text-emerald-950">
                Prescription Dispensed Successfully
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">{dispenseSuccessMessage}</p>
            </div>
          </div>
          {lastReceiptNo && (
            <Link
              href={`/pharmacy/receipts/${lastReceiptNo}`}
              className="px-4 py-2.5 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </Link>
          )}
        </div>
      )}

      {/* Read-Only Banner for Already Dispensed Prescription */}
      {isPrescriptionDispensed && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-400 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-emerald-950 shadow-sm">
          <div className="flex items-center gap-3.5">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white uppercase tracking-wider">
                  DISPENSED
                </span>
                <h4 className="font-bold text-sm sm:text-base text-emerald-950">
                  Prescription Record Closed (Read-Only)
                </h4>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                Dispensed at:{" "}
                <strong>
                  {data.prescription.dispensedAt
                    ? new Date(data.prescription.dispensedAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      }) + " IST"
                    : "Recorded in system"}
                </strong>
                . Re-dispense is locked.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {lastReceiptNo && (
              <Link
                href={`/pharmacy/receipts/${lastReceiptNo}`}
                className="flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>View / Print Receipt</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => router.push("/pharmacy/dashboard")}
              className="flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
            >
              New Search
            </button>
          </div>
        </div>
      )}

      {/* Patient & Prescription Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {data.patient.displayName}
              </h1>

              {requiresStickers ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>DOSE TIME STICKERS REQUIRED</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Standard Packaging
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-slate-600 pt-1">
              <span>
                Patient ID:{" "}
                <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-900">
                  {data.patient.id}
                </code>
              </span>
              <span>•</span>
              <span>
                Language: <strong className="text-slate-900">{data.patient.preferredLanguage}</strong>
              </span>
              <span>•</span>
              <span>
                Device: <strong className="text-slate-900">{data.patient.deviceType}</strong>
              </span>
              <span>•</span>
              <span>
                Doctor: <strong className="text-blue-700">{data.prescription.doctorName}</strong>
              </span>
              <span>•</span>
              <span>Revision #{data.prescription.revision}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto">
            {lastReceiptNo && (
              <Link
                href={`/pharmacy/receipts/${lastReceiptNo}`}
                className="px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </Link>
            )}

            <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
              <span
                className={`text-xs font-black ${
                  isPrescriptionDispensed ? "text-emerald-700" : "text-blue-700"
                }`}
              >
                {data.prescription.status}
              </span>
            </div>
          </div>
        </div>

        {/* Privacy Assurance Banner */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Zero-Browsing Privacy Policy:</strong> No diagnosis notes or browsing lists are accessible in this workspace.
          </span>
        </div>
      </div>

      {/* SECTION: Attach Physical Dose Time Stickers (Confirm-Only) */}
      {requiresStickers && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Attach Physical Dose Time Stickers
                </h3>
                <p className="text-xs text-slate-500">
                  Doctor-prescribed visual regimen. Affix physical color stickers to packaging and confirm.
                </p>
              </div>
            </div>

            {/* Progress line */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {confirmedCount} of {totalMedicines} medicines done
              </span>
              {allStickersConfirmed && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full border border-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </span>
              )}
            </div>
          </div>

          {/* Missing sticker plan error banner */}
          {hasMissingStickerPlan && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-950">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong className="text-sm font-bold text-rose-900">
                  Sticker plan missing, contact the doctor
                </strong>
                <p className="text-xs text-rose-700 mt-0.5">
                  Patient requires visual packaging, but medicine{" "}
                  <strong>{missingPlanMedicine?.medicine.medicineName}</strong> has no prescribed dose time slots. Dispensing is blocked.
                </p>
              </div>
            </div>
          )}

          {/* Medicine Sticker Rows */}
          <div className="divide-y divide-slate-100 space-y-1">
            {data.medicineLines.map((line) => {
              const med = line.medicine;
              const hasPlan = Boolean(line.stickerPlan && line.stickerPlan.slots.length > 0);
              const isConfirmed = Boolean(confirmedStickers[med.id]);
              const physicalStickers = getPhysicalStickersForMedicine(
                line.stickerPlan?.slots || [],
                Boolean(line.stickerPlan?.beforeFood)
              );
              const isConfirming = confirmingStickerId === med.id;

              return (
                <div
                  key={med.id}
                  className={`pt-4 pb-4 px-3 sm:px-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isConfirmed ? "bg-emerald-50/40" : "bg-slate-50/60"
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900">
                        {med.medicineName}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">({med.dosage})</span>
                    </div>

                    {/* Sticker Chips with Swatches */}
                    {hasPlan ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {physicalStickers.map((stk) => (
                          <span
                            key={stk.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${
                              stk.badgeClasses || "bg-slate-100 text-slate-800"
                            }`}
                            style={
                              stk.hex
                                ? {
                                    backgroundColor: stk.hex + "15",
                                    borderColor: stk.hex,
                                    color: stk.hex === "#EAB308" ? "#854D0E" : stk.hex,
                                  }
                                : undefined
                            }
                          >
                            {stk.hex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block border border-black/20 shrink-0"
                                style={{ backgroundColor: stk.hex }}
                              />
                            )}
                            <span>{stk.text || stk.label}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Sticker plan missing, contact the doctor</span>
                      </span>
                    )}
                  </div>

                  {/* Status Badge & Confirm Control */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        isConfirmed
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      {isConfirmed ? "ATTACHED" : "PENDING"}
                    </span>

                    {!isPrescriptionDispensed && (
                      <button
                        type="button"
                        disabled={isConfirmed || !hasPlan || isConfirming}
                        onClick={() => handleConfirmStickers(med.id)}
                        className={`min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                          isConfirmed
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                            : !hasPlan
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            : "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-98"
                        }`}
                        aria-label={`Confirm stickers attached for ${med.medicineName}`}
                      >
                        {isConfirmed ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Stickers attached</span>
                          </>
                        ) : isConfirming ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Confirming...</span>
                          </>
                        ) : (
                          <>
                            <span>Stickers attached</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION: Medicines to Dispense */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Medications to Dispense ({totalMedicines} prescribed)
          </h2>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Verify prescribed quantity before confirming final dispense
          </span>
        </div>

        {data.medicineLines.map((line, index) => {
          const med = line.medicine;
          const isDispensed = line.isDispensed || isPrescriptionDispensed;
          const currentQty = quantities[med.id] || med.quantityPrescribed || 30;

          return (
            <div
              key={med.id}
              className={`bg-white rounded-3xl border transition-all p-5 sm:p-7 ${
                isDispensed
                  ? "border-emerald-200 bg-emerald-50/20"
                  : "border-slate-200 shadow-sm"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                {/* Medicine Information Column */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 break-words">{med.medicineName}</h3>

                    {isDispensed && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>DISPENSED</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Dosage</span>
                      <strong className="text-slate-800">{med.dosage}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Frequency</span>
                      <strong className="text-slate-800">{med.frequency}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                      <strong className="text-slate-800">{med.duration}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Prescribed Qty
                      </span>
                      <strong className="text-slate-800">{med.quantityPrescribed || 30} units</strong>
                    </div>
                  </div>
                </div>

                {/* Quantity Given Control */}
                <div className="w-full sm:w-60 bg-slate-50 border border-slate-200 p-4 rounded-2xl shrink-0">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Quantity Given *
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    disabled={isDispensed}
                    value={currentQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQuantities((prev) => ({
                        ...prev,
                        [med.id]: isNaN(val) ? 0 : val,
                      }));
                    }}
                    className="w-full px-3 py-2.5 min-h-[48px] bg-white border border-slate-300 rounded-xl text-base sm:text-sm font-semibold text-slate-900 outline-hidden focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Prescribed: {med.quantityPrescribed || 30} units
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* STICKY BOTTOM BUTTON: Confirm Medicines Given (Single Whole-Prescription Action) */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 sm:p-5 z-40 shadow-xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left w-full sm:w-auto">
            <span className="font-bold text-slate-900 block text-sm sm:text-base">
              {data.patient.displayName}
            </span>
            <span className="text-xs text-slate-500">
              {totalMedicines} medicine{totalMedicines > 1 ? "s" : ""} in Revision #{data.prescription.revision}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {dispenseDisabledReason && !isPrescriptionDispensed && (
              <span className="text-xs text-rose-600 font-semibold text-center sm:text-right max-w-md">
                🔒 {dispenseDisabledReason}
              </span>
            )}

            {!isPrescriptionDispensed ? (
              <button
                type="button"
                disabled={!canDispensePrescription || dispenseSubmitting}
                onClick={handleDispenseWholePrescription}
                className={`w-full sm:w-auto py-3.5 px-6 min-h-[48px] rounded-2xl text-sm sm:text-base font-bold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 ${
                  canDispensePrescription && !dispenseSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                {dispenseSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing Dispense Transaction...</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-5 h-5" />
                    <span>Confirm Medicines Given</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {lastReceiptNo && (
                  <Link
                    href={`/pharmacy/receipts/${lastReceiptNo}`}
                    className="flex-1 sm:flex-none py-3 px-5 min-h-[48px] rounded-2xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Receipt</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => router.push("/pharmacy/dashboard")}
                  className="flex-1 sm:flex-none py-3 px-5 min-h-[48px] rounded-2xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
