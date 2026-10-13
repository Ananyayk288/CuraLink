import { InventoryFreshness } from "../enums/inventory-freshness.enum";

export interface FreshnessCalculationResult {
  freshness: InventoryFreshness;
  hoursSinceUpdate: number;
  isEstimate: boolean;
  label: string;
}

export function calculateInventoryFreshness(
  lastUpdatedAtIso: string,
  currentDate: Date = new Date(),
  freshHoursThreshold: number = 24,
  agingHoursThreshold: number = 72
): FreshnessCalculationResult {
  const lastUpdate = new Date(lastUpdatedAtIso);
  const diffMs = Math.max(0, currentDate.getTime() - lastUpdate.getTime());
  const hoursSinceUpdate = Math.round(diffMs / (1000 * 60 * 60));

  if (hoursSinceUpdate <= freshHoursThreshold) {
    return {
      freshness: InventoryFreshness.FRESH,
      hoursSinceUpdate,
      isEstimate: false,
      label: "Fresh (Audited within 24h)",
    };
  }

  if (hoursSinceUpdate <= agingHoursThreshold) {
    return {
      freshness: InventoryFreshness.AGING,
      hoursSinceUpdate,
      isEstimate: true,
      label: "Aging (Audit recommended)",
    };
  }

  return {
    freshness: InventoryFreshness.STALE,
    hoursSinceUpdate,
    isEstimate: true,
    label: "Stale (Physical verification required)",
  };
}
