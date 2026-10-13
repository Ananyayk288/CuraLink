import { Prescription, PrescriptionMedicine } from "@/modules/pharmacy/domain/entities/prescription";
import { PatientSummary } from "@/modules/pharmacy/domain/entities/patient-summary";
import { PrescriptionStatus } from "@/modules/pharmacy/domain/enums/prescription-status.enum";
import { DoseSlot } from "@/modules/pharmacy/domain/enums/dose-slot.enum";

export interface SupabaseActivePrescriptionRow {
  prescription_id: string;
  patient_id: string;
  patient_display_name: string;
  requires_stickers: boolean;
  preferred_language: string;
  device_type: "SMARTPHONE" | "FEATURE_PHONE";
  doctor_id: string;
  doctor_name: string;
  hospital_id: string;
  status: string;
  revision: number;
  parent_prescription_id: string | null;
  committed_at: string;
}

export interface SupabasePrescriptionMedicineRow {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  dose_slots?: string[];
  before_food?: boolean;
  quantity_prescribed?: number;
}

export function mapSupabaseToPatientSummary(row: SupabaseActivePrescriptionRow): PatientSummary {
  return {
    id: row.patient_id,
    displayName: row.patient_display_name,
    requiresStickers: row.requires_stickers,
    preferredLanguage: row.preferred_language,
    deviceType: row.device_type,
  };
}

export function mapSupabaseToPrescription(
  row: SupabaseActivePrescriptionRow,
  medicines: SupabasePrescriptionMedicineRow[]
): Prescription {
  return {
    id: row.prescription_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    hospitalId: row.hospital_id,
    status: row.status as PrescriptionStatus,
    revision: row.revision,
    parentPrescriptionId: row.parent_prescription_id || undefined,
    committedAt: row.committed_at,
    createdAt: row.committed_at,
    medicines: medicines.map((m) => ({
      id: m.id,
      prescriptionId: m.prescription_id,
      medicineName: m.medicine_name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      doseSlots: (m.dose_slots || []) as DoseSlot[],
      beforeFood: Boolean(m.before_food),
      quantityPrescribed: m.quantity_prescribed || 30,
    })),
  };
}
