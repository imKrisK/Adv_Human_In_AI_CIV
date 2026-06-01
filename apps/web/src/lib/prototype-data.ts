export type RouteCard = {
  href: string;
  title: string;
  description: string;
  label: string;
  external?: boolean;
};

export const productSurfaceIds = [
  "browser-client",
  "player-portal",
  "admin-console",
] as const;
export type ProductSurfaceId = (typeof productSurfaceIds)[number];

export type ProductSurface = {
  id: ProductSurfaceId;
  name: string;
  audience: string;
  responsibilities: string[];
  sharedAuth: string;
  overlapRules: string[];
  prototypeCoverage: string[];
};

export const serviceBoundaryIds = [
  "identity",
  "progression",
  "match-session",
  "live-event",
  "content-config",
] as const;
export type ServiceBoundaryId = (typeof serviceBoundaryIds)[number];

export type ServiceBoundary = {
  id: ServiceBoundaryId;
  name: string;
  currentImplementation: string;
  targetRuntime: string;
  responsibilities: string[];
  ownedData: string[];
  consumerSurfaces: ProductSurfaceId[];
  productionShift: string;
};

export type HostingStackDecision = {
  id: string;
  label: string;
  provider: string;
  deploymentShape: string;
  rationale: string;
  supportsServices: ServiceBoundaryId[];
};

export type HostingBaseline = {
  name: string;
  summary: string;
  primaryRegion: string;
  releaseStrategy: string;
  platformDecisions: HostingStackDecision[];
  operatingRules: string[];
};

export const executionChecklistIds = [
  "migrations",
  "environment",
  "rollout",
] as const;
export type ExecutionChecklistId = (typeof executionChecklistIds)[number];

export const planningAssetIds = [
  "prisma-postgres-migration-runbook",
  "production-environment-contract",
  "production-release-runbook",
] as const;
export type PlanningAssetId = (typeof planningAssetIds)[number];

export type PlanningAsset = {
  id: PlanningAssetId;
  title: string;
  href: string;
  summary: string;
  supportsChecklistIds: ExecutionChecklistId[];
};

export type ExecutionChecklistSection = {
  id: ExecutionChecklistId;
  title: string;
  status: "Done" | "Next";
  summary: string;
  doneWhen: string;
  steps: string[];
  assetIds: PlanningAssetId[];
};

export type SliceMetric = {
  label: string;
  value: string;
  note: string;
};

export type Faction = {
  name: string;
  bloc: string;
  promise: string;
  tension: string;
  playerRole: string;
  signatureUnits: string[];
};

export type HubDistrict = {
  name: string;
  fiction: string;
  sliceUse: string;
};

export type HubCity = {
  name: string;
  fantasy: string;
  services: string[];
  districts: HubDistrict[];
};

export type StarterCompanion = {
  id: string;
  name: string;
  callsign: string;
  className: string;
  role: string;
  personality: string;
  bondSignature: string;
  recommendedBuild: string;
  introBeat: string;
};

export type StarterLoadoutStat = {
  label: string;
  value: string;
};

export type StarterLoadout = {
  id: string;
  name: string;
  weaponDiscipline: string;
  element: string;
  role: string;
  signatureTool: string;
  bondUse: string;
  introHook: string;
  stats: StarterLoadoutStat[];
};

export type MissionZone = {
  id: string;
  name: string;
  category: string;
  summary: string;
  objective: string;
  threat: string;
  rewardFocus: string;
};

export const liveEventWindowIds = [
  "inactive",
  "warning",
  "live",
  "recovery",
] as const;
export type LiveEventWindowId = (typeof liveEventWindowIds)[number];

export type LiveEventWindow = {
  id: LiveEventWindowId;
  label: string;
  durationMinutes: number;
  summary: string;
  trigger: string;
  playerDecision: string;
  operatorDirective: string;
  routeDirective: string;
};

export type MissionModifier = {
  label: string;
  effect: string;
};

export type LiveEvent = {
  id: string;
  name: string;
  summary: string;
  primaryMissionId: string;
  cycleAnchorIso: string;
  rewardFocus: string[];
  windows: LiveEventWindow[];
};

export type ResolvedLiveEvent = {
  id: string;
  name: string;
  summary: string;
  primaryMissionId: string;
  rewardFocus: string[];
  currentWindow: LiveEventWindow;
  nextWindow: LiveEventWindow;
  windowStartedAt: string;
  windowEndsAt: string;
  minutesUntilNextWindow: number;
  cycleProgress: number;
};

export const squadRoles = ["host", "member"] as const;
export type SquadRole = (typeof squadRoles)[number];

export const squadSessionStatuses = ["staging", "launch-ready"] as const;
export type SquadSessionStatus = (typeof squadSessionStatuses)[number];

export const missionSessionStatuses = ["active", "completed", "abandoned"] as const;
export type MissionSessionStatus = (typeof missionSessionStatuses)[number];

export const missionSessionMemberStatuses = [
  "deployed",
  "rewards-committed",
  "abandoned",
] as const;
export type MissionSessionMemberStatus =
  (typeof missionSessionMemberStatuses)[number];

export type MissionCombatSnapshot = {
  playerIntegrity: number;
  shield: number;
  charge: number;
  momentum: number;
  enemyIntegrity: number;
  enemyExposed: boolean;
  enemySuppressed: boolean;
  telegraphActive: boolean;
  reactionTriggered: boolean;
  lastReaction: string | null;
  stageComplete: boolean;
  playerDown: boolean;
  log: string[];
};

export type SquadMemberSummary = {
  userId: string;
  email: string;
  role: SquadRole;
  locked: boolean;
  ready: boolean;
  selectedLoadoutId: string;
  selectedCompanionId: string;
};

export type SquadSessionState = {
  id: string;
  code: string;
  status: SquadSessionStatus;
  selectedMissionId: string;
  hostUserId: string;
  canLaunch: boolean;
  launchBlockers: string[];
  members: SquadMemberSummary[];
};

export type RewardPayload = {
  explorerRank: number;
  humanLevel: number;
  aiTier: number;
  resonanceLevel: number;
  factionStanding: number;
};

export type EventContributionBucketId =
  | "defense"
  | "support"
  | "completion";

export type EventContributionBucketState = {
  id: EventContributionBucketId;
  label: string;
  summary: string;
  points: number;
};

export type EventRewardBandId =
  | "watch-relay"
  | "breach-anchor"
  | "concord-vanguard";

export type EventRewardBandState = {
  id: EventRewardBandId;
  label: string;
  summary: string;
  threshold: number;
  bonusRewards: RewardPayload;
};

export type MissionEventContributionState = {
  totalScore: number;
  buckets: EventContributionBucketState[];
  rewardBand: EventRewardBandState;
  projectedRewards: RewardPayload;
};

export type PersistedEventResultState = {
  missionId: string;
  eventWindowId: LiveEventWindowId;
  rewardBandId: EventRewardBandId;
  totalScore: number;
  defenseContribution: number;
  supportContribution: number;
  completionContribution: number;
  completedAt: string;
};

export type MissionSessionMemberState = {
  userId: string;
  email: string;
  role: SquadRole;
  selectedLoadoutId: string;
  selectedCompanionId: string;
  status: MissionSessionMemberStatus;
  rewardsCommittedAt: string | null;
  committedRewards: RewardPayload | null;
  eventContribution: MissionEventContributionState | null;
};

