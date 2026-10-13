import { StickerConfirmationRepository } from "@/modules/pharmacy/ports/sticker-confirmation-repository.port";
import { StickerConfirmation } from "@/modules/pharmacy/domain/entities/sticker-confirmation";
import { getSupabaseClient } from "./client";

export class SupabaseStickerConfirmationRepository implements StickerConfirmationRepository {
  async confirm(
    prescriptionMedicineId: string,
    confirmedBy: string
  ): Promise<StickerConfirmation> {
    const client = getSupabaseClient();

    const { data: existing } = await client
      .from("sticker_confirmations")
      .select("*")
      .eq("prescription_medicine_id", prescriptionMedicineId)
      .maybeSingle();

    if (existing) {
      return {
        id: existing.id,
        prescriptionMedicineId: existing.prescription_medicine_id,
        confirmedBy: existing.confirmed_by,
        confirmedAt: existing.confirmed_at,
      };
    }

    const { data, error } = await client
      .from("sticker_confirmations")
      .insert({
        prescription_medicine_id: prescriptionMedicineId,
        confirmed_by: confirmedBy,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to confirm sticker: ${error?.message}`);
    }

    return {
      id: data.id,
      prescriptionMedicineId: data.prescription_medicine_id,
      confirmedBy: data.confirmed_by,
      confirmedAt: data.confirmed_at,
    };
  }

  async findByMedicineId(
    prescriptionMedicineId: string
  ): Promise<StickerConfirmation | null> {
    const client = getSupabaseClient();
    const { data } = await client
      .from("sticker_confirmations")
      .select("*")
      .eq("prescription_medicine_id", prescriptionMedicineId)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      prescriptionMedicineId: data.prescription_medicine_id,
      confirmedBy: data.confirmed_by,
      confirmedAt: data.confirmed_at,
    };
  }

  async findByPrescriptionId(
    prescriptionId: string
  ): Promise<StickerConfirmation[]> {
    const client = getSupabaseClient();
    const { data: meds } = await client
      .from("prescription_medicines")
      .select("id")
      .eq("prescription_id", prescriptionId);

    if (!meds || meds.length === 0) return [];

    const medIds = meds.map((m) => m.id);
    const { data } = await client
      .from("sticker_confirmations")
      .select("*")
      .in("prescription_medicine_id", medIds);

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      prescriptionMedicineId: row.prescription_medicine_id,
      confirmedBy: row.confirmed_by,
      confirmedAt: row.confirmed_at,
    }));
  }
}
