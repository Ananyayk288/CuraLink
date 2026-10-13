import { ValidationError } from "@/core/domain/errors/domain-error";
import { DoseSlot } from "../enums/dose-slot.enum";

export interface ValidateStickerSlotsParams {
  slots: DoseSlot[];
  beforeFood?: boolean;
}

/**
 * validateStickerSlots
 * Validates that:
 * 1. At least one DoseSlot is provided.
 * 2. No duplicate slots exist within the same medicine's assignment.
 * Multiple medicines in the same prescription CAN share the same slot/colour.
 */
export function validateStickerSlots(params: ValidateStickerSlotsParams): void {
  const { slots } = params;

  if (!slots || slots.length === 0) {
    throw new ValidationError("At least one time-of-day dose slot (Morning, Afternoon, or Night) must be selected.");
  }

  // Validate no duplicate slots in the same assignment
  const uniqueSlots = new Set<DoseSlot>();
  for (const slot of slots) {
    if (!Object.values(DoseSlot).includes(slot)) {
      throw new ValidationError(`Invalid dose slot "${slot}". Must be MORNING, AFTERNOON, or NIGHT.`);
    }
    if (uniqueSlots.has(slot)) {
      throw new ValidationError(`Duplicate dose slot "${slot}" in the same medicine sticker assignment is rejected.`);
    }
    uniqueSlots.add(slot);
  }
}