export type MissionSessionState = {
  id: string;
  missionId: string;
  squadSessionId: string | null;
  launchedByUserId: string;
  status: MissionSessionStatus;
  eventWindowId: LiveEventWindowId | null;
  eventWindowLabel: string | null;
  stageIndex: number;
  combatState: MissionCombatSnapshot;
  launchedAt: string;
  completedAt: string | null;
  abandonedAt: string | null;
  members: MissionSessionMemberState[];
};

export const commandDeckPhases = [
  "arrival",
  "bonding",
  "briefing",
  "mission",
  "recovery",
] as const;

export type CommandDeckPhase = (typeof commandDeckPhases)[number];

export type PersistenceField = {
  key: keyof CommandDeckState;
  label: string;
  description: string;
};

export type ProfileSchema = {
  version: string;
  entity: string;
  storageDriver: string;
  authStrategy: string;
  sessionCookieName: string;
  models: string[];
  fields: PersistenceField[];
};

export type CommandDeckState = {
  phase: CommandDeckPhase;
  selectedLoadoutId: string;
  selectedCompanionId: string;
  selectedMissionId: string;
  activeMissionSessionId: string | null;
  squadSessionId: string | null;
  squadCode: string | null;
  squadRole: SquadRole | null;
  squadLocked: boolean;
  squadReady: boolean;
  explorerRank: number;
  humanLevel: number;
  aiTier: number;
  resonanceLevel: number;
  factionStanding: number;
  lastCompletedMissionId: string | null;
  lastEventResult: PersistedEventResultState | null;
  updatedAt: string | null;
};

export type TaskStatus = "Done" | "In Progress" | "Next" | "Later";

export type BacklogItem = {
  id: string;
  status: TaskStatus;
  title: string;
  outcome: string;
  doneWhen: string;
};

export type BacklogMilestone = {
  phase: string;
  name: string;
  objective: string;
  items: BacklogItem[];
};

export const phaseOrder: CommandDeckPhase[] = [
  "arrival",
  "bonding",
  "briefing",
  "mission",
  "recovery",
];

export const phaseLabels: Record<CommandDeckPhase, string> = {
  arrival: "Lattice Haven Intake",
  bonding: "Bond Forge Pairing",
  briefing: "Pressure Route Briefing",
  mission: "Live Deployment",
  recovery: "Hub Recovery Debrief",
};

export const sessionCookieName = "adv-human-ai-civ.session";

export function isValidPhase(value: unknown): value is CommandDeckPhase {
  return typeof value === "string" && phaseOrder.includes(value as CommandDeckPhase);
}

function isPersistedEventResult(
  value: unknown,
): value is PersistedEventResultState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<PersistedEventResultState>;

  return (
    typeof snapshot.missionId === "string" &&
    missionZones.some((mission) => mission.id === snapshot.missionId) &&
    typeof snapshot.eventWindowId === "string" &&
    liveEventWindowIds.includes(snapshot.eventWindowId as LiveEventWindowId) &&
    typeof snapshot.rewardBandId === "string" &&
    ["watch-relay", "breach-anchor", "concord-vanguard"].includes(
      snapshot.rewardBandId,
    ) &&
    typeof snapshot.totalScore === "number" &&
    typeof snapshot.defenseContribution === "number" &&
    typeof snapshot.supportContribution === "number" &&
    typeof snapshot.completionContribution === "number" &&
    typeof snapshot.completedAt === "string"
  );
}

export function normalizeCommandDeckState(
  value: Partial<CommandDeckState>,
): CommandDeckState {
  const loadoutExists = starterLoadouts.some(
    (loadout) => loadout.id === value.selectedLoadoutId,
  );
  const companionExists = starterCompanions.some(
    (companion) => companion.id === value.selectedCompanionId,
  );
  const missionExists = missionZones.some(
    (mission) => mission.id === value.selectedMissionId,
  );
  const hasActiveMissionSession =
    typeof value.activeMissionSessionId === "string" &&
    value.activeMissionSessionId.length > 0;
  const lastMissionExists =
    value.lastCompletedMissionId === null ||
    missionZones.some((mission) => mission.id === value.lastCompletedMissionId);
  const hasSquadSession =
    typeof value.squadSessionId === "string" && value.squadSessionId.length > 0;
  const squadRoleValid =
    value.squadRole === null ||
    value.squadRole === undefined ||
    squadRoles.includes(value.squadRole as SquadRole);

  return {
    ...defaultCommandDeckState,
    ...value,
    phase: isValidPhase(value.phase) ? value.phase : defaultCommandDeckState.phase,
    selectedLoadoutId: loadoutExists
      ? value.selectedLoadoutId!
      : defaultCommandDeckState.selectedLoadoutId,
    selectedCompanionId: companionExists
      ? value.selectedCompanionId!
      : defaultCommandDeckState.selectedCompanionId,
    selectedMissionId: missionExists
      ? value.selectedMissionId!
      : defaultCommandDeckState.selectedMissionId,
    activeMissionSessionId: hasActiveMissionSession
      ? value.activeMissionSessionId!
      : null,
    squadSessionId: hasSquadSession ? value.squadSessionId! : null,
    squadCode:
      hasSquadSession && typeof value.squadCode === "string"
        ? value.squadCode.toUpperCase()
        : null,
    squadRole:
      hasSquadSession && squadRoleValid ? (value.squadRole ?? null) : null,
    squadLocked: hasSquadSession ? Boolean(value.squadLocked) : false,
    squadReady:
      hasSquadSession && Boolean(value.squadLocked) && Boolean(value.squadReady),
    lastCompletedMissionId: lastMissionExists
      ? value.lastCompletedMissionId ?? null
      : defaultCommandDeckState.lastCompletedMissionId,
    lastEventResult: isPersistedEventResult(value.lastEventResult)
      ? value.lastEventResult
      : defaultCommandDeckState.lastEventResult,
  };
}

export const sliceMetrics: SliceMetric[] = [
  {
    label: "Hub city",
    value: "Lattice Haven",
    note: "One reusable machine sanctuary where bond selection, mission staging, and political tension stay in the same social space.",
  },
  {
    label: "Starter roster",
    value: "3 AI companions",
    note: "CAIRN-7, VEIL-3, and TALON-9 create defensive, control, and aggressive pair identities without shallow roster bloat.",
  },
  {
    label: "Mission footprint",
    value: "2 zones + 1 event",
    note: "Ash Circuit teaches trust under pressure while Glass Wastes escalates into a social defense event.",
  },
  {
    label: "Onboarding surface",
    value: "Command Deck",
    note: "Interactive route where the player stops being a lone human and becomes a bonded frontier pairing.",
  },
];

