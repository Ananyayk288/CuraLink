import { describe, it, expect } from "vitest";
import { calculateInventoryFreshness } from "@/modules/pharmacy/domain/rules/freshness-calculator";
import { InventoryFreshness } from "@/modules/pharmacy/domain/enums/inventory-freshness.enum";

describe("Inventory Freshness Calculator", () => {
  const baseTime = new Date("2026-10-13T12:00:00Z");

  it("should mark item as FRESH if updated within 24 hours", () => {
    const updated4HoursAgo = new Date("2026-10-13T08:00:00Z").toISOString();
    const result = calculateInventoryFreshness(updated4HoursAgo, baseTime, 24, 72);

    expect(result.freshness).toBe(InventoryFreshness.FRESH);
    expect(result.isEstimate).toBe(false);
    expect(result.hoursSinceUpdate).toBe(4);
  });

  it("should mark item as AGING and estimate if updated between 24 and 72 hours ago", () => {
    const updated36HoursAgo = new Date("2026-10-12T00:00:00Z").toISOString();
    const result = calculateInventoryFreshness(updated36HoursAgo, baseTime, 24, 72);

    expect(result.freshness).toBe(InventoryFreshness.AGING);
    expect(result.isEstimate).toBe(true);
    expect(result.hoursSinceUpdate).toBe(36);
  });

  it("should mark item as STALE and estimate if updated more than 72 hours ago", () => {
    const updated96HoursAgo = new Date("2026-10-09T12:00:00Z").toISOString();
    const result = calculateInventoryFreshness(updated96HoursAgo, baseTime, 24, 72);

    expect(result.freshness).toBe(InventoryFreshness.STALE);
    expect(result.isEstimate).toBe(true);
    expect(result.hoursSinceUpdate).toBe(96);
  });
});
