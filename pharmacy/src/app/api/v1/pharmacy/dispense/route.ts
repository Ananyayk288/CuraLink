import { NextRequest } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { DispensePrescriptionSchema } from "@/modules/pharmacy/interface/validators/pharmacy.schemas";
import { extractAuthToken, apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const idempotencyKey = req.headers.get("Idempotency-Key") || req.headers.get("idempotency-key") || "";
    const body = await req.json();

    const validated = DispensePrescriptionSchema.parse(body);

    const container = getContainer();
    const result = await container.dispensePrescriptionUseCase.execute(
      {
        ...validated,
        idempotencyKey,
      },
      token
    );

    return apiSuccess({
      ...result,
      message: "Medicines given and stock updated successfully",
    });
  } catch (error) {
    return apiError(error);
  }
}
