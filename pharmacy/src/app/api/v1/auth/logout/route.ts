import { NextRequest } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { extractAuthToken, apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const container = getContainer();
    await container.authProvider.signOut(token);

    const response = apiSuccess({ success: true, message: "Logged out successfully" });
    response.cookies.delete("curalink_session");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
