import { describe, it, expect } from "vitest";
import { validateStickerSlots } from "@/modules/pharmacy/domain/rules/sticker-uniqueness.rule";
import { DoseSlot } from "@/modules/pharmacy/domain/enums/dose-slot.enum";
import { ValidationError } from "@/core/domain/errors/domain-error";

describe("Time-of-Day Sticker Slots Domain Rules", () => {
  it("should permit valid single or multi-slot assignments", () => {
    expect(() =>
      validateStickerSlots({
        slots: [DoseSlot.MORNING],
        beforeFood: false,
      })
    ).not.toThrow();

    expect(() =>
      validateStickerSlots({
        slots: [DoseSlot.MORNING, DoseSlot.NIGHT],
        beforeFood: true,
      })
    ).not.toThrow();

    expect(() =>
      validateStickerSlots({
        slots: [DoseSlot.MORNING, DoseSlot.AFTERNOON, DoseSlot.NIGHT],
        beforeFood: false,
      })
    ).not.toThrow();
  });

  it("should permit multiple medicines to share the same slot (e.g., Red / Morning)", () => {
    // Medicine A
    expect(() =>
      validateStickerSlots({
        slots: [DoseSlot.MORNING],
        beforeFood: false,
      })
    ).not.toThrow();

    // Medicine B sharing Morning (Red)
    expect(() =>
      validateStickerSlots({
        slots: [DoseSlot.MORNING, DoseSlot.NIGHT],
        beforeFood: false,
      })
    ).not.toThrow();
  });

  it("should reject empty slots array", () => {
    expect(() =>
      validateStickerSlots({
        slots: [],
        beforeFood: true,
      })
    ).toThrow(ValidationError);
  });

  it("should reject duplicate slots on the same medicine assignment", () => {
    expect(() =>
      validateStickerSlots({
        slots: [DoseSlot.MORNING, DoseSlot.MORNING],
        beforeFood: false,
      })
    ).toThrow(ValidationError);
  });

  it("should reject invalid slot values", () => {
    expect(() =>
      validateStickerSlots({
        slots: ["MIDNIGHT" as unknown as DoseSlot],
      })
    ).toThrow(ValidationError);
  });
});
