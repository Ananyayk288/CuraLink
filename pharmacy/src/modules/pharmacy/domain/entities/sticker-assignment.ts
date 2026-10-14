export interface StickerAssignment {
  id: string;
  prescriptionMedicineId: string;
  prescriptionId?: string;
  color?: string;
  symbol?: string;
  slots?: string[];
  beforeFood?: boolean;
  assignedBy?: string;
  assignedAt?: string;
  confirmedAt?: string;
}
