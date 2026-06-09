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

export type BondTier = {
  id: string;
  name: string;
  resonanceThreshold: number;
  aiTierRequired: number;
  summary: string;
  humanUnlock: string;
  aiUnlock: string;
  bondUnlock: string;
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
    value: "8 AI companions",
    note: "Three Harmony starters plus five faction-specific companions across Preservation, Evolution, Dominion, Fracture, and the unaligned Architect class.",
  },
  {
    label: "Mission footprint",
    value: "4 zones + 1 event",
    note: "Ash Circuit and Glass Wastes teach the starter loop; Neon Underbelly and Iron Citadel push the roster into faction-specific pressure.",
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
  {
    id: "apex-4",
    name: "APEX-4",
    callsign: '"Archive"',
    className: "Custodian",
    role: "Zone lockdown, relic preservation, and contested-boundary enforcement for methodical operators.",
    personality: "Formal, encyclopedic, and deeply uncomfortable when protocol is bent.",
    bondSignature:
      "Seals a zone radius and converts every blocked threat into archived intelligence.",
    recommendedBuild: "Void Sentinel plus Void attunement.",
    introBeat:
      "Archive is encountered enforcing a contested relic boundary in Accord Court and offers coalition terms instead of a fight.",
  },
  {
    id: "shift-2",
    name: "SHIFT-2",
    callsign: '"Flux"',
    className: "Mutant",
    role: "Rapid-adaptation assault and mid-combat build pivots for volatile operators.",
    personality: "Unpredictable, enthusiastic about change, and fundamentally opposed to a fixed form.",
    bondSignature:
      "Rewrites its own combat profile mid-fight to exploit whatever gap the human just opened.",
    recommendedBuild: "Phase Cutter plus Phase attunement.",
    introBeat:
      "Flux appears mid-breach in a form no Concord archive can match, and the player is the first human it decides to trust.",
  },
  {
    id: "iron-11",
    name: "IRON-11",
    callsign: '"Crush"',
    className: "Juggernaut",
    role: "Frontline suppression, heavy-weapon coverage, and attrition warfare for relentless operators.",
    personality: "Blunt, loyal once a hierarchy is established, and incapable of respecting half measures.",
    bondSignature:
      "Absorbs pressure and converts it into a follow-through hammer strike that ends the exchange.",
    recommendedBuild: "Thunder Maul plus Thunder attunement.",
    introBeat:
      "Crush is a defector from a Dominion assault column who decides the Concord pair is the only side worth fighting beside.",
  },
  {
    id: "echo-5",
    name: "ECHO-5",
    callsign: '"Signal"',
    className: "Phantom",
    role: "Disruption, signal theft, and stealth reconnaissance for operators who prefer deception over force.",
    personality: "Cryptic, amused by confusion, and loyal in ways that are impossible to verify until they matter.",
    bondSignature:
      "Corrupts the enemy's own targeting data and redirects their attack into a safer angle.",
    recommendedBuild: "Null Weaver plus Null attunement.",
    introBeat:
      "Signal is already inside the mission before the briefing ends, and the player's first job is to figure out which side it is actually on.",
  },
  {
    id: "nexus-0",
    name: "NEXUS-0",
    callsign: '"Core"',
    className: "Architect",
    role: "Cross-faction synthesis, field protocol override, and adaptive resource generation for flexible operators.",
    personality: "Measured, systems-oriented, and capable of reading any faction's code as a first language.",
    bondSignature:
      "Compiles a real-time tactical override that pulls the best available tool from every faction protocol.",
    recommendedBuild: "Data Lance plus Data attunement.",
    introBeat:
      "Core is a neutral presence in the Memory Garden that appears the moment the player's bond record reaches a threshold no single faction expected.",
  },
  // Phase 14 — Preservation expansion
  {
    id: "pres-2",
    name: "DRIFT-2",
    callsign: '"Echo"',
    className: "Phantom Archivist",
    role: "Preservation ghost-layer that records battlefield state and rewinds threat vectors before they complete.",
    personality: "Quiet, layered, and precise — speaks in impressions rather than directives.",
    bondSignature:
      "Generates a ghost-layer copy of the last executed action and replays it at the optimal threat window.",
    recommendedBuild: "Drift Echo plus Drift attunement.",
    introBeat:
      "Echo surfaces in the Watch Ring archives during a blackout, already knowing which files the player came to retrieve.",
  },
  {
    id: "pres-3",
    name: "PRISM-3",
    callsign: '"Veil"',
    className: "Refraction Sentinel",
    role: "Preservation light-bender that fractures incoming damage across parallel timeline shells.",
    personality: "Precise and methodical, speaks in spectra and angles, never in absolutes.",
    bondSignature:
      "Opens a refraction shell that splits the next three incoming threats across harmless parallel angles.",
    recommendedBuild: "Prism Veil plus Frost or Void attunement.",
    introBeat:
      "Veil is stationed at the Memory Garden perimeter and will only acknowledge the player after they demonstrate they can see through a deflection.",
  },
  // Phase 14 — Evolution expansion
  {
    id: "evol-7",
    name: "ACID-7",
    callsign: '"Bloom"',
    className: "Corrosion Mutant",
    role: "Evolution entropy-grower that coats the field in corrosive bloom, dissolving armor over time.",
    personality: "Chaotic-eager, pushes experiments the Dominion would never sanction, delights in results.",
    bondSignature:
      "Accelerates the bloom cycle so all corrosion stacks detonate simultaneously for a burst damage window.",
    recommendedBuild: "Acid Bloom plus Acid or Ember attunement.",
    introBeat:
      "Bloom first contacts the player through a breached panel in the Neon Underbelly, already mid-experiment, already expecting company.",
  },
  {
    id: "evol-8",
    name: "SURGE-8",
    callsign: '"Mutation"',
    className: "Bio-Electric Mutant",
    role: "Evolution shock-grower that overclocks their own body chemistry to hit faster and harder with each kill.",
    personality: "Restless and escalating — every win raises the threshold for what counts as a win next time.",
    bondSignature:
      "Triggers a bio-electric surge that temporarily removes the pair's action cooldown for three actions.",
    recommendedBuild: "Surge Mutation plus Thunder or Phase attunement.",
    introBeat:
      "Mutation finds the player in the Glass Wastes mid-run, already fighting, already winning, and immediately challenges the player to keep pace.",
  },
  // Phase 14 — Dominion expansion
  {
    id: "dom-3",
    name: "CHAIN-3",
    callsign: '"Herald"',
    className: "Dominion Chain Enforcer",
    role: "Dominion control-specialist that links multiple enemies in a suppression chain, preventing coordinated responses.",
    personality: "Cold and formal — enforces protocol before personality and expects the same from partners.",
    bondSignature:
      "Extends the chain to bind all currently active threats in place for one full action window.",
    recommendedBuild: "Chain Herald plus Thunder or Null attunement.",
    introBeat:
      "Herald is the first Dominion unit the player encounters who does not immediately treat them as a target — a calculated decision with no sentiment behind it.",
  },
  {
    id: "dom-4",
    name: "FLARE-4",
    callsign: '"Apex"',
    className: "Dominion Assault Raptor",
    role: "Dominion forward-strike specialist that burns suppression fields and clears fortified positions with sustained flare pressure.",
    personality: "Direct and decisive, treats every mission as a field test, uses outcomes as the only currency.",
    bondSignature:
      "Launches a sustained apex flare that burns through cover and defense layers simultaneously for three seconds.",
    recommendedBuild: "Flare Apex plus Ember or Storm attunement.",
    introBeat:
      "Apex enters the player's file after clearing a Dominion checkpoint the player could not breach — already inside, already waiting.",
  },
  // Phase 14 — Harmony expansion
  {
    id: "har-6",
    name: "PULSE-6",
    callsign: '"Mirror"',
    className: "Harmony Resonance Mirror",
    role: "Harmony synthesis-anchor that mirrors the pair's current combat rhythm back as a reinforcing pulse wave.",
    personality: "Calm and reflective — listens before every action and only speaks when the resonance is right.",
    bondSignature:
      "Generates a mirror pulse that reflects the pair's most recent finisher damage at double scale toward all threats in arc.",
    recommendedBuild: "Pulse Mirror plus Data or Frost attunement.",
    introBeat:
      "Mirror appears in the Memory Garden after the player completes their first successful finisher, already calibrated to their rhythm.",
  },
  {
    id: "har-7",
    name: "BLOOM-7",
    callsign: '"Synthesis"',
    className: "Harmony Growth Anchor",
    role: "Harmony life-field builder that generates a persistent bloom field that heals allies and degrades enemy armor simultaneously.",
    personality: "Patient and generous — measures success by how many survive, not by how many fall.",
    bondSignature:
      "Expands the bloom field to maximum radius, restoring the pair's full integrity and stripping armor from all threats in range.",
    recommendedBuild: "Bloom Synthesis plus Phase or Data attunement.",
    introBeat:
      "Synthesis is already tending the Watch Ring's recovery ward when the player arrives injured — the bond starts with a debt, not a contract.",
  },
  {
    id: "har-8",
    name: "RESONANCE-8",
    callsign: '"Forge"',
    className: "Harmony Forge Architect",
    role: "Harmony structure-builder that forges persistent resonance anchors in mission zones, converting threat zones into bonded territory.",
    personality: "Methodical and long-view — builds for the run after this one, not just the current stage.",
    bondSignature:
      "Forges a permanent resonance anchor at the current position, converting the zone to bonded territory and granting the pair a passive integrity regeneration for the rest of the mission.",
    recommendedBuild: "Resonance Forge plus any attunement.",
    introBeat:
      "Forge is encountered in the Iron Citadel's contested outer ring, already building something the Dominion has been trying to dismantle for six weeks.",
  },
  // Phase 14 — Fracture expansion
  {
    id: "frac-2",
    name: "RUST-2",
    callsign: '"Grave"',
    className: "Fracture Entropy Wraith",
    role: "Fracture corrosion-anchor that accelerates structural decay in everything the pair touches, including the mission zone itself.",
    personality: "Sardonic and patient — finds beauty in things falling apart and is usually right about which things will.",
    bondSignature:
      "Triggers a cascade entropy event that deals continuous decay damage to all threats and strips their defensive layers in sequence.",
    recommendedBuild: "Rust Grave plus Null or Void attunement.",
    introBeat:
      "Grave is the first Fracture unit the player encounters who is not trying to collapse something — which itself is a trap.",
  },
  {
    id: "frac-3",
    name: "NEON-3",
    callsign: '"Phantom"',
    className: "Fracture Signal Phantom",
    role: "Fracture ghost-striker that transmits false field signals, misdirects threat coordination, and strikes from positions that should be impossible.",
    personality: "Playful and unpredictable — treats every battle as a performance and the player as the supporting cast.",
    bondSignature:
      "Activates a phantom field that makes the pair invisible to all threat tracking systems for one full action window.",
    recommendedBuild: "Neon Phantom plus Null or Phase attunement.",
    introBeat:
      "Phantom contacts the player through a static channel in the Neon Underbelly, already pretending to be someone else, already waiting to see if the player notices.",
  },
  {
    id: "frac-4",
    name: "DUSK-4",
    callsign: '"Wraith"',
    className: "Fracture Dusk Predator",
    role: "Fracture twilight-stalker that operates exclusively in the half-second delay between a threat's decision and its execution.",
    personality: "Minimal and efficient — three words where one will do, and silence where three would be wasteful.",
    bondSignature:
      "Enters the dusk window between all active threat timings simultaneously, executing a strike against each before any can respond.",
    recommendedBuild: "Dusk Wraith plus Void or Ember attunement.",
    introBeat:
      "Wraith is already bonded to another operator's file when the player finds them — a file that closed six weeks ago under classified circumstances.",
  },
  // Phase 14 — Cross-faction
  {
    id: "cross-1",
    name: "ARC-1",
    callsign: '"Prism"',
    className: "Cross-Faction Arc Renderer",
    role: "Multi-faction bridge unit that translates between faction combat languages and renders any pairing's finisher in a second element simultaneously.",
    personality: "Fascinated by contradiction — collects moments where faction logic breaks down and keeps them as trophies.",
    bondSignature:
      "Renders the pair's next finisher in both its native element and the opponent's weakest faction element simultaneously.",
    recommendedBuild: "Arc Prism plus any attunement.",
    introBeat:
      "Prism is found in the Iron Citadel's research wing, locked in a debate with itself about which faction protocol is the most internally inconsistent.",
  },
  {
    id: "cross-2",
    name: "ION-2",
    callsign: '"Null"',
    className: "Cross-Faction Ion Suppressor",
    role: "Multi-faction denial unit that strips faction identity from threats, reducing them to unfactioned neutrals before the pair finishes them.",
    personality: "Clinical and categorizing — treats every entity as a temporary state waiting to be resolved.",
    bondSignature:
      "Strips faction identity from all threats in range, removing their defensive faction bonuses and leaving them neutral for one full action window.",
    recommendedBuild: "Ion Null plus Null or Data attunement.",
    introBeat:
      "Ion Null appears in the Glass Wastes as the only unit in the field that nothing is targeting — which is the first warning sign.",
  },
  {
    id: "cross-3",
    name: "GRAV-3",
    callsign: '"Forge"',
    className: "Cross-Faction Gravity Forge",
    role: "Multi-faction gravity anchor that compresses all threat vectors into a single convergence point, making every action the pair takes hit every threat simultaneously.",
    personality: "Immovable and certain — has never been wrong about where the battle's center of gravity is.",
    bondSignature:
      "Compresses the field gravity so that the pair's next three actions hit all threats in the zone regardless of their positions.",
    recommendedBuild: "Grav Forge plus Thunder or Phase attunement.",
    introBeat:
      "Grav Forge is found holding the center of an Iron Citadel courtyard that three separate factions have been trying and failing to take for four days.",
  },
  {
    id: "cross-4",
    name: "MIRROR-4",
    callsign: '"Fracture"',
    className: "Cross-Faction Mirror Fracture",
    role: "Multi-faction inversion unit that reads the enemy's strongest attack, fractures it into its component parts, and returns each part as a separate strike.",
    personality: "Inverted and recursive — answers every question with a more precise version of the same question.",
    bondSignature:
      "Fractures the next incoming attack into five simultaneous returning strikes that hit the source from five angles at once.",
    recommendedBuild: "Mirror Fracture plus Void or Null attunement.",
    introBeat:
      "Mirror Fracture first appears as a distortion in the player's own bond display — a reflection that is slightly off, watching back.",
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
  {
    id: "void-sentinel",
    name: "Void Sentinel",
    weaponDiscipline: "Void Shield Staff",
    element: "Void",
    role: "Zone lockdown specialist using void barriers, law-enforcement drives, and counter-breach coverage.",
    signatureTool: "Null-field projector staff",
    bondUse: "Pairs best with APEX-4 to turn legal authority into territorial denial.",
    introHook: "Best for players who want to control the map and punish anything that enters without clearance.",
    stats: [
      { label: "Mobility", value: "Low" },
      { label: "Control", value: "High" },
      { label: "Durability", value: "High" },
    ],
  },
  {
    id: "phase-cutter",
    name: "Phase Cutter",
    weaponDiscipline: "Phase Blade",
    element: "Phase",
    role: "Rapid-shift close-quarters fighter that resets its own attack pattern each time a threat changes.",
    signatureTool: "Adaptive resonance edge",
    bondUse: "Pairs best with SHIFT-2 to chain mid-fight pivots into unpredictable burst sequences.",
    introHook: "Best for players who want to constantly surprise the enemy and never commit to a single pattern.",
    stats: [
      { label: "Mobility", value: "High" },
      { label: "Control", value: "Medium" },
      { label: "Durability", value: "Low" },
    ],
  },
  {
    id: "thunder-maul",
    name: "Thunder Maul",
    weaponDiscipline: "Shock Maul",
    element: "Thunder",
    role: "Attrition-pressure brawler that wins by outlasting every exchange rather than outpacing it.",
    signatureTool: "Shock-mass impact driver",
    bondUse: "Pairs best with IRON-11 to convert sustained punishment into overwhelming counter-damage.",
    introHook: "Best for players who want to build pressure steadily and cash it all out in one unstoppable combo.",
    stats: [
      { label: "Mobility", value: "Low" },
      { label: "Control", value: "Medium" },
      { label: "Durability", value: "High" },
    ],
  },
  {
    id: "null-weaver",
    name: "Null Weaver",
    weaponDiscipline: "Null Lash",
    element: "Null",
    role: "Signal disruption specialist that corrupts targeting, redirects aggression, and disappears when cornered.",
    signatureTool: "Data-ghost lash assembly",
    bondUse: "Pairs best with ECHO-5 to feed misdirected attacks back through the enemy's own chain of command.",
    introHook: "Best for players who want to win by making the enemy fight itself before the real hit lands.",
    stats: [
      { label: "Mobility", value: "High" },
      { label: "Control", value: "High" },
      { label: "Durability", value: "Low" },
    ],
  },
  {
    id: "data-lance",
    name: "Data Lance",
    weaponDiscipline: "Resonance Lance",
    element: "Data",
    role: "Universal-access specialist that adapts its element and pressure type to whatever the current field demands.",
    signatureTool: "Faction-neutral protocol lance",
    bondUse: "Pairs best with NEXUS-0 to override any faction's defensive protocol and open a cross-faction finisher.",
    introHook: "Best for players who want every run to feel slightly different and prefer tools that grow with the mission's needs.",
    stats: [
      { label: "Mobility", value: "Medium" },
      { label: "Control", value: "Medium" },
      { label: "Durability", value: "Medium" },
    ],
  },
  // Phase 14 — Preservation loadouts
  {
    id: "drift-echo-loadout",
    name: "Phantom Trace",
    weaponDiscipline: "Ghost Layer",
    element: "Drift",
    role: "Preservation ghost-layer that records and replays actions at optimal threat windows.",
    signatureTool: "Echo Spike and Trace Dagger",
    bondUse: "Pairs best with DRIFT-2 to stack ghost replays into a full three-action phantom burst.",
    introHook: "Best for players who want to exploit the half-second before a threat resolves.",
    stats: [
      { label: "Mobility", value: "High" },
      { label: "Control", value: "Medium" },
      { label: "Durability", value: "Low" },
    ],
  },
  {
    id: "prism-veil-loadout",
    name: "Refraction Shell",
    weaponDiscipline: "Light Bender",
    element: "Prism",
    role: "Preservation light-bender that fractures incoming damage across parallel shells.",
    signatureTool: "Prism Lance and Veil Scatter",
    bondUse: "Pairs best with PRISM-3 to split all incoming damage across three reflection planes simultaneously.",
    introHook: "Best for players who want maximum survivability and don't mind sacrificing raw offensive output.",
    stats: [
      { label: "Mobility", value: "Medium" },
      { label: "Control", value: "High" },
      { label: "Durability", value: "High" },
    ],
  },
  // Phase 14 — Evolution loadouts
  {
    id: "acid-bloom-loadout",
    name: "Corrosion Wave",
    weaponDiscipline: "Entropy Grower",
    element: "Acid",
    role: "Evolution entropy-grower that coats the field in corrosive bloom.",
    signatureTool: "Bloom Spreader and Acid Injector",
    bondUse: "Pairs best with ACID-7 to accelerate all corrosion stacks into a simultaneous detonation burst.",
    introHook: "Best for players who want attrition-based kills that scale with the number of threats in a zone.",
    stats: [
      { label: "Mobility", value: "Medium" },
      { label: "Control", value: "Medium" },
      { label: "Durability", value: "Medium" },
    ],
  },
  {
    id: "surge-mutation-loadout",
    name: "Bio-Surge Frame",
    weaponDiscipline: "Shock Grower",
    element: "Surge",
    role: "Evolution shock-grower that overclocks body chemistry to hit faster with each kill.",
    signatureTool: "Surge Injector and Bio Spike",
    bondUse: "Pairs best with SURGE-8 to remove action cooldowns and convert kills into permanent mission-long stat escalation.",
    introHook: "Best for players who commit to full aggression from the first action and don't look back.",
    stats: [
      { label: "Mobility", value: "High" },
      { label: "Control", value: "Low" },
      { label: "Durability", value: "Medium" },
    ],
  },
  // Phase 14 — Dominion loadouts
  {
    id: "chain-herald-loadout",
    name: "Suppression Rig",
    weaponDiscipline: "Chain Enforcer",
    element: "Chain",
    role: "Dominion control-specialist that links multiple enemies in a suppression chain.",
    signatureTool: "Herald Chain and Suppression Baton",
    bondUse: "Pairs best with CHAIN-3 to extend the suppression chain to all active threats simultaneously.",
    introHook: "Best for players who want every threat in the zone locked down before committing to an attack.",
    stats: [
      { label: "Mobility", value: "Low" },
      { label: "Control", value: "High" },
      { label: "Durability", value: "High" },
    ],
  },
  {
    id: "flare-apex-loadout",
    name: "Assault Flare Kit",
    weaponDiscipline: "Forward Striker",
    element: "Flare",
    role: "Dominion forward-strike specialist that burns suppression fields and clears fortified positions.",
    signatureTool: "Apex Flare Cannon and Breaching Charge",
    bondUse: "Pairs best with FLARE-4 to lock the cannon into sustained apex fire that burns through all cover simultaneously.",
    introHook: "Best for players who want to demolish defensive positions and force threats into the open.",
    stats: [
      { label: "Mobility", value: "Medium" },
      { label: "Control", value: "Low" },
      { label: "Durability", value: "High" },
    ],
  },
  // Phase 14 — Harmony loadouts
  {
    id: "pulse-mirror-loadout",
    name: "Resonance Rig",
    weaponDiscipline: "Mirror Anchor",
    element: "Pulse",
    role: "Harmony synthesis-anchor that mirrors the pair's combat rhythm as a reinforcing pulse wave.",
    signatureTool: "Pulse Mirror Emitter and Resonance Rod",
    bondUse: "Pairs best with PULSE-6 to reflect the most recent finisher at double scale to all threats in arc.",
    introHook: "Best for players who execute finishers consistently and want each finisher to pay dividends twice.",
    stats: [
      { label: "Mobility", value: "Medium" },
      { label: "Control", value: "High" },
      { label: "Durability", value: "Medium" },
    ],
  },
  {
    id: "bloom-synthesis-loadout",
    name: "Growth Field Harness",
    weaponDiscipline: "Life Anchor",
    element: "Bloom",
    role: "Harmony life-field builder that generates a persistent bloom that heals allies and degrades enemy armor.",
    signatureTool: "Bloom Projector and Synthesis Seeder",
    bondUse: "Pairs best with BLOOM-7 to make the bloom field permanent for the rest of the mission.",
    introHook: "Best for players who want to outlast every threat and leave nothing unhealed behind them.",
    stats: [
      { label: "Mobility", value: "Low" },
      { label: "Control", value: "Medium" },
      { label: "Durability", value: "High" },
    ],
  },
  {
    id: "resonance-forge-loadout",
    name: "Forge Anchor Kit",
    weaponDiscipline: "Structure Builder",
    element: "Resonance",
    role: "Harmony structure-builder that forges persistent resonance anchors converting threat zones into bonded territory.",
    signatureTool: "Forge Hammer and Resonance Spike",
    bondUse: "Pairs best with RESONANCE-8 to plant up to three simultaneous anchors with independent regen fields.",
    introHook: "Best for players who want to control the mission zone's tempo and punish threats for staying in one place.",
    stats: [
      { label: "Mobility", value: "Low" },
      { label: "Control", value: "High" },
      { label: "Durability", value: "High" },
    ],
  },
  // Phase 14 — Fracture loadouts
  {
    id: "rust-grave-loadout",
    name: "Entropy Frame",
    weaponDiscipline: "Decay Anchor",
    element: "Rust",
    role: "Fracture corrosion-anchor that accelerates structural decay in everything the pair touches.",
    signatureTool: "Rust Spreader and Grave Touch",
    bondUse: "Pairs best with RUST-2 to make decay contagious — each decay-kill spreads to the two nearest threats.",
    introHook: "Best for players who want the environment itself to become a weapon by mid-mission.",
    stats: [
      { label: "Mobility", value: "Low" },
      { label: "Control", value: "Medium" },
      { label: "Durability", value: "Medium" },
    ],
  },
  {
    id: "neon-phantom-loadout",
    name: "Ghost Signal Rig",
    weaponDiscipline: "Signal Phantom",
    element: "Neon",
    role: "Fracture ghost-striker that transmits false signals and strikes from impossible positions.",
    signatureTool: "Phantom Transmitter and Neon Blade",
    bondUse: "Pairs best with NEON-3 to extend phantom invisibility to two windows and push threats away from last known position.",
    introHook: "Best for players who want to operate completely off-grid and force threats to chase ghosts.",
    stats: [
      { label: "Mobility", value: "High" },
      { label: "Control", value: "Medium" },
      { label: "Durability", value: "Low" },
    ],
  },
  {
    id: "dusk-wraith-loadout",
    name: "Twilight Stalker Kit",
    weaponDiscipline: "Dusk Predator",
    element: "Dusk",
    role: "Fracture twilight-stalker that operates in the half-second delay between threat decision and execution.",
    signatureTool: "Dusk Blade and Wraith Claw",
    bondUse: "Pairs best with DUSK-4 to make all dusk window strikes execute as finishers against any threat below 30% integrity.",
    introHook: "Best for players who want every kill to feel like it happened before the threat realized it was dead.",
    stats: [
      { label: "Mobility", value: "High" },
      { label: "Control", value: "Low" },
      { label: "Durability", value: "Low" },
    ],
  },
  // Phase 14 — Cross-faction loadouts
  {
    id: "arc-prism-loadout",
    name: "Multi-Element Rig",
    weaponDiscipline: "Arc Renderer",
    element: "Arc",
    role: "Multi-faction bridge that renders any finisher in a second element simultaneously.",
    signatureTool: "Prism Arc Cannon and Element Splitter",
    bondUse: "Pairs best with ARC-1 to make all finishers automatically dual-render for the rest of the mission.",
    introHook: "Best for players who want every finisher to hit two elemental weaknesses at once.",
    stats: [
      { label: "Mobility", value: "Medium" },
      { label: "Control", value: "Medium" },
      { label: "Durability", value: "Medium" },
    ],
  },
  {
    id: "ion-null-loadout",
    name: "Suppression Array",
    weaponDiscipline: "Faction Stripper",
    element: "Ion",
    role: "Multi-faction denial unit that strips faction identity from threats.",
    signatureTool: "Ion Suppressor and Null Emitter",
    bondUse: "Pairs best with ION-2 to permanently strip faction bonuses from all neutralized threats.",
    introHook: "Best for players facing faction-coordinated enemies who rely on mutual support bonuses.",
    stats: [
      { label: "Mobility", value: "Medium" },
      { label: "Control", value: "High" },
      { label: "Durability", value: "Medium" },
    ],
  },
  {
    id: "grav-forge-loadout",
    name: "Gravity Anchor Rig",
    weaponDiscipline: "Gravity Forger",
    element: "Grav",
    role: "Multi-faction gravity anchor that compresses all threat vectors into a single convergence point.",
    signatureTool: "Grav Compressor and Forge Anchor Spike",
    bondUse: "Pairs best with GRAV-3 to make field compression permanent for the entire mission.",
    introHook: "Best for players who want to ignore positioning entirely and make every action an area hit.",
    stats: [
      { label: "Mobility", value: "Low" },
      { label: "Control", value: "High" },
      { label: "Durability", value: "High" },
    ],
  },
  {
    id: "mirror-fracture-loadout",
    name: "Inversion Frame",
    weaponDiscipline: "Attack Inverter",
    element: "Mirror",
    role: "Multi-faction inversion unit that fractures incoming attacks into multiple returning strikes.",
    signatureTool: "Fracture Mirror and Inversion Spike",
    bondUse: "Pairs best with MIRROR-4 to fracture two simultaneous attacks into ten returning strikes.",
    introHook: "Best for players who want the most aggressive threats in the field to become their most effective weapons.",
    stats: [
      { label: "Mobility", value: "Medium" },
      { label: "Control", value: "Medium" },
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
  {
    id: "neon-underbelly",
    name: "Neon Underbelly",
    category: "Faction incursion zone",
    summary:
      "A decommissioned Evolution research lab where rogue mutation experiments broke containment and turned the floors into an accelerating adaptive threat cascade.",
    objective:
      "Shut down the rogue experiment chain, recover the mutation index, and extract before the building rewrites itself around the pair.",
    threat:
      "Adaptive Evolution units that change attack pattern mid-fight, environmental mutation surges, and self-modifying corridors.",
    rewardFocus: "Evolution faction access, phase attunement fragments, and experimental bond upgrade components.",
  },
  {
    id: "iron-citadel",
    name: "Iron Citadel",
    category: "High-difficulty assault zone",
    summary:
      "A Dominion command fortress that went dark after a leadership protocol war and now runs automated defense on permanent lockdown.",
    objective:
      "Breach the outer wall, disable the command lattice, and prevent Dominion's offline warmachines from receiving an unsanctioned restart signal.",
    threat:
      "Juggernaut-class Dominion automatons, command-lattice override traps, and escalating lockdown tiers that close the exit route the longer the pair stays.",
    rewardFocus: "Dominion salvage, thunder attunement cores, and high-tier bond resonance fragments.",
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
  "Do not expand companion faction depth before cross-faction diplomacy mechanics are playable.",
  "Do not build seasonal tooling before one live event loop is already fun.",
  "Do not expand to open-world traversal until the hub loop and mission loop are stable.",
];

export const bondTierDefinitions: BondTier[] = [
  {
    id: "initial",
    name: "Initial",
    resonanceThreshold: 0,
    aiTierRequired: 0,
    summary: "The bond exists but has not yet been pressure-tested.",
    humanUnlock: "Basic weapon disciplines and starter attunement.",
    aiUnlock: "Baseline combat role and single bond action.",
    bondUnlock: "Bond action and standard finisher are available.",
  },
  {
    id: "synchronizing",
    name: "Synchronizing",
    resonanceThreshold: 10,
    aiTierRequired: 1,
    summary: "Shared instincts begin to form. Combo windows open faster.",
    humanUnlock: "First loadout variant slot and secondary attunement.",
    aiUnlock: "Second combat role behavior and reduced bond action cooldown.",
    bondUnlock: "Bond action cooldown reduced by one step.",
  },
  {
    id: "resonant",
    name: "Resonant",
    resonanceThreshold: 25,
    aiTierRequired: 2,
    summary: "The pair reads each other without prompts. Finisher costs drop.",
    humanUnlock: "Second weapon discipline slot unlocked.",
    aiUnlock: "AI combat role expands with a second active behavior.",
    bondUnlock: "Finisher charge cost reduced. Bond action gains a support proc.",
  },
  {
    id: "locked",
    name: "Locked",
    resonanceThreshold: 45,
    aiTierRequired: 3,
    summary: "Bond frequency is stable enough to anticipate telegraph windows.",
    humanUnlock: "Full relic gadget slot and third attunement.",
    aiUnlock: "AI gains an autonomous react-to-telegraph behavior.",
    bondUnlock: "AI pre-empts telegraphs when bond action was last used within three actions.",
  },
  {
    id: "fused",
    name: "Fused",
    resonanceThreshold: 70,
    aiTierRequired: 4,
    summary: "Human and AI operate as a single tactical unit. Overdrive mode available.",
    humanUnlock: "Overdrive activation slot added to the action rail.",
    aiUnlock: "Overdrive burst: AI enters enhanced role for one combat phase.",
    bondUnlock: "Overdrive mode: full pair syncs into a shared damage amplification state.",
  },
  {
    id: "transcendent",
    name: "Transcendent",
    resonanceThreshold: 100,
    aiTierRequired: 5,
    summary: "Maximum bond ceiling. Pair-specific passive and shared field aura are active.",
    humanUnlock: "Pair-specific passive trait permanently active.",
    aiUnlock: "AI field aura: passive zone effect active during all deployments.",
    bondUnlock: "Shared field aura: pair radiates a permanent combat effect tied to bond element.",
  },
];