"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Eye,
  Tag,
  PackageCheck,
  Boxes,
  ShieldCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import { FormattedAuditActivity } from "@/modules/pharmacy/application/get-pharmacist-activity.use-case";

export default function PharmacistActivityPage() {
  const [logs, setLogs] = useState<FormattedAuditActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/pharmacy/activity");
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Activity fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const renderActionIcon = (type: string) => {
    switch (type) {
      case "PATIENT_SEARCH_PERFORMED":
        return <Search className="w-4 h-4 text-sky-600" />;
      case "PRESCRIPTION_VIEWED":
        return <Eye className="w-4 h-4 text-blue-600" />;
      case "STICKER_ASSIGNED":
        return <Tag className="w-4 h-4 text-purple-600" />;
      case "MEDICINE_DISPENSED":
        return <PackageCheck className="w-4 h-4 text-emerald-600" />;
      case "INVENTORY_UPDATED":
        return <Boxes className="w-4 h-4 text-amber-600" />;
      default:
        return <History className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Activity &amp; Governance Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only, tamper-evident audit record of your clinical workspace interactions
          </p>
        </div>

        <button
          onClick={fetchActivity}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 transition-all shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Security Note */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start sm:items-center gap-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
        <span>
          <strong>Audit Compliance (ISO/IEC 27001 &amp; ABDM):</strong> Every search attempt, sticker binding, stock change, and dispense event is cryptographically recorded with actor ID and IST timestamp.
        </span>
      </div>

      {/* Logs Table / Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Loading audit logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No actions recorded in this session</p>
              <p className="text-xs text-slate-400 mt-1">Actions taken across the portal will appear here automatically</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {renderActionIcon(log.actionType)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {log.actionType.replace(/_/g, " ")}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 uppercase">
                        {log.targetEntity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-mono truncate">
                      Target ID: {log.targetId}
                    </p>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="text-[11px] text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-200 inline-block max-w-full overflow-hidden text-ellipsis">
                        {Object.entries(log.metadata).map(([k, v]) => (
                          <span key={k} className="mr-3">
                            <strong className="text-slate-500">{k}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs shrink-0 pl-12 sm:pl-0">
                  <span className="font-bold text-slate-800 block">{log.timestampIst}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestampIso).toISOString().substring(11, 19)} UTC
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
