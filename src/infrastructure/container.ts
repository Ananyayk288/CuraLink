import { AuthProvider } from "@/core/ports/auth-provider.port";
import { AuditLogRepository } from "@/core/ports/audit-log-repository.port";
import { EventPublisher } from "@/core/ports/event-publisher.port";
import { Clock } from "@/core/ports/clock.port";

import { PrescriptionReadPort } from "@/modules/pharmacy/ports/prescription-read.port";
import { StickerConfirmationRepository } from "@/modules/pharmacy/ports/sticker-confirmation-repository.port";
import { DispensingRepository } from "@/modules/pharmacy/ports/dispensing-repository.port";
import { InventoryRepository } from "@/modules/pharmacy/ports/inventory-repository.port";

// Mock implementations
import { MockAuthProvider } from "./mock/mock-auth-provider";
import { MockPrescriptionRepository } from "./mock/mock-prescription-repository";
import { MockStickerConfirmationRepository } from "./mock/mock-sticker-confirmation-repository";
import { MockDispensingRepository } from "./mock/mock-dispensing-repository";
import { MockInventoryRepository } from "./mock/mock-inventory-repository";
import { MockAuditLogRepository } from "./mock/mock-audit-log-repository";
import { MockEventPublisher } from "./mock/mock-event-publisher";
import { SystemClock } from "./mock/system-clock";

// Supabase implementations
import { SupabaseAuthProvider } from "./supabase/supabase-auth-provider";
import { SupabasePrescriptionRepository } from "./supabase/supabase-prescription-repository";
import { SupabaseStickerConfirmationRepository } from "./supabase/supabase-sticker-confirmation-repository";
import { SupabaseDispensingRepository } from "./supabase/supabase-dispensing-repository";
import { SupabaseInventoryRepository } from "./supabase/supabase-inventory-repository";
import { SupabaseAuditLogRepository } from "./supabase/supabase-audit-log-repository";

// Use cases
import { LookupPatientActivePrescriptionUseCase } from "@/modules/pharmacy/application/lookup-patient-active-prescription.use-case";
import { GetPatientActivePrescriptionUseCase } from "@/modules/pharmacy/application/get-patient-active-prescription.use-case";
import { ConfirmStickerUseCase } from "@/modules/pharmacy/application/confirm-sticker.use-case";
import { DispensePrescriptionUseCase } from "@/modules/pharmacy/application/dispense-prescription.use-case";
import { GetInventoryUseCase } from "@/modules/pharmacy/application/get-inventory.use-case";
import { UpdateInventoryUseCase } from "@/modules/pharmacy/application/update-inventory.use-case";
import { GetReceiptUseCase } from "@/modules/pharmacy/application/get-receipt.use-case";
import { GetPharmacistActivityUseCase } from "@/modules/pharmacy/application/get-pharmacist-activity.use-case";
import {
  DevCommitSupersedingRevisionUseCase,
  DevPrescriptionMutationPort,
} from "@/modules/pharmacy/application/dev-tools/dev-commit-superseding-revision.use-case";

export interface ServiceContainer {
  authProvider: AuthProvider;
  auditLogRepository: AuditLogRepository;
  eventPublisher: EventPublisher;
  clock: Clock;

  prescriptionReadPort: PrescriptionReadPort;
  devPrescriptionMutationPort: DevPrescriptionMutationPort;
  stickerConfirmationRepository: StickerConfirmationRepository;
  dispensingRepository: DispensingRepository;
  inventoryRepository: InventoryRepository;

  // Use cases
  lookupPatientActivePrescriptionUseCase: LookupPatientActivePrescriptionUseCase;
  getPatientActivePrescriptionUseCase: GetPatientActivePrescriptionUseCase;
  confirmStickerUseCase: ConfirmStickerUseCase;
  dispensePrescriptionUseCase: DispensePrescriptionUseCase;
  getInventoryUseCase: GetInventoryUseCase;
  updateInventoryUseCase: UpdateInventoryUseCase;
  getReceiptUseCase: GetReceiptUseCase;
  getPharmacistActivityUseCase: GetPharmacistActivityUseCase;
  devCommitSupersedingRevisionUseCase: DevCommitSupersedingRevisionUseCase;
}

let containerInstance: ServiceContainer | null = null;

