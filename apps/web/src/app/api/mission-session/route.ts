import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedSession,
  persistProfileState,
  profileStateToRecordInput,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  abandonMissionSessionFromService,
  advanceMissionSessionStageFromService,
  applyCombatActionToMissionSessionFromService,
  launchMissionSessionFromService,
  retryMissionSessionStageFromService,
} from "@/lib/session-service-client";
import { recordTelemetryEvents } from "@/lib/telemetry";
import {
  applyMissionCompletion,
  createEncounterState,
  getMissionFlow,
  getPairingForProfile,
  resolveEventContributionState,
  resolveMissionRewardPayload,
  type CombatState,
  type EventContributionTotals,
} from "@/lib/playable-slice";
import {
  firstLiveEvent,
  getLiveEventWindow,
  missionSessionMemberStatuses,
  missionSessionStatuses,
  missionZones,
  normalizeCommandDeckState,
  type CommandDeckState,
  type MissionCombatSnapshot,
  type MissionSessionState,
  type SquadRole,
} from "@/lib/prototype-data";

const combatActionIds = ["light", "heavy", "dodge", "bond", "finisher"] as const;

const missionSessionActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("launch"),
    missionId: z.string().refine(
      (value) => missionZones.some((mission) => mission.id === value),
      "Unknown mission.",
    ),
  }),
  z.object({
    action: z.literal("combat-action"),
    actionId: z.enum(combatActionIds),
  }),
  z.object({ action: z.literal("retry-stage") }),
  z.object({ action: z.literal("advance-stage") }),
  z.object({ action: z.literal("commit-member") }),
  z.object({ action: z.literal("abandon") }),
]);

function missionSessionResponse(
  missionSession: MissionSessionState | null,
  message?: string,
  status = 200,
) {
  return NextResponse.json({ missionSession, message }, { status });
}

async function clearMissionDeployment(
  userId: string,
  profile: CommandDeckState,
  message: string,
) {
  await persistProfileState(userId, {
    activeMissionSessionId: null,
    phase: profile.phase === "mission" ? "briefing" : profile.phase,
  });

  return missionSessionResponse(null, message);
}

function isMissionCombatSnapshot(value: unknown): value is MissionCombatSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<MissionCombatSnapshot>;

  return (
    typeof snapshot.playerIntegrity === "number" &&
    typeof snapshot.shield === "number" &&
    typeof snapshot.charge === "number" &&
    typeof snapshot.momentum === "number" &&
    typeof snapshot.enemyIntegrity === "number" &&
    typeof snapshot.enemyExposed === "boolean" &&
    typeof snapshot.enemySuppressed === "boolean" &&
    typeof snapshot.telegraphActive === "boolean" &&
    typeof snapshot.reactionTriggered === "boolean" &&
    (typeof snapshot.lastReaction === "string" || snapshot.lastReaction === null) &&
    typeof snapshot.stageComplete === "boolean" &&
    typeof snapshot.playerDown === "boolean" &&
    Array.isArray(snapshot.log)
  );
}

function readCombatState(
  missionId: string,
  stageIndex: number,
  combatStateJson: string | null,
  eventWindowId?: MissionSessionState["eventWindowId"],
): CombatState {
  if (!combatStateJson) {
    return createEncounterState(missionId, stageIndex, eventWindowId);
  }

  try {
    const parsed = JSON.parse(combatStateJson) as unknown;

    if (isMissionCombatSnapshot(parsed)) {
      return parsed;
    }
  } catch {
    return createEncounterState(missionId, stageIndex, eventWindowId);
  }

  return createEncounterState(missionId, stageIndex, eventWindowId);
}

function normalizeEventWindowId(
  missionId: string,
  eventWindowId: string | null,
): MissionSessionState["eventWindowId"] {
  if (missionId !== firstLiveEvent.primaryMissionId || !eventWindowId) {
    return null;
  }

  return firstLiveEvent.windows.some((window) => window.id === eventWindowId)
    ? (eventWindowId as MissionSessionState["eventWindowId"])
    : null;
}

