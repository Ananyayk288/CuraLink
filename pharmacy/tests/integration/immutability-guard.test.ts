import { describe, it, expect } from "vitest";
import { DELETE, PUT } from "@/app/api/v1/prescriptions/[id]/route";

describe("Prescription Immutability HTTP Route Guard", () => {
  it("should return HTTP 405 Method Not Allowed on DELETE /api/v1/prescriptions/{id}", async () => {
    const response = await DELETE();
    expect(response.status).toBe(405);

    const body = await response.json();
    expect(body.error.code).toBe("METHOD_NOT_ALLOWED");
    expect(body.error.message).toContain("immutable clinical records");
  });

  it("should return HTTP 405 Method Not Allowed on PUT /api/v1/prescriptions/{id}", async () => {
    const response = await PUT();
    expect(response.status).toBe(405);

    const body = await response.json();
    expect(body.error.code).toBe("METHOD_NOT_ALLOWED");
  });
});
