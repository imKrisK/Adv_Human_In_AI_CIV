import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import { advanceMissionSessionStage } from "@/lib/session-service";
import { advanceMissionSessionStageFromService } from "@/lib/session-service-client";
import {
  isValidSessionServiceInternalRequest,
  sessionServiceInternalTokenHeader,
  type SessionServiceAdvanceStageRequest,
  type SessionServiceMissionEnvelope,
} from "@/lib/session-service-contract";

const browserAdvanceStageSchema = z.object({
  action: z.literal("advance-stage"),
});

const internalAdvanceStageSchema = z.object({
  userId: z.string().trim().min(1),
  profile: z.object({
    activeMissionSessionId: z.string().trim().min(1).nullable(),
    phase: z.string().trim().min(1),
  }),
});

function missionSessionResponse(
  missionSession: SessionServiceMissionEnvelope["missionSession"],
  message?: string,
  status = 200,
) {
  return NextResponse.json(
    {
      missionSession,
      message,
      source: "session-service",
    } satisfies SessionServiceMissionEnvelope,
    { status },
  );
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (
    isValidSessionServiceInternalRequest(
      request.headers.get(sessionServiceInternalTokenHeader),
    )
  ) {
    const parsed = internalAdvanceStageSchema.safeParse(
      (await request.json()) as SessionServiceAdvanceStageRequest,
    );

    if (!parsed.success) {
      return missionSessionResponse(
        null,
        "Session-service advance-stage request rejected by the schema validator.",
        400,
      );
    }

    const resolved = await advanceMissionSessionStage(parsed.data);

    return missionSessionResponse(
      resolved.missionSession,
      resolved.message,
      resolved.status,
    );
  }

  const session = await getAuthenticatedSession();

  if (!session) {
    return missionSessionResponse(
      null,
      "Sign in through the command deck before editing a mission session.",
      401,
    );
  }

  const parsed = browserAdvanceStageSchema.safeParse(await request.json());

  if (!parsed.success) {
    return missionSessionResponse(
      null,
      "Session-service advance-stage request rejected by the schema validator.",
      400,
    );
  }

  const resolved = await advanceMissionSessionStageFromService({
    userId: session.userId,
    profile: {
      activeMissionSessionId: session.profile.activeMissionSessionId,
      phase: session.profile.phase,
    },
  });

  return missionSessionResponse(
    resolved.missionSession,
    resolved.message,
    resolved.status,
  );
}