export function getContainer(): ServiceContainer {
  if (containerInstance) return containerInstance;

  const provider = (process.env.DATA_PROVIDER || "mock").toLowerCase();

  // Core cross-cutting adapters
  const clock = new SystemClock();
  const eventPublisher = new MockEventPublisher();

  let authProvider: AuthProvider;
  let auditLogRepository: AuditLogRepository;
  let prescriptionReadPort: PrescriptionReadPort;
  let devPrescriptionMutationPort: DevPrescriptionMutationPort;
  let stickerConfirmationRepository: StickerConfirmationRepository;
  let dispensingRepository: DispensingRepository;
  let inventoryRepository: InventoryRepository;

  if (provider === "supabase") {
    authProvider = new SupabaseAuthProvider();
    auditLogRepository = new SupabaseAuditLogRepository();
    const supaPrescRepo = new SupabasePrescriptionRepository();
    prescriptionReadPort = supaPrescRepo;
    devPrescriptionMutationPort = supaPrescRepo;
    stickerConfirmationRepository = new SupabaseStickerConfirmationRepository();
    dispensingRepository = new SupabaseDispensingRepository();
    inventoryRepository = new SupabaseInventoryRepository();
  } else {
    // Default Mock Provider
    authProvider = new MockAuthProvider();
    auditLogRepository = new MockAuditLogRepository();
    const mockPrescRepo = new MockPrescriptionRepository();
    const mockDispRepo = new MockDispensingRepository();
    const mockStickerConfRepo = new MockStickerConfirmationRepository(mockPrescRepo);
    mockPrescRepo.setDispensingRepository(mockDispRepo);

    prescriptionReadPort = mockPrescRepo;
    devPrescriptionMutationPort = mockPrescRepo;
    stickerConfirmationRepository = mockStickerConfRepo;
    dispensingRepository = mockDispRepo;
    inventoryRepository = new MockInventoryRepository();
  }

  const freshHours = parseInt(process.env.FRESH_HOURS_THRESHOLD || "24", 10);
  const agingHours = parseInt(process.env.AGING_HOURS_THRESHOLD || "72", 10);

  const lookupPatientActivePrescriptionUseCase = new LookupPatientActivePrescriptionUseCase(
    prescriptionReadPort,
    stickerConfirmationRepository,
    dispensingRepository,
    inventoryRepository,
    authProvider,
    auditLogRepository,
    clock
  );

  const getPatientActivePrescriptionUseCase = new GetPatientActivePrescriptionUseCase(
    lookupPatientActivePrescriptionUseCase
  );

  const confirmStickerUseCase = new ConfirmStickerUseCase(
    stickerConfirmationRepository,
    authProvider,
    auditLogRepository,
    clock
  );

  const dispensePrescriptionUseCase = new DispensePrescriptionUseCase(
    prescriptionReadPort,
    dispensingRepository,
    inventoryRepository,
    stickerConfirmationRepository,
    authProvider,
    auditLogRepository,
    eventPublisher,
    clock
  );

  const getInventoryUseCase = new GetInventoryUseCase(
    inventoryRepository,
    authProvider,
    clock,
    freshHours,
    agingHours
  );

  const updateInventoryUseCase = new UpdateInventoryUseCase(
    inventoryRepository,
    authProvider,
    auditLogRepository,
    eventPublisher,
    clock
  );

  const getReceiptUseCase = new GetReceiptUseCase(
    dispensingRepository,
    stickerConfirmationRepository,
    prescriptionReadPort,
    authProvider,
    clock
  );

  const getPharmacistActivityUseCase = new GetPharmacistActivityUseCase(
    auditLogRepository,
    authProvider,
    clock
  );

  const devCommitSupersedingRevisionUseCase = new DevCommitSupersedingRevisionUseCase(
    devPrescriptionMutationPort,
    auditLogRepository,
    clock
  );

  containerInstance = {
    authProvider,
    auditLogRepository,
    eventPublisher,
    clock,
    prescriptionReadPort,
    devPrescriptionMutationPort,
    stickerConfirmationRepository,
    dispensingRepository,
    inventoryRepository,
    lookupPatientActivePrescriptionUseCase,
    getPatientActivePrescriptionUseCase,
    confirmStickerUseCase,
    dispensePrescriptionUseCase,
    getInventoryUseCase,
    updateInventoryUseCase,
    getReceiptUseCase,
    getPharmacistActivityUseCase,
    devCommitSupersedingRevisionUseCase,
  };

  return containerInstance;
}
