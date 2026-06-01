import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import { applyCombatActionToMissionSession } from "@/lib/session-service";
import { applyCombatActionToMissionSessionFromService } from "@/lib/session-service-client";
import {
  isValidSessionServiceInternalRequest,
  sessionServiceInternalTokenHeader,
  type SessionServiceCombatActionRequest,
  type SessionServiceMissionEnvelope,
} from "@/lib/session-service-contract";
import { commandDeckPhases } from "@/lib/prototype-data";

const combatActionIds = ["light", "heavy", "dodge", "bond", "finisher"] as const;

const browserCombatActionSchema = z.object({
  action: z.literal("combat-action"),
  actionId: z.enum(combatActionIds),
});

const internalCombatActionSchema = z.object({
  userId: z.string().trim().min(1),
  actionId: z.enum(combatActionIds),
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
    const parsed = internalCombatActionSchema.safeParse(
      (await request.json()) as SessionServiceCombatActionRequest,
    );

    if (!parsed.success) {
      return missionSessionResponse(
        null,
        "Session-service combat action request rejected by the schema validator.",
        400,
      );
    }

    const resolved = await applyCombatActionToMissionSession(parsed.data);

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

  const parsed = browserCombatActionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return missionSessionResponse(
      null,
      "Session-service combat action request rejected by the schema validator.",
      400,
    );
  }

  const resolved = await applyCombatActionToMissionSessionFromService({
    userId: session.userId,
    actionId: parsed.data.actionId,
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