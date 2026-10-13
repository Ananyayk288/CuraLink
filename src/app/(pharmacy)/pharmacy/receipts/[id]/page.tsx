"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { PrintableReceiptData } from "@/modules/pharmacy/application/get-receipt.use-case";
import { StickerBadge } from "@/components/pharmacy/sticker-badge";

export default function ReceiptPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [receipt, setReceipt] = useState<PrintableReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/pharmacy/receipts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.receipt) {
          setReceipt(data.receipt);
        } else {
          setError(data.error?.message || "Receipt not found");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="font-semibold text-slate-700">Loading receipt details...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-red-200 text-center shadow-lg">
        <h2 className="text-lg font-bold text-slate-900">Receipt Not Found</h2>
        <p className="text-xs text-slate-600 mt-1">{error || "Invalid receipt number"}</p>
        <Link
          href="/pharmacy/dashboard"
          className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[48px] bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Patient Search</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Action buttons (hidden on print) */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/pharmacy/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Search</span>
        </Link>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all min-h-[44px]"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Receipt</span>
        </button>
      </div>

      {/* Printable Receipt Card */}
      <div className="receipt-container bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center pb-6 border-b border-slate-200">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center mb-3 shadow-xs">
            <img src="/curalink-symbol.png" alt="CuraLink Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CuraLink</h1>
          <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mt-0.5">
            Licensed Pharmacy Dispensing Record
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Facility: {receipt.pharmacyId}</p>
        </div>

        {/* Receipt Meta */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Receipt Number</span>
            <strong className="font-mono text-sm text-slate-900">{receipt.receiptNo}</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Dispense Timestamp</span>
            <strong className="text-slate-800">{receipt.dispensedAtIst}</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient Name & ID</span>
            <strong className="text-slate-900 text-sm">{receipt.patient.displayName}</strong>
            <span className="text-slate-500 block font-mono text-[10px]">{receipt.patient.id}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Prescribing Doctor</span>
            <strong className="text-slate-800">{receipt.prescription.doctorName}</strong>
            <span className="text-slate-500 block text-[10px]">Revision #{receipt.prescription.revision}</span>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Dispensed Medications & Physical Sticker Bindings
          </h3>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Expiry</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4 text-right">Physical Stickers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipt.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{item.medicineName}</span>
                      <span className="text-[11px] text-slate-500">{item.stickersSummary}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{item.batchNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{item.expiryDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex justify-end">
                        <StickerBadge slots={item.slots} beforeFood={item.beforeFood} size="sm" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification attestation */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Dispensed By</span>
            <strong className="text-slate-800">{receipt.dispensedByName}</strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pharmacist Verification</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1 justify-end">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
              <span>Physical Stock Verified</span>
            </span>
          </div>
        </div>

        {/* Privacy Notice and Disclaimer */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1">
          <p className="text-[11px] font-semibold text-slate-700">{receipt.notice}</p>
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Privacy Compliant: Excludes diagnostic details and clinical consultation records.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
