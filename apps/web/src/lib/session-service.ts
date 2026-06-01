import { randomBytes } from "node:crypto";

import {
  persistProfileState,
  profileRecordToState,
  profileStateToRecordInput,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  applyMissionCompletion,
  advanceEncounterState,
  createEncounterState,
  executeCombatAction,
  getPairingForProfile,
  getMissionFlow,
  isMissionUnlocked,
  resolveCombatContributionDelta,
  resolveEventContributionState,
  resolveMissionRewardPayload,
  type CombatActionId,
  type EventContributionTotals,
} from "@/lib/playable-slice";
import {
  firstLiveEvent,
  getLiveEventWindow,
  missionSessionMemberStatuses,
  missionSessionStatuses,
  normalizeCommandDeckState,
  type MissionCombatSnapshot,
  type MissionSessionState,
  type SquadRole,
  type SquadSessionState,
  type CommandDeckState,
  resolveLiveEvent,
} from "@/lib/prototype-data";
import { recordTelemetryEvents } from "@/lib/telemetry";
import {
  resolveSessionServiceConfig,
  type SessionServiceConfig,
  type SessionServiceConfigSource,
  type SessionServiceCoordinationMode,
  type SessionServiceMissionRouteResult,
  type SessionServiceMode,
} from "@/lib/session-service-contract";

export type SessionMembershipContext = {
  userId: string;
  profile: Pick<
    CommandDeckState,
    | "selectedMissionId"
    | "squadCode"
    | "squadLocked"
    | "squadReady"
    | "squadRole"
    | "squadSessionId"
  >;
};

export type MissionSessionContext = {
  userId: string;
  profile: Pick<CommandDeckState, "activeMissionSessionId" | "phase">;
};

export type MissionSessionLaunchContext = {
  userId: string;
  profile: Pick<
    CommandDeckState,
    "activeMissionSessionId" | "squadRole" | "squadSessionId"
  >;
};

export type MissionSessionCombatActionContext = MissionSessionContext & {
  actionId: CombatActionId;
};

export type MissionSessionAdvanceStageContext = MissionSessionContext;

export type MissionSessionRetryStageContext = MissionSessionContext;

export type MissionSessionCommitMemberContext = MissionSessionContext;

export type SessionServiceHealth = {
  service: "session-service-skeleton";
  status: "ok" | "degraded";
  runtime: SessionServiceConfig["runtime"];
  contract: {
    mode: SessionServiceMode;
    coordinationMode: SessionServiceCoordinationMode;
    source: SessionServiceConfigSource;
    baseUrl: string | null;
  };
  database: {
    reachable: boolean;
    detail: string;
  };
  coordination: {
    realtimeConfigured: boolean;
    presenceConfigured: boolean;
    missingKeys: string[];
  };
};

type ResolvedActiveMissionMutationContext =
  | {
      ok: true;
      missionSession: MissionSessionRecord;
      currentMember: MissionSessionRecord["members"][number];
    }
  | {
      ok: false;
      result: SessionServiceMissionRouteResult;
    };

export async function createUniqueSquadCode() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
    const existing = await prisma.squadSession.findUnique({ where: { code } });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Unable to allocate a unique squad code.");
}

