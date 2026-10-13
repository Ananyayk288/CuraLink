import { PrescriptionReadPort } from "@/modules/pharmacy/ports/prescription-read.port";
import { DevPrescriptionMutationPort } from "@/modules/pharmacy/application/dev-tools/dev-commit-superseding-revision.use-case";
import { Prescription } from "@/modules/pharmacy/domain/entities/prescription";
import { PatientSummary } from "@/modules/pharmacy/domain/entities/patient-summary";
import { getSupabaseClient } from "./client";
import {
  SupabaseActivePrescriptionRow,
  SupabasePrescriptionMedicineRow,
  mapSupabaseToPatientSummary,
  mapSupabaseToPrescription,
} from "./mappers/prescription.mapper";

export class SupabasePrescriptionRepository
  implements PrescriptionReadPort, DevPrescriptionMutationPort
{
  async getActiveCommittedByPatientId(
    patientId: string
  ): Promise<{ prescription: Prescription; patient: PatientSummary } | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("pharmacy_active_prescriptions")
      .select("*")
      .or(`patient_id.eq.${patientId},uhid.eq.${patientId}`)
      .eq("status", "COMMITTED")
      .order("revision", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const raw = data as SupabaseActivePrescriptionRow;
    const { data: meds } = await client
      .from("prescription_medicines")
      .select("*")
      .eq("prescription_id", raw.prescription_id);

    return {
      patient: mapSupabaseToPatientSummary(raw),
      prescription: mapSupabaseToPrescription(
        raw,
        (meds as SupabasePrescriptionMedicineRow[]) || []
      ),
    };
  }

  async getPrescriptionById(prescriptionId: string): Promise<Prescription | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("pharmacy_active_prescriptions")
      .select("*")
      .eq("prescription_id", prescriptionId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const raw = data as SupabaseActivePrescriptionRow;
    const { data: meds } = await client
      .from("prescription_medicines")
      .select("*")
      .eq("prescription_id", raw.prescription_id);

    return mapSupabaseToPrescription(raw, (meds as SupabasePrescriptionMedicineRow[]) || []);
  }

  async isSuperseded(prescriptionId: string): Promise<boolean> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("pharmacy_active_prescriptions")
      .select("status, patient_id, revision")
      .eq("prescription_id", prescriptionId)
      .single();

    if (!data) return false;
    if (data.status === "SUPERSEDED") return true;

    const { data: newer } = await client
      .from("pharmacy_active_prescriptions")
      .select("prescription_id")
      .eq("patient_id", data.patient_id)
      .gt("revision", data.revision)
      .eq("status", "COMMITTED")
      .limit(1);

    return Boolean(newer && newer.length > 0);
  }

  async isRevisedFromPartiallyDispensed(prescriptionId: string): Promise<boolean> {
    const client = getSupabaseClient();
    const { data: presc } = await client
      .from("pharmacy_active_prescriptions")
      .select("parent_prescription_id")
      .eq("prescription_id", prescriptionId)
      .single();

    if (!presc || !presc.parent_prescription_id) return false;

    const { data: dispenses } = await client
      .from("dispense_events")
      .select("id")
      .eq("prescription_id", presc.parent_prescription_id)
      .limit(1);

    return Boolean(dispenses && dispenses.length > 0);
  }

  async commitNewRevision(
    previousPrescriptionId: string,
    newMedicines?: { medicineName: string; dosage: string; frequency: string; duration: string }[]
  ): Promise<Prescription> {
    const client = getSupabaseClient();
    // In live Supabase, calls the security-definer function supersede_committed_prescription
    await client.rpc("supersede_committed_prescription", {
      p_prescription_id: previousPrescriptionId,
      p_doctor_id: "a0000001-0000-0000-0000-000000000002",
    });

    const active = await this.getPrescriptionById(previousPrescriptionId);
    if (!active) throw new Error("Prescription not found");
    return active;
  }
}
