import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import {
  playtestFocusAreas,
  playtestIssueSeverities,
} from "@/lib/playtest-data";
import { missionZones } from "@/lib/prototype-data";
import { recordTelemetryEvent } from "@/lib/telemetry";

const playtestActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create-session"),
    missionId: z.string().refine(
      (value) => missionZones.some((mission) => mission.id === value),
      "Unknown mission.",
    ),
    operatorCount: z.literal(4),
    summary: z.string().min(12).max(400),
  }),
  z.object({
    action: z.literal("log-issue"),
    playtestSessionId: z.string().min(1).max(120),
    missionId: z.string().refine(
      (value) => missionZones.some((mission) => mission.id === value),
      "Unknown mission.",
    ),
    severity: z.enum(playtestIssueSeverities),
    area: z.enum(playtestFocusAreas),
    title: z.string().min(6).max(120),
    notes: z.string().min(12).max(600),
  }),
]);

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAuthenticatedSession();

  if (!session) {
    return NextResponse.json(
      {
        message: "Sign in through the command deck before logging a playtest session.",
      },
      { status: 401 },
    );
  }

  try {
    const parsed = playtestActionSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Playtest payload rejected by the schema validator." },
        { status: 400 },
      );
    }

    const action = parsed.data;

    if (action.action === "create-session") {
      const playtestSessionId = randomUUID();

      await recordTelemetryEvent({
        userId: session.userId,
        eventType: "playtest_session_logged",
        missionId: action.missionId,
        context: {
          playtestSessionId,
          missionId: action.missionId,
          operatorCount: action.operatorCount,
          summary: action.summary.trim(),
          loggedBy: session.email,
        },
      });

      return NextResponse.json({
        playtestSessionId,
        message: "Four-player playtest session opened. Log any critical, major, or polish findings from the run.",
      });
    }

    await recordTelemetryEvent({
      userId: session.userId,
      eventType: "playtest_issue_logged",
      missionId: action.missionId,
      context: {
        playtestSessionId: action.playtestSessionId,
        missionId: action.missionId,
        severity: action.severity,
        area: action.area,
        title: action.title.trim(),
        notes: action.notes.trim(),
        loggedBy: session.email,
      },
    });

    return NextResponse.json({
      message: `${action.severity} issue logged for the current playtest session.`,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to write the playtest log right now." },
      { status: 500 },
    );
  }
}