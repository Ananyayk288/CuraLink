import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@/core/domain/errors/domain-error";

export function apiSuccess<T>(data: T, status: number = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, { status, headers });
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: error.errors.map((e) => e.message).join(", "),
          details: error.flatten().fieldErrors,
        },
      },
      { status: 422 }
    );
  }

  if (error instanceof DomainError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  console.error("[API_ERROR]", error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message,
      },
    },
    { status: 500 }
  );
}

export function extractAuthToken(req: Request): string | undefined {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Also check cookie header
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/curalink_session=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return undefined;
}