async function readMissionSessionRecord(missionSessionId: string) {
  return prisma.missionSession.findUnique({
    where: { id: missionSessionId },
    include: {
      members: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

type MissionSessionRecord = NonNullable<
  Awaited<ReturnType<typeof readMissionSessionRecord>>
>;

function readMissionSessionMemberContribution(
  member: MissionSessionRecord["members"][number],
): EventContributionTotals {
  return {
    defense: member.eventDefenseContribution,
    support: member.eventSupportContribution,
    completion: member.eventCompletionContribution,
  };
}

function readMissionSessionMemberRewards(
  member: MissionSessionRecord["members"][number],
): MissionSessionState["members"][number]["committedRewards"] {
  if (!member.rewardsCommittedAt) {
    return null;
  }

  return {
    explorerRank: member.rewardExplorerRank,
    humanLevel: member.rewardHumanLevel,
    aiTier: member.rewardAiTier,
    resonanceLevel: member.rewardResonanceLevel,
    factionStanding: member.rewardFactionStanding,
  };
}

async function readMissionSessionState(missionSessionId: string) {
  const missionSession = await readMissionSessionRecord(missionSessionId);

  if (!missionSession) {
    return null;
  }

  const eventWindowId = normalizeEventWindowId(
    missionSession.missionId,
    missionSession.eventWindowId,
  );

  const combatState = readCombatState(
    missionSession.missionId,
    missionSession.stageIndex,
    missionSession.combatStateJson,
    eventWindowId,
  );

  return {
    id: missionSession.id,
    missionId: missionSession.missionId,
    squadSessionId: missionSession.squadSessionId,
    launchedByUserId: missionSession.launchedByUserId,
    status: missionSession.status as MissionSessionState["status"],
    eventWindowId,
    eventWindowLabel: eventWindowId
      ? getLiveEventWindow(firstLiveEvent, eventWindowId).label
      : null,
    stageIndex: missionSession.stageIndex,
    combatState,
    launchedAt: missionSession.launchedAt.toISOString(),
    completedAt: missionSession.completedAt?.toISOString() ?? null,
    abandonedAt: missionSession.abandonedAt?.toISOString() ?? null,
    members: missionSession.members.map((member) => {
      const contribution = readMissionSessionMemberContribution(member);

      return {
        userId: member.userId,
        email: member.user.email,
        role: member.squadRole as SquadRole,
        selectedLoadoutId: member.selectedLoadoutId,
        selectedCompanionId: member.selectedCompanionId,
        status: member.status as MissionSessionState["members"][number]["status"],
        rewardsCommittedAt: member.rewardsCommittedAt?.toISOString() ?? null,
        committedRewards: readMissionSessionMemberRewards(member),
        eventContribution: resolveEventContributionState(
          missionSession.missionId,
          eventWindowId,
          contribution,
        ),
      };
    }),
  } satisfies MissionSessionState;
}

async function resolveActiveMissionSession(session: NonNullable<Awaited<ReturnType<typeof getAuthenticatedSession>>>) {
  if (!session.profile.activeMissionSessionId) {
    return {
      response: missionSessionResponse(
        null,
        "No active mission session is attached to this operator.",
        409,
      ),
    };
  }

  const missionSession = await readMissionSessionRecord(
    session.profile.activeMissionSessionId,
  );

  if (!missionSession) {
    return {
      response: await clearMissionDeployment(
        session.userId,
        session.profile,
        "The previous mission session expired and was cleared.",
      ),
    };
  }

  if (missionSession.status === "abandoned") {
    return {
      response: await clearMissionDeployment(
        session.userId,
        session.profile,
        "Mission session was abandoned and your deployment was recovered.",
      ),
    };
  }

  const currentMember = missionSession.members.find(
    (member) => member.userId === session.userId,
  );

  if (!currentMember) {
    return {
      response: await clearMissionDeployment(
        session.userId,
        session.profile,
        "Your mission slot expired and was cleared.",
      ),
    };
  }

  return { missionSession, currentMember };
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

  if (!session.profile.activeMissionSessionId) {
    return missionSessionResponse(null);
  }

  const missionSession = await readMissionSessionState(
    session.profile.activeMissionSessionId,
  );

  if (!missionSession) {
    return clearMissionDeployment(
      session.userId,
      session.profile,
      "The previous mission session expired and was cleared.",
    );
  }

  if (missionSession.status === "abandoned") {
    return clearMissionDeployment(
      session.userId,
      session.profile,
      "Mission session was abandoned and your deployment was recovered.",
    );
  }

  const currentMember = missionSession.members.find(
    (member) => member.userId === session.userId,
  );

  if (!currentMember) {
    return clearMissionDeployment(
      session.userId,
      session.profile,
      "Your mission slot expired and was cleared.",
    );
  }

  return missionSessionResponse(missionSession);
}

export async function POST(request: Request) {
  const session = await getAuthenticatedSession();

  if (!session) {
    return missionSessionResponse(
      null,
      "Sign in through the command deck before editing a mission session.",
      401,
    );
  }

  try {
    const parsed = missionSessionActionSchema.safeParse(await request.json());

    if (!parsed.success) {
      return missionSessionResponse(
        null,
        "Mission-session action rejected by the schema validator.",
        400,
      );
    }

    const action = parsed.data;

    switch (action.action) {
      case "launch": {
        const resolved = await launchMissionSessionFromService({
          userId: session.userId,
          missionId: action.missionId,
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

      case "combat-action": {
        const resolved = await applyCombatActionToMissionSessionFromService({
          userId: session.userId,
          actionId: action.actionId,
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

      case "retry-stage": {
        const resolved = await retryMissionSessionStageFromService({
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

      case "advance-stage": {
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

      case "commit-member": {
        const resolved = await resolveActiveMissionSession(session);

        if ("response" in resolved) {
          return resolved.response;
        }

        const { missionSession, currentMember } = resolved;
        const eventWindowId = normalizeEventWindowId(
          missionSession.missionId,
          missionSession.eventWindowId,
        );

        if (currentMember.rewardsCommittedAt) {
          return missionSessionResponse(
            await readMissionSessionState(missionSession.id),
            "Rewards were already committed for this operator.",
          );
        }

        const mission = getMissionFlow(
          missionSession.missionId,
          eventWindowId,
        );

        if (!mission) {
          return missionSessionResponse(
            null,
            "Mission rewards could not be resolved for this session.",
            500,
          );
        }

        const combatState = readCombatState(
          missionSession.missionId,
          missionSession.stageIndex,
          missionSession.combatStateJson,
          eventWindowId,
        );
        const contribution = readMissionSessionMemberContribution(currentMember);
        const eventContribution = resolveEventContributionState(
          missionSession.missionId,
          eventWindowId,
          contribution,
        );
        const rewardPayload = resolveMissionRewardPayload(
          missionSession.missionId,
          eventWindowId,
          contribution,
        );

        if (
          missionSession.stageIndex !== mission.stages.length - 1 ||
          !combatState.stageComplete ||
          combatState.playerDown
        ) {
          return missionSessionResponse(
            await readMissionSessionState(missionSession.id),
            "Secure the final shared lane before committing mission rewards.",
            409,
          );
        }

        const committedAt = new Date();
        const pairing = getPairingForProfile({
          selectedLoadoutId: currentMember.selectedLoadoutId,
          selectedCompanionId: currentMember.selectedCompanionId,
        });

        const nextProfile = normalizeCommandDeckState({
          ...applyMissionCompletion(
            session.profile,
            missionSession.missionId,
            rewardPayload,
            eventWindowId,
          ),
          activeMissionSessionId: null,
          squadLocked: false,
          squadReady: false,
          lastEventResult:
            eventContribution && eventWindowId
              ? {
                  missionId: missionSession.missionId,
                  eventWindowId,
                  rewardBandId: eventContribution.rewardBand.id,
                  totalScore: eventContribution.totalScore,
                  defenseContribution: contribution.defense,
                  supportContribution: contribution.support,
                  completionContribution: contribution.completion,
                  completedAt: committedAt.toISOString(),
                }
              : session.profile.lastEventResult,
        });

        await prisma.$transaction(async (tx) => {
          await tx.missionSessionMember.update({
            where: {
              missionSessionId_userId: {
                missionSessionId: missionSession.id,
                userId: session.userId,
              },
            },
            data: {
              status: missionSessionMemberStatuses[1],
              rewardExplorerRank: rewardPayload.explorerRank,
              rewardHumanLevel: rewardPayload.humanLevel,
              rewardAiTier: rewardPayload.aiTier,
              rewardResonanceLevel: rewardPayload.resonanceLevel,
              rewardFactionStanding: rewardPayload.factionStanding,
              completedAt: committedAt,
              rewardsCommittedAt: committedAt,
            },
          });

          await tx.playerProfile.update({
            where: { userId: session.userId },
            data: profileStateToRecordInput(nextProfile),
          });

          const pendingMembers = await tx.missionSessionMember.count({
            where: {
              missionSessionId: missionSession.id,
              rewardsCommittedAt: null,
            },
          });

          if (pendingMembers === 0) {
            await tx.missionSession.update({
              where: { id: missionSession.id },
              data: {
                status: missionSessionStatuses[1],
                completedAt: committedAt,
              },
            });
          }
        });

        await recordTelemetryEvents([
          {
            userId: session.userId,
            eventType: "mission_completed",
            phase: "recovery",
            missionId: missionSession.missionId,
            context: {
              pairingId: pairing.id,
              rewardBandId: eventContribution?.rewardBand.id ?? null,
              totalScore: eventContribution?.totalScore ?? null,
              missionSessionId: missionSession.id,
              finalIntegrity: combatState.playerIntegrity,
            },
          },
          {
            userId: session.userId,
            eventType: "phase_reached",
            phase: "recovery",
            missionId: missionSession.missionId,
            context: {
              fromPhase: session.profile.phase,
              rewardBandId: eventContribution?.rewardBand.id ?? null,
            },
          },
        ]);

        return missionSessionResponse(
          await readMissionSessionState(missionSession.id),
          "Mission rewards committed to this operator.",
        );
      }

      case "abandon": {
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
    }
  } catch {
    return missionSessionResponse(
      null,
      "Unable to update the shared mission session right now.",
      500,
    );
  }
}