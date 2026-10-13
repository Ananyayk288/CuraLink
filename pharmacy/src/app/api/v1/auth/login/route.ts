import { NextRequest } from "next/server";
import { getContainer } from "@/infrastructure/container";
import { LoginSchema } from "@/modules/pharmacy/interface/validators/pharmacy.schemas";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = LoginSchema.parse(body);

    const container = getContainer();
    const session = await container.authProvider.signIn({
      username: validated.username,
      password: validated.password,
    });

    const response = apiSuccess({
      user: session.user,
      token: session.token,
    });

    // Set secure HTTP-only cookie for session persistence
    response.cookies.set("curalink_session", session.token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    return apiError(error);
  }
}
