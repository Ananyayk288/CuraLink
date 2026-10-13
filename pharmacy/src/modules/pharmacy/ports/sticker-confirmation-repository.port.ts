import { StickerConfirmation } from "../domain/entities/sticker-confirmation";

export interface StickerConfirmationRepository {
  confirm(prescriptionMedicineId: string, confirmedBy: string): Promise<StickerConfirmation>;
  findByMedicineId(prescriptionMedicineId: string): Promise<StickerConfirmation | null>;
  findByPrescriptionId(prescriptionId: string): Promise<StickerConfirmation[]>;
}
