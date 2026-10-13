import { StickerAssignment } from "../domain/entities/sticker-assignment";

export interface StickerRepository {
  findByPrescriptionId?(prescriptionId: string): Promise<StickerAssignment[]>;
  assign?(data: Partial<StickerAssignment>): Promise<StickerAssignment>;
  confirm?(prescriptionMedicineId: string, pharmacistId: string): Promise<StickerAssignment>;
  isConfirmed?(prescriptionMedicineId: string): Promise<boolean>;
}
