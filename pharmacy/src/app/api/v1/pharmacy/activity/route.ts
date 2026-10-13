import { NextRequest } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { extractAuthToken, apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const container = getContainer();
    const logs = await container.getPharmacistActivityUseCase.execute(token);

    return apiSuccess({ logs });
  } catch (error) {
    return apiError(error);
  }
}
