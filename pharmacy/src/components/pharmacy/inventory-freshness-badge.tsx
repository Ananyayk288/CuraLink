import React from "react";
import { InventoryFreshness } from "@/modules/pharmacy/domain/enums/inventory-freshness.enum";
import { FreshnessCalculationResult } from "@/modules/pharmacy/domain/rules/freshness-calculator";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface InventoryFreshnessBadgeProps {
  freshness: FreshnessCalculationResult;
}

export function InventoryFreshnessBadge({ freshness }: InventoryFreshnessBadgeProps) {
  switch (freshness.freshness) {
    case InventoryFreshness.FRESH:
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
          title={`Audited ${freshness.hoursSinceUpdate} hours ago`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Fresh</span>
          <span className="text-[10px] text-emerald-600/80">({freshness.hoursSinceUpdate}h ago)</span>
        </span>
      );

    case InventoryFreshness.AGING:
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
          title={`Audited ${freshness.hoursSinceUpdate} hours ago. Stock quantities are treated as estimates.`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Aging (Estimate)</span>
          <span className="text-[10px] text-amber-600/80">({freshness.hoursSinceUpdate}h)</span>
        </span>
      );

    case InventoryFreshness.STALE:
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
          title={`Audited ${freshness.hoursSinceUpdate} hours ago. Physical stock audit required before dispensing.`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Stale (Estimate)</span>
          <span className="text-[10px] text-rose-600/80">({freshness.hoursSinceUpdate}h)</span>
        </span>
      );
  }
}
