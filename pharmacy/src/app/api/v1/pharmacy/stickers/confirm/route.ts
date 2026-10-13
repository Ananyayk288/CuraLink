import { NextRequest } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { ConfirmStickerSchema } from "@/modules/pharmacy/interface/validators/pharmacy.schemas";
import { extractAuthToken, apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const body = await req.json();
    const validated = ConfirmStickerSchema.parse(body);

    const container = getContainer();
    const confirmation = await container.confirmStickerUseCase.execute(validated, token);

    return apiSuccess({
      confirmation,
      message: "Physical stickers confirmed as attached",
    });
  } catch (error) {
    return apiError(error);
  }
}
