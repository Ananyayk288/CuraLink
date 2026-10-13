import { DoseSlot } from "../enums/dose-slot.enum";

export interface SlotConfig {
  slot: DoseSlot;
  colorName: string; // "Red", "Yellow", "Blue"
  hex: string;
  label: string;     // e.g. "Day (Morning)"
  period: string;    // "Morning", "Afternoon", "Night"
  badgeClasses: string;
}

export const DOSE_SLOT_CONFIG: Record<DoseSlot, SlotConfig> = {
  [DoseSlot.MORNING]: {
    slot: DoseSlot.MORNING,
    colorName: "Red",
    hex: "#EF4444",
    label: "Day (Morning)",
    period: "Morning",
    badgeClasses: "bg-red-500 text-white border-red-600",
  },
  [DoseSlot.AFTERNOON]: {
    slot: DoseSlot.AFTERNOON,
    colorName: "Yellow",
    hex: "#EAB308",
    label: "Afternoon",
    period: "Afternoon",
    badgeClasses: "bg-amber-400 text-amber-950 border-amber-500",
  },
  [DoseSlot.NIGHT]: {
    slot: DoseSlot.NIGHT,
    colorName: "Blue",
    hex: "#3B82F6",
    label: "Night",
    period: "Night",
    badgeClasses: "bg-blue-600 text-white border-blue-700",
  },
};

export interface MiniStickerConfig {
  label: string;
  text: string;
  description: string;
  badgeClasses: string;
}

export const MINI_BEFORE_FOOD_CONFIG: MiniStickerConfig = {
  label: "Mini",
  text: "Take BEFORE food",
  description: "Take 30 minutes before meal",
  badgeClasses: "bg-slate-900 text-white border-slate-700 text-[10px] font-bold tracking-tight px-2 py-0.5 rounded-full shadow-2xs",
};

export function formatDoseSlotName(slot: DoseSlot): string {
  const config = DOSE_SLOT_CONFIG[slot];
  return `${config.colorName} (${config.period})`;
}

export interface PhysicalStickerItem {
  id: string;
  type: "SLOT" | "MINI";
  colorName: string; // "Red", "Yellow", "Blue", or "Mini"
  hex?: string;
  label: string;
  text: string;
  badgeClasses: string;
}

/**
 * getPhysicalStickersForMedicine
 * Returns all physical stickers that must be attached to a single medicine packet.
 * A single medicine packet can receive MULTIPLE physical stickers:
 * - One per assigned dose slot (e.g. Red for Morning + Blue for Night)
 * - Plus one Mini badge if before_food is true (e.g. Mini "Take BEFORE food").
 */
export function getPhysicalStickersForMedicine(
  slots: DoseSlot[] = [],
  beforeFood: boolean = false
): PhysicalStickerItem[] {
  const stickers: PhysicalStickerItem[] = [];
  const diurnalOrder = [DoseSlot.MORNING, DoseSlot.AFTERNOON, DoseSlot.NIGHT];

  for (const slot of diurnalOrder) {
    if (slots.includes(slot)) {
      const cfg = DOSE_SLOT_CONFIG[slot];
      stickers.push({
        id: `slot-${slot}`,
        type: "SLOT",
        colorName: cfg.colorName,
        hex: cfg.hex,
        label: cfg.label,
        text: `${cfg.colorName} (${cfg.period})`,
        badgeClasses: cfg.badgeClasses,
      });
    }
  }

  if (beforeFood) {
    stickers.push({
      id: "mini-before-food",
      type: "MINI",
      colorName: MINI_BEFORE_FOOD_CONFIG.label,
      label: MINI_BEFORE_FOOD_CONFIG.label,
      text: `Mini (${MINI_BEFORE_FOOD_CONFIG.text})`,
      badgeClasses: MINI_BEFORE_FOOD_CONFIG.badgeClasses,
    });
  }

  return stickers;
}

/**
 * formatMedicineStickersSummary
 * Renders a human-readable list of all physical stickers attached to a single medicine packet.
 * Example: "Red (Morning) + Blue (Night) + Mini (Take BEFORE food)"
 */
export function formatMedicineStickersSummary(
  slots: DoseSlot[] = [],
  beforeFood: boolean = false
): string {
  const stickers = getPhysicalStickersForMedicine(slots, beforeFood);
  if (stickers.length === 0) return "Standard Packaging";
  return stickers.map((s) => s.text).join(" + ");
}
