import { prisma } from "@/lib/db";
import { forwardTelemetryEventsToAnalytics } from "@/lib/observability";
import {
  playtestIssueSeverities,
  type PlaytestFocusArea,
  type PlaytestIssueSeverity,
} from "@/lib/playtest-data";
import {
  starterPairings,
  type PairingId,
} from "@/lib/playable-slice";
import {
  missionZones,
  phaseLabels,
  phaseOrder,
  type CommandDeckPhase,
} from "@/lib/prototype-data";

export const telemetryEventTypes = [
  "operator_registered",
  "session_restored",
  "demo_session_started",
  "phase_reached",
  "mission_launched",
  "mission_completed",
  "pairing_selected",
  "combat_action_taken",
  "reaction_triggered",
  "telegraph_failed",
  "playtest_session_logged",
  "playtest_issue_logged",
  "observability_probe_requested",
  "observability_analytics_delivered",
  "observability_analytics_failed",
  "observability_analytics_skipped",
  "observability_error_delivered",
  "observability_error_failed",
  "observability_error_skipped",
] as const;

export type TelemetryEventType = (typeof telemetryEventTypes)[number];

export type TelemetryEventInput = {
  userId?: string | null;
  eventType: TelemetryEventType;
  phase?: CommandDeckPhase | null;
  missionId?: string | null;
  context?: Record<string, unknown> | null;
  createdAt?: Date;
};

export type TelemetryPhaseSummary = {
  phase: CommandDeckPhase;
  label: string;
  reachedUsers: number;
  transitions: number;
  dropFromPrevious: number | null;
};

export type TelemetryPairingSummary = {
  pairingId: PairingId;
  label: string;
  selections: number;
  trackedOutcomes: number;
  reactionTriggers: number;
  telegraphFailures: number;
  reactionRate: number;
  completedRuns: number;
  averageActionsPerClear: number | null;
  averageFinalIntegrity: number | null;
  balanceTargets: {
    actionsPerClear: { min: number; max: number };
    finalIntegrity: { min: number; max: number };
    reactionRate: { min: number; max: number };
  };
  balanceStatus: "no-data" | "on-target" | "watch";
};

export type TelemetrySummary = {
  totalOperators: number;
  registrations: number;
  sessionRestores: number;
  demoSessions: number;
  missionLaunches: number;
  missionCompletions: number;
  completionRate: number;
  pairSelections: number;
  reactionTriggers: number;
  telegraphFailures: number;
  reactionSuccessRate: number;
  phases: TelemetryPhaseSummary[];
  pairings: TelemetryPairingSummary[];
  latestEventAt: string | null;
};

export type PlaytestIssueSummary = {
  playtestSessionId: string;
  missionId: string;
  missionLabel: string;
  severity: PlaytestIssueSeverity;
  area: PlaytestFocusArea;
  title: string;
  notes: string;
  loggedBy: string;
  createdAt: string;
};

export type PlaytestSessionSummary = {
  playtestSessionId: string;
  missionId: string;
  missionLabel: string;
  operatorCount: number;
  summary: string;
  loggedBy: string;
  createdAt: string;
  issueCounts: Record<PlaytestIssueSeverity, number>;
};

export type PlaytestSummary = {
  latestSession: PlaytestSessionSummary | null;
  issuesBySeverity: Record<PlaytestIssueSeverity, PlaytestIssueSummary[]>;
};

const starterBuildBalanceTargets: Record<
  PairingId,
  TelemetryPairingSummary["balanceTargets"]
