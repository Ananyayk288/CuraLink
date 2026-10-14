import { describe, it, expect } from "vitest";
import {
  DOSE_SLOT_CONFIG,
  MINI_BEFORE_FOOD_CONFIG,
  formatDoseSlotName,
  getPhysicalStickersForMedicine,
  formatMedicineStickersSummary,
} from "@/modules/pharmacy/domain/config/sticker-slot-config";
import { DoseSlot } from "@/modules/pharmacy/domain/enums/dose-slot.enum";

describe("Sticker Slot Config", () => {
  it("should have exact color mappings for Morning (Red), Afternoon (Green), and Night (Blue)", () => {
    expect(DOSE_SLOT_CONFIG[DoseSlot.MORNING].colorName).toBe("Red");
    expect(DOSE_SLOT_CONFIG[DoseSlot.MORNING].period).toBe("Morning");

    expect(DOSE_SLOT_CONFIG[DoseSlot.AFTERNOON].colorName).toBe("Green");
    expect(DOSE_SLOT_CONFIG[DoseSlot.AFTERNOON].period).toBe("Afternoon");

    expect(DOSE_SLOT_CONFIG[DoseSlot.NIGHT].colorName).toBe("Blue");
    expect(DOSE_SLOT_CONFIG[DoseSlot.NIGHT].period).toBe("Night");
  });

  it("should define before-food mini badge config", () => {
    expect(MINI_BEFORE_FOOD_CONFIG.label).toBe("Before Food");
    expect(MINI_BEFORE_FOOD_CONFIG.text).toBe("Before Food");
  });

  it("should format dose slot names clearly", () => {
    expect(formatDoseSlotName(DoseSlot.MORNING)).toBe("Red (Morning)");
    expect(formatDoseSlotName(DoseSlot.AFTERNOON)).toBe("Green (Afternoon)");
    expect(formatDoseSlotName(DoseSlot.NIGHT)).toBe("Blue (Night)");
  });

  it("should correctly handle multiple physical stickers assigned to a single medicine", () => {
    // Scenario 1: Medicine taken Morning + Night (Twice daily) -> 2 physical stickers
    const stickersBds = getPhysicalStickersForMedicine([DoseSlot.MORNING, DoseSlot.NIGHT], false);
    expect(stickersBds).toHaveLength(2);
    expect(stickersBds[0].colorName).toBe("Red");
    expect(stickersBds[1].colorName).toBe("Blue");
    expect(formatMedicineStickersSummary([DoseSlot.MORNING, DoseSlot.NIGHT], false)).toBe(
      "Red (Morning) + Blue (Night)"
    );

    // Scenario 2: Medicine taken Morning + Night before food -> 3 physical stickers (Red, Blue, Before Food)
    const stickersWithMini = getPhysicalStickersForMedicine(
      [DoseSlot.MORNING, DoseSlot.NIGHT],
      true
    );
    expect(stickersWithMini).toHaveLength(3);
    expect(stickersWithMini[0].colorName).toBe("Red");
    expect(stickersWithMini[1].colorName).toBe("Blue");
    expect(stickersWithMini[2].colorName).toBe("Before Food");
    expect(stickersWithMini[2].text).toBe("Before Food");
    expect(formatMedicineStickersSummary([DoseSlot.MORNING, DoseSlot.NIGHT], true)).toBe(
      "Red (Morning) + Blue (Night) + Before Food"
    );

    // Scenario 3: Medicine taken Three times daily before food -> 4 physical stickers (Red, Green, Blue, Before Food)
    const stickersTds = getPhysicalStickersForMedicine(
      [DoseSlot.MORNING, DoseSlot.AFTERNOON, DoseSlot.NIGHT],
      true
    );
    expect(stickersTds).toHaveLength(4);
    expect(stickersTds.map((s) => s.colorName)).toEqual(["Red", "Green", "Blue", "Before Food"]);
    expect(
      formatMedicineStickersSummary(
        [DoseSlot.MORNING, DoseSlot.AFTERNOON, DoseSlot.NIGHT],
        true
      )
    ).toBe("Red (Morning) + Green (Afternoon) + Blue (Night) + Before Food");
  });
});
