import { InventoryRepository } from "../ports/inventory-repository.port";
import { AuthProvider } from "@/core/ports/auth-provider.port";
import { Clock } from "@/core/ports/clock.port";
import { Role } from "@/core/domain/enums/role.enum";
import { InventoryItem } from "../domain/entities/inventory-item";
import {
  calculateInventoryFreshness,
  FreshnessCalculationResult,
} from "../domain/rules/freshness-calculator";

export interface EnrichedInventoryItem {
  item: InventoryItem;
  freshness: FreshnessCalculationResult;
  isLowStock: boolean;
}

export interface GetInventoryFilter {
  lowStockOnly?: boolean;
  searchQuery?: string;
}

export class GetInventoryUseCase {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly authProvider: AuthProvider,
    private readonly clock: Clock,
    private readonly freshHours: number = 24,
    private readonly agingHours: number = 72
  ) {}

  async execute(token?: string, filter?: GetInventoryFilter): Promise<EnrichedInventoryItem[]> {
    await this.authProvider.validateRole(Role.PHARMACY, token);
    const items = await this.inventoryRepository.findAll();
    const now = this.clock.now();

    const enriched: EnrichedInventoryItem[] = items.map((item) => {
      const freshness = calculateInventoryFreshness(
        item.lastUpdatedAt,
        now,
        this.freshHours,
        this.agingHours
      );
      const isLowStock = item.stockQuantity <= item.lowStockThreshold;

      return {
        item,
        freshness,
        isLowStock,
      };
    });

    let result = enriched;
    if (filter?.lowStockOnly) {
      result = result.filter((i) => i.isLowStock);
    }

    if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.item.medicineName.toLowerCase().includes(q) ||
          i.item.brandOrGeneric.toLowerCase().includes(q)
      );
    }

    return result;
  }
}
