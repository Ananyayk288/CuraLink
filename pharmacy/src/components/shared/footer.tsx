import React from "react";

export function Footer() {
  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 py-6 px-4 no-print mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            CuraLink
          </span>
          <span className="text-slate-300 font-medium">
            Coordination aid. Not an autonomous medical decision-maker.
          </span>
        </div>

        <div className="flex items-center gap-6 text-slate-400">
          <span>Role: Licensed Dispensing Pharmacist (R.Ph)</span>
          <span className="text-slate-600">|</span>
          <span>Timezone: Asia/Kolkata (IST)</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Audit Active (Append-Only)
          </span>
        </div>
      </div>
    </footer>
  );
}
