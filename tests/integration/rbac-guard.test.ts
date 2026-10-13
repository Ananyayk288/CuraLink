import { describe, it, expect } from "vitest";
import { getContainer } from "@/infrastructure/container";
import { Role } from "@/core/domain/enums/role.enum";
import { ForbiddenError } from "@/core/domain/errors/domain-error";

describe("Role-Based Access Control (RBAC) Guard", () => {
  const container = getContainer();

  it("should block non-pharmacy roles from executing pharmacy operations", async () => {
    // 1. Sign in as Patient Suresh
    const patientSession = await container.authProvider.signIn({ username: "Suresh Patil" });
    expect(patientSession.user.role).toBe(Role.PATIENT);

    // 2. Attempt to lookup patient active prescription with Patient token -> MUST throw ForbiddenError
    await expect(
      container.lookupPatientActivePrescriptionUseCase.execute("AV-000001", patientSession.token)
    ).rejects.toThrow(ForbiddenError);

    // 3. Attempt to access pharmacy inventory with Patient token -> MUST throw ForbiddenError
    await expect(
      container.getInventoryUseCase.execute(patientSession.token)
    ).rejects.toThrow(ForbiddenError);
  });

  it("should permit PHARMACY role to access pharmacy endpoints", async () => {
    const pharmacySession = await container.authProvider.signIn({ username: "pharmacy" });
    expect(pharmacySession.user.role).toBe(Role.PHARMACY);

    const lookupResult = await container.lookupPatientActivePrescriptionUseCase.execute(
      "AV-000001",
      pharmacySession.token
    );
    expect(lookupResult.patient.id).toBe("AV-000001");
    expect(lookupResult.prescription.status).toBe("COMMITTED");
  });
});