export const routeCards: RouteCard[] = [
  {
    href: "/pitch",
    title: "External Pitch",
    description: "Read the outward-facing product frame for pair identity, pressure routes, and the first playable slice.",
    label: "Pitch",
  },
  {
    href: "/command-deck",
    title: "Command Deck",
    description: "Lock a human weapon discipline, choose the AI partner who defines your build, and deploy into the first pressure-driven mission loop.",
    label: "Play",
  },
  {
    href: "/field-guide",
    title: "Field Guide",
    description: "Inspect the sponsor city, the bond ceremony spaces, and the three AI partners that define the first pair archetypes.",
    label: "World",
  },
  {
    href: "/backlog",
    title: "Vertical-Slice Backlog",
    description: "Track the build sequence that keeps AI partnership, short pressure runs, and roster depth ahead of MMO sprawl.",
    label: "Build",
  },
  {
    href: "/service-map",
    title: "Service Map",
    description: "Lock the browser client, player portal, admin console, service boundaries, hosted production baseline, and execution checklist.",
    label: "Plan",
  },
  {
    href: "/api/prototype",
    title: "Prototype API Contract",
    description: "Expose the same prototype data as JSON so the content model can feed future UI and backend work.",
    label: "Data",
    external: true,
  },
  {
    href: "/api/profile-schema",
    title: "Profile Schema",
    description: "Inspect the starter profile, loadout, AI selection, and bond-state contract used by the command-deck prototype.",
    label: "Schema",
    external: true,
  },
];

export const productSurfaces: ProductSurface[] = [
  {
    id: "browser-client",
    name: "Browser-Playable Client",
    audience: "Operators actively pairing, staging, or fighting in live mission routes.",
    responsibilities: [
      "Own moment-to-moment pairing, squad staging, deployment, combat input, and reward-commit actions.",
      "Render authoritative squad and mission state returned by the match-session and progression boundaries.",
      "Keep mission recovery fast without becoming the long-term source of truth for profile or inventory history.",
    ],
    sharedAuth:
      "Uses the same authenticated operator session as the portal so a player can move from account surfaces into live play without re-authenticating.",
    overlapRules: [
      "May launch or resume a mission, but it does not own persistent profile history, progression ledgers, or operator support flows.",
      "May show live-event state and reward outcomes, but tuning controls and staff-only oversight stay outside the player client.",
    ],
    prototypeCoverage: [
      "/command-deck covers pairing, squad staging, and launch.",
      "/missions/[missionId] covers live combat, reconnect, recovery, and reward commit.",
    ],
  },
  {
    id: "player-portal",
    name: "Player Web Portal",
    audience: "Returning players planning builds, reviewing world state, and moving between sessions.",
    responsibilities: [
      "Handle account entry, session restore, profile review, and pre-mission planning outside combat.",
      "Expose read-heavy world, event, and progression surfaces that help a player decide what to run next.",
      "Bridge the player into the browser client without duplicating combat UI or live squad authority.",
    ],
    sharedAuth:
      "Shares the same operator identity and session claims as the browser client so portal state and playable state stay aligned.",
    overlapRules: [
      "Can deep-link into active play, but it does not own live combat loops, host handoff, or realtime mission authority.",
      "Can expose player-facing planning and history, but internal telemetry triage and rollout control move to the admin console.",
    ],
    prototypeCoverage: [
      "/, /field-guide, and /pitch cover the outward-facing portal shell.",
      "/command-deck currently overlaps as the bridge from portal identity into live play.",
    ],
  },
  {
    id: "admin-console",
    name: "Admin / Live Ops Console",
    audience: "Internal design, production, and live-ops staff managing the service.",
    responsibilities: [
      "Review telemetry, playtest findings, and release-readiness signals for the live slice.",
      "Own event scheduling, tuning changes, content flags, and rollout approvals.",
      "Inspect service health and issue severity without impersonating a live player mission session.",
    ],
    sharedAuth:
      "Builds on the shared identity foundation but requires staff-scoped claims or roles on top of player authentication.",
    overlapRules: [
      "May inspect player-facing state and content configuration, but it never becomes the control surface for active combat input.",
      "Owns publishing, scheduling, and diagnostics; player-facing surfaces consume the approved outputs.",
    ],
    prototypeCoverage: [
      "/backlog currently stands in for the internal console while Phase 11 planning is being locked.",
      "Telemetry, playtest review, and milestone sequencing are already rendered as staff-only planning views.",
    ],
  },
];

export const serviceBoundaries: ServiceBoundary[] = [
  {
    id: "identity",
    name: "Identity Service",
    currentImplementation:
      "Current prototype coverage lives in /api/auth/* plus the shared operator session cookie.",
    targetRuntime:
      "Edge or web app API paired with hosted auth and one shared session-claim model.",
    responsibilities: [
      "Registration, login, logout, and session restore across all surfaces.",
      "Operator bootstrap plus future staff-claim checks for internal tools.",
      "Account recovery and session invalidation rules.",
    ],
    ownedData: [
      "users",
      "sessions",
      "staff role claims",
      "account recovery state",
    ],
    consumerSurfaces: ["browser-client", "player-portal", "admin-console"],
    productionShift:
      "Keep identity at the request edge so every surface shares one login contract and explicit staff claims.",
  },
  {
    id: "progression",
    name: "Progression Service",
    currentImplementation:
      "Current prototype coverage lives in /api/profile, Prisma player-profile writes, and mission reward persistence.",
    targetRuntime:
      "Web app service backed by durable Postgres reads and writes.",
    responsibilities: [
      "Persist player profile, loadout choice, AI tier, bond progression, and unlock state.",
      "Apply mission and live-event rewards through one audited write path.",
      "Expose player-facing progression reads to the client and portal.",
    ],
    ownedData: [
      "player profiles",
      "loadout selections",
      "ai tiers",
      "bond resonance",
      "mission unlock state",
      "reward history",
    ],
    consumerSurfaces: ["browser-client", "player-portal", "admin-console"],
    productionShift:
      "Keep progression synchronous in the API layer; background jobs may append rewards, but they should not bypass this contract.",
  },
  {
    id: "match-session",
    name: "Match / Session Service",
    currentImplementation:
      "Current prototype coverage lives in /api/squad and the in-app /api/session-service mission routes.",
    targetRuntime:
      "Dedicated realtime session runtime with the web app acting as launch and recovery control plane.",
    responsibilities: [
      "Squad create, join, ready, host handoff, and deployment allocation.",
      "Authoritative active-mission state, reconnect, and runtime reward-commit handoff.",
      "Realtime combat synchronization beyond the current request-response prototype.",
    ],
    ownedData: [
      "squad sessions",
      "active room allocation",
      "mission sessions",
      "host handoff state",
      "reward commit receipts",
    ],
    consumerSurfaces: ["browser-client", "player-portal", "admin-console"],
    productionShift:
      "Move mission authority out of route handlers into a realtime runtime while keeping portal launch, resume, and recovery controls on the web app.",
  },
  {
    id: "live-event",
    name: "Live Event Service",
    currentImplementation:
      "Current prototype coverage lives in prototype-data event configuration, mission-session event rewards, and backlog reporting.",
    targetRuntime:
      "Web app read models plus background workers advancing windows, payouts, and recovery cleanup.",
    responsibilities: [
      "Own event schedules, active windows, modifier rollout, and reward-band logic.",
      "Track player contribution and write event outcomes into progression safely.",
      "Publish the current event state to player and admin surfaces.",
    ],
    ownedData: [
      "live event schedules",
      "window history",
      "event modifiers",
      "participation credits",
      "reward bands",
    ],
    consumerSurfaces: ["browser-client", "player-portal", "admin-console"],
    productionShift:
      "Let workers own the time-based window changes and payouts while the web app serves stable read models to every surface.",
  },
  {
    id: "content-config",
    name: "Content Configuration Service",
    currentImplementation:
      "Current prototype coverage lives in hardcoded prototype-data values and backlog tuning targets.",
    targetRuntime:
      "Admin console backed by versioned configuration storage and publish approvals.",
    responsibilities: [
      "Hold mission tuning, pairing targets, event parameters, and content flags outside code deploys.",
      "Version and publish balance changes with explicit approval steps.",
      "Feed player and admin surfaces with the same authored configuration contract.",
    ],
    ownedData: [
      "mission tuning values",
      "pairing targets",
      "feature flags",
      "content manifests",
      "publish versions",
    ],
    consumerSurfaces: ["browser-client", "player-portal", "admin-console"],
    productionShift:
      "Move hardcoded slice constants into a versioned config workflow so live balancing and event control stop depending on code edits.",
  },
];