export async function readSquadState(squadSessionId: string) {
  const squad = await prisma.squadSession.findUnique({
    where: { id: squadSessionId },
  });

  if (!squad) {
    return null;
  }

  const members = await prisma.playerProfile.findMany({
    where: { squadSessionId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const launchBlockers = members.flatMap((member) => {
    if (!member.squadLocked) {
      return [`${member.user.email} must lock a bonded pair.`];
    }

    if (!member.squadReady) {
      return [`${member.user.email} is not ready.`];
    }

    return [];
  });
  const canLaunch = members.length > 0 && launchBlockers.length === 0;
  const nextStatus = canLaunch ? "launch-ready" : "staging";

  if (squad.status !== nextStatus) {
    await prisma.squadSession.update({
      where: { id: squadSessionId },
      data: { status: nextStatus },
    });
  }

  return {
    id: squad.id,
    code: squad.code,
    status: nextStatus,
    selectedMissionId: squad.selectedMissionId,
    hostUserId: squad.hostUserId,
    canLaunch,
    launchBlockers,
    members: members.map((member) => ({
      userId: member.userId,
      email: member.user.email,
      role: (member.squadRole ?? "member") as SquadRole,
      locked: member.squadLocked,
      ready: member.squadReady,
      selectedLoadoutId: member.selectedLoadoutId,
      selectedCompanionId: member.selectedCompanionId,
    })),
  } satisfies SquadSessionState;
}

export async function clearSquadMembership(userId: string) {
  await persistProfileState(userId, {
    squadSessionId: null,
    squadCode: null,
    squadRole: null,
    squadLocked: false,
    squadReady: false,
  });
}

export async function syncSessionMembership(
  session: SessionMembershipContext | null,
  squad: SquadSessionState,
) {
  if (!session) {
    return {
      cleared: false,
      message: undefined as string | undefined,
    };
  }

  const currentMember = squad.members.find((member) => member.userId === session.userId);

  if (!currentMember) {
    await clearSquadMembership(session.userId);
    return {
      cleared: true,
      message: "Your squad slot expired and was cleared during reconnect.",
    };
  }

  const nextRole: CommandDeckState["squadRole"] =
    squad.hostUserId === session.userId ? "host" : "member";
  const patch: Partial<CommandDeckState> = {};
  let message: string | undefined;

  if (session.profile.squadSessionId !== squad.id) {
    patch.squadSessionId = squad.id;
  }

  if (session.profile.squadCode !== squad.code) {
    patch.squadCode = squad.code;
  }

  if (session.profile.selectedMissionId !== squad.selectedMissionId) {
    patch.selectedMissionId = squad.selectedMissionId;
  }

  if (session.profile.squadRole !== nextRole) {
    patch.squadRole = nextRole;
    message =
      nextRole === "host"
        ? "Host handoff completed. You now own squad deployment."
        : "Squad staging reconnected under the current host.";
  }

  if (session.profile.squadLocked !== currentMember.locked) {
    patch.squadLocked = currentMember.locked;
  }

  if (session.profile.squadReady !== currentMember.ready) {
    patch.squadReady = currentMember.ready;
  }

  if (Object.keys(patch).length > 0) {
    await persistProfileState(session.userId, patch);
  }

  return {
    cleared: false,
    message,
  };
}

export async function promoteNextHost(
  squadSessionId: string,
  squadCode: string,
  hostUserId: string,
) {
  const nextHost = await prisma.playerProfile.findFirst({
    where: {
      squadSessionId,
      userId: { not: hostUserId },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!nextHost) {
    await prisma.squadSession.delete({ where: { id: squadSessionId } });
    return;
  }

  await prisma.squadSession.update({
    where: { id: squadSessionId },
    data: { hostUserId: nextHost.userId },
  });

  await persistProfileState(nextHost.userId, {
    squadSessionId,
    squadCode,
    squadRole: "host",
  });
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
) {
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

function serializeCombatState(combatState: MissionCombatSnapshot) {
  return JSON.stringify(combatState);
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

export async function readMissionSessionRecord(missionSessionId: string) {
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

export type MissionSessionRecord = NonNullable<
  Awaited<ReturnType<typeof readMissionSessionRecord>>
>;

async function readLaunchProfiles(squadSessionId: string | null, userId: string) {
  if (!squadSessionId) {
    const profile = await prisma.playerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    return profile ? [profile] : [];
  }

  return prisma.playerProfile.findMany({
    where: { squadSessionId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}

function getLaunchBlockers(
  missionId: string,
  profiles: Awaited<ReturnType<typeof readLaunchProfiles>>,
  squadLaunch: boolean,
) {
  const mission = getMissionFlow(missionId);

  if (!mission) {
    return ["Unknown mission target."];
  }

  return profiles.flatMap((profile) => {
    const blockers: string[] = [];
    const profileState = profileRecordToState(profile);

    if (profile.activeMissionSessionId) {
      blockers.push(`${profile.user.email} is already deployed in another mission session.`);
    }

    if (squadLaunch && !profile.squadLocked) {
      blockers.push(`${profile.user.email} must lock a bonded pair.`);
    }

    if (squadLaunch && !profile.squadReady) {
      blockers.push(`${profile.user.email} is not ready.`);
    }

    if (!isMissionUnlocked(missionId, profileState)) {
      blockers.push(`${profile.user.email} is not cleared for ${mission.name}.`);
    }

    return blockers;
  });
}

export async function readMissionSessionState(missionSessionId: string) {
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

async function clearMissionDeployment(
  userId: string,
  profile: MissionSessionContext["profile"],
  message: string,
) {
  await persistProfileState(userId, {
    activeMissionSessionId: null,
    phase: profile.phase === "mission" ? "briefing" : profile.phase,
  });

  return {
    missionSession: null,
    message,
  };
}

export async function readCurrentMissionSession(context: MissionSessionContext) {
  if (!context.profile.activeMissionSessionId) {
    return {
      missionSession: null,
      message: undefined as string | undefined,
    };
  }

  const missionSession = await readMissionSessionState(
    context.profile.activeMissionSessionId,
  );

  if (!missionSession) {
    return clearMissionDeployment(
      context.userId,
      context.profile,
      "The previous mission session expired and was cleared.",
    );
  }

  if (missionSession.status === "abandoned") {
    return clearMissionDeployment(
      context.userId,
      context.profile,
      "Mission session was abandoned and your deployment was recovered.",
    );
  }

  const currentMember = missionSession.members.find(
    (member) => member.userId === context.userId,
  );

  if (!currentMember) {
    return clearMissionDeployment(
      context.userId,
      context.profile,
      "Your mission slot expired and was cleared.",
    );
  }

  return {
    missionSession,
    message: undefined as string | undefined,
  };
}

async function resolveActiveMissionSessionForMutation(
  context: MissionSessionContext,
): Promise<ResolvedActiveMissionMutationContext> {
  if (!context.profile.activeMissionSessionId) {
    return {
      ok: false,
      result: {
        missionSession: null,
        message: "No active mission session is attached to this operator.",
        status: 409,
      },
    };
  }

  const missionSession = await readMissionSessionRecord(
    context.profile.activeMissionSessionId,
  );

  if (!missionSession) {
    return {
      ok: false,
      result: {
        ...(await clearMissionDeployment(
          context.userId,
          context.profile,
          "The previous mission session expired and was cleared.",
        )),
        status: 200,
      },
    };
  }

  if (missionSession.status === "abandoned") {
    return {
      ok: false,
      result: {
        ...(await clearMissionDeployment(
          context.userId,
          context.profile,
          "Mission session was abandoned and your deployment was recovered.",
        )),
        status: 200,
      },
    };
  }

  const currentMember = missionSession.members.find(
    (member) => member.userId === context.userId,
  );

  if (!currentMember) {
    return {
      ok: false,
      result: {
        ...(await clearMissionDeployment(
          context.userId,
          context.profile,
          "Your mission slot expired and was cleared.",
        )),
        status: 200,
      },
    };
  }

  return {
    ok: true,
    missionSession,
    currentMember,
  };
}

export async function launchMissionSession(
  context: MissionSessionLaunchContext,
  missionId: string,
): Promise<SessionServiceMissionRouteResult> {
  if (context.profile.activeMissionSessionId) {
    const existingMissionSession = await readMissionSessionState(
      context.profile.activeMissionSessionId,
    );

    if (existingMissionSession) {
      return {
        missionSession: existingMissionSession,
        message: "Mission session already active for this operator.",
        status: 409,
      };
    }

    await persistProfileState(context.userId, {
      activeMissionSessionId: null,
    });
  }

  const squadLaunch = Boolean(context.profile.squadSessionId);

  if (squadLaunch && context.profile.squadRole !== "host") {
    return {
      missionSession: null,
      message: "Only the squad host can launch the staged mission.",
      status: 409,
    };
  }

  if (squadLaunch) {
    const squad = await prisma.squadSession.findUnique({
      where: { id: context.profile.squadSessionId! },
    });

    if (!squad) {
      return {
        missionSession: null,
        message: "The staged squad session expired before deployment.",
        status: 409,
      };
    }

    if (squad.selectedMissionId !== missionId) {
      return {
        missionSession: null,
        message: "Stage this route for the squad before launching it.",
        status: 409,
      };
    }
  }

  const launchProfiles = await readLaunchProfiles(
    context.profile.squadSessionId,
    context.userId,
  );

  if (launchProfiles.length === 0) {
    return {
      missionSession: null,
      message: "Unable to resolve the launch roster for this mission.",
      status: 409,
    };
  }

  const launchBlockers = getLaunchBlockers(
    missionId,
    launchProfiles,
    squadLaunch,
  );

  if (launchBlockers.length > 0) {
    return {
      missionSession: null,
      message: launchBlockers[0],
      status: 409,
    };
  }

  const createdMissionSession = await prisma.$transaction(async (tx) => {
    const eventWindowId =
      missionId === firstLiveEvent.primaryMissionId
        ? resolveLiveEvent(firstLiveEvent).currentWindow.id
        : null;
    const initialCombatState = createEncounterState(missionId, 0, eventWindowId);
    const missionSession = await tx.missionSession.create({
      data: {
        missionId,
        squadSessionId: context.profile.squadSessionId,
        launchedByUserId: context.userId,
        status: missionSessionStatuses[0],
        eventWindowId,
        stageIndex: 0,
        combatStateJson: serializeCombatState(initialCombatState),
      },
    });

    await tx.missionSessionMember.createMany({
      data: launchProfiles.map((profile) => ({
        missionSessionId: missionSession.id,
        userId: profile.userId,
        squadRole:
          (profile.squadRole as SquadRole | null) ??
          (profile.userId === context.userId ? "host" : "member"),
        selectedLoadoutId: profile.selectedLoadoutId,
        selectedCompanionId: profile.selectedCompanionId,
        status: missionSessionMemberStatuses[0],
      })),
    });

    for (const profile of launchProfiles) {
      const nextProfile = normalizeCommandDeckState({
        ...profileRecordToState(profile),
        phase: "mission",
        selectedMissionId: missionId,
        activeMissionSessionId: missionSession.id,
      });

      await tx.playerProfile.update({
        where: { userId: profile.userId },
        data: profileStateToRecordInput(nextProfile),
      });
    }

    return missionSession;
  });

  await recordTelemetryEvents(
    launchProfiles.flatMap((profile) => {
      const profileState = profileRecordToState(profile);

      return [
        {
          userId: profile.userId,
          eventType: "mission_launched" as const,
          phase: "mission",
          missionId,
          context: {
            fromPhase: profileState.phase,
            squadLaunch,
            missionSessionId: createdMissionSession.id,
          },
        },
        {
          userId: profile.userId,
          eventType: "phase_reached" as const,
          phase: "mission",
          missionId,
          context: {
            fromPhase: profileState.phase,
            squadLaunch,
          },
        },
      ];
    }),
  );

  return {
    missionSession: await readMissionSessionState(createdMissionSession.id),
    message: squadLaunch
      ? "Squad mission session launched. Every member now shares the same live deployment record."
      : "Mission session launched.",
    status: 200,
  };
}

export async function abandonMissionSession(
  context: MissionSessionContext,
): Promise<SessionServiceMissionRouteResult> {
  const resolved = await resolveActiveMissionSessionForMutation(context);

  if (!resolved.ok) {
    return resolved.result;
  }

  const { missionSession, currentMember } = resolved;
  const squadRecovery = Boolean(missionSession.squadSessionId);
  const canAbandon = !squadRecovery || currentMember.squadRole === "host";

  if (!canAbandon) {
    return {
      missionSession: await readMissionSessionState(missionSession.id),
      message: "Only the squad host can abandon and recover the shared mission session.",
      status: 409,
    };
  }

  const recoveredAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.missionSession.update({
      where: { id: missionSession.id },
      data: {
        status: missionSessionStatuses[2],
        abandonedAt: recoveredAt,
      },
    });

    await tx.missionSessionMember.updateMany({
      where: {
        missionSessionId: missionSession.id,
        rewardsCommittedAt: null,
      },
      data: {
        status: missionSessionMemberStatuses[2],
        completedAt: recoveredAt,
      },
    });

    const attachedProfiles = await tx.playerProfile.findMany({
      where: { activeMissionSessionId: missionSession.id },
    });

    for (const profile of attachedProfiles) {
      const nextProfile = normalizeCommandDeckState({
        ...profileRecordToState(profile),
        activeMissionSessionId: null,
        phase: "briefing",
        squadLocked: false,
        squadReady: false,
        selectedMissionId: missionSession.missionId,
      });

      await tx.playerProfile.update({
        where: { userId: profile.userId },
        data: profileStateToRecordInput(nextProfile),
      });
    }

    if (missionSession.squadSessionId) {
      await tx.squadSession.update({
        where: { id: missionSession.squadSessionId },
        data: { status: "staging" },
      });
    }
  });

  return {
    missionSession: null,
    message: squadRecovery
      ? "Mission session abandoned. Attached squad operators were returned to briefing."
      : "Mission aborted. Operator returned to briefing.",
    status: 200,
  };
}

export async function applyCombatActionToMissionSession(
  context: MissionSessionCombatActionContext,
): Promise<SessionServiceMissionRouteResult> {
  const resolved = await resolveActiveMissionSessionForMutation(context);

  if (!resolved.ok) {
    return resolved.result;
  }

  const { missionSession, currentMember } = resolved;

  if (missionSession.status !== "active") {
    return {
      missionSession: await readMissionSessionState(missionSession.id),
      message: "Mission session is no longer accepting combat actions.",
      status: 409,
    };
  }

  const eventWindowId = normalizeEventWindowId(
    missionSession.missionId,
    missionSession.eventWindowId,
  );
  const mission = getMissionFlow(missionSession.missionId, eventWindowId);
  const combatState = readCombatState(
    missionSession.missionId,
    missionSession.stageIndex,
    missionSession.combatStateJson,
    eventWindowId,
  );

  if (!mission) {
    return {
      missionSession: null,
      message: "Mission runtime could not be resolved for this session.",
      status: 500,
    };
  }

  if (combatState.stageComplete) {
    return {
      missionSession: await readMissionSessionState(missionSession.id),
      message:
        "The current lane is already secured. Advance the shared objective instead.",
      status: 409,
    };
  }

  if (combatState.playerDown) {
    return {
      missionSession: await readMissionSessionState(missionSession.id),
      message:
        "The pair is destabilized. Retry the shared stage before taking another action.",
      status: 409,
    };
  }

  const pairing = getPairingForProfile({
    selectedLoadoutId: currentMember.selectedLoadoutId,
    selectedCompanionId: currentMember.selectedCompanionId,
  });
  const currentStage = mission.stages[missionSession.stageIndex];
  const nextCombatState = executeCombatAction(
    pairing.id,
    missionSession.missionId,
    missionSession.stageIndex,
    combatState,
    context.actionId,
    eventWindowId,
  );

  const contributionDelta = resolveCombatContributionDelta(
    context.actionId,
    combatState,
    nextCombatState,
    eventWindowId,
  );

  await prisma.$transaction(async (tx) => {
    await tx.missionSession.update({
      where: { id: missionSession.id },
      data: {
        combatStateJson: serializeCombatState(nextCombatState),
      },
    });

    if (contributionDelta) {
      await tx.missionSessionMember.update({
        where: {
          missionSessionId_userId: {
            missionSessionId: missionSession.id,
            userId: currentMember.userId,
          },
        },
        data: {
          eventDefenseContribution: {
            increment: contributionDelta.defense,
          },
          eventSupportContribution: {
            increment: contributionDelta.support,
          },
          eventCompletionContribution: {
            increment: contributionDelta.completion,
          },
        },
      });
    }
  });

  await recordTelemetryEvents([
    {
      userId: currentMember.userId,
      eventType: "combat_action_taken",
      phase: "mission",
      missionId: missionSession.missionId,
      context: {
        missionSessionId: missionSession.id,
        pairingId: pairing.id,
        actionId: context.actionId,
        stageId: currentStage.id,
        stageIndex: missionSession.stageIndex,
        integrityLost:
          combatState.playerIntegrity - nextCombatState.playerIntegrity,
        playerIntegrity: nextCombatState.playerIntegrity,
      },
    },
    ...(!combatState.reactionTriggered && nextCombatState.reactionTriggered
      ? [
          {
            userId: currentMember.userId,
            eventType: "reaction_triggered" as const,
            phase: "mission" as const,
            missionId: missionSession.missionId,
            context: {
              missionSessionId: missionSession.id,
              pairingId: pairing.id,
              actionId: context.actionId,
              reactionName: nextCombatState.lastReaction,
              stageId: currentStage.id,
              stageIndex: missionSession.stageIndex,
            },
          },
        ]
      : []),
    ...(combatState.telegraphActive &&
    !nextCombatState.telegraphActive &&
    !nextCombatState.reactionTriggered &&
    nextCombatState.playerIntegrity < combatState.playerIntegrity
      ? [
          {
            userId: currentMember.userId,
            eventType: "telegraph_failed" as const,
            phase: "mission" as const,
            missionId: missionSession.missionId,
            context: {
              missionSessionId: missionSession.id,
              pairingId: pairing.id,
              actionId: context.actionId,
              integrityLost:
                combatState.playerIntegrity - nextCombatState.playerIntegrity,
              stageId: currentStage.id,
              stageIndex: missionSession.stageIndex,
            },
          },
        ]
      : []),
  ]);

  return {
    missionSession: await readMissionSessionState(missionSession.id),
    status: 200,
  };
}

export async function advanceMissionSessionStage(
  context: MissionSessionAdvanceStageContext,
): Promise<SessionServiceMissionRouteResult> {
  const resolved = await resolveActiveMissionSessionForMutation(context);

  if (!resolved.ok) {
    return resolved.result;
  }

  const { missionSession } = resolved;
  const eventWindowId = normalizeEventWindowId(
    missionSession.missionId,
    missionSession.eventWindowId,
  );
  const mission = getMissionFlow(missionSession.missionId, eventWindowId);
  const combatState = readCombatState(
    missionSession.missionId,
    missionSession.stageIndex,
    missionSession.combatStateJson,
    eventWindowId,
  );

  if (!mission) {
    return {
      missionSession: null,
      message: "Mission runtime could not be resolved for this session.",
      status: 500,
    };
  }

  if (!combatState.stageComplete) {
    return {
      missionSession: await readMissionSessionState(missionSession.id),
      message: "Secure the current lane before advancing the shared objective.",
      status: 409,
    };
  }

  if (missionSession.stageIndex >= mission.stages.length - 1) {
    return {
      missionSession: await readMissionSessionState(missionSession.id),
      message: "Final lane secured. Commit rewards to close this mission.",
      status: 409,
    };
  }

  const nextStageIndex = missionSession.stageIndex + 1;
  const nextCombatState = advanceEncounterState(
    missionSession.missionId,
    nextStageIndex,
    combatState,
    eventWindowId,
  );

  await prisma.missionSession.update({
    where: { id: missionSession.id },
    data: {
      stageIndex: nextStageIndex,
      combatStateJson: serializeCombatState(nextCombatState),
    },
  });

  return {
    missionSession: await readMissionSessionState(missionSession.id),
    message: "Shared objective advanced to the next lane.",
    status: 200,
  };
}

export async function retryMissionSessionStage(
  context: MissionSessionRetryStageContext,
): Promise<SessionServiceMissionRouteResult> {
  const resolved = await resolveActiveMissionSessionForMutation(context);

  if (!resolved.ok) {
    return resolved.result;
  }

  const { missionSession } = resolved;
  const eventWindowId = normalizeEventWindowId(
    missionSession.missionId,
    missionSession.eventWindowId,
  );
  const nextCombatState = createEncounterState(
    missionSession.missionId,
    missionSession.stageIndex,
    eventWindowId,
  );

  await prisma.missionSession.update({
    where: { id: missionSession.id },
    data: {
      combatStateJson: serializeCombatState(nextCombatState),
    },
  });

  return {
    missionSession: await readMissionSessionState(missionSession.id),
    message: "Shared stage reset. The squad can re-enter the lane.",
    status: 200,
  };
}

export async function commitMissionSessionMember(
  context: MissionSessionCommitMemberContext,
): Promise<SessionServiceMissionRouteResult> {
  const resolved = await resolveActiveMissionSessionForMutation(context);

  if (!resolved.ok) {
    return resolved.result;
  }

  const { missionSession, currentMember } = resolved;
  const eventWindowId = normalizeEventWindowId(
    missionSession.missionId,
    missionSession.eventWindowId,
  );

  if (currentMember.rewardsCommittedAt) {
    return {
      missionSession: await readMissionSessionState(missionSession.id),
      message: "Rewards were already committed for this operator.",
      status: 200,
    };
  }

  const mission = getMissionFlow(missionSession.missionId, eventWindowId);

  if (!mission) {
    return {
      missionSession: null,
      message: "Mission rewards could not be resolved for this session.",
      status: 500,
    };
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
    return {
      missionSession: await readMissionSessionState(missionSession.id),
      message: "Secure the final shared lane before committing mission rewards.",
      status: 409,
    };
  }

  const committedAt = new Date();
  const pairing = getPairingForProfile({
    selectedLoadoutId: currentMember.selectedLoadoutId,
    selectedCompanionId: currentMember.selectedCompanionId,
  });

  await prisma.$transaction(async (tx) => {
    const currentProfileRecord = await tx.playerProfile.findUnique({
      where: { userId: context.userId },
    });

    if (!currentProfileRecord) {
      throw new Error("Mission reward commit requires an existing operator profile.");
    }

    const currentProfile = profileRecordToState(currentProfileRecord);
    const nextProfile = normalizeCommandDeckState({
      ...applyMissionCompletion(
        currentProfile,
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
          : currentProfile.lastEventResult,
    });

    await tx.missionSessionMember.update({
      where: {
        missionSessionId_userId: {
          missionSessionId: missionSession.id,
          userId: context.userId,
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
      where: { userId: context.userId },
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
      userId: context.userId,
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
      userId: context.userId,
      eventType: "phase_reached",
      phase: "recovery",
      missionId: missionSession.missionId,
      context: {
        fromPhase: context.profile.phase,
        rewardBandId: eventContribution?.rewardBand.id ?? null,
      },
    },
  ]);

  return {
    missionSession: await readMissionSessionState(missionSession.id),
    message: "Mission rewards committed to this operator.",
    status: 200,
  };
}

export async function readSessionServiceHealth(): Promise<SessionServiceHealth> {
  const contract = resolveSessionServiceConfig();
  const realtimeConfigured =
    contract.mode === "embedded-web" || Boolean(process.env.FLY_REALTIME_APP_NAME);
  const presenceConfigured =
    contract.coordinationMode === "inline-local" ||
    (Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
      Boolean(process.env.UPSTASH_REDIS_REST_TOKEN));

  try {
    await prisma.$queryRawUnsafe("SELECT 1");

    return {
      service: "session-service-skeleton",
      status: contract.missingKeys.length === 0 ? "ok" : "degraded",
      runtime: contract.runtime,
      contract: {
        mode: contract.mode,
        coordinationMode: contract.coordinationMode,
        source: contract.source,
        baseUrl: contract.baseUrl,
      },
      database: {
        reachable: true,
        detail: "Database connectivity check passed.",
      },
      coordination: {
        realtimeConfigured,
        presenceConfigured,
        missingKeys: contract.missingKeys,
      },
    };
  } catch (error) {
    return {
      service: "session-service-skeleton",
      status: "degraded",
      runtime: contract.runtime,
      contract: {
        mode: contract.mode,
        coordinationMode: contract.coordinationMode,
        source: contract.source,
        baseUrl: contract.baseUrl,
      },
      database: {
        reachable: false,
        detail:
          error instanceof Error
            ? error.message
            : "Database connectivity check failed.",
      },
      coordination: {
        realtimeConfigured,
        presenceConfigured,
        missingKeys: contract.missingKeys,
      },
    };
  }
}