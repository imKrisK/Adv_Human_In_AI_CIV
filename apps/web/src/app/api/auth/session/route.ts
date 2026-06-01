import { NextResponse } from "next/server";

import {
  authenticatedSessionPayload,
  getAuthenticatedSession,
  unauthenticatedSessionPayload,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthenticatedSession();

  if (!session) {
    return NextResponse.json(unauthenticatedSessionPayload());
  }

  return NextResponse.json(
    authenticatedSessionPayload(session.email, session.profile),
  );
}