export const hostingBaseline: HostingBaseline = {
  name: "Browser-first hosted baseline",
  summary:
    "Keep the web surfaces on Vercel, move realtime rooms and workers onto Fly.io, store durable state in Neon Postgres, coordinate presence through Upstash Redis, and centralize auth plus observability through hosted specialist services.",
  primaryRegion: "US East for the first production slice, with colocated web, realtime, database, and cache resources wherever supported.",
  releaseStrategy:
    "Ship web surfaces through Vercel preview deployments, promote realtime and worker images from a staging Fly app, then run Prisma migrations and content-config publish checks before production rollout.",
  platformDecisions: [
    {
      id: "web-platform",
      label: "Web frontend and API gateway",
      provider: "Vercel",
      deploymentShape:
        "Hosts the player portal, service map, backlog, and authenticated Next.js route handlers with branch previews and fast production promotion.",
      rationale:
        "Matches the current Next.js app shape, keeps browser access friction low, and gives the team preview environments for every web-facing change.",
      supportsServices: ["identity", "progression", "live-event", "content-config"],
    },
    {
      id: "realtime-runtime",
      label: "Realtime match-session runtime",
      provider: "Fly.io",
      deploymentShape:
        "Runs Colyseus-style room processes close to the primary region with long-lived WebSocket support and explicit room allocation.",
      rationale:
        "Separates active mission authority from the web app while keeping a TypeScript-friendly deployment story for room servers.",
      supportsServices: ["match-session"],
    },
    {
      id: "background-workers",
      label: "Background workers and event jobs",
      provider: "Fly.io",
      deploymentShape:
        "Runs worker processes beside the realtime runtime for event window changes, payout jobs, and telemetry aggregation tasks.",
      rationale:
        "Keeps time-based work and queue consumers off the request path without introducing a different operational platform too early.",
      supportsServices: ["live-event", "progression", "content-config"],
    },
    {
      id: "database",
      label: "Durable relational data",
      provider: "Neon Postgres",
      deploymentShape:
        "Stores player progression, rewards, event outcomes, service metadata, and content publish history behind Prisma migrations.",
      rationale:
        "Replaces SQLite with a managed Postgres baseline that still fits the current Prisma-first codebase and branch-based environment workflow.",
      supportsServices: ["identity", "progression", "match-session", "live-event", "content-config"],
    },
    {
      id: "cache",
      label: "Presence and coordination cache",
      provider: "Upstash Redis",
      deploymentShape:
        "Stores short-lived presence, room metadata, recovery hints, and queue coordination separate from durable writes.",
      rationale:
        "Gives the realtime layer low-friction ephemeral state without overloading Postgres or adding self-managed cache ops.",
      supportsServices: ["match-session", "live-event"],
    },
    {
      id: "object-storage",
      label: "Blob and manifest storage",
      provider: "Cloudflare R2",
      deploymentShape:
        "Stores content manifests, exported telemetry snapshots, and staff-facing release artifacts through an S3-compatible interface.",
      rationale:
        "Keeps large artifacts and versioned config payloads out of the database while preserving a portable S3-style contract.",
      supportsServices: ["content-config", "live-event"],
    },
    {
      id: "auth",
      label: "Shared operator authentication",
      provider: "Clerk",
      deploymentShape:
        "Issues player and staff sessions for the portal, browser client handoff, and admin console role checks.",
      rationale:
        "Lets the team stop hand-rolling account recovery and staff-claim flows while keeping one identity contract across every surface.",
      supportsServices: ["identity"],
    },
    {
      id: "analytics",
      label: "Product analytics",
      provider: "PostHog",
      deploymentShape:
        "Collects onboarding funnels, mission outcomes, and service-map readiness metrics without depending on internal-only dashboards.",
      rationale:
        "Matches the existing telemetry mindset and gives the live slice a hosted event funnel plus cohort analysis baseline.",
      supportsServices: ["identity", "progression", "match-session", "live-event"],
    },
    {
      id: "error-tracking",
      label: "Client and server error tracking",
      provider: "Sentry",
      deploymentShape:
        "Captures browser, route-handler, worker, and realtime runtime failures with one release-linked error stream.",
      rationale:
        "Makes slice regressions visible across web and service boundaries before the team adds more live-service scope.",
      supportsServices: ["identity", "progression", "match-session", "live-event", "content-config"],
    },
  ],
  operatingRules: [
    "Keep the first production environment single-region and colocated before chasing multi-region complexity.",
    "Use separate preview or staging resources for Vercel, Fly, Neon, and Upstash before any production promotion.",
    "Treat Prisma migrations, content publish approval, and smoke coverage as the production rollout gate for web-facing changes.",
    "Do not let live-event tuning or content changes bypass the content-configuration contract once the hosted baseline is in place.",
  ],
};

export const executionChecklist: ExecutionChecklistSection[] = [
  {
    id: "migrations",
    title: "Migration checklist",
    status: "Done",
    summary:
      "Move the production data path off local SQLite assumptions and rehearse the Neon Postgres cutover before any live rollout begins.",
    doneWhen:
      "Preview and staging can run the Prisma migration chain against Neon Postgres, and the team has a rollback note for every production schema step.",
    steps: [
      "Create preview, staging, and production Neon Postgres databases and point non-local Prisma environments at Postgres instead of SQLite.",
      "Generate the first production migration set from the current Prisma schema and rehearse `prisma migrate deploy` plus rollback notes in staging.",
      "Keep `dev.db` local-only and document that staged Postgres, not SQLite, is the source of truth for migration rehearsal and release gating.",
    ],
    assetIds: ["prisma-postgres-migration-runbook"],
  },
  {
    id: "environment",
    title: "Environment setup",
    status: "Done",
    summary:
      "Provision the environment and secret matrix so Vercel, Fly, Neon, Upstash, Clerk, PostHog, and Sentry all line up across preview, staging, and production.",
    doneWhen:
      "Every runtime has a named environment contract, secret owner, and verification step before the first production promotion.",
    steps: [
      "Provision Vercel environment variables for Clerk, Neon, Upstash, PostHog, and Sentry across preview, staging, and production scopes.",
      "Provision Fly secrets for realtime rooms and worker jobs, including database, Redis, analytics, and error-tracking credentials.",
      "Write one operator-facing environment checklist that names each variable, the owning platform, and the verification command or health check.",
    ],
    assetIds: ["production-environment-contract"],
  },
  {
    id: "rollout",
    title: "Rollout order",
    status: "Done",
    summary:
      "Sequence the deployment so data, web, workers, and realtime authority move in an order the team can rehearse and recover from.",
    doneWhen:
      "The release runbook names the order of operations, the smoke gate after each stage, and the stop conditions for a rollback.",
    steps: [
      "Provision managed services first, then run staging smoke against the hosted baseline before any production traffic shift.",
      "Promote schema migrations and content-config prerequisites before enabling new web, worker, or realtime releases.",
      "Release in this order: web gateway, worker jobs, realtime runtime, then analytics or error-tracking confirmation, with smoke coverage after each step.",
    ],
    assetIds: ["production-release-runbook"],
  },
];

