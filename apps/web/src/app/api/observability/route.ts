import { NextResponse } from "next/server";

import { getAuthenticatedSession } from "@/lib/auth";
import {
  createObservabilityAuditEvents,
  readObservabilityStatus,
  runObservabilityProbe,
} from "@/lib/observability";
import { recordTelemetryEvents } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readObservabilityStatus());
}

export async function POST() {
  const session = await getAuthenticatedSession();

  if (!session) {
    return NextResponse.json(
      {
        message:
          "Sign in through the command deck before running the observability probe.",
      },
      { status: 401 },
    );
  }

  const probe = await runObservabilityProbe();

  await recordTelemetryEvents(
    createObservabilityAuditEvents(probe).map((event) => ({
      ...event,
      userId: session.userId,
      phase: session.profile.phase,
      missionId: session.profile.selectedMissionId,
    })),
  );

  return NextResponse.json(probe, {
    status:
      probe.analytics.delivery === "failed" ||
      probe.errorTracking.delivery === "failed"
        ? 502
        : 200,
  });
}