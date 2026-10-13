import { PrescriptionStatus } from "@/modules/pharmacy/domain/enums/prescription-status.enum";
import { DoseSlot } from "@/modules/pharmacy/domain/enums/dose-slot.enum";

export interface DoctorPrescriptionRecord {
  id: string;
  patientId: string; // e.g. "AV-000001"
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  status: PrescriptionStatus;
  revision: number;
  parentPrescriptionId?: string;
  committedAt?: string;
  createdAt: string;
  medicines: {
    id: string;
    prescriptionId: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    doseSlots: DoseSlot[];
    beforeFood: boolean;
    quantityPrescribed: number;
  }[];
  // CONFIDENTIAL DOCTOR-SIDE FIELDS: Must NEVER leak to Pharmacy
  diagnosis: string;
  consultationNotes: string;
  psychiatricEvaluation?: string;
  encounterNotes: string;
  labFindingsSummary: string;
}

export const SEED_PRESCRIPTIONS: DoctorPrescriptionRecord[] = [
  // 1. Suresh Patil (AV-000001): Active Committed Revision 1 (Needs Stickers)
  {
    id: "c0000001-0000-0000-0000-000000000001",
    patientId: "AV-000001",
    doctorId: "a0000001-0000-0000-0000-000000000002",
    doctorName: "Dr. Amit Sen, MD",
    hospitalId: "fac-city-general",
    status: PrescriptionStatus.COMMITTED,
    revision: 1,
    committedAt: "2026-10-10T09:30:00Z",
    createdAt: "2026-10-10T09:15:00Z",
    medicines: [
      {
        id: "d0000001-0000-0000-0000-000000000001",
        prescriptionId: "c0000001-0000-0000-0000-000000000001",
        medicineName: "Metformin 500mg",
        dosage: "500 mg",
        frequency: "Twice daily after meals",
        duration: "30 days",
        doseSlots: [DoseSlot.MORNING, DoseSlot.NIGHT], // Red + Blue (Multi-color on single medicine!)
        beforeFood: false,
        quantityPrescribed: 60,
      },
      {
        id: "d0000001-0000-0000-0000-000000000002",
        prescriptionId: "c0000001-0000-0000-0000-000000000001",
        medicineName: "Glimepiride 1mg",
        dosage: "1 mg",
        frequency: "Once daily before breakfast",
        duration: "30 days",
        doseSlots: [DoseSlot.MORNING], // Red + Mini Before Food
        beforeFood: true,
        quantityPrescribed: 30,
      },
      {
        id: "d0000001-0000-0000-0000-000000000003",
        prescriptionId: "c0000001-0000-0000-0000-000000000001",
        medicineName: "Atorvastatin 10mg",
        dosage: "10 mg",
        frequency: "Once daily at night",
        duration: "30 days",
        doseSlots: [DoseSlot.NIGHT], // Blue
        beforeFood: false,
        quantityPrescribed: 30,
      },
    ],
    diagnosis: "Uncontrolled Type 2 Diabetes Mellitus with peripheral neuropathy and dyslipidemia",
    consultationNotes: "Patient has high fasting glucose (190 mg/dL). Discussed dietary restrictions with son.",
    psychiatricEvaluation: "Mild anxiety regarding chronic disease management; cognitive function intact.",
    encounterNotes: "Attended with son Ramesh. Patient cannot read written prescriptions. Advised color sticker coding.",
    labFindingsSummary: "HbA1c 9.2%, Fasting Glucose 190, Serum Creatinine 1.0",
  },

  // 2. Ananya Sharma (AV-000002): Active Committed Revision 1 (Literate, Standard Packaging)
  {
    id: "c0000001-0000-0000-0000-000000000002",
    patientId: "AV-000002",
    doctorId: "a0000001-0000-0000-0000-000000000002",
    doctorName: "Dr. Amit Sen, MD",
    hospitalId: "fac-city-general",
    status: PrescriptionStatus.COMMITTED,
    revision: 1,
    committedAt: "2026-10-11T11:00:00Z",
    createdAt: "2026-10-11T10:45:00Z",
    medicines: [
      {
        id: "d0000001-0000-0000-0000-000000000004",
        prescriptionId: "c0000001-0000-0000-0000-000000000002",
        medicineName: "Amoxicillin 500mg",
        dosage: "500 mg",
        frequency: "Three times daily after food",
        duration: "7 days",
        doseSlots: [DoseSlot.MORNING, DoseSlot.AFTERNOON, DoseSlot.NIGHT], // Red + Yellow + Blue
        beforeFood: false,
        quantityPrescribed: 21,
      },
    ],
    diagnosis: "Acute bacterial sinusitis",
    consultationNotes: "Complained of severe facial pressure and nasal congestion for 10 days.",
    encounterNotes: "Patient understands dosage schedule well. Smartphone reminders enabled.",
    labFindingsSummary: "No labs ordered.",
  },

  // 3. Vikram Rao (AV-000003): Revision 1 (SUPERSEDED, partially dispensed) and Revision 2 (COMMITTED)
  {
    id: "c0000001-0000-0000-0000-000000000003",
    patientId: "AV-000003",
    doctorId: "a0000001-0000-0000-0000-000000000002",
    doctorName: "Dr. Amit Sen, MD",
    hospitalId: "fac-city-general",
    status: PrescriptionStatus.SUPERSEDED,
    revision: 1,
    committedAt: "2026-10-08T14:00:00Z",
    createdAt: "2026-10-08T13:30:00Z",
    medicines: [
      {
        id: "d0000001-0000-0000-0000-000000000005",
        prescriptionId: "c0000001-0000-0000-0000-000000000003",
        medicineName: "Amlodipine 5mg",
        dosage: "5 mg",
        frequency: "Once daily in morning",
        duration: "30 days",
        doseSlots: [DoseSlot.MORNING],
        beforeFood: false,
        quantityPrescribed: 30,
      },
    ],
    diagnosis: "Primary Hypertension",
    consultationNotes: "BP 150/95 mmHg. Initiated monotherapy.",
    encounterNotes: "Patient illiterate. Needs stickers.",
    labFindingsSummary: "BP baseline 150/95",
  },
  {
    id: "c0000001-0000-0000-0000-000000000004",
    patientId: "AV-000003",
    doctorId: "a0000001-0000-0000-0000-000000000002",
    doctorName: "Dr. Amit Sen, MD",
    hospitalId: "fac-city-general",
    status: PrescriptionStatus.COMMITTED,
    revision: 2,
    parentPrescriptionId: "c0000001-0000-0000-0000-000000000003",
    committedAt: "2026-10-12T16:00:00Z",
    createdAt: "2026-10-12T15:45:00Z",
    medicines: [
      {
        id: "d0000001-0000-0000-0000-000000000006",
        prescriptionId: "c0000001-0000-0000-0000-000000000004",
        medicineName: "Amlodipine 10mg",
        dosage: "10 mg",
        frequency: "Once daily in morning",
        duration: "30 days",
        doseSlots: [DoseSlot.MORNING],
        beforeFood: false,
        quantityPrescribed: 30,
      },
    ],
    diagnosis: "Primary Hypertension (Dose escalation)",
    consultationNotes: "BP still elevated (148/92). Increased Amlodipine to 10mg.",
    encounterNotes: "Revised prescription issued to replace revision 1.",
    labFindingsSummary: "BP follow-up 148/92",
  },

  // 4. Rahul Verma (AV-000005): DRAFT Prescription ONLY (Must never appear in pharmacy search)
  {
    id: "c0000001-0000-0000-0000-000000000006",
    patientId: "AV-000005",
    doctorId: "a0000001-0000-0000-0000-000000000002",
    doctorName: "Dr. Amit Sen, MD",
    hospitalId: "fac-city-general",
    status: PrescriptionStatus.DRAFT,
    revision: 1,
    createdAt: "2026-10-13T08:00:00Z",
    medicines: [
      {
        id: "d0000001-0000-0000-0000-000000000008",
        prescriptionId: "c0000001-0000-0000-0000-000000000006",
        medicineName: "Cetirizine 10mg",
        dosage: "10 mg",
        frequency: "Once daily at night",
        duration: "10 days",
        doseSlots: [DoseSlot.NIGHT],
        beforeFood: false,
        quantityPrescribed: 10,
      },
    ],
    diagnosis: "Seasonal Allergic Rhinitis",
    consultationNotes: "Drafted care plan, awaiting lab confirmation before committing.",
    encounterNotes: "Follow-up required.",
    labFindingsSummary: "Pending IgE panel",
  },
];