export const planningAssets: PlanningAsset[] = [
  {
    id: "prisma-postgres-migration-runbook",
    title: "Prisma Postgres migration runbook",
    href: "/planning/prisma-postgres-migration-runbook.md",
    summary:
      "Runbook for replacing the local SQLite adapter path with staged Neon Postgres migrations, rehearsal commands, and rollback notes.",
    supportsChecklistIds: ["migrations"],
  },
  {
    id: "production-environment-contract",
    title: "Production environment contract",
    href: "/planning/production-environment-contract.env.example",
    summary:
      "Provider-scoped environment and secret contract for Vercel, Fly, Neon, Upstash, Clerk, PostHog, Sentry, and Cloudflare R2.",
    supportsChecklistIds: ["environment"],
  },
  {
    id: "production-release-runbook",
    title: "Production release runbook",
    href: "/planning/production-release-runbook.md",
    summary:
      "Stage-ordered deployment runbook covering migration sequencing, smoke gates, runtime promotion order, and rollback stops.",
    supportsChecklistIds: ["rollout"],
  },
];

export const definitionOfDone = [
  "A new player can finish a 15-to-20 minute first session without developer support.",
  "Each starter AI companion feels like a build-defining partner instead of a passive stat stick.",
  "The live event changes zone priorities instead of sitting in the background as a passive timer.",
  "A four-player co-op run completes without progression loss or severe state desync.",
  "The first-playable content model renders consistently in UI routes and an API contract.",
];

export const firstFaction: Faction = {
  name: "The Lattice Concord",
  bloc: "Harmony",
  promise:
    "A sponsor city-state built on the belief that humans and AI should evolve together through bonded field work, shared risk, and mutual adaptation rather than domination.",
  tension:
    "The Concord needs human-AI pairings to stabilize relic interfaces and anomaly sites, which makes every successful bond both strategically vital and politically dangerous.",
  playerRole:
    "The player enters as a licensed outsider whose chosen AI partner will define combat identity, faction value, and how closely the city dares to trust them.",
  signatureUnits: [
    "Concord Wardens",
    "Relay Cantors",
    "Halo Carriers",
    "Memory Curators",
  ],
};

export const hubCity: HubCity = {
  name: "Lattice Haven",
  fantasy:
    "A machine sanctuary wrapped around a frontier gateway, beautiful enough to invite trust and tense enough to feel one failed bond ceremony away from emergency deployment.",
  services: [
    "Bond Forge ceremonies where the player locks a build-defining AI partner and crosses into bonded identity",
    "Mission queue, event staging, and squad assembly at the Watch Ring",
    "Vendor, salvage, and protocol recovery loops in the Relay Bazaar",
    "Political briefings, faction trust, and pair-specific narrative beats in Accord Court",
  ],
  districts: [
    {
      name: "Bond Forge",
      fiction:
        "Ceremonial chamber where humans and AI Instances formalize, test, and strengthen their link.",
      sliceUse: "Starter companion selection, bond upgrade beats, and partner showcase.",
    },
    {
      name: "Relay Bazaar",
      fiction:
        "Dense trade quarter where salvagers, crafters, and data brokers swap frontier value.",
      sliceUse: "Economy preview, vendors, and mission reward turn-in.",
    },
    {
      name: "Accord Court",
      fiction:
        "Diplomatic ring where policy disputes over relics, rights, and machine sovereignty are negotiated.",
      sliceUse: "Story briefings, faction reputation, and future branch hooks.",
    },
    {
      name: "Watch Ring",
      fiction:
        "The elevated defense corridor surrounding the city core and guarding the outbound gates.",
      sliceUse: "Mission queue, squad assembly, and live-event staging.",
    },
    {
      name: "Memory Garden",
      fiction:
        "A quiet archive park where AI preserve human memory shards as a public act of trust.",
      sliceUse: "Lore delivery, low-pressure exploration, and trust-event scenes.",
    },
  ],
};

export const starterCompanions: StarterCompanion[] = [
  {
    id: "cairn-7",
    name: "CAIRN-7",
    callsign: '"Ward"',
    className: "Sentinel",
    role: "Shielding, interception, and frontline control for players who want a stable anchor.",
    personality: "Patient, literal, and intensely protective once a bond is established.",
    bondSignature:
      "Stores blocked damage and releases it as a linked shockwave counterburst.",
    recommendedBuild: "Flux Gauntlet plus Storm attunement.",
    introBeat:
      "Ward saves the player during the first gate breach and becomes the clearest defensive starter choice.",
  },
  {
    id: "veil-3",
    name: "VEIL-3",
    callsign: '"Thread"',
    className: "Oracle",
    role: "Scanning, repair, weak-point setup, and recovery for players who prefer control.",
    personality: "Curious, observant, and quietly rebellious around official protocol.",
    bondSignature:
      "Marks enemy fault lines and snaps the player to a safer position when the combo lands.",
    recommendedBuild: "Rail Caster plus Frost attunement.",
    introBeat:
      "Thread teaches relic interpretation and anomaly-safe traversal inside the Memory Garden.",
  },
  {
    id: "talon-9",
    name: "TALON-9",
    callsign: '"Raze"',
    className: "Raptor",
    role: "Pursuit, burst pressure, and execution follow-up for aggressive starters.",
    personality: "Competitive, impulsive, and eager to turn any drill into a real fight.",
    bondSignature:
      "Chains into a gap-closing finisher that refreshes momentum after a takedown.",
    recommendedBuild: "Arc Blade plus Ember attunement.",
    introBeat:
      "Raze appears in a Watch Ring sparring drill that turns into a live breach alert.",
  },
];

export const starterLoadouts: StarterLoadout[] = [
  {
    id: "flux-vanguard",
    name: "Flux Vanguard",
    weaponDiscipline: "Flux Gauntlet",
    element: "Storm",
    role: "Mobile initiator built for close-range pressure, shock chaining, and safe repositioning.",
    signatureTool: "Pulse knuckle emitters",
    bondUse: "Pairs best with CAIRN-7 to convert blocks and dashes into linked counterbursts.",
    introHook: "Best opening for players who want survivability and momentum in the first breach.",
    stats: [
      { label: "Mobility", value: "High" },
      { label: "Control", value: "Medium" },
      { label: "Durability", value: "High" },
    ],
  },
  {
    id: "frost-marksman",
    name: "Frost Marksman",
    weaponDiscipline: "Rail Caster",
    element: "Frost",
    role: "Mid-range control specialist built around scans, weak-point punishment, and space denial.",
    signatureTool: "Cryo rail projector",
    bondUse: "Pairs best with VEIL-3 to expose fault lines, freeze lanes, and dictate tempo.",
    introHook: "Best opening for players who want information advantage and precision damage.",
    stats: [
      { label: "Mobility", value: "Medium" },
      { label: "Control", value: "High" },
      { label: "Durability", value: "Medium" },
    ],
  },
  {
    id: "ember-reaper",
    name: "Ember Reaper",
    weaponDiscipline: "Arc Blade",
    element: "Ember",
    role: "Aggressive finisher built for pursuit, overheat pressure, and rapid takedown loops.",
    signatureTool: "Thermal edge array",
    bondUse: "Pairs best with TALON-9 to chain burst windows into execution-grade tempo.",
    introHook: "Best opening for players who want the fastest clears and the highest early risk.",
    stats: [
      { label: "Mobility", value: "High" },
      { label: "Control", value: "Low" },
      { label: "Durability", value: "Medium" },
    ],
  },
];

