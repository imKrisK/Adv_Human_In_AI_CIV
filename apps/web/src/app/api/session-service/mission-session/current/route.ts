import { z } from "zod";
import { NextResponse } from "next/server";

import { getAuthenticatedSession } from "@/lib/auth";
import { readCurrentMissionSession } from "@/lib/session-service";
import { readCurrentMissionSessionFromService } from "@/lib/session-service-client";
import {
  isValidSessionServiceInternalRequest,
  sessionServiceInternalTokenHeader,
  type SessionServiceCurrentMissionRequest,
  type SessionServiceMissionEnvelope,
} from "@/lib/session-service-contract";

const currentMissionRequestSchema = z.object({
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

export async function GET() {
  const session = await getAuthenticatedSession();

  if (!session) {
    return missionSessionResponse(
      null,
      "Sign in through the command deck before loading a mission session.",
      401,
    );
  }

  const resolved = await readCurrentMissionSessionFromService({
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

export async function POST(request: Request) {
  if (
    !isValidSessionServiceInternalRequest(
      request.headers.get(sessionServiceInternalTokenHeader),
    )
  ) {
    return missionSessionResponse(
      null,
      "Session-service internal request rejected.",
      403,
    );
  }

  const parsed = currentMissionRequestSchema.safeParse(
    (await request.json()) as SessionServiceCurrentMissionRequest,
  );

  if (!parsed.success) {
    return missionSessionResponse(
      null,
      "Session-service current mission request rejected by the schema validator.",
      400,
    );
  }

  const resolved = await readCurrentMissionSession(parsed.data);

  return missionSessionResponse(resolved.missionSession, resolved.message);
}