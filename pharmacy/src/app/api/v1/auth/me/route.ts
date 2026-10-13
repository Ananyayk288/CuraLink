import { NextRequest } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { extractAuthToken, apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const container = getContainer();
    const user = await container.authProvider.getCurrentUser(token);

    if (!user) {
      return apiSuccess({ user: null });
    }

    return apiSuccess({ user });
  } catch (error) {
    return apiError(error);
  }
}