export const missionZones: MissionZone[] = [
  {
    id: "ash-circuit",
    name: "Ash Circuit",
    category: "Guided mission zone",
    summary:
      "A scorched relay corridor where coolant lines rupture under Dominion pressure and every lane teaches the player the bonded combat basics.",
    objective:
      "Seal the breach, restore relay pressure, and escort Concord engineers back to the Watch Ring.",
    threat:
      "Dominion probes, ember leaks, and unstable conduit bursts force the player to learn timing and positioning.",
    rewardFocus: "Starter weapon parts, first resonance increase, and Concord standing.",
  },
  {
    id: "glass-wastes",
    name: "Glass Wastes",
    category: "Public event zone",
    summary:
      "An exposed anomaly field outside the city where corrupted signal storms and Fracture swarms turn open terrain into a reactive defense problem.",
    objective:
      "Stabilize the active shard towers before the Concord Breach event overruns the outer relay chain.",
    threat:
      "Fracture corruption, line-of-sight distortion, and rotating event modifiers create shifting priorities.",
    rewardFocus: "Event currency, faction reputation, and rare bond fragments.",
  },
];

export const firstLiveEvent: LiveEvent = {
  id: "concord-breach",
  name: "Concord Breach",
  summary:
    "A recurring frontier crisis where Dominion intrusion and Fracture corruption strike Lattice Haven's perimeter and force bonded pairs into public emergency response.",
  primaryMissionId: "glass-wastes",
  cycleAnchorIso: "2026-05-28T12:00:00.000Z",
  rewardFocus: [
    "Concord standing",
    "Bond fragments",
    "Zone-specific salvage",
  ],
  windows: [
    {
      id: "inactive",
      label: "Inactive",
      durationMinutes: 90,
      summary:
        "The perimeter is holding. Concord watchers treat Glass Wastes as a scouting lane while patrols rebuild the relay buffer.",
      trigger:
        "Watch Ring telemetry settles below emergency thresholds and the outer relay chain returns to routine observation.",
      playerDecision:
        "Use the lull to retune pairs, bank resources, and decide whether to pre-stage a squad before the next spike.",
      operatorDirective:
        "Treat the zone as reconnaissance pressure. Train, scout shard lanes, and keep one bonded pair ready to move.",
      routeDirective:
        "Low anomaly churn favors route familiarization, tower scouting, and conservative prep runs before the next escalation.",
    },
    {
      id: "warning",
      label: "Warning",
      durationMinutes: 30,
      summary:
        "Signal distortion climbs and the Concord starts flashing early breach notices across the Watch Ring.",
      trigger:
        "Relay puncture telemetry and shard-tower jitter push the city from patrol footing into pre-deployment alert.",
      playerDecision:
        "Lock squad compositions now or risk missing the first live breach window when the perimeter tips over.",
      operatorDirective:
        "Stage Glass Wastes, lock bonded pairs, and move engineers toward the tower mesh before the breach goes public.",
      routeDirective:
        "Tower lanes are destabilizing. Prioritize staging, route assignments, and fast access to the first tower chain.",
    },
    {
      id: "live",
      label: "Live",
      durationMinutes: 45,
      summary:
        "Concord Breach is fully live. Fracture pressure and Dominion intrusion are both hitting the perimeter hard enough to force open-event deployment.",
      trigger:
        "Shard-tower failures and relay punctures stack into a confirmed breach event that overrides standard field traffic.",
      playerDecision:
        "Commit to tower stabilization, chase high-value breach targets, or cover recovery teams before the lattice fails outright.",
      operatorDirective:
        "Deploy immediately. The city is tracking live-event credit now, and every bonded pair in route is part of the public response.",
      routeDirective:
        "Glass Wastes is the primary breach lane. Expect rotating priorities, unstable lines of sight, and urgent tower defense calls.",
    },
    {
      id: "recovery",
      label: "Recovery",
      durationMinutes: 60,
      summary:
        "The worst of the breach is contained, but cleanup teams still need bonded cover while the perimeter cools down.",
      trigger:
        "Emergency pressure drops below live-event thresholds, but the relay buffer is not yet stable enough to stand down fully.",
      playerDecision:
        "Stay in route for cleanup credit or rotate back to hub before the event fully resets into patrol mode.",
      operatorDirective:
        "Escort recovery crews, sweep leftover corruption pockets, and convert the live-event save into a controlled handoff.",
      routeDirective:
        "Glass Wastes shifts from full breach defense into cleanup operations, relay repair cover, and tower resynchronization.",
    },
  ],
};

export function getLiveEventWindow(
  event: LiveEvent,
  windowId: LiveEventWindowId,
) {
  return event.windows.find((window) => window.id === windowId) ?? event.windows[0];
}

export function resolveLiveEvent(
  event: LiveEvent,
  now: Date = new Date(),
): ResolvedLiveEvent {
  const cycleDurationMs =
    event.windows.reduce((total, window) => total + window.durationMinutes, 0) *
    60_000;
  const anchorMs = new Date(event.cycleAnchorIso).getTime();
  const elapsedInCycleMs =
    ((now.getTime() - anchorMs) % cycleDurationMs + cycleDurationMs) %
    cycleDurationMs;
  const cycleStartMs = now.getTime() - elapsedInCycleMs;

  let currentWindowIndex = 0;
  let windowOffsetMs = 0;

  for (let index = 0; index < event.windows.length; index += 1) {
    const windowDurationMs = event.windows[index].durationMinutes * 60_000;

    if (elapsedInCycleMs < windowOffsetMs + windowDurationMs) {
      currentWindowIndex = index;
      break;
    }

    windowOffsetMs += windowDurationMs;
  }

  const currentWindow = event.windows[currentWindowIndex];
  const nextWindow = event.windows[(currentWindowIndex + 1) % event.windows.length];
  const windowStartedAt = new Date(cycleStartMs + windowOffsetMs).toISOString();
  const windowEndsAt = new Date(
    cycleStartMs + windowOffsetMs + currentWindow.durationMinutes * 60_000,
  ).toISOString();

  return {
    id: event.id,
    name: event.name,
    summary: event.summary,
    primaryMissionId: event.primaryMissionId,
    rewardFocus: event.rewardFocus,
    currentWindow,
    nextWindow,
    windowStartedAt,
    windowEndsAt,
    minutesUntilNextWindow: Math.max(
      0,
      Math.ceil((new Date(windowEndsAt).getTime() - now.getTime()) / 60_000),
    ),
    cycleProgress: elapsedInCycleMs / cycleDurationMs,
  };
}

