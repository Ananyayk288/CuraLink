import { NextRequest } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { extractAuthToken, apiSuccess, apiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = extractAuthToken(req);

    const container = getContainer();
    const receipt = await container.getReceiptUseCase.execute(id, token);

    return apiSuccess({ receipt });
  } catch (error) {
    return apiError(error);
  }
}
