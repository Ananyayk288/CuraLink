import { InventoryRepository } from "../ports/inventory-repository.port";
import { AuthProvider } from "@/core/ports/auth-provider.port";
import { AuditLogRepository } from "@/core/ports/audit-log-repository.port";
import { EventPublisher } from "@/core/ports/event-publisher.port";
import { Clock } from "@/core/ports/clock.port";
import { Role } from "@/core/domain/enums/role.enum";
import { AuditAction } from "@/core/domain/enums/audit-action.enum";
import { NotFoundError, ValidationError } from "@/core/domain/errors/domain-error";
import { InventoryItem } from "../domain/entities/inventory-item";
import { InventoryUpdatedEvent } from "../domain/events/inventory-updated.event";

export interface UpdateInventoryDto {
  inventoryItemId: string;
  newStockQuantity: number;
  reason: string;
}

export class UpdateInventoryUseCase {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly authProvider: AuthProvider,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly clock: Clock
  ) {}

  async execute(dto: UpdateInventoryDto, token?: string): Promise<InventoryItem> {
    const user = await this.authProvider.validateRole(Role.PHARMACY, token);

    if (dto.newStockQuantity < 0) {
      throw new ValidationError("Stock quantity cannot be negative.");
    }

    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new ValidationError("A reason must be provided for manual stock updates.");
    }

    const currentItem = await this.inventoryRepository.findById(dto.inventoryItemId);
    if (!currentItem) {
      throw new NotFoundError(`Inventory item ${dto.inventoryItemId} not found.`);
    }

    const previousQuantity = currentItem.stockQuantity;
    const updatedItem = await this.inventoryRepository.updateStock(
      dto.inventoryItemId,
      dto.newStockQuantity
    );

    await this.eventPublisher.publish(
      new InventoryUpdatedEvent({
        inventoryItemId: updatedItem.id,
        medicineName: updatedItem.medicineName,
        previousQuantity,
        newQuantity: dto.newStockQuantity,
        reason: dto.reason,
        updatedBy: user.id,
      })
    );

    await this.auditLogRepository.append({
      actorId: user.id,
      actorRole: user.role,
      actionType: AuditAction.INVENTORY_UPDATED,
      targetEntity: "INVENTORY_ITEM",
      targetId: updatedItem.id,
      timestamp: this.clock.nowIso(),
      metadata: {
        medicineName: updatedItem.medicineName,
        previousQuantity,
        newQuantity: dto.newStockQuantity,
        reason: dto.reason,
      },
    });

    return updatedItem;
  }
}