> = {
  "flux-ward": {
    actionsPerClear: { min: 7, max: 11 },
    finalIntegrity: { min: 60, max: 90 },
    reactionRate: { min: 65, max: 90 },
  },
  "frost-thread": {
    actionsPerClear: { min: 8, max: 12 },
    finalIntegrity: { min: 55, max: 85 },
    reactionRate: { min: 70, max: 95 },
  },
  "ember-raze": {
    actionsPerClear: { min: 6, max: 10 },
    finalIntegrity: { min: 35, max: 70 },
    reactionRate: { min: 50, max: 80 },
  },
  "void-archive": {
    actionsPerClear: { min: 8, max: 13 },
    finalIntegrity: { min: 65, max: 95 },
    reactionRate: { min: 55, max: 85 },
  },
  "phase-flux": {
    actionsPerClear: { min: 7, max: 11 },
    finalIntegrity: { min: 40, max: 75 },
    reactionRate: { min: 60, max: 90 },
  },
  "thunder-crush": {
    actionsPerClear: { min: 9, max: 14 },
    finalIntegrity: { min: 50, max: 80 },
    reactionRate: { min: 55, max: 85 },
  },
  "null-signal": {
    actionsPerClear: { min: 7, max: 12 },
    finalIntegrity: { min: 45, max: 80 },
    reactionRate: { min: 65, max: 92 },
  },
  "data-core": {
    actionsPerClear: { min: 7, max: 12 },
    finalIntegrity: { min: 50, max: 85 },
    reactionRate: { min: 60, max: 90 },
  },
  // Phase 14 — Preservation expansion
  "drift-echo": {
    actionsPerClear: { min: 8, max: 13 },
    finalIntegrity: { min: 60, max: 92 },
    reactionRate: { min: 65, max: 90 },
  },
  "prism-veil": {
    actionsPerClear: { min: 9, max: 14 },
    finalIntegrity: { min: 65, max: 95 },
    reactionRate: { min: 70, max: 95 },
  },
  // Phase 14 — Evolution expansion
  "acid-bloom": {
    actionsPerClear: { min: 6, max: 10 },
    finalIntegrity: { min: 30, max: 65 },
    reactionRate: { min: 55, max: 82 },
  },
  "surge-mutation": {
    actionsPerClear: { min: 7, max: 11 },
    finalIntegrity: { min: 40, max: 70 },
    reactionRate: { min: 60, max: 88 },
  },
  // Phase 14 — Dominion expansion
  "chain-herald": {
    actionsPerClear: { min: 8, max: 12 },
    finalIntegrity: { min: 45, max: 78 },
    reactionRate: { min: 58, max: 86 },
  },
  "flare-apex": {
    actionsPerClear: { min: 7, max: 11 },
    finalIntegrity: { min: 38, max: 72 },
    reactionRate: { min: 52, max: 82 },
  },
  // Phase 14 — Harmony expansion
  "pulse-mirror": {
    actionsPerClear: { min: 8, max: 12 },
    finalIntegrity: { min: 55, max: 88 },
    reactionRate: { min: 62, max: 92 },
  },
  "bloom-synthesis": {
    actionsPerClear: { min: 9, max: 13 },
    finalIntegrity: { min: 60, max: 90 },
    reactionRate: { min: 65, max: 93 },
  },
  "resonance-forge": {
    actionsPerClear: { min: 10, max: 15 },
    finalIntegrity: { min: 58, max: 88 },
    reactionRate: { min: 68, max: 94 },
  },
  // Phase 14 — Fracture expansion
  "rust-grave": {
    actionsPerClear: { min: 6, max: 11 },
    finalIntegrity: { min: 25, max: 60 },
    reactionRate: { min: 48, max: 78 },
  },
  "neon-phantom": {
    actionsPerClear: { min: 7, max: 12 },
    finalIntegrity: { min: 40, max: 72 },
    reactionRate: { min: 63, max: 90 },
  },
  "dusk-wraith": {
    actionsPerClear: { min: 7, max: 11 },
    finalIntegrity: { min: 35, max: 68 },
    reactionRate: { min: 60, max: 88 },
  },
  // Phase 14 — Cross-faction
  "arc-prism": {
    actionsPerClear: { min: 8, max: 13 },
    finalIntegrity: { min: 50, max: 83 },
    reactionRate: { min: 62, max: 91 },
  },
  "ion-null": {
    actionsPerClear: { min: 7, max: 12 },
    finalIntegrity: { min: 45, max: 78 },
    reactionRate: { min: 60, max: 90 },
  },
  "grav-forge": {
    actionsPerClear: { min: 9, max: 14 },
    finalIntegrity: { min: 55, max: 85 },
    reactionRate: { min: 65, max: 92 },
  },
  "mirror-fracture": {
    actionsPerClear: { min: 8, max: 12 },
    finalIntegrity: { min: 42, max: 75 },
    reactionRate: { min: 58, max: 88 },
  },
};

function serializeTelemetryContext(
  context: TelemetryEventInput["context"],
) {
  return context ? JSON.stringify(context) : null;
}

