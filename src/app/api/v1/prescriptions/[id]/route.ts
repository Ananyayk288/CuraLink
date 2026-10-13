import { NextResponse } from "next/server";

export async function DELETE() {
  return NextResponse.json(
    {
      error: {
        code: "METHOD_NOT_ALLOWED",
        message:
          "Prescriptions are immutable clinical records. Deletion is strictly prohibited under CuraLink immutability policy.",
      },
    },
    {
      status: 405,
      headers: {
        Allow: "GET, POST",
      },
    }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      error: {
        code: "METHOD_NOT_ALLOWED",
        message:
          "Committed prescriptions cannot be updated in place. Create a new revision instead.",
      },
    },
    {
      status: 405,
      headers: {
        Allow: "GET, POST",
      },
    }
  );
}
