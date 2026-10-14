import { Prescription } from "../domain/entities/prescription";
import { PatientSummary } from "../domain/entities/patient-summary";

export interface PrescriptionReadPort {
  getActiveCommittedByPatientId(
    patientId: string
  ): Promise<{ prescription: Prescription; patient: PatientSummary } | null>;
  getPrescriptionById(prescriptionId: string): Promise<Prescription | null>;
  isSuperseded(prescriptionId: string): Promise<boolean>;
  isRevisedFromPartiallyDispensed(prescriptionId: string): Promise<boolean>;
}
