import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import { launchMissionSession } from "@/lib/session-service";
import { launchMissionSessionFromService } from "@/lib/session-service-client";
import {
  isValidSessionServiceInternalRequest,
  sessionServiceInternalTokenHeader,
  type SessionServiceLaunchMissionRequest,
  type SessionServiceMissionEnvelope,
} from "@/lib/session-service-contract";
import { missionZones } from "@/lib/prototype-data";

const missionIdSchema = z.string().refine(
  (value) => missionZones.some((mission) => mission.id === value),
  "Unknown mission.",
);

const browserLaunchSchema = z.object({
  missionId: missionIdSchema,
});

const internalLaunchSchema = z.object({
  userId: z.string().trim().min(1),
  missionId: missionIdSchema,
  profile: z.object({
    activeMissionSessionId: z.string().trim().min(1).nullable(),
    squadSessionId: z.string().trim().min(1).nullable(),
    squadRole: z.enum(["host", "member"]).nullable(),
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
    const parsed = internalLaunchSchema.safeParse(
      (await request.json()) as SessionServiceLaunchMissionRequest,
    );

    if (!parsed.success) {
      return missionSessionResponse(
        null,
        "Session-service launch request rejected by the schema validator.",
        400,
      );
    }

    const resolved = await launchMissionSession(parsed.data, parsed.data.missionId);

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
      "Sign in through the command deck before launching a mission session.",
      401,
    );
  }

  const parsed = browserLaunchSchema.safeParse(await request.json());

  if (!parsed.success) {
    return missionSessionResponse(
      null,
      "Session-service launch request rejected by the schema validator.",
      400,
    );
  }

  const resolved = await launchMissionSessionFromService({
    userId: session.userId,
    missionId: parsed.data.missionId,
    profile: {
      activeMissionSessionId: session.profile.activeMissionSessionId,
      squadSessionId: session.profile.squadSessionId,
      squadRole: session.profile.squadRole,
    },
  });

  return missionSessionResponse(
    resolved.missionSession,
    resolved.message,
    resolved.status,
  );
}