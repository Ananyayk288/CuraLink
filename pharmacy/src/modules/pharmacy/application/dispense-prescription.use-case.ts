import { PrescriptionReadPort } from "../ports/prescription-read.port";
import { DispensingRepository } from "../ports/dispensing-repository.port";
import { InventoryRepository } from "../ports/inventory-repository.port";
import { StickerConfirmationRepository } from "../ports/sticker-confirmation-repository.port";
import { AuthProvider } from "@/core/ports/auth-provider.port";
import { AuditLogRepository } from "@/core/ports/audit-log-repository.port";
import { EventPublisher } from "@/core/ports/event-publisher.port";
import { Clock } from "@/core/ports/clock.port";
import { Role } from "@/core/domain/enums/role.enum";
import { AuditAction } from "@/core/domain/enums/audit-action.enum";
import { NotFoundError, ValidationError, ConflictError } from "@/core/domain/errors/domain-error";
import { DispenseStatus } from "../domain/enums/dispense-status.enum";
import { PrescriptionStatus } from "../domain/enums/prescription-status.enum";
import { MedicineDispensedWithStickerEvent } from "../domain/events/medicine-dispensed.event";

export interface DispensePrescriptionItemDto {
  prescriptionMedicineId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
}

export interface DispensePrescriptionDto {
  prescriptionId: string;
  items: DispensePrescriptionItemDto[];
  idempotencyKey: string;
}

export interface DispensePrescriptionResult {
  receiptNo: string;
  itemsDispensed: number;
  isIdempotentReplay: boolean;
  lowStockAlerts: string[];
}

export class DispensePrescriptionUseCase {
  constructor(
    private readonly prescriptionReadPort: PrescriptionReadPort,
    private readonly dispensingRepository: DispensingRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly stickerConfirmationRepository: StickerConfirmationRepository,
    private readonly authProvider: AuthProvider,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly clock: Clock
  ) {}

