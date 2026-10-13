import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { extractAuthToken, apiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = extractAuthToken(req);

    const container = getContainer();
    const result = await container.lookupPatientActivePrescriptionUseCase.execute(id, token);

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
