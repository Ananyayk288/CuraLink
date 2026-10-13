import { describe, it, expect, beforeEach } from "vitest";
import { getContainer } from "@/infrastructure/container";
import { MockPrescriptionRepository } from "@/infrastructure/mock/mock-prescription-repository";

describe("Privacy and Least Privilege Scoping", () => {
  const container = getContainer();

  it("proves that doctor-side confidential fields exist in storage but are strictly stripped from the Pharmacy DTO", async () => {
    // 1. Inspect the raw doctor-side record to prove confidential notes DO exist in the backend
    const mockRepo = container.prescriptionReadPort as MockPrescriptionRepository;
    const rawDoctorRecord = mockRepo.getRawDoctorRecordForTesting("c0000001-0000-0000-0000-000000000001");

    expect(rawDoctorRecord).toBeDefined();
    expect(rawDoctorRecord?.diagnosis).toContain("Uncontrolled Type 2 Diabetes Mellitus");
    expect(rawDoctorRecord?.consultationNotes).toContain("high fasting glucose");
    expect(rawDoctorRecord?.psychiatricEvaluation).toContain("Mild anxiety");
    expect(rawDoctorRecord?.encounterNotes).toContain("Attended with son Ramesh");

    // 2. Fetch the patient active workspace through the Pharmacy use case
    const sureshPatientId = "AV-000001";
    const pharmacyWorkspace = await container.getPatientActivePrescriptionUseCase.execute(sureshPatientId);

    // 3. Verify permitted fields ARE returned
    expect(pharmacyWorkspace.patient.displayName).toBe("Suresh Patil");
    expect(pharmacyWorkspace.patient.requiresStickers).toBe(true);
    expect(pharmacyWorkspace.patient.preferredLanguage).toBe("hi-IN");
    expect(pharmacyWorkspace.prescription.doctorName).toBe("Dr. Amit Sen, MD");
    expect(pharmacyWorkspace.prescription.revision).toBe(1);
    expect(pharmacyWorkspace.medicineLines.length).toBe(3);

    // 4. VERIFY CONFIDENTIAL DATA IS STRICTLY STRIPPED / UNREACHABLE
    const serialized = JSON.stringify(pharmacyWorkspace);
    expect(serialized).not.toContain("Uncontrolled Type 2 Diabetes Mellitus");
    expect(serialized).not.toContain("high fasting glucose");
    expect(serialized).not.toContain("Mild anxiety");
    expect(serialized).not.toContain("Attended with son Ramesh");
    expect(serialized).not.toContain("Penicillin"); // confidential allergy list not in pharmacy summary
    expect(serialized).not.toContain("Ramesh Patil (Son)"); // confidential guardian contact

    // Type inspection to verify fields do not exist on the DTO
    const prescRecord = pharmacyWorkspace.prescription as Record<string, unknown>;
    expect(prescRecord.diagnosis).toBeUndefined();
    expect(prescRecord.consultationNotes).toBeUndefined();
    expect(prescRecord.psychiatricEvaluation).toBeUndefined();
    expect(prescRecord.encounterNotes).toBeUndefined();
  });
});