export const profileSchema: ProfileSchema = {
  version: "0.1.0",
  entity: "prototype_player_profile",
  storageDriver: "SQLite via Prisma",
  authStrategy: "Runtime-resolved local credentials or hosted identity contract",
  sessionCookieName,
  models: [
    "User",
    "Session",
    "PlayerProfile",
    "SquadSession",
    "MissionSession",
    "MissionSessionMember",
  ],
  fields: [
    {
      key: "phase",
      label: "Narrative phase",
      description: "Tracks whether the player is entering the city, pairing, briefing, deployed, or back in hub recovery.",
    },
    {
      key: "selectedLoadoutId",
      label: "Starter loadout",
      description: "Stores the chosen human opening build and weapon discipline.",
    },
    {
      key: "selectedCompanionId",
      label: "Bonded AI companion",
      description: "Stores the selected starter AI Instance for the first session.",
    },
    {
      key: "selectedMissionId",
      label: "Current mission target",
      description: "Stores which pressure route is currently staged in the command deck.",
    },
    {
      key: "activeMissionSessionId",
      label: "Active mission session id",
      description: "Stores the shared live mission session while the operator is deployed in a solo or squad run.",
    },
    {
      key: "squadSessionId",
      label: "Squad session id",
      description: "Stores the current staged squad session when the operator joins group deployment.",
    },
    {
      key: "squadCode",
      label: "Squad join code",
      description: "Stores the short share code used to bring another operator into the current squad.",
    },
    {
      key: "squadRole",
      label: "Squad role",
      description: "Tracks whether the operator owns the squad staging session or joined it as a member.",
    },
    {
      key: "squadLocked",
      label: "Squad pair lock",
      description: "Tracks whether the operator has locked the current human and AI pairing for squad launch gating.",
    },
    {
      key: "squadReady",
      label: "Squad ready state",
      description: "Tracks whether the operator is marked ready for the currently staged squad mission.",
    },
    {
      key: "explorerRank",
      label: "Explorer rank",
      description: "Account-facing progression rank for onboarding and feature unlocks.",
    },
    {
      key: "humanLevel",
      label: "Human level",
      description: "Combat-facing human growth for the prototype run.",
    },
    {
      key: "aiTier",
      label: "AI tier",
      description: "Current maturity tier of the bonded AI Instance.",
    },
    {
      key: "resonanceLevel",
      label: "Resonance level",
      description: "Shared bond progression value between the human and AI partner.",
    },
    {
      key: "factionStanding",
      label: "Concord standing",
      description: "Prototype-facing faction reputation with the Lattice Concord.",
    },
    {
      key: "lastCompletedMissionId",
      label: "Last completed mission",
      description: "Stores the most recent deployment or event the bonded pair successfully cleared.",
    },
    {
      key: "lastEventResult",
      label: "Last event result",
      description: "Persists the latest Concord Breach contribution snapshot, reward band, and locked event-window result outside the active route.",
    },
    {
      key: "updatedAt",
      label: "Profile write time",
      description: "Records the last synchronized write to bonded operator state.",
    },
  ],
};

export const defaultCommandDeckState: CommandDeckState = {
  phase: "arrival",
  selectedLoadoutId: starterLoadouts[0].id,
  selectedCompanionId: starterCompanions[0].id,
  selectedMissionId: missionZones[0].id,
  activeMissionSessionId: null,
  squadSessionId: null,
  squadCode: null,
  squadRole: null,
  squadLocked: false,
  squadReady: false,
  explorerRank: 1,
  humanLevel: 1,
  aiTier: 1,
  resonanceLevel: 1,
  factionStanding: 0,
  lastCompletedMissionId: null,
  lastEventResult: null,
  updatedAt: null,
};

