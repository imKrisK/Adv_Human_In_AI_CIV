import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedSession, persistProfileState } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  clearSquadMembership,
  createUniqueSquadCode,
  promoteNextHost,
  readSquadState,
  syncSessionMembership,
} from "@/lib/session-service";
import {
  missionZones,
  squadRoles,
  squadSessionStatuses,
  type SquadSessionState,
} from "@/lib/prototype-data";

const squadActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create") }),
  z.object({ action: z.literal("join"), code: z.string().min(6).max(12) }),
  z.object({ action: z.literal("leave") }),
  z.object({ action: z.literal("toggle-lock"), locked: z.boolean() }),
  z.object({ action: z.literal("toggle-ready"), ready: z.boolean() }),
  z.object({
    action: z.literal("stage-mission"),
    missionId: z.string().refine(
      (value) => missionZones.some((mission) => mission.id === value),
      "Unknown mission.",
    ),
  }),
]);

function squadResponse(squad: SquadSessionState | null, message?: string, status = 200) {
  return NextResponse.json({ squad, message }, { status });
}

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthenticatedSession();

  if (!session) {
    return squadResponse(null, "Sign in through the command deck before loading squad staging.", 401);
  }

  if (!session.profile.squadSessionId) {
    return squadResponse(null);
  }

  const squad = await readSquadState(session.profile.squadSessionId);

  if (!squad) {
    await clearSquadMembership(session.userId);
    return squadResponse(null, "Previous squad staging session expired and was cleared.");
  }

  const syncResult = await syncSessionMembership(session, squad);

  if (syncResult.cleared) {
    return squadResponse(null, syncResult.message);
  }

  return squadResponse(squad, syncResult.message);
}

export async function POST(request: Request) {
  const session = await getAuthenticatedSession();

  if (!session) {
    return squadResponse(null, "Sign in through the command deck before editing squad staging.", 401);
  }

  try {
    const parsed = squadActionSchema.safeParse(await request.json());

    if (!parsed.success) {
      return squadResponse(null, "Squad action rejected by the schema validator.", 400);
    }

    const action = parsed.data;

    switch (action.action) {
      case "create": {
        if (session.profile.squadSessionId) {
          const existingSquad = await readSquadState(session.profile.squadSessionId);
          return squadResponse(existingSquad, "Operator is already staged in a squad.", 409);
        }

        const code = await createUniqueSquadCode();
        const squad = await prisma.squadSession.create({
          data: {
            code,
            status: squadSessionStatuses[0],
            selectedMissionId: session.profile.selectedMissionId,
            hostUserId: session.userId,
          },
        });

        await persistProfileState(session.userId, {
          squadSessionId: squad.id,
          squadCode: squad.code,
          squadRole: squadRoles[0],
          squadLocked: false,
          squadReady: false,
        });

        return squadResponse(await readSquadState(squad.id), "Squad staging session created.");
      }

      case "join": {
        if (session.profile.squadSessionId) {
          const existingSquad = await readSquadState(session.profile.squadSessionId);
          return squadResponse(existingSquad, "Leave the current squad before joining another one.", 409);
        }

        const code = action.code.trim().toUpperCase();
        const squad = await prisma.squadSession.findUnique({ where: { code } });

        if (!squad) {
          return squadResponse(null, "No squad staging session matches that code.", 404);
        }

        const memberCount = await prisma.playerProfile.count({
          where: { squadSessionId: squad.id },
        });

        if (memberCount >= 4) {
          return squadResponse(null, "That squad is already at its four-operator cap.", 409);
        }

        await persistProfileState(session.userId, {
          selectedMissionId: squad.selectedMissionId,
          phase: session.profile.phase === "arrival" ? "briefing" : session.profile.phase,
          squadSessionId: squad.id,
          squadCode: squad.code,
          squadRole: squadRoles[1],
          squadLocked: false,
          squadReady: false,
        });

        return squadResponse(await readSquadState(squad.id), "Joined squad staging session.");
      }

      case "leave": {
        if (!session.profile.squadSessionId || !session.profile.squadCode) {
          return squadResponse(null, "Operator is not currently staged in a squad.");
        }

        const squadSessionId = session.profile.squadSessionId;
        const squadCode = session.profile.squadCode;
        const wasHost = session.profile.squadRole === "host";

        await clearSquadMembership(session.userId);

        if (wasHost) {
          await promoteNextHost(squadSessionId, squadCode, session.userId);
        } else {
          const remaining = await prisma.playerProfile.count({
            where: { squadSessionId },
          });

          if (remaining === 0) {
            await prisma.squadSession.deleteMany({ where: { id: squadSessionId } });
          }
        }

        return squadResponse(null, "Left squad staging session.");
      }

      case "toggle-lock": {
        if (!session.profile.squadSessionId || !session.profile.squadCode || !session.profile.squadRole) {
          return squadResponse(null, "Join or create a squad before locking a bonded pair.", 409);
        }

        await persistProfileState(session.userId, {
          squadSessionId: session.profile.squadSessionId,
          squadCode: session.profile.squadCode,
          squadRole: session.profile.squadRole,
          squadLocked: action.locked,
          squadReady: action.locked ? session.profile.squadReady : false,
        });

        return squadResponse(
          await readSquadState(session.profile.squadSessionId),
          action.locked
            ? "Bonded pair locked for squad launch checks."
            : "Bonded pair unlocked. Ready state was cleared.",
        );
      }

      case "toggle-ready": {
        if (!session.profile.squadSessionId || !session.profile.squadCode || !session.profile.squadRole) {
          return squadResponse(null, "Join or create a squad before changing ready state.", 409);
        }

        if (!session.profile.squadLocked) {
          return squadResponse(null, "Lock the bonded pair before marking ready.", 409);
        }

        await persistProfileState(session.userId, {
          squadSessionId: session.profile.squadSessionId,
          squadCode: session.profile.squadCode,
          squadRole: session.profile.squadRole,
          squadLocked: session.profile.squadLocked,
          squadReady: action.ready,
        });

        return squadResponse(
          await readSquadState(session.profile.squadSessionId),
          action.ready ? "Operator marked ready." : "Operator marked not ready.",
        );
      }

      case "stage-mission": {
        if (!session.profile.squadSessionId || session.profile.squadRole !== "host") {
          return squadResponse(null, "Only the squad host can retarget the staged mission.", 409);
        }

        await prisma.squadSession.update({
          where: { id: session.profile.squadSessionId },
          data: { selectedMissionId: action.missionId },
        });

        await prisma.playerProfile.updateMany({
          where: { squadSessionId: session.profile.squadSessionId },
          data: {
            selectedMissionId: action.missionId,
            squadReady: false,
          },
        });

        return squadResponse(
          await readSquadState(session.profile.squadSessionId),
          "Squad mission target updated. Ready checks were reset for the new route.",
        );
      }
    }
  } catch {
    return squadResponse(null, "Unable to update squad staging right now.", 500);
  }
}