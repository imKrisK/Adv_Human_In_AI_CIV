import { NextResponse } from "next/server";

import { getAuthenticatedSession } from "@/lib/auth";
import {
  readEventConfig,
  writeEventConfig,
} from "@/lib/event-config";
import type { LiveEventOverride } from "@/lib/event-config-shared";

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await readEventConfig();
  return NextResponse.json({ eventId: "concord-breach", config: config ?? {} });
}

export async function PATCH(request: Request) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const override = body as LiveEventOverride;

  // Validate fields
  if (
    override.cycleAnchorIso !== undefined &&
    typeof override.cycleAnchorIso !== "string"
  ) {
    return NextResponse.json(
      { error: "cycleAnchorIso must be an ISO date string" },
      { status: 400 },
    );
  }
  if (
    override.primaryMissionId !== undefined &&
    typeof override.primaryMissionId !== "string"
  ) {
    return NextResponse.json(
      { error: "primaryMissionId must be a string" },
      { status: 400 },
    );
  }
  if (override.cycleAnchorIso) {
    const parsed = new Date(override.cycleAnchorIso);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "cycleAnchorIso is not a valid date" },
        { status: 400 },
      );
    }
  }

  await writeEventConfig(override, session.userId);

  return NextResponse.json({
    ok: true,
    eventId: "concord-breach",
    config: override,
    updatedBy: session.userId,
    updatedAt: new Date().toISOString(),
  });
}
