import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { PatientLookupSchema } from "@/modules/pharmacy/interface/validators/pharmacy.schemas";
import { extractAuthToken, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = PatientLookupSchema.parse(body);
    const token = extractAuthToken(req);

    const container = getContainer();
    const result = await container.lookupPatientActivePrescriptionUseCase.execute(
      validated.patientId,
      token
    );

    // Secure response: NEVER cache or store patient or prescription data offline
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
