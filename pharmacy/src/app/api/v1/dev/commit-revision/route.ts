import { NextRequest } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { DevCommitRevisionSchema } from "@/modules/pharmacy/interface/validators/pharmacy.schemas";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ForbiddenError } from "@/core/domain/errors/domain-error";

export async function POST(req: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_DEV_TOOLS !== "true") {
      throw new ForbiddenError("Dev tools are disabled in this environment.");
    }

    const body = await req.json();
    const validated = DevCommitRevisionSchema.parse(body);

    const container = getContainer();
    const newRevision = await container.devCommitSupersedingRevisionUseCase.execute(
      validated.prescriptionId,
      validated.newMedicines
    );

    return apiSuccess({ newRevision, message: "New prescription revision committed by Doctor simulation." });
  } catch (error) {
    return apiError(error);
  }
}
