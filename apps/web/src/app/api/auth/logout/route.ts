import { NextResponse } from "next/server";

import {
  clearSessionCookie,
  getAuthenticatedSession,
  revokeSession,
  unauthenticatedSessionPayload,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getAuthenticatedSession();

  if (session) {
    await revokeSession(session.rawToken);
  }

  const response = NextResponse.json(
    unauthenticatedSessionPayload("Operator session closed."),
  );

  return clearSessionCookie(response);
}