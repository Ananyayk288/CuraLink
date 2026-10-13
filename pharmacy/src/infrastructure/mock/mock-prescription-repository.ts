import { PrescriptionReadPort } from "@/modules/pharmacy/ports/prescription-read.port";
import { DevPrescriptionMutationPort } from "@/modules/pharmacy/application/dev-tools/dev-commit-superseding-revision.use-case";
import { Prescription } from "@/modules/pharmacy/domain/entities/prescription";
import { PatientSummary } from "@/modules/pharmacy/domain/entities/patient-summary";
import { PrescriptionStatus } from "@/modules/pharmacy/domain/enums/prescription-status.enum";
import { SEED_PRESCRIPTIONS, DoctorPrescriptionRecord } from "./seed/mock-prescriptions.seed";
import { SEED_PATIENTS } from "./seed/mock-patients.seed";
import { DispensingRepository } from "@/modules/pharmacy/ports/dispensing-repository.port";

import { DoseSlot } from "@/modules/pharmacy/domain/enums/dose-slot.enum";

export class MockPrescriptionRepository implements DevPrescriptionMutationPort {
  private prescriptions: DoctorPrescriptionRecord[] = JSON.parse(
    JSON.stringify(SEED_PRESCRIPTIONS)
  );
  private dispensingRepo?: DispensingRepository;

  setDispensingRepository(repo: DispensingRepository) {
    this.dispensingRepo = repo;
  }

  // Scopes patient record to privacy-compliant PatientSummary
  private mapToPatientSummary(patientId: string): PatientSummary | null {
    const raw = SEED_PATIENTS.find((p) => p.id === patientId);
    if (!raw) return null;

    return {
      id: raw.id,
      displayName: raw.fullName,
      requiresStickers: raw.literacyStatus === "ILLITERATE",
      preferredLanguage: raw.preferredLanguage,
      deviceType: raw.deviceType,
    };
  }

  // Scopes DoctorPrescriptionRecord to clean Prescription (stripping all diagnosis & notes)
  private mapToScopedPrescription(raw: DoctorPrescriptionRecord): Prescription {
    return {
      id: raw.id,
      patientId: raw.patientId,
      doctorId: raw.doctorId,
      doctorName: raw.doctorName,
      hospitalId: raw.hospitalId,
      status: raw.status,
      revision: raw.revision,
      parentPrescriptionId: raw.parentPrescriptionId,
      committedAt: raw.committedAt || raw.createdAt,
      createdAt: raw.createdAt,
      medicines: raw.medicines.map((m) => ({
        id: m.id,
        prescriptionId: m.prescriptionId,
        medicineName: m.medicineName,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        doseSlots: m.doseSlots || [],
        beforeFood: m.beforeFood ?? false,
        quantityPrescribed: m.quantityPrescribed || 30,
      })),
    };
  }

  async getActiveCommittedByPatientId(
    patientId: string
  ): Promise<{ prescription: Prescription; patient: PatientSummary } | null> {
    const patientSummary = this.mapToPatientSummary(patientId);
    if (!patientSummary) return null;

    const patientPrescriptions = this.prescriptions.filter((p) => p.patientId === patientId);
    // ONLY COMMITTED revisions. Rejects DRAFT and SUPERSEDED!
    const committedRevisions = patientPrescriptions
      .filter((p) => p.status === PrescriptionStatus.COMMITTED)
      .sort((a, b) => b.revision - a.revision);

    const active = committedRevisions[0];
    if (!active) return null;

    return {
      prescription: this.mapToScopedPrescription(active),
      patient: patientSummary,
    };
  }

  async getPrescriptionById(prescriptionId: string): Promise<Prescription | null> {
    const record = this.prescriptions.find((p) => p.id === prescriptionId);
    if (!record) return null;
    return this.mapToScopedPrescription(record);
  }

  async isSuperseded(prescriptionId: string): Promise<boolean> {
    const current = this.prescriptions.find((p) => p.id === prescriptionId);
    if (!current) return false;
    if (current.status === PrescriptionStatus.SUPERSEDED) return true;

    // Check if there is any newer committed revision for the same patient
    const newer = this.prescriptions.some(
      (p) =>
        p.patientId === current.patientId &&
        p.revision > current.revision &&
        p.status === PrescriptionStatus.COMMITTED
    );
    return newer;
  }

  async isRevisedFromPartiallyDispensed(prescriptionId: string): Promise<boolean> {
    const current = this.prescriptions.find((p) => p.id === prescriptionId);
    if (!current || !current.parentPrescriptionId) return false;

    if (this.dispensingRepo) {
      const parentDispenses = await this.dispensingRepo.findByPrescriptionId(
        current.parentPrescriptionId
      );
      return parentDispenses.length > 0;
    }

    return false;
  }

  // Developer Simulation Port: simulates Doctor committing a superseding revision
  async commitNewRevision(
    previousPrescriptionId: string,
    newMedicines?: { medicineName: string; dosage: string; frequency: string; duration: string }[]
  ): Promise<Prescription> {
    const prev = this.prescriptions.find((p) => p.id === previousPrescriptionId);
    if (!prev) {
      throw new Error(`Prescription ${previousPrescriptionId} not found.`);
    }

    // Mark previous as SUPERSEDED
    prev.status = PrescriptionStatus.SUPERSEDED;

    const newRevisionNumber = prev.revision + 1;
    const newPrescriptionId = `c0000001-0000-0000-0000-${String(
      this.prescriptions.length + 1
    ).padStart(12, "0")}`;

    const medicinesList = newMedicines
      ? newMedicines.map((m, idx) => ({
          id: `d0000001-0000-0000-0000-${String(Date.now() + idx).slice(-12)}`,
          prescriptionId: newPrescriptionId,
          medicineName: m.medicineName,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          doseSlots: [DoseSlot.MORNING, DoseSlot.NIGHT],
          beforeFood: false,
          quantityPrescribed: 30,
        }))
      : prev.medicines.map((m, idx) => ({
          ...m,
          id: `d0000001-0000-0000-0000-${String(Date.now() + idx).slice(-12)}`,
          prescriptionId: newPrescriptionId,
          doseSlots: m.doseSlots || [DoseSlot.MORNING, DoseSlot.NIGHT],
          beforeFood: m.beforeFood ?? false,
          quantityPrescribed: m.quantityPrescribed || 30,
        }));

    const newRecord: DoctorPrescriptionRecord = {
      id: newPrescriptionId,
      patientId: prev.patientId,
      doctorId: prev.doctorId,
      doctorName: prev.doctorName,
      hospitalId: prev.hospitalId,
      status: PrescriptionStatus.COMMITTED,
      revision: newRevisionNumber,
      parentPrescriptionId: prev.id,
      committedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      medicines: medicinesList,
      diagnosis: `${prev.diagnosis} (Revised)`,
      consultationNotes: "Revised by doctor via simulation.",
      encounterNotes: "Follow-up revised encounter.",
      labFindingsSummary: "Follow-up",
    };

    this.prescriptions.push(newRecord);
    return this.mapToScopedPrescription(newRecord);
  }

  // Test helper: exposes the internal raw doctor record to verify that fields exist on doctor side but are stripped
  getRawDoctorRecordForTesting(prescriptionId: string): DoctorPrescriptionRecord | undefined {
    return this.prescriptions.find((p) => p.id === prescriptionId);
  }
}
