import { LookupPatientActivePrescriptionUseCase, PatientLookupResult } from "./lookup-patient-active-prescription.use-case";
import { PrescriptionMedicine } from "../domain/entities/prescription";
import { DispenseEvent } from "../domain/entities/dispense-event";
import { DoseSlot } from "../domain/enums/dose-slot.enum";
import { InventoryBatch } from "../domain/entities/inventory-batch";

export interface EnrichedMedicineLine {
  medicine: PrescriptionMedicine;
  stickerPlan: {
    slots: DoseSlot[];
    beforeFood: boolean;
  } | null;
  isStickerConfirmed: boolean;
  availableBatches: InventoryBatch[];
  dispenseEvent?: DispenseEvent;
  isDispensed: boolean;
}

export type PatientActiveWorkspaceData = PatientLookupResult;

export class GetPatientActivePrescriptionUseCase {
  constructor(private readonly lookupUseCase: LookupPatientActivePrescriptionUseCase) {}

  async execute(patientId: string, token?: string): Promise<PatientActiveWorkspaceData> {
    return this.lookupUseCase.execute(patientId, token);
  }
}
