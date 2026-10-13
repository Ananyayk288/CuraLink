import { StickerConfirmationRepository } from "@/modules/pharmacy/ports/sticker-confirmation-repository.port";
import { StickerConfirmation } from "@/modules/pharmacy/domain/entities/sticker-confirmation";
import { MockPrescriptionRepository } from "./mock-prescription-repository";

export class MockStickerConfirmationRepository implements StickerConfirmationRepository {
  private confirmations: StickerConfirmation[] = [];
  private prescriptionRepo?: MockPrescriptionRepository;

  constructor(prescriptionRepo?: MockPrescriptionRepository) {
    this.prescriptionRepo = prescriptionRepo;
  }

  setPrescriptionRepository(repo: MockPrescriptionRepository) {
    this.prescriptionRepo = repo;
  }

  async confirm(prescriptionMedicineId: string, confirmedBy: string): Promise<StickerConfirmation> {
    const existing = this.confirmations.find(
      (c) => c.prescriptionMedicineId === prescriptionMedicineId
    );
    if (existing) {
      return { ...existing };
    }

    const record: StickerConfirmation = {
      id: `stk-conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      prescriptionMedicineId,
      confirmedBy,
      confirmedAt: new Date().toISOString(),
    };

    this.confirmations.push(record);
    return { ...record };
  }

  async findByMedicineId(prescriptionMedicineId: string): Promise<StickerConfirmation | null> {
    const found = this.confirmations.find(
      (c) => c.prescriptionMedicineId === prescriptionMedicineId
    );
    return found ? { ...found } : null;
  }

  async findByPrescriptionId(prescriptionId: string): Promise<StickerConfirmation[]> {
    if (this.prescriptionRepo) {
      const rx = await this.prescriptionRepo.getPrescriptionById(prescriptionId);
      if (rx) {
        const medIds = new Set(rx.medicines.map((m) => m.id));
        return this.confirmations
          .filter((c) => medIds.has(c.prescriptionMedicineId))
          .map((c) => ({ ...c }));
      }
    }
    return [...this.confirmations];
  }

  reset(): void {
    this.confirmations = [];
  }
}