function readTelemetryContext(contextJson: string | null) {
  if (!contextJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(contextJson) as unknown;

    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function isPairingId(value: unknown): value is PairingId {
  return starterPairings.some((pairing) => pairing.id === value);
}

function initialPlaytestIssueCounts() {
  return {
    critical: 0,
    major: 0,
    polish: 0,
  } satisfies Record<PlaytestIssueSeverity, number>;
}

function initialPlaytestIssuesBySeverity() {
  return {
    critical: [],
    major: [],
    polish: [],
  } satisfies Record<PlaytestIssueSeverity, PlaytestIssueSummary[]>;
}

function getMissionLabel(missionId: string) {
  return missionZones.find((mission) => mission.id === missionId)?.name ?? missionId;
}

function readPlaytestSessionId(context: Record<string, unknown> | null) {
  return typeof context?.playtestSessionId === "string"
    ? context.playtestSessionId
    : null;
}

function isPlaytestIssueSeverity(value: unknown): value is PlaytestIssueSeverity {
  return playtestIssueSeverities.some((severity) => severity === value);
}

function readNumericTelemetryContextValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readMissionSessionKey(
  userId: string | null,
  context: Record<string, unknown> | null,
) {
  if (!userId || typeof context?.missionSessionId !== "string") {
    return null;
  }

  return `${userId}:${context.missionSessionId}`;
}

function withinTargetRange(
  value: number | null,
  range: { min: number; max: number },
) {
  return value !== null && value >= range.min && value <= range.max;
}

function roundTelemetryAverage(total: number, samples: number) {
  return samples > 0 ? Math.round((total / samples) * 10) / 10 : null;
}

export async function recordTelemetryEvents(events: TelemetryEventInput[]) {
  if (events.length === 0) {
    return;
  }

  try {
    await prisma.telemetryEvent.createMany({
      data: events.map((event) => ({
        userId: event.userId ?? null,
        eventType: event.eventType,
        phase: event.phase ?? null,
        missionId: event.missionId ?? null,
        contextJson: serializeTelemetryContext(event.context),
        createdAt: event.createdAt ?? new Date(),
      })),
    });
  } catch {
    // Telemetry is best-effort for the prototype and should not block user flow.
  }

  try {
    await forwardTelemetryEventsToAnalytics(events);
  } catch {
    // Hosted analytics forwarding is also best-effort and should not block user flow.
  }
}

export async function recordTelemetryEvent(event: TelemetryEventInput) {
  await recordTelemetryEvents([event]);
}

export async function readTelemetrySummary(): Promise<TelemetrySummary> {
  const [totalOperators, events] = await Promise.all([
    prisma.playerProfile.count(),
    prisma.telemetryEvent.findMany({
      select: {
        userId: true,
        eventType: true,
        phase: true,
        createdAt: true,
        contextJson: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let registrations = 0;
  let sessionRestores = 0;
  let demoSessions = 0;
  let missionLaunches = 0;
  let missionCompletions = 0;
  let pairSelections = 0;
  let reactionTriggers = 0;
  let telegraphFailures = 0;

  const phaseTransitions: Record<CommandDeckPhase, number> = {
    arrival: 0,
    bonding: 0,
    briefing: 0,
    mission: 0,
    recovery: 0,
  };
  const phaseUsers: Record<CommandDeckPhase, Set<string>> = {
    arrival: new Set<string>(),
    bonding: new Set<string>(),
    briefing: new Set<string>(),
    mission: new Set<string>(),
    recovery: new Set<string>(),
  };
  const pairingSummaries = Object.fromEntries(
    starterPairings.map((pairing) => [
      pairing.id,
      {
        pairingId: pairing.id,
        label: pairing.name,
        selections: 0,
        trackedOutcomes: 0,
        reactionTriggers: 0,
        telegraphFailures: 0,
        completedRuns: 0,
        totalActionsPerClear: 0,
        totalFinalIntegrity: 0,
        finalIntegritySamples: 0,
      },
    ]),
  ) as Record<
    PairingId,
    Omit<
      TelemetryPairingSummary,
      | "reactionRate"
      | "averageActionsPerClear"
      | "averageFinalIntegrity"
      | "balanceTargets"
      | "balanceStatus"
    > & {
      totalActionsPerClear: number;
      totalFinalIntegrity: number;
      finalIntegritySamples: number;
    }
  >;
  const actionCountsByMissionSession = new Map<string, number>();
  const completedRunsByMissionSession = new Map<
    string,
    {
      pairingId: PairingId;
      finalIntegrity: number | null;
    }
  >();

  for (const event of events) {
    const context = readTelemetryContext(event.contextJson);
    const pairingId = isPairingId(context?.pairingId) ? context.pairingId : null;
    const missionSessionKey = readMissionSessionKey(event.userId ?? null, context);

    switch (event.eventType) {
      case "operator_registered":
        registrations += 1;
        break;
      case "session_restored":
        sessionRestores += 1;
        break;
      case "demo_session_started":
        demoSessions += 1;
        break;
      case "mission_launched":
        missionLaunches += 1;
        break;
      case "mission_completed":
        missionCompletions += 1;

        if (missionSessionKey && pairingId) {
          completedRunsByMissionSession.set(missionSessionKey, {
            pairingId,
            finalIntegrity: readNumericTelemetryContextValue(context?.finalIntegrity),
          });
        }
        break;
      case "pairing_selected":
        pairSelections += 1;

        if (pairingId) {
          pairingSummaries[pairingId].selections += 1;
        }
        break;
      case "combat_action_taken":
        if (missionSessionKey) {
          actionCountsByMissionSession.set(
            missionSessionKey,
            (actionCountsByMissionSession.get(missionSessionKey) ?? 0) + 1,
          );
        }
        break;
      case "reaction_triggered":
        reactionTriggers += 1;

        if (pairingId) {
          pairingSummaries[pairingId].trackedOutcomes += 1;
          pairingSummaries[pairingId].reactionTriggers += 1;
        }
        break;
      case "telegraph_failed":
        telegraphFailures += 1;

        if (pairingId) {
          pairingSummaries[pairingId].trackedOutcomes += 1;
          pairingSummaries[pairingId].telegraphFailures += 1;
        }
        break;
      case "phase_reached":
        if (event.phase && phaseOrder.includes(event.phase as CommandDeckPhase)) {
          const phase = event.phase as CommandDeckPhase;
          phaseTransitions[phase] += 1;

          if (event.userId) {
            phaseUsers[phase].add(event.userId);
          }
        }
        break;
    }
  }

  let previousReachedUsers: number | null = null;
  const phases = phaseOrder.map((phase) => {
    const reachedUsers = phaseUsers[phase].size;
    const dropFromPrevious =
      previousReachedUsers === null
        ? null
        : Math.max(previousReachedUsers - reachedUsers, 0);

    previousReachedUsers = reachedUsers;

    return {
      phase,
      label: phaseLabels[phase],
      reachedUsers,
      transitions: phaseTransitions[phase],
      dropFromPrevious,
    } satisfies TelemetryPhaseSummary;
  });

  for (const completedRun of completedRunsByMissionSession.values()) {
    const summary = pairingSummaries[completedRun.pairingId];
    summary.completedRuns += 1;
  }

  for (const [missionSessionKey, completedRun] of completedRunsByMissionSession) {
    const summary = pairingSummaries[completedRun.pairingId];

    summary.totalActionsPerClear += actionCountsByMissionSession.get(missionSessionKey) ?? 0;

    if (completedRun.finalIntegrity !== null) {
      summary.totalFinalIntegrity += completedRun.finalIntegrity;
      summary.finalIntegritySamples += 1;
    }
  }

  const pairings = starterPairings.map((pairing) => {
    const summary = pairingSummaries[pairing.id];
    const opportunities = summary.trackedOutcomes;
    const balanceTargets = starterBuildBalanceTargets[pairing.id];
    const averageActionsPerClear = roundTelemetryAverage(
      summary.totalActionsPerClear,
      summary.completedRuns,
    );
    const averageFinalIntegrity = roundTelemetryAverage(
      summary.totalFinalIntegrity,
      summary.finalIntegritySamples,
    );
    const reactionRate =
      opportunities > 0
        ? Math.round((summary.reactionTriggers / opportunities) * 100)
        : 0;
    const hasBalanceData =
      summary.completedRuns > 0 &&
      averageActionsPerClear !== null &&
      averageFinalIntegrity !== null &&
      opportunities > 0;

    return {
      pairingId: summary.pairingId,
      label: summary.label,
      selections: summary.selections,
      trackedOutcomes: summary.trackedOutcomes,
      reactionTriggers: summary.reactionTriggers,
      telegraphFailures: summary.telegraphFailures,
      reactionRate,
      completedRuns: summary.completedRuns,
      averageActionsPerClear,
      averageFinalIntegrity,
      balanceTargets,
      balanceStatus: !hasBalanceData
        ? "no-data"
        : withinTargetRange(
              averageActionsPerClear,
              balanceTargets.actionsPerClear,
            ) &&
            withinTargetRange(
              averageFinalIntegrity,
              balanceTargets.finalIntegrity,
            ) &&
            withinTargetRange(reactionRate, balanceTargets.reactionRate)
          ? "on-target"
          : "watch",
    } satisfies TelemetryPairingSummary;
  });

  return {
    totalOperators,
    registrations,
    sessionRestores,
    demoSessions,
    missionLaunches,
    missionCompletions,
    completionRate:
      missionLaunches > 0
        ? Math.round((missionCompletions / missionLaunches) * 100)
        : 0,
    pairSelections,
    reactionTriggers,
    telegraphFailures,
    reactionSuccessRate:
      reactionTriggers + telegraphFailures > 0
        ? Math.round(
            (reactionTriggers / (reactionTriggers + telegraphFailures)) * 100,
          )
        : 0,
    phases,
    pairings,
    latestEventAt: events[0]?.createdAt.toISOString() ?? null,
  };
}

export async function readPlaytestSummary(): Promise<PlaytestSummary> {
  const events = await prisma.telemetryEvent.findMany({
    select: {
      eventType: true,
      createdAt: true,
      contextJson: true,
    },
    where: {
      eventType: {
        in: ["playtest_session_logged", "playtest_issue_logged"],
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const sessions = new Map<
    string,
    PlaytestSessionSummary & {
      issuesBySeverity: Record<PlaytestIssueSeverity, PlaytestIssueSummary[]>;
    }
  >();

  for (const event of events) {
    const context = readTelemetryContext(event.contextJson);
    const playtestSessionId = readPlaytestSessionId(context);

    if (!playtestSessionId) {
      continue;
    }

    if (event.eventType === "playtest_session_logged") {
      const missionId = typeof context?.missionId === "string" ? context.missionId : "ash-circuit";

      sessions.set(playtestSessionId, {
        playtestSessionId,
        missionId,
        missionLabel: getMissionLabel(missionId),
        operatorCount: readNumericTelemetryContextValue(context?.operatorCount) ?? 4,
        summary: typeof context?.summary === "string" ? context.summary : "Four-player playtest recorded.",
        loggedBy: typeof context?.loggedBy === "string" ? context.loggedBy : "Unknown operator",
        createdAt: event.createdAt.toISOString(),
        issueCounts: initialPlaytestIssueCounts(),
        issuesBySeverity: initialPlaytestIssuesBySeverity(),
      });
      continue;
    }

    if (event.eventType !== "playtest_issue_logged") {
      continue;
    }

    const severity = isPlaytestIssueSeverity(context?.severity)
      ? context.severity
      : null;

    if (!severity) {
      continue;
    }

    const existingSession = sessions.get(playtestSessionId);

    if (!existingSession) {
      continue;
    }

    const missionId = typeof context?.missionId === "string" ? context.missionId : existingSession.missionId;
    const issue = {
      playtestSessionId,
      missionId,
      missionLabel: getMissionLabel(missionId),
      severity,
      area:
        typeof context?.area === "string"
          ? (context.area as PlaytestFocusArea)
          : "stability",
      title: typeof context?.title === "string" ? context.title : "Untitled issue",
      notes: typeof context?.notes === "string" ? context.notes : "No additional notes logged.",
      loggedBy: typeof context?.loggedBy === "string" ? context.loggedBy : existingSession.loggedBy,
      createdAt: event.createdAt.toISOString(),
    } satisfies PlaytestIssueSummary;

    existingSession.issueCounts[severity] += 1;
    existingSession.issuesBySeverity[severity].push(issue);
  }

  const latestSession = [...sessions.values()].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )[0] ?? null;

  return {
    latestSession,
    issuesBySeverity: latestSession
      ? latestSession.issuesBySeverity
      : initialPlaytestIssuesBySeverity(),
  };
}