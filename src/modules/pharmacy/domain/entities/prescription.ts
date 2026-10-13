import { PrescriptionStatus } from "../enums/prescription-status.enum";
import { DoseSlot } from "../enums/dose-slot.enum";

export interface PrescriptionMedicine {
  id: string;
  prescriptionId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  doseSlots: DoseSlot[];
  beforeFood: boolean;
  quantityPrescribed: number;
  // Note: Clinical diagnoses and consultation notes are strictly excluded in pharmacy domain
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  status: PrescriptionStatus;
  revision: number;
  parentPrescriptionId?: string;
  committedAt: string; // ISO UTC
  createdAt: string;
  medicines: PrescriptionMedicine[];
}
