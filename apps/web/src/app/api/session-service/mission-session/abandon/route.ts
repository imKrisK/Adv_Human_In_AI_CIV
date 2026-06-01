import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import { abandonMissionSession } from "@/lib/session-service";
import { abandonMissionSessionFromService } from "@/lib/session-service-client";
import {
  isValidSessionServiceInternalRequest,
  sessionServiceInternalTokenHeader,
  type SessionServiceAbandonMissionRequest,
  type SessionServiceMissionEnvelope,
} from "@/lib/session-service-contract";
import { commandDeckPhases } from "@/lib/prototype-data";

const browserAbandonSchema = z.object({
  action: z.literal("abandon"),
});

const internalAbandonSchema = z.object({
  userId: z.string().trim().min(1),
  profile: z.object({
    activeMissionSessionId: z.string().trim().min(1).nullable(),
    phase: z.enum(commandDeckPhases),
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
    const parsed = internalAbandonSchema.safeParse(
      (await request.json()) as SessionServiceAbandonMissionRequest,
    );

    if (!parsed.success) {
      return missionSessionResponse(
        null,
        "Session-service abandon request rejected by the schema validator.",
        400,
      );
    }

    const resolved = await abandonMissionSession(parsed.data);

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
      "Sign in through the command deck before abandoning a mission session.",
      401,
    );
  }

  const parsed = browserAbandonSchema.safeParse(await request.json());

  if (!parsed.success) {
    return missionSessionResponse(
      null,
      "Session-service abandon request rejected by the schema validator.",
      400,
    );
  }

  const resolved = await abandonMissionSessionFromService({
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