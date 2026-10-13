import { describe, it, expect, beforeEach } from "vitest";
import { getContainer } from "@/infrastructure/container";
import { AuditAction } from "@/core/domain/enums/audit-action.enum";
import { NotFoundError } from "@/core/domain/errors/domain-error";
import { patientLookupRateLimiter } from "@/lib/rate-limiter";

describe("Patient Lookup Integration Test Suite", () => {
  const container = getContainer();
  let pharmacyToken: string;
  let pharmacyUserId: string;

  beforeEach(async () => {
    const session = await container.authProvider.signIn({ username: "pharmacy" });
    pharmacyToken = session.token;
    pharmacyUserId = session.user.id;

    // Reset rate limiter for test pharmacist
    patientLookupRateLimiter.reset(pharmacyUserId);
  });

  it("should return ONLY the latest COMMITTED prescription for a patient", async () => {
    const result = await container.lookupPatientActivePrescriptionUseCase.execute(
      "AV-000001",
      pharmacyToken
    );

    expect(result.patient.id).toBe("AV-000001");
    expect(result.patient.displayName).toBe("Suresh Patil");
    expect(result.prescription.status).toBe("COMMITTED");
    expect(result.prescription.revision).toBe(1);
    expect(result.medicineLines.length).toBeGreaterThan(0);
  });

  it("should return the latest revision (Rev 2) for Vikram Rao (AV-000003), not obsolete Rev 1", async () => {
    const result = await container.lookupPatientActivePrescriptionUseCase.execute(
      "AV-000003",
      pharmacyToken
    );

    expect(result.patient.id).toBe("AV-000003");
    expect(result.patient.displayName).toBe("Vikram Rao");
    expect(result.prescription.revision).toBe(2);
    expect(result.prescription.status).toBe("COMMITTED");

    // Must flag revised banner because Rev 1 was partly dispensed
    expect(result.prescription.hasRevisedNotice).toBe(true);
    expect(result.prescription.revisedBannerMessage).toBe(
      "This prescription was revised. Dispense only what is shown here."
    );
  });

  it("should throw generic NotFoundError for patient with only DRAFT prescription (AV-000005)", async () => {
    await expect(
      container.lookupPatientActivePrescriptionUseCase.execute("AV-000005", pharmacyToken)
    ).rejects.toThrow(NotFoundError);

    try {
      await container.lookupPatientActivePrescriptionUseCase.execute("AV-000005", pharmacyToken);
    } catch (err: any) {
      expect(err.message).toBe("No active prescription found for this ID");
    }
  });

  it("should throw exact generic NotFoundError for non-existent patient ID", async () => {
    try {
      await container.lookupPatientActivePrescriptionUseCase.execute("AV-999999", pharmacyToken);
      expect.unreachable("Should have thrown NotFoundError");
    } catch (err: any) {
      expect(err).toBeInstanceOf(NotFoundError);
      expect(err.message).toBe("No active prescription found for this ID");
    }
  });

  it("should normalize patient ID with leading/trailing whitespace and lowercase", async () => {
    const result = await container.lookupPatientActivePrescriptionUseCase.execute(
      "  av-000001  ",
      pharmacyToken
    );

    expect(result.patient.id).toBe("AV-000001");
    expect(result.prescription.status).toBe("COMMITTED");
  });

  it("should throw exact generic NotFoundError for empty or whitespace-only input", async () => {
    try {
      await container.lookupPatientActivePrescriptionUseCase.execute("   ", pharmacyToken);
      expect.unreachable("Should have thrown NotFoundError");
    } catch (err: any) {
      expect(err).toBeInstanceOf(NotFoundError);
      expect(err.message).toBe("No active prescription found for this ID");
    }
  });

  it("should audit-log every search attempt with actor, patientId, and found boolean", async () => {
    const beforeLogs = await container.auditLogRepository.findByActorId(pharmacyUserId);
    const beforeCount = beforeLogs.length;

    // Successful search
    await container.lookupPatientActivePrescriptionUseCase.execute("AV-000002", pharmacyToken);

    // Failed search
    try {
      await container.lookupPatientActivePrescriptionUseCase.execute("AV-999999", pharmacyToken);
    } catch {
      // Expected
    }

    const afterLogs = await container.auditLogRepository.findByActorId(pharmacyUserId);
    expect(afterLogs.length).toBe(beforeCount + 2);

    const successfulLog = afterLogs.find(
      (l) => l.actionType === AuditAction.PATIENT_SEARCH_PERFORMED && l.targetId === "AV-000002"
    );
    expect(successfulLog).toBeDefined();
    expect(successfulLog?.metadata?.found).toBe(true);

    const failedLog = afterLogs.find(
      (l) => l.actionType === AuditAction.PATIENT_SEARCH_PERFORMED && l.targetId === "AV-999999"
    );
    expect(failedLog).toBeDefined();
    expect(failedLog?.metadata?.found).toBe(false);
  });

  it("should enforce rate limiting per pharmacist to prevent enumeration", async () => {
    patientLookupRateLimiter.reset(pharmacyUserId);

    // Make rapid requests up to the limit (20)
    for (let i = 0; i < 20; i++) {
      await container.lookupPatientActivePrescriptionUseCase.execute("AV-000001", pharmacyToken);
    }

    // 21st request MUST throw DomainError rate limit exceeded
    await expect(
      container.lookupPatientActivePrescriptionUseCase.execute("AV-000001", pharmacyToken)
    ).rejects.toThrow("Rate limit exceeded");
  });
});