  async execute(
    dto: DispensePrescriptionDto,
    token?: string
  ): Promise<DispensePrescriptionResult> {
    const user = await this.authProvider.validateRole(Role.PHARMACY, token);

    if (!dto.idempotencyKey) {
      throw new ValidationError("Idempotency-Key header is required for dispensing");
    }

    if (!dto.items || dto.items.length === 0) {
      throw new ValidationError("At least one medicine item is required to dispense");
    }

    // 1. Check idempotency: if already processed, return existing receipt without double deduction
    const firstMedId = dto.items[0]?.prescriptionMedicineId;
    const existingEvents =
      (await this.dispensingRepository.findByIdempotencyKey(dto.idempotencyKey)) ||
      (firstMedId
        ? await this.dispensingRepository.findByIdempotencyKey(`${dto.idempotencyKey}-${firstMedId}`)
        : null);

    if (existingEvents) {
      return {
        receiptNo: existingEvents.receiptNo,
        itemsDispensed: dto.items.length,
        isIdempotentReplay: true,
        lowStockAlerts: [],
      };
    }

    // 2. Fetch prescription and verify status
    const prescription = await this.prescriptionReadPort.getPrescriptionById(dto.prescriptionId);
    if (!prescription) {
      throw new NotFoundError(`Prescription ${dto.prescriptionId} not found`);
    }

    if (prescription.status === PrescriptionStatus.SUPERSEDED) {
      throw new ConflictError("Cannot dispense a SUPERSEDED prescription revision");
    }

    // 3. Fetch patient details to check sticker requirement
    const activeData = await this.prescriptionReadPort.getActiveCommittedByPatientId(prescription.patientId);
    const requiresStickers = Boolean(activeData?.patient.requiresStickers);

    // 4. Validate all sticker confirmations if required
    const confirmations = await this.stickerConfirmationRepository.findByPrescriptionId(prescription.id);

    for (const med of prescription.medicines) {
      if (requiresStickers) {
        // If sticker plan missing
        if (!med.doseSlots || med.doseSlots.length === 0) {
          throw new ValidationError(
            `Sticker plan missing for ${med.medicineName}. Contact the prescribing doctor.`
          );
        }
        // If not confirmed
        const isConfirmed = confirmations.some((c) => c.prescriptionMedicineId === med.id);
        if (!isConfirmed) {
          throw new ValidationError(
            `Stickers must be confirmed for all medicines before dispensing. Missing for ${med.medicineName}.`
          );
        }
      }
    }

    // 5. Pre-validate stock and batches for all items
    const today = new Date(this.clock.nowIso().substring(0, 10));
    const lowStockAlerts: string[] = [];

    for (const itemDto of dto.items) {
      const med = prescription.medicines.find((m: { id: string }) => m.id === itemDto.prescriptionMedicineId);
      if (!med) {
        throw new NotFoundError(
          `Medicine ${itemDto.prescriptionMedicineId} not found on prescription`
        );
      }

      // Expiry validation: minimum 30 days
      const expDate = new Date(itemDto.expiryDate);
      if (isNaN(expDate.getTime()) || expDate <= today) {
        throw new ValidationError(`Batch ${itemDto.batchNumber} has expired`);
      }
      const daysRemaining = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (daysRemaining < 30) {
        throw new ValidationError(
          `Batch ${itemDto.batchNumber} has less than 30 days of shelf life remaining (${daysRemaining} days)`
        );
      }

      // Inventory check
      const inventoryItem = await this.inventoryRepository.findByName(med.medicineName);
      if (!inventoryItem) {
        throw new NotFoundError(`Inventory item not found for medicine: ${med.medicineName}`);
      }
      if (inventoryItem.stockQuantity < itemDto.quantity) {
        throw new ValidationError(
          `Insufficient inventory stock for ${med.medicineName}. Available: ${inventoryItem.stockQuantity}, Requested: ${itemDto.quantity}`
        );
      }
    }

    // 6. ATOMIC DISPENSE TRANSACTION
    const nowIso = this.clock.nowIso();
    const cleanId = prescription.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
    const receiptNo = `REC-${prescription.revision}-${cleanId}-${Date.now().toString().slice(-4)}`;

    for (const itemDto of dto.items) {
      const med = prescription.medicines.find((m: { id: string }) => m.id === itemDto.prescriptionMedicineId)!;
      const inventoryItem = (await this.inventoryRepository.findByName(med.medicineName))!;

      // a. Insert dispense_event
      const dispenseEvent = await this.dispensingRepository.saveDispenseEvent({
        prescriptionMedicineId: med.id,
        prescriptionId: prescription.id,
        patientId: prescription.patientId,
        pharmacyId: user.facilityId || "fac-curalink-01",
        medicineName: med.medicineName,
        batchNumber: itemDto.batchNumber,
        expiryDate: itemDto.expiryDate,
        quantity: itemDto.quantity,
        receiptNo,
        status: DispenseStatus.DISPENSED,
        idempotencyKey: `${dto.idempotencyKey}-${med.id}`,
        dispensedBy: user.id,
      });

      // b. Subtract stock quantity from batch and item
      const updatedItem = await this.inventoryRepository.decrementStock(
        inventoryItem.id,
        itemDto.quantity,
        itemDto.batchNumber
      );

      // c. Insert append-only inventory_movements row
      await this.inventoryRepository.recordMovement({
        inventoryItemId: inventoryItem.id,
        change: -itemDto.quantity,
        reason: "DISPENSE",
        dispenseEventId: dispenseEvent.id,
      });

      // d. Check low stock threshold
      if (updatedItem.stockQuantity <= updatedItem.lowStockThreshold) {
        lowStockAlerts.push(
          `Low stock alert: ${med.medicineName} is at ${updatedItem.stockQuantity} (Threshold: ${updatedItem.lowStockThreshold})`
        );
      }

      // e. Publish domain event hook for future telephony service
      await this.eventPublisher.publish(
        new MedicineDispensedWithStickerEvent({
          patientId: prescription.patientId,
          prescriptionMedicineId: med.id,
          slots: med.doseSlots || [],
          beforeFood: Boolean(med.beforeFood),
        })
      );
    }

    // 7. Write audit log entry
    await this.auditLogRepository.append({
      actorId: user.id,
      actorRole: user.role,
      actionType: AuditAction.MEDICINE_DISPENSED,
      targetEntity: "Prescription",
      targetId: prescription.id,
      timestamp: nowIso,
      metadata: {
        receiptNo,
        itemsCount: dto.items.length,
        idempotencyKey: dto.idempotencyKey,
      },
    });

    return {
      receiptNo,
      itemsDispensed: dto.items.length,
      isIdempotentReplay: false,
      lowStockAlerts,
    };
  }
}
