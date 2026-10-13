import React from "react";
import { DoseSlot } from "@/modules/pharmacy/domain/enums/dose-slot.enum";
import { DOSE_SLOT_CONFIG, MINI_BEFORE_FOOD_CONFIG } from "@/modules/pharmacy/domain/config/sticker-slot-config";

interface StickerBadgeProps {
  slots?: DoseSlot[];
  beforeFood?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StickerBadge({ slots = [], beforeFood = false, size = "md" }: StickerBadgeProps) {
  if (!slots || slots.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
        <span>No Stickers Assigned</span>
      </span>
    );
  }

  const order = [DoseSlot.MORNING, DoseSlot.AFTERNOON, DoseSlot.NIGHT];
  const sortedSlots = order.filter((s) => slots.includes(s));

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {sortedSlots.map((slot) => {
        const config = DOSE_SLOT_CONFIG[slot];
        return (
          <span
            key={slot}
            className={`inline-flex items-center gap-1.5 font-bold rounded-lg border shadow-2xs transition-all ${
              sizeClasses[size]
            }`}
            style={{
              backgroundColor: config.hex + "15",
              borderColor: config.hex,
              color: config.hex === "#EAB308" ? "#854D0E" : config.hex,
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block border border-black/20 shrink-0"
              style={{ backgroundColor: config.hex }}
            />
            <span>
              {config.colorName} ({config.period})
            </span>
          </span>
        );
      })}

      {beforeFood && (
        <span
          className={`inline-flex items-center font-bold tracking-tight rounded-md border border-slate-800 bg-slate-900 text-white ${
            size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"
          }`}
          title={MINI_BEFORE_FOOD_CONFIG.description}
        >
          <span>{MINI_BEFORE_FOOD_CONFIG.text}</span>
        </span>
      )}
    </div>
  );
}