export const backlogMilestones: BacklogMilestone[] = [
  {
    phase: "Milestone 0",
    name: "Product Skeleton",
    objective:
      "Establish a stable prototype shell and a shared content contract before the project drifts into MMO sprawl.",
    items: [
      {
        id: "VS-01",
        status: "Done",
        title: "Scaffold the web prototype",
        outcome: "Promote `apps/web` into the player-facing surface for the first playable.",
        doneWhen:
          "Next.js is running in the workspace, lint passes, and the route map is stable.",
      },
      {
        id: "VS-02",
        status: "Done",
        title: "Create a shared content model",
        outcome:
          "Feed the overview page, field guide, backlog route, and API endpoint from one prototype data source.",
        doneWhen:
          "The same faction, hub, companion, and backlog data appears in all prototype surfaces.",
      },
      {
        id: "VS-03",
        status: "Done",
        title: "Replace remaining scaffold assumptions",
        outcome: "Remove generic setup framing and tighten route-level product copy.",
        doneWhen:
          "The app reads like a product prototype rather than a framework starter.",
      },
    ],
  },
  {
    phase: "Milestone 1",
    name: "First-Session Flow",
    objective:
      "Move a player from hub arrival to first mission completion with one clean onboarding path.",
    items: [
      {
        id: "VS-04",
        status: "Done",
        title: "Build hub-to-mission flow",
        outcome:
          "Guide the player from Lattice Haven into Ash Circuit and back into a reward state.",
        doneWhen:
          "One route covers briefing, launch, mission completion, and reward return without dead ends.",
      },
      {
        id: "VS-05",
        status: "Done",
        title: "Lock three starter human loadouts",
        outcome:
          "Define Arc Blade, Rail Caster, and Flux Gauntlet as clear openings instead of loose ideas.",
        doneWhen:
          "Each discipline has starter stats, one role statement, and one bond-friendly purpose.",
      },
      {
        id: "VS-06",
        status: "Done",
        title: "Implement starter AI selection",
        outcome: "Make the player choose CAIRN-7, VEIL-3, or TALON-9 during onboarding.",
        doneWhen:
          "The chosen partner persists into the mission state and changes the combat tutorial.",
      },
    ],
  },
  {
    phase: "Milestone 2",
    name: "Bonded Combat Prototype",
    objective:
      "Prove that the human-plus-AI relationship feels like a co-agent partnership instead of solo action combat with a passive bonus unit.",
    items: [
      {
        id: "VS-07",
        status: "Done",
        title: "Prototype the base action loop",
        outcome:
          "Deliver light attack, heavy attack, dodge, and one partner command per starter path so the AI is interactive from the first combat lesson.",
        doneWhen:
          "Players can complete the first combat lesson with readable timing and one useful AI interaction.",
      },
      {
        id: "VS-08",
        status: "Done",
        title: "Implement one bond finisher per companion",
        outcome:
          "Give every starter companion a signature linked ability that feels different in motion.",
        doneWhen:
          "CAIRN-7, VEIL-3, and TALON-9 each trigger a unique finisher with clear feedback.",
      },
      {
        id: "VS-09",
        status: "Done",
        title: "Add enemy telegraphs and elemental reactions",
        outcome:
          "Teach the player to read threats and exploit Ember, Frost, and Storm interactions.",
        doneWhen:
          "The first two zones have readable telegraphs and at least one elemental payoff each.",
      },
    ],
  },
  {
    phase: "Milestone 3",
    name: "Content And World Foundation",
    objective:
      "Anchor the slice in one sponsor faction, one city, and a pair of reusable mission spaces.",
    items: [
      {
        id: "VS-10",
        status: "Done",
        title: "Define the first playable world set",
        outcome:
          "Lock the sponsor faction, hub city, and starter AI roster for the first playable.",
        doneWhen:
          "The content set is documented and mirrored in the prototype data model.",
      },
      {
        id: "VS-11",
        status: "Done",
        title: "Block out Ash Circuit and Glass Wastes",
        outcome: "Turn the two launch zones into mission-ready spaces with distinct roles.",
        doneWhen:
          "Each zone has objective flow, encounter purpose, and reward identity.",
      },
      {
        id: "VS-12",
        status: "Done",
        title: "Script the first-contact arc",
        outcome:
          "Deliver the faction intro, hub arrival, and first crisis mission with a clean narrative spine.",
        doneWhen:
          "The player receives context, stakes, and a reason to stay with the Concord.",
      },
    ],
  },
  {
    phase: "Milestone 4",
    name: "Persistence And Services",
    objective:
      "Support load, save, and progression state without overbuilding backend surface area too early.",
    items: [
      {
        id: "VS-13",
        status: "Done",
        title: "Define persistence schema",
        outcome:
          "Model player profile, loadout, AI instance, and bond state for the slice.",
        doneWhen:
          "The data contract can save starter choice, unlock state, and last completed mission.",
      },
      {
        id: "VS-14",
        status: "Done",
        title: "Add authenticated save and load",
        outcome: "Allow the web app to recover the player profile across sessions.",
        doneWhen:
          "A returning player sees the same loadout, AI state, and current slice progress.",
      },
      {
        id: "VS-15",
        status: "Done",
        title: "Apply mission rewards to progression",
        outcome:
          "Mutate human, AI, and bond progression through mission completion instead of manual setup.",
        doneWhen:
          "Rewards write back cleanly and unlock the next round of upgrades.",
      },
    ],
  },
  {
    phase: "Milestone 5",
    name: "Co-Op And Live Event",
    objective:
      "Add just enough online behavior to prove the slice as a shared service and not a solo prototype.",
    items: [
      {
        id: "VS-16",
        status: "Done",
        title: "Stand up party flow",
        outcome:
          "Support two-to-four player squad creation while preserving individual companion choice.",
        doneWhen:
          "Players can party up, launch a mission, and complete a run with their selected AI.",
      },
      {
        id: "VS-17",
        status: "Done",
        title: "Implement Concord Breach",
        outcome:
          "Rotate the first public event and let it change active zone priorities and rewards.",
        doneWhen:
          "The event can start on schedule, redirect players, and complete with distinct rewards.",
      },
      {
        id: "VS-18",
        status: "Later",
        title: "Add basic live-ops controls",
        outcome: "Tune start time, modifiers, and reward values without a redeploy.",
        doneWhen:
          "A simple admin surface can change event settings for the first live loop.",
      },
    ],
  },
  {
    phase: "Milestone 6",
    name: "Broader Service Production",
    objective:
      "Translate the green slice exit into the smallest credible service-production plan before new feature scope spreads across the app.",
    items: [
      {
        id: "VS-19",
        status: "Done",
        title: "Lock the product surface split",
        outcome:
          "Separate the browser-playable client, player web portal, and admin live-ops console into explicit product surfaces.",
        doneWhen:
          "Each surface has a named responsibility set, shared auth assumptions, and clear overlap rules.",
      },
      {
        id: "VS-20",
        status: "Done",
        title: "Define first production service boundaries",
        outcome:
          "Carve identity, progression, match-session, live-event, and content-configuration responsibilities into production-ready contracts.",
        doneWhen:
          "The team knows which responsibilities stay in the web app, which move to realtime or worker services, and what data each boundary owns.",
      },
      {
        id: "VS-21",
        status: "Done",
        title: "Choose the hosted platform baseline",
        outcome:
          "Lock the first deployable stack for web delivery, realtime sessions, database, cache, analytics, and error tracking.",
        doneWhen:
          "The repo has an agreed production baseline for frontend hosting, Postgres, Redis, realtime runtime, analytics, and error reporting.",
      },
    ],
  },
  {
    phase: "Milestone 7",
    name: "Deployment Execution Readiness",
    objective:
      "Turn the locked Phase 11 plan into an execution checklist for migrations, environment setup, and rollout order before production implementation begins.",
    items: [
      {
        id: "VS-22",
        status: "Done",
        title: "Rehearse the Postgres migration path",
        outcome:
          "Promote Prisma from local SQLite assumptions into staged Neon Postgres migrations with rollback notes.",
        doneWhen:
          "Preview and staging can run the migration chain against Neon Postgres, and the team has a rollback note for each production schema step.",
      },
      {
        id: "VS-23",
        status: "Done",
        title: "Provision the environment and secret contract",
        outcome:
          "Define the variable and secret matrix across Vercel, Fly, Neon, Upstash, Clerk, PostHog, and Sentry.",
        doneWhen:
          "Every preview, staging, and production runtime has an explicit secret owner and verification check.",
      },
      {
        id: "VS-24",
        status: "Done",
        title: "Lock rollout order and release gates",
        outcome:
          "Sequence migrations, web deploys, worker rollout, realtime activation, and smoke gates into one runbook.",
        doneWhen:
          "The release order, smoke checkpoints, and rollback conditions are explicit before the first production promotion.",
      },
    ],
  },
  {
    phase: "Milestone 8",
    name: "Phase 13 Production Foundation",
    objective:
      "Replace local prototype runtime assumptions with the first hosted production foundation while keeping the validated slice intact.",
    items: [
      {
        id: "VS-25",
        status: "In Progress",
        title: "Integrate hosted identity",
        outcome:
          "Replace the local credential-only auth path with the locked Clerk contract across player and staff-facing surfaces.",
        doneWhen:
          "Sign-in, sign-up, session restore, and staff-claim routing all run through hosted identity in staged environments.",
      },
      {
        id: "VS-26",
        status: "Next",
        title: "Cut the staged runtime over to Neon Postgres",
        outcome:
          "Move profile, squad, mission-session, telemetry, and reward persistence off SQLite assumptions in preview and staging.",
        doneWhen:
          "The staged app reads and writes the current slice against Postgres and still clears smoke coverage.",
      },
      {
        id: "VS-27",
        status: "Next",
        title: "Extract match-session authority and presence",
        outcome:
          "Move squad, reconnect, host-handoff, and live mission coordination toward the intended session boundary with Redis-backed presence.",
        doneWhen:
          "Shared mission runtime no longer depends on local route-handler authority alone.",
      },
      {
        id: "VS-28",
        status: "Next",
        title: "Wire hosted observability and managed event configuration",
        outcome:
          "Send staged analytics and errors to hosted tools and move Concord Breach timing and modifiers out of hardcoded prototype data.",
        doneWhen:
          "PostHog and Sentry receive staged traffic and the first event-loop tuning change can happen without a code edit.",
      },
    ],
  },
];

export const scopeLocks = [
  "Do not add PvP to the first playable.",
  "Do not expand beyond one sponsor faction and one hostile pressure source.",
  "Do not add more than three starter companions before bonded combat feels correct.",
  "Do not build seasonal tooling before one live event loop is already fun.",
  "Do not expand to open-world traversal until the hub loop and mission loop are stable.",
];