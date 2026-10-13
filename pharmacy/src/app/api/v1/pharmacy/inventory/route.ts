import { NextRequest } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { UpdateInventorySchema } from "@/modules/pharmacy/interface/validators/pharmacy.schemas";
import { extractAuthToken, apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const { searchParams } = new URL(req.url);

    const lowStockOnly = searchParams.get("lowStock") === "true";
    const searchQuery = searchParams.get("search") || undefined;

    const container = getContainer();
    const items = await container.getInventoryUseCase.execute(token, {
      lowStockOnly,
      searchQuery,
    });

    return apiSuccess({ items });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = UpdateInventorySchema.parse(body);
    const token = extractAuthToken(req);

    const container = getContainer();
    const updatedItem = await container.updateInventoryUseCase.execute(validated, token);

    return apiSuccess({ updatedItem });
  } catch (error) {
    return apiError(error);
  }
}
