import {
  type EventContributionBucketId,
  type EventRewardBandState,
  firstLiveEvent,
  getLiveEventWindow,
  missionZones,
  normalizeCommandDeckState,
  type CommandDeckState,
  type LiveEventWindowId,
  type MissionEventContributionState,
  type MissionModifier,
  type PersistedEventResultState,
  type RewardPayload,
  resolveLiveEvent,
} from "@/lib/prototype-data";

export type PairingId = "flux-ward" | "frost-thread" | "ember-raze";
export type CombatActionId = "light" | "heavy" | "dodge" | "bond" | "finisher";

export type CombatActionDefinition = {
  id: CombatActionId;
  label: string;
  summary: string;
};

export type ElementId = "storm" | "frost" | "ember";

export type EnemyTelegraph = {
  name: string;
  cue: string;
  counterplay: string;
  surgePressure: number;
  reactionElement: ElementId;
  reactionName: string;
  reactionOutcome: string;
  reactionBonusDamage: number;
};

export type StarterPairing = {
  id: PairingId;
  name: string;
  subtitle: string;
  element: ElementId;
  loadoutId: string;
  companionId: string;
  combatIdentity: string;
  missionUse: string;
  finisherName: string;
  actions: CombatActionDefinition[];
};

export type MissionStage = {
  id: string;
  title: string;
  objective: string;
  narrative: string;
  enemyName: string;
  enemyIntegrity: number;
  enemyPressure: number;
  environment: string;
  telegraph: EnemyTelegraph;
  rewardText: string;
};

export type MissionFlow = {
  id: string;
  name: string;
  overview: string;
  launchText: string;
  failureRisk: string;
  narrativeArc: string[];
  stages: MissionStage[];
  modifiers?: MissionModifier[];
  eventWindowId?: LiveEventWindowId | null;
  eventWindowLabel?: string | null;
  completionNarrative: string;
  completionRewards: RewardPayload;
  nextMissionId: string | null;
};

export type EventContributionTotals = {
  defense: number;
  support: number;
  completion: number;
};

export type CombatState = {
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

const FINISHER_THRESHOLD = 60;

const emptyRewardPayload: RewardPayload = {
  explorerRank: 0,
  humanLevel: 0,
  aiTier: 0,
  resonanceLevel: 0,
  factionStanding: 0,
};

const emptyEventContributionTotals: EventContributionTotals = {
  defense: 0,
  support: 0,
  completion: 0,
};

const contributionBucketMeta: Record<
  EventContributionBucketId,
  { label: string; summary: string }
> = {
  defense: {
    label: "Defense",
    summary:
      "Line holds, telegraph answers, and shield-preserving decisions that keep the breach from collapsing the route.",
  },
  support: {
    label: "Support",
    summary:
      "Bond coordination, suppression, and reaction setup that keeps Concord crews and allied pairs working in rhythm.",
  },
  completion: {
    label: "Completion",
    summary:
      "Direct breach progress, tower clears, and execution pressure that actually closes the objective.",
  },
};

const eventContributionWeights: Record<LiveEventWindowId, EventContributionTotals> = {
  inactive: { defense: 1, support: 2, completion: 1 },
  warning: { defense: 2, support: 2, completion: 1 },
  live: { defense: 2, support: 1, completion: 2 },
  recovery: { defense: 1, support: 2, completion: 2 },
};

const eventRewardBands: EventRewardBandState[] = [
  {
    id: "watch-relay",
    label: "Watch Relay",
    summary:
      "Concord logs the run as reliable event cover and clears a modest bonus for keeping the route useful.",
    threshold: 0,
    bonusRewards: {
      explorerRank: 0,
      humanLevel: 0,
      aiTier: 0,
      resonanceLevel: 1,
      factionStanding: 2,
    },
  },
  {
    id: "breach-anchor",
    label: "Breach Anchor",
    summary:
      "The pair held enough of the crisis tempo that Concord records the run as a stabilizing anchor for the full event window.",
    threshold: 18,
    bonusRewards: {
      explorerRank: 1,
      humanLevel: 0,
      aiTier: 0,
      resonanceLevel: 1,
      factionStanding: 4,
    },
  },
  {
    id: "concord-vanguard",
    label: "Concord Vanguard",
    summary:
      "The run pushed hard enough that Concord upgrades the payout and writes the pair in as frontline event response.",
    threshold: 30,
    bonusRewards: {
      explorerRank: 1,
      humanLevel: 1,
      aiTier: 1,
      resonanceLevel: 2,
      factionStanding: 6,
    },
  },
];

function cloneRewardPayload(reward: RewardPayload): RewardPayload {
  return { ...reward };
}

export function addRewardPayload(
  base: RewardPayload,
  delta: RewardPayload,
): RewardPayload {
  return {
    explorerRank: base.explorerRank + delta.explorerRank,
    humanLevel: base.humanLevel + delta.humanLevel,
    aiTier: base.aiTier + delta.aiTier,
    resonanceLevel: base.resonanceLevel + delta.resonanceLevel,
    factionStanding: base.factionStanding + delta.factionStanding,
  };
}

export function createEmptyEventContributionTotals(): EventContributionTotals {
  return { ...emptyEventContributionTotals };
}

export function addEventContributionTotals(
  current: EventContributionTotals,
  delta: EventContributionTotals,
): EventContributionTotals {
  return {
    defense: current.defense + delta.defense,
    support: current.support + delta.support,
    completion: current.completion + delta.completion,
  };
}

function totalContributionScore(contribution: EventContributionTotals) {
  return contribution.defense + contribution.support + contribution.completion;
}

function hasContributionScore(contribution: EventContributionTotals) {
  return totalContributionScore(contribution) > 0;
}

function scaleContributionDelta(
  delta: EventContributionTotals,
  eventWindowId: LiveEventWindowId,
): EventContributionTotals {
  const weights = eventContributionWeights[eventWindowId];

  return {
    defense: delta.defense * weights.defense,
    support: delta.support * weights.support,
    completion: delta.completion * weights.completion,
  };
}

function resolveEventRewardBand(totalScore: number): EventRewardBandState {
  return [...eventRewardBands]
    .reverse()
    .find((band) => totalScore >= band.threshold) ?? eventRewardBands[0];
}

export function getEventRewardBand(
  rewardBandId: EventRewardBandState["id"],
): EventRewardBandState {
  return (
    eventRewardBands.find((band) => band.id === rewardBandId) ?? eventRewardBands[0]
  );
}

export function resolveCombatContributionDelta(
  actionId: CombatActionId,
  currentState: CombatState,
  nextState: CombatState,
  eventWindowId: LiveEventWindowId | null,
): EventContributionTotals | null {
  if (!eventWindowId) {
    return null;
  }

  const baseDelta = createEmptyEventContributionTotals();

  switch (actionId) {
    case "dodge":
      baseDelta.defense += 2;
      break;
    case "bond":
      baseDelta.support += 2;
      break;
    case "light":
      baseDelta.completion += 1;
      break;
    case "heavy":
      baseDelta.completion += 2;
      break;
    case "finisher":
      baseDelta.completion += 3;
      break;
  }

  if (currentState.telegraphActive && !nextState.telegraphActive) {
    baseDelta.defense += 1;
  }

  if (nextState.shield > currentState.shield) {
    baseDelta.defense += 1;
  }

  if (!currentState.enemySuppressed && nextState.enemySuppressed) {
    baseDelta.support += 1;
  }

  if (!currentState.enemyExposed && nextState.enemyExposed) {
    baseDelta.support += 1;
  }

  if (!currentState.reactionTriggered && nextState.reactionTriggered) {
    baseDelta.support += 2;
  }

  if (!currentState.stageComplete && nextState.stageComplete) {
    baseDelta.completion += 4;
  }

  const scaledDelta = scaleContributionDelta(baseDelta, eventWindowId);

  return hasContributionScore(scaledDelta) ? scaledDelta : null;
}

export function resolveEventContributionState(
  missionId: string,
  eventWindowId: LiveEventWindowId | null,
  contribution: EventContributionTotals,
): MissionEventContributionState | null {
  if (missionId !== firstLiveEvent.primaryMissionId || !eventWindowId) {
    return null;
  }

  const mission = getMissionFlow(missionId, eventWindowId);

  if (!mission) {
    return null;
  }

  const totalScore = totalContributionScore(contribution);
  const rewardBand = resolveEventRewardBand(totalScore);

  return {
    totalScore,
    buckets: (["defense", "support", "completion"] as const).map((bucketId) => ({
      id: bucketId,
      label: contributionBucketMeta[bucketId].label,
      summary: contributionBucketMeta[bucketId].summary,
      points: contribution[bucketId],
    })),
    rewardBand,
    projectedRewards: addRewardPayload(
      mission.completionRewards,
      rewardBand.bonusRewards,
    ),
  };
}

export function resolveMissionRewardPayload(
  missionId: string,
  eventWindowId: LiveEventWindowId | null,
  contribution?: EventContributionTotals | null,
): RewardPayload {
  const mission = getMissionFlow(missionId, eventWindowId);

  if (!mission) {
    return cloneRewardPayload(emptyRewardPayload);
  }

  const eventContribution = contribution
    ? resolveEventContributionState(missionId, eventWindowId, contribution)
    : null;

  return eventContribution
    ? cloneRewardPayload(eventContribution.projectedRewards)
    : cloneRewardPayload(mission.completionRewards);
}

export function resolvePersistedEventResult(
  result: PersistedEventResultState | null,
) {
  if (!result) {
    return null;
  }

  return {
    mission: getMissionFlow(result.missionId, result.eventWindowId),
    window: getLiveEventWindow(firstLiveEvent, result.eventWindowId),
    rewardBand: getEventRewardBand(result.rewardBandId),
    totalScore: result.totalScore,
    completedAt: result.completedAt,
    buckets: (["defense", "support", "completion"] as const).map((bucketId) => ({
      id: bucketId,
      label: contributionBucketMeta[bucketId].label,
      summary: contributionBucketMeta[bucketId].summary,
      points:
        bucketId === "defense"
          ? result.defenseContribution
          : bucketId === "support"
            ? result.supportContribution
            : result.completionContribution,
    })),
  };
}

export const starterPairings: StarterPairing[] = [
  {
    id: "flux-ward",
    name: "Flux Vanguard + CAIRN-7",
    subtitle: "Storm gauntlet opener with shield-conversion counterplay",
    element: "storm",
    loadoutId: "flux-vanguard",
    companionId: "cairn-7",
    combatIdentity:
      "Absorb lane pressure, convert it into shielded charge, and let CAIRN-7 turn the breach into a safe counterpush.",
    missionUse:
      "Best when the Concord needs a pair that can survive crowding, protect engineers, and hold the corridor together.",
    finisherName: "Storm Bulwark Crash",
    actions: [
      { id: "light", label: "Arc Jab", summary: "Safe strike that builds shield and resonance charge." },
      { id: "heavy", label: "Gauntlet Crash", summary: "Frontloaded impact that cashes in exposed targets." },
      { id: "dodge", label: "Aegis Drift", summary: "Short evade that thickens shielding before the counterfire arrives." },
      { id: "bond", label: "Ward Intercept", summary: "CAIRN-7 cuts the enemy line and primes a safer retaliation window." },
      { id: "finisher", label: "Storm Bulwark Crash", summary: "Consumes charge for a linked slam that spikes damage and defense at once." },
    ],
  },
  {
    id: "frost-thread",
    name: "Frost Marksman + VEIL-3",
    subtitle: "Precision control pairing built around scans, exposure, and safe spacing",
    element: "frost",
    loadoutId: "frost-marksman",
    companionId: "veil-3",
    combatIdentity:
      "Open weak points, manage sightlines, and let VEIL-3 keep the pair calm while the field distorts around you.",
    missionUse:
      "Best when shard towers, signal haze, and public-event spacing demand a calmer, more surgical bond.",
    finisherName: "Faultline Zero",
    actions: [
      { id: "light", label: "Cryo Shot", summary: "Low-risk precision fire that hits harder on scanned targets." },
      { id: "heavy", label: "Shatter Lance", summary: "Precision detonation that punishes exposed enemy fault lines." },
      { id: "dodge", label: "Slip Vector", summary: "Thread snaps the player sideways and cancels the next hostile burst." },
      { id: "bond", label: "Thread Scan", summary: "VEIL-3 tags structural weaknesses and quiets retaliation pressure." },
      { id: "finisher", label: "Faultline Zero", summary: "Consumes charge to freeze the lane and collapse exposed targets in one line." },
    ],
  },
  {
    id: "ember-raze",
    name: "Ember Reaper + TALON-9",
    subtitle: "Aggressive pursuit pairing that stacks tempo and cashes it out in executions",
    element: "ember",
    loadoutId: "ember-reaper",
    companionId: "talon-9",
    combatIdentity:
      "Maintain momentum, force short kill windows, and let TALON-9 turn every overheat spike into another chase.",
    missionUse:
      "Best when breach targets need to disappear fast before the lane snowballs into a city-scale failure.",
    finisherName: "Overheat Execution",
    actions: [
      { id: "light", label: "Thermal Slice", summary: "Fast cut that ramps momentum and heat pressure." },
      { id: "heavy", label: "Raze Dive", summary: "High-commitment strike that pays out stored momentum." },
      { id: "dodge", label: "Afterburn Step", summary: "Maintains pace while cutting the next retaliatory lane." },
      { id: "bond", label: "Predator Sync", summary: "TALON-9 marks the prey and stretches the combo window." },
      { id: "finisher", label: "Overheat Execution", summary: "Consumes charge and tempo to end the exchange with a lunging finisher." },
    ],
  },
];

export const missionFlows: MissionFlow[] = [
  {
    id: "ash-circuit",
    name: "Ash Circuit",
    overview:
      "Ash Circuit is where the Concord decides whether the bond is field-worthy. Seal the relay breach, stabilize coolant pressure, and walk the recovery team home before the district fails.",
    launchText:
      "Cross the Watch Ring gate and hold the corridor together long enough for the Concord to believe this pair can survive outside rehearsal.",
    failureRisk:
      "If the corridor fails, Lattice Haven loses shield coverage and Dominion probes reach the Bond Forge itself.",
    narrativeArc: [
      "Wardens pull your pair through a heat-struck gate as breach alarms roll across the Watch Ring.",
      "Accord Court treats the crisis as your first real answer to the city: save the engineers, prove the bond, earn deployment trust.",
      "By the final escort lane, the city stops seeing a lone human and starts seeing a viable frontier pair.",
    ],
    stages: [
      {
        id: "gate-breach",
        title: "Breach Gate",
        objective: "Break the first Dominion wedge and reopen the relay shutter.",
        narrative:
          "Coolant vents and broken shutters leave no safe rehearsal space; the bond either stabilizes fast or the breach spreads.",
        enemyName: "Dominion Breach Walker",
        enemyIntegrity: 48,
        enemyPressure: 12,
        environment: "Scorched steel lanes and unstable thermal vents.",
        telegraph: {
          name: "Molten Ram",
          cue: "The walker braces its front plates and commits to a relay-shattering charge.",
          counterplay:
            "Slip the line or intercept the hit before the corridor compresses around the pair.",
          surgePressure: 4,
          reactionElement: "storm",
          reactionName: "Static Breach",
          reactionOutcome:
            "Storm charge catches the walker mid-lunge and rips the telegraph back through its own frame.",
          reactionBonusDamage: 12,
        },
        rewardText: "Relay salvage comes free and the bond comes back hotter.",
      },
      {
        id: "relay-spine",
        title: "Stabilize Relay Spine",
        objective: "Hold the line long enough for Concord engineers to restart the pressure lattice.",
        narrative:
          "The relay spine keeps spasming under Dominion interference, forcing the pair to hold formation in a shrinking safe lane.",
        enemyName: "Pressure Disruptor",
        enemyIntegrity: 60,
        enemyPressure: 14,
        environment: "Pulsing conduit arcs and intermittent blast shutters.",
        telegraph: {
          name: "Coolant Shear",
          cue: "The disruptor spikes the conduit and sweeps the safe lane with a cutting pressure wave.",
          counterplay:
            "Suppress the core or sidestep before the sweep seals the line.",
          surgePressure: 4,
          reactionElement: "frost",
          reactionName: "Lattice Lock",
          reactionOutcome:
            "Frost seizes the relay surge in place and leaves the disruptor trapped in its own pattern.",
          reactionBonusDamage: 12,
        },
        rewardText: "Telemetry stabilizes, and Concord trust climbs with it.",
      },
      {
        id: "escort-lane",
        title: "Escort The Recovery Team",
        objective: "Walk the engineers back to the Watch Ring without losing the relay key.",
        narrative:
          "What began as a breach repair becomes a proof run: keep the engineers alive while the corridor tries to collapse around you.",
        enemyName: "Dominion Escort Breaker",
        enemyIntegrity: 74,
        enemyPressure: 16,
        environment: "Narrow escort lane with collapsing guard rails and relay flashback fields.",
        telegraph: {
          name: "Pursuit Flare",
          cue: "The escort breaker floods the lane with heat and commits to a last rush on the engineers.",
          counterplay:
            "Break line of pursuit or hit through the opening before it reaches the convoy.",
          surgePressure: 5,
          reactionElement: "ember",
          reactionName: "Burnthrough",
          reactionOutcome:
            "Ember force catches the breaker at full sprint and burns straight through the rush.",
          reactionBonusDamage: 14,
        },
        rewardText: "The engineers make it home, and Glass Wastes clearance is finally yours.",
      },
    ],
    completionNarrative:
      "The recovery team reaches the Watch Ring alive and the whole corridor seems to breathe again. Concord clerks stop logging the human as a risk case and start writing the bonded pair in as a field asset with Glass Wastes clearance.",
    completionRewards: {
      explorerRank: 1,
      humanLevel: 1,
      aiTier: 1,
      resonanceLevel: 1,
      factionStanding: 15,
    },
    nextMissionId: "glass-wastes",
  },
  {
    id: "glass-wastes",
    name: "Glass Wastes",
    overview:
      "Glass Wastes is the first public proof that the bond works outside controlled lanes. Survey the shard towers, sync the lattice, and hold through a full Concord Breach wave.",
    launchText:
      "Leave the city lattice, keep the shard network breathing, and show the Concord this pair can survive a live frontier event.",
    failureRisk:
      "If the towers fail, corruption rolls back to the Watch Ring and the emergency becomes a city-defense disaster.",
    narrativeArc: [
      "The Glass Wastes feel sacred and wrong at once: silent towers, refracted horizons, and corrupted signals under every step.",
      "Now the pair is the experiment the Concord chose to trust, crossing tower lanes while machine blocs argue over who owns the field.",
      "Holding through the last breach marks the bond as fit for live-event operations instead of protected training duty.",
    ],
    stages: [
      {
        id: "shard-survey",
        title: "Survey The Shard Line",
        objective: "Secure the approach lane and locate the first intact shard tower.",
        narrative:
          "Signal distortion makes every contact look safer and farther away than it really is.",
        enemyName: "Fracture Scout Lattice",
        enemyIntegrity: 56,
        enemyPressure: 13,
        environment: "Signal haze, reflective glass dunes, and deceptive line-of-sight.",
        telegraph: {
          name: "Mirror Bloom",
          cue: "The scout lattice splits into false positions and tries to close the pair inside the reflections.",
          counterplay:
            "Reposition before the reflections converge or expose the real lane.",
          surgePressure: 4,
          reactionElement: "frost",
          reactionName: "Whiteout Snap",
          reactionOutcome:
            "Frost seizes the mirage field and forces the true scout lattice out into the open.",
          reactionBonusDamage: 12,
        },
        rewardText: "Shard telemetry steadies and the field starts answering your signal.",
      },
      {
        id: "tower-sync",
        title: "Synchronize Tower Mesh",
        objective: "Hold the tower long enough to rebind the anomaly lattice.",
        narrative:
          "The tower sync drags the field onto your position, forcing a short, hard control fight with no clean retreat.",
        enemyName: "Corruption Resonator",
        enemyIntegrity: 66,
        enemyPressure: 15,
        environment: "Tower discharge rings and unstable signal echoes.",
        telegraph: {
          name: "Arc Cascade",
          cue: "The resonator loads the tower ring and tries to dump the full surge through your position.",
          counterplay:
            "Suppress the release or roll through the ring before it grounds.",
          surgePressure: 5,
          reactionElement: "storm",
          reactionName: "Grounded Surge",
          reactionOutcome:
            "Storm feedback grounds the tower burst and hurls the whole cascade back through the resonator.",
          reactionBonusDamage: 14,
        },
        rewardText: "The tower mesh answers the bond and credits the pair with a major save.",
      },
      {
        id: "breach-defense",
        title: "Hold During Concord Breach",
        objective: "Survive the breach wave and keep the final tower online until relief arrives.",
        narrative:
          "This is the first time the pair is trusted with a true public-event defense problem instead of a protected training lane.",
        enemyName: "Breach Devourer",
        enemyIntegrity: 82,
        enemyPressure: 17,
        environment: "Tower overload arcs and rotating corruption surges.",
        telegraph: {
          name: "Cinder Maw",
          cue: "The devourer opens its breach core and drags the lane into one killing pull.",
          counterplay:
            "Disrupt the core before the pull finishes or cut sideways out of the maw.",
          surgePressure: 6,
          reactionElement: "ember",
          reactionName: "Cauterize",
          reactionOutcome:
            "Ember force cauterizes the breach core and breaks the maw before it can finish closing.",
          reactionBonusDamage: 16,
        },
        rewardText: "Rare salvage, breach credit, and live-ops trust lock into the operator record.",
      },
    ],
    completionNarrative:
      "The final tower stays lit through the breach. By the time relief reaches the line, the Concord is no longer testing the pair; it is clearing them for wider frontier deployments and live-event duty.",
    completionRewards: {
      explorerRank: 1,
      humanLevel: 1,
      aiTier: 0,
      resonanceLevel: 2,
      factionStanding: 25,
    },
    nextMissionId: null,
  },
];

type StageRotation = Partial<
  Pick<
    MissionStage,
    "objective" | "narrative" | "environment" | "enemyPressure" | "rewardText"
  >
>;

type GlassWastesRotation = {
  overview: string;
  launchText: string;
  failureRisk: string;
  narrativeArc: string[];
  modifiers: MissionModifier[];
  stageRotations: Record<string, StageRotation>;
};

const glassWastesWindowRotations: Record<LiveEventWindowId, GlassWastesRotation> = {
  inactive: {
    overview:
      "Glass Wastes has cooled into a reconnaissance lane. Survey the shard towers, calibrate the mesh, and read the field before the next Concord Breach spike arrives.",
    launchText:
      "Use the lull outside the city lattice to map tower health, scout clean approach lines, and bank enough telemetry to survive the next escalation.",
    failureRisk:
      "If the scouts miss the next fracture line, Lattice Haven walks blind into the next breach cycle.",
    narrativeArc: [
      "The Glass Wastes are quieter than the reports promised, but every tower hum still sounds like a warning the city has not translated yet.",
      "Concord handlers push the pair forward as a reconnaissance answer first, asking for signal clarity before they ask for heroics.",
      "By the last lane, the pair is no longer just surviving the frontier; it is teaching the city how to read the next public event before it starts.",
    ],
    modifiers: [
      {
        label: "Calm Perimeter",
        effect:
          "Enemy pressure runs lighter while Concord treats the route as reconnaissance instead of emergency defense.",
      },
      {
        label: "Survey Priority",
        effect:
          "Tower mapping and shard telemetry take priority over raw breach suppression.",
      },
    ],
    stageRotations: {
      "shard-survey": {
        objective: "Map the shard approach and tag the first stable tower.",
        narrative:
          "The perimeter is temporarily calm, which means the real test is reading the field before it erupts again.",
        environment: "Low-burn signal haze, open shard lanes, and half-awake tower beacons.",
        enemyPressure: 11,
      },
      "tower-sync": {
        objective: "Calibrate the tower mesh before the next breach wave can claim it.",
        narrative:
          "The tower is still salvageable, but only if the pair can hold the line while the lattice runs quiet diagnostics.",
        environment: "Cooling tower rings and intermittent signal wash.",
        enemyPressure: 13,
      },
      "breach-defense": {
        objective: "Hold the final tower through the scouting surge and bank the city a clean read.",
        narrative:
          "Even the calm window ends with a test: prove the pair can stabilize the line before the true breach begins.",
        environment: "Muted corruption pulses and tower vents just starting to re-ignite.",
        enemyPressure: 15,
      },
    },
  },
  warning: {
    overview:
      "Glass Wastes is tipping into pre-breach alert. Secure the shard approaches, rush the tower sync, and brace the route before Concord Breach turns fully live.",
    launchText:
      "Leave the city lattice early, lock the forward towers, and make sure the first live breach wave hits a prepared line instead of a broken one.",
    failureRisk:
      "If the warning window is wasted, the live breach opens with the outer relay chain already compromised.",
    narrativeArc: [
      "The towers still stand, but the whole field feels like it is counting down to impact.",
      "Concord dispatch stops talking about rehearsal and starts talking about readiness checks, fallback lanes, and the cost of being late.",
      "By the last lane, the pair is not just proving it can respond to crisis; it is buying the city time before the crisis peaks.",
    ],
    modifiers: [
      {
        label: "Pre-Breach Surge",
        effect:
          "Threat pressure builds earlier as the field tips from patrol into open-event alert.",
      },
      {
        label: "Forward Staging",
        effect:
          "Concord prioritizes tower readiness and fast access to the breach lanes over long-route caution.",
      },
    ],
    stageRotations: {
      "shard-survey": {
        objective: "Clear the approach lane before the first breach sirens lock the route.",
        narrative:
          "The field is no longer quiet; every clean scan now doubles as a readiness check for the wave behind it.",
        environment: "Escalating signal haze and towers ramping into alert mode.",
        enemyPressure: 14,
      },
      "tower-sync": {
        objective: "Stabilize the tower mesh before the live breach wave reaches the outer ring.",
        narrative:
          "The lattice is straining early, forcing the pair to finish the sync under a timer the city can feel.",
        environment: "Charging tower rings and warning-tone signal echoes.",
        enemyPressure: 16,
      },
      "breach-defense": {
        objective: "Hold the warning line long enough to keep the city from entering the live breach already behind.",
        narrative:
          "This is the moment before the public event becomes undeniable, and the pair is all that stands between warning and collapse.",
        environment: "Breach static, unstable tower pulses, and partial corruption flares.",
        enemyPressure: 18,
      },
    },
  },
  live: {
    overview:
      "Glass Wastes is the first public proof that the bond works outside controlled lanes. Survey the shard towers, sync the lattice, and hold through a full Concord Breach wave.",
    launchText:
      "Leave the city lattice, keep the shard network breathing, and show the Concord this pair can survive a live frontier event.",
    failureRisk:
      "If the towers fail, corruption rolls back to the Watch Ring and the emergency becomes a city-defense disaster.",
    narrativeArc: [
      "The Glass Wastes feel sacred and wrong at once: silent towers, refracted horizons, and corrupted signals under every step.",
      "Now the pair is the experiment the Concord chose to trust, crossing tower lanes while machine blocs argue over who owns the field.",
      "Holding through the last breach marks the bond as fit for live-event operations instead of protected training duty.",
    ],
    modifiers: [
      {
        label: "Breach Surge",
        effect:
          "The route is in full public-event mode, with maximum pressure and no protected fallback lane.",
      },
      {
        label: "Open Event Credit",
        effect:
          "Concord is logging live-event performance, salvage, and tower defense impact in real time.",
      },
      {
        label: "Rotating Tower Priority",
        effect:
          "The route emphasis can pivot hard between scouting, lattice sync, and breach hold once the event goes public.",
      },
    ],
    stageRotations: {
      "shard-survey": {
        objective: "Secure the approach lane and locate the first intact shard tower.",
        narrative:
          "Signal distortion makes every contact look safer and farther away than it really is.",
        environment: "Signal haze, reflective glass dunes, and deceptive line-of-sight.",
        enemyPressure: 13,
      },
      "tower-sync": {
        objective: "Hold the tower long enough to rebind the anomaly lattice.",
        narrative:
          "The tower sync drags the field onto your position, forcing a short, hard control fight with no clean retreat.",
        environment: "Tower discharge rings and unstable signal echoes.",
        enemyPressure: 15,
      },
      "breach-defense": {
        objective: "Survive the breach wave and keep the final tower online until relief arrives.",
        narrative:
          "This is the first time the pair is trusted with a true public-event defense problem instead of a protected training lane.",
        environment: "Tower overload arcs and rotating corruption surges.",
        enemyPressure: 17,
      },
    },
  },
  recovery: {
    overview:
      "Glass Wastes has shifted into breach cleanup. Sweep the shard approaches, resynchronize the towers, and hold the recovery corridor while Concord secures the aftermath.",
    launchText:
      "Stay on the line after the breach peak, cover the cleanup crews, and turn a live-event save into a controlled recovery window.",
    failureRisk:
      "If recovery fails, the city survives the breach only to lose the towers during cleanup and salvage.",
    narrativeArc: [
      "The worst of the breach has passed, leaving behind cracked towers, salvage teams, and too many places the field still wants to bite.",
      "Concord no longer needs a miracle. It needs bonded pairs that can keep the cleanup corridor from turning into another emergency.",
      "By the last lane, the pair proves it can finish a public event cleanly, not just survive the loudest minute of it.",
    ],
    modifiers: [
      {
        label: "Cleanup Cover",
        effect:
          "The route shifts from peak breach defense into escort, salvage security, and relay repair cover.",
      },
      {
        label: "Residual Corruption",
        effect:
          "Pressure runs lighter than the live window, but stray surges and cleanup hazards still punish sloppy movement.",
      },
    ],
    stageRotations: {
      "shard-survey": {
        objective: "Sweep the shard approach and keep recovery crews clear of lingering corruption pockets.",
        narrative:
          "The reflections are less violent now, but every clean lane still has to be earned for the crews moving in behind you.",
        environment: "Cooling glass dunes, cleanup markers, and residual signal ghosts.",
        enemyPressure: 12,
        rewardText: "Recovery telemetry steadies and the cleanup corridor opens wider.",
      },
      "tower-sync": {
        objective: "Resynchronize the tower mesh so the cleanup teams can reclaim the lattice.",
        narrative:
          "The fight is shorter now, but the price of failure is handing the whole repair effort back to the breach.",
        environment: "Tower reset arcs and salvage rigs working under fire.",
        enemyPressure: 14,
        rewardText:
          "The tower answers the pair again and the recovery crews push deeper into the line.",
      },
      "breach-defense": {
        objective: "Hold the recovery corridor until the final tower handoff is complete.",
        narrative:
          "The city is already breathing easier, but one last surge could still turn the cleanup into another catastrophe.",
        environment: "Residual breach arcs and half-stabilized tower relays.",
        enemyPressure: 16,
        rewardText:
          "Cleanup credit, salvage access, and recovery trust lock into the operator record.",
      },
    },
  },
};

const glassWastesBaseFlow =
  missionFlows.find((mission) => mission.id === firstLiveEvent.primaryMissionId) ??
  missionFlows[missionFlows.length - 1];

function resolveMissionEventWindowId(
  missionId: string,
  eventWindowId?: LiveEventWindowId | null,
) {
  if (missionId !== firstLiveEvent.primaryMissionId) {
    return null;
  }

  return eventWindowId ?? resolveLiveEvent(firstLiveEvent).currentWindow.id;
}

function buildGlassWastesFlow(eventWindowId: LiveEventWindowId) {
  const rotation = glassWastesWindowRotations[eventWindowId];
  const eventWindow = getLiveEventWindow(firstLiveEvent, eventWindowId);

  return {
    ...glassWastesBaseFlow,
    overview: rotation.overview,
    launchText: rotation.launchText,
    failureRisk: rotation.failureRisk,
    narrativeArc: rotation.narrativeArc,
    modifiers: rotation.modifiers,
    eventWindowId,
    eventWindowLabel: eventWindow.label,
    stages: glassWastesBaseFlow.stages.map((stage) => ({
      ...stage,
      ...rotation.stageRotations[stage.id],
    })),
  } satisfies MissionFlow;
}

function appendLog(log: string[], message: string) {
  return [message, ...log].slice(0, 6);
}

function clearTelegraph(nextState: CombatState, stage: MissionStage, message: string) {
  if (!nextState.telegraphActive) {
    return;
  }

  nextState.telegraphActive = false;
  nextState.log = appendLog(nextState.log, `${stage.telegraph.name} breaks early. ${message}`);
}

function shouldTriggerElementalReaction(
  pairing: StarterPairing,
  stage: MissionStage,
  state: CombatState,
  actionId: CombatActionId,
) {
  if (state.reactionTriggered || pairing.element !== stage.telegraph.reactionElement) {
    return false;
  }

  if (actionId === "bond" && state.telegraphActive) {
    return true;
  }

  if (actionId === "heavy" && state.enemyExposed) {
    return true;
  }

  return actionId === "finisher" && (state.telegraphActive || state.enemyExposed);
}

function applyElementalReaction(nextState: CombatState, stage: MissionStage) {
  nextState.telegraphActive = false;
  nextState.reactionTriggered = true;
  nextState.lastReaction = stage.telegraph.reactionName;
  nextState.enemySuppressed = true;
  nextState.charge = Math.min(100, nextState.charge + 8);
  nextState.log = appendLog(nextState.log, stage.telegraph.reactionOutcome);

  return stage.telegraph.reactionBonusDamage;
}

export function getMissionFlow(
  missionId: string,
  eventWindowId?: LiveEventWindowId | null,
) {
  const mission = missionFlows.find((candidate) => candidate.id === missionId) ?? null;

  if (!mission) {
    return null;
  }

  const resolvedWindowId = resolveMissionEventWindowId(missionId, eventWindowId);

  if (!resolvedWindowId) {
    return mission;
  }

  return buildGlassWastesFlow(resolvedWindowId);
}

export function getStarterPairing(pairingId: PairingId) {
  return starterPairings.find((pairing) => pairing.id === pairingId) ?? starterPairings[0];
}

export function getPairingForProfile(
  profile: Pick<CommandDeckState, "selectedLoadoutId" | "selectedCompanionId">,
) {
  const exactPairing = starterPairings.find(
    (pairing) =>
      pairing.loadoutId === profile.selectedLoadoutId &&
      pairing.companionId === profile.selectedCompanionId,
  );

  if (exactPairing) {
    return exactPairing;
  }

  return (
    starterPairings.find(
      (pairing) => pairing.loadoutId === profile.selectedLoadoutId,
    ) ?? starterPairings[0]
  );
}

export function isMissionUnlocked(
  missionId: string,
  profile: Pick<CommandDeckState, "lastCompletedMissionId" | "explorerRank">,
) {
  if (missionId === "ash-circuit") {
    return true;
  }

  return (
    profile.lastCompletedMissionId === "ash-circuit" || profile.explorerRank > 1
  );
}

export function createEncounterState(
  missionId: string,
  stageIndex: number,
  eventWindowId?: LiveEventWindowId | null,
): CombatState {
  const mission = getMissionFlow(missionId, eventWindowId);
  const stage = mission?.stages[stageIndex];

  if (!mission || !stage) {
    throw new Error(`Unknown mission stage: ${missionId}#${stageIndex}`);
  }

  return {
    playerIntegrity: 100,
    shield: 0,
    charge: 0,
    momentum: 0,
    enemyIntegrity: stage.enemyIntegrity,
    enemyExposed: false,
    enemySuppressed: false,
    telegraphActive: true,
    reactionTriggered: false,
    lastReaction: null,
    stageComplete: false,
    playerDown: false,
    log: [
      `${stage.enemyName} steps into the route. ${stage.objective}`,
      `The field closes around the pair: ${stage.environment}`,
    ],
  };
}

export function advanceEncounterState(
  missionId: string,
  nextStageIndex: number,
  previous: CombatState,
  eventWindowId?: LiveEventWindowId | null,
) {
  const mission = getMissionFlow(missionId, eventWindowId);
  const stage = mission?.stages[nextStageIndex];

  if (!mission || !stage) {
    throw new Error(`Unknown mission stage: ${missionId}#${nextStageIndex}`);
  }

  return {
    playerIntegrity: Math.min(100, previous.playerIntegrity + 18),
    shield: Math.floor(previous.shield / 2),
    charge: Math.min(100, previous.charge + 10),
    momentum: Math.max(0, previous.momentum - 1),
    enemyIntegrity: stage.enemyIntegrity,
    enemyExposed: false,
    enemySuppressed: false,
    telegraphActive: true,
    reactionTriggered: false,
    lastReaction: null,
    stageComplete: false,
    playerDown: false,
    log: [
      `${stage.title} opens under live pressure. ${stage.narrative}`,
      `${stage.enemyName} surges into the route.`,
    ],
  } satisfies CombatState;
}

function applyEnemyCounter(
  state: CombatState,
  stage: MissionStage,
  counterMitigation: number,
  skipCounter: boolean,
) {
  if (state.stageComplete || state.playerDown) {
    return state;
  }

  const nextState = { ...state };

  if (skipCounter) {
    clearTelegraph(
      nextState,
      stage,
      "The pair beats the timing window before the surge can connect.",
    );
    nextState.log = appendLog(
      nextState.log,
      `${stage.enemyName} loses the retaliation window and cannot answer the pair.`,
    );
    return nextState;
  }

  let incoming = stage.enemyPressure;

  if (nextState.telegraphActive) {
    incoming += stage.telegraph.surgePressure;
    nextState.telegraphActive = false;
    nextState.log = appendLog(nextState.log, `${stage.telegraph.name} lands: ${stage.telegraph.cue}`);
  }

  if (nextState.enemySuppressed) {
    incoming -= 5;
    nextState.enemySuppressed = false;
  }

  incoming = Math.max(0, incoming - counterMitigation);

  if (incoming <= 0) {
    clearTelegraph(
      nextState,
      stage,
      "The shield wall eats the surge before it finds a clean hit.",
    );
    nextState.log = appendLog(
      nextState.log,
      `${stage.enemyName} cannot turn the pressure spike into real damage.`,
    );
    return nextState;
  }

  const shieldAbsorb = Math.min(nextState.shield, incoming);
  nextState.shield -= shieldAbsorb;
  const remainingDamage = incoming - shieldAbsorb;
  nextState.playerIntegrity = Math.max(0, nextState.playerIntegrity - remainingDamage);
  nextState.playerDown = nextState.playerIntegrity === 0;
  nextState.log = appendLog(
    nextState.log,
    `${stage.enemyName} slams back with ${incoming} pressure; the shield catches ${shieldAbsorb}.`,
  );

  return nextState;
}

export function executeCombatAction(
  pairingId: PairingId,
  missionId: string,
  stageIndex: number,
  currentState: CombatState,
  actionId: CombatActionId,
  eventWindowId?: LiveEventWindowId | null,
) {
  const mission = getMissionFlow(missionId, eventWindowId);
  const stage = mission?.stages[stageIndex];

  if (!mission || !stage) {
    throw new Error(`Unknown mission stage: ${missionId}#${stageIndex}`);
  }

  const pairing = getStarterPairing(pairingId);

  const nextState: CombatState = {
    ...currentState,
    log: [...currentState.log],
  };

  let damage = 0;
  let counterMitigation = 0;
  let skipCounter = false;

  if (actionId === "finisher" && nextState.charge < FINISHER_THRESHOLD) {
    nextState.log = appendLog(
      nextState.log,
      "Resonance is still climbing. The finisher will not answer yet.",
    );

    return applyEnemyCounter(nextState, stage, 0, false);
  }

  switch (pairingId) {
    case "flux-ward":
      switch (actionId) {
        case "light":
          damage = 8;
          nextState.charge = Math.min(100, nextState.charge + 12);
          nextState.shield += 5;
          nextState.log = appendLog(
            nextState.log,
            "Arc Jab lands first, and CAIRN-7 folds the pressure back into the shield line.",
          );
          break;
        case "heavy":
          damage = 15 + (nextState.enemyExposed ? 6 : 0);
          nextState.charge = Math.min(100, nextState.charge + 18);
          nextState.enemyExposed = false;
          nextState.log = appendLog(
            nextState.log,
            "Gauntlet Crash hits like a gate strike and tears open the front of the breach.",
          );
          break;
        case "dodge":
          nextState.shield += 14;
          nextState.charge = Math.min(100, nextState.charge + 8);
          nextState.enemySuppressed = true;
          counterMitigation = 8;
          nextState.log = appendLog(
            nextState.log,
            "Aegis Drift turns the evade window into a braced guard wall.",
          );
          break;
        case "bond":
          damage = 6;
          nextState.shield += 6;
          nextState.charge = Math.min(100, nextState.charge + 24);
          nextState.enemyExposed = true;
          nextState.enemySuppressed = true;
          counterMitigation = 6;
          nextState.log = appendLog(
            nextState.log,
            "CAIRN-7 cuts across the lane, intercepts the hit, and opens a punish window.",
          );
          break;
        case "finisher":
          damage = 30 + (nextState.enemyExposed ? 8 : 0);
          nextState.charge = 0;
          nextState.shield += 10;
          nextState.enemyExposed = false;
          nextState.enemySuppressed = true;
          counterMitigation = 10;
          nextState.log = appendLog(
            nextState.log,
            "Storm Bulwark Crash rolls through the breach like a controlled collapse.",
          );
          break;
      }
      break;
    case "frost-thread":
      switch (actionId) {
        case "light":
          damage = 7 + (nextState.enemyExposed ? 5 : 0);
          nextState.charge = Math.min(100, nextState.charge + 10);
          nextState.log = appendLog(
            nextState.log,
            "Cryo Shot lands on VEIL-3 telemetry and starts the crack running.",
          );
          break;
        case "heavy":
          damage = 12 + (nextState.enemyExposed ? 12 : 0);
          nextState.charge = Math.min(100, nextState.charge + 16);
          nextState.enemyExposed = false;
          nextState.log = appendLog(
            nextState.log,
            "Shatter Lance finds the marked fault line and blows it wide.",
          );
          break;
        case "dodge":
          nextState.charge = Math.min(100, nextState.charge + 12);
          nextState.enemySuppressed = true;
          skipCounter = true;
          nextState.log = appendLog(
            nextState.log,
            "Slip Vector ghosts the pair out of the firing solution.",
          );
          break;
        case "bond":
          damage = 5;
          nextState.charge = Math.min(100, nextState.charge + 22);
          nextState.enemyExposed = true;
          nextState.enemySuppressed = true;
          counterMitigation = 5;
          nextState.log = appendLog(
            nextState.log,
            "Thread Scan threads the weak seams through the target shell.",
          );
          break;
        case "finisher":
          damage = 28 + (nextState.enemyExposed ? 10 : 0);
          nextState.charge = 0;
          nextState.enemyExposed = true;
          nextState.enemySuppressed = true;
          skipCounter = true;
          nextState.log = appendLog(
            nextState.log,
            "Faultline Zero freezes the whole lane for one clean break.",
          );
          break;
      }
      break;
    case "ember-raze":
      switch (actionId) {
        case "light":
          damage = 10 + nextState.momentum * 2;
          nextState.charge = Math.min(100, nextState.charge + 14);
          nextState.momentum += 1;
          nextState.log = appendLog(
            nextState.log,
            "Thermal Slice keeps TALON-9 hungry and the chase accelerating.",
          );
          break;
        case "heavy":
          damage = 12 + nextState.momentum * 8;
          nextState.charge = Math.min(100, nextState.charge + 18);
          nextState.momentum = Math.max(0, nextState.momentum - 1);
          nextState.log = appendLog(
            nextState.log,
            "Raze Dive cashes the whole chase into one brutal drop.",
          );
          break;
        case "dodge":
          nextState.charge = Math.min(100, nextState.charge + 10);
          nextState.momentum += 1;
          counterMitigation = 6;
          nextState.log = appendLog(
            nextState.log,
            "Afterburn Step keeps the pursuit alive while the return strike skims past.",
          );
          break;
        case "bond":
          damage = 8;
          nextState.charge = Math.min(100, nextState.charge + 20);
          nextState.momentum += 1;
          nextState.enemyExposed = true;
          counterMitigation = 4;
          nextState.log = appendLog(
            nextState.log,
            "Predator Sync tags the soft side and stretches the kill window.",
          );
          break;
        case "finisher":
          damage = 24 + nextState.momentum * 12 + (nextState.enemyExposed ? 6 : 0);
          nextState.charge = 0;
          nextState.momentum = 0;
          nextState.enemyExposed = false;
          counterMitigation = 8;
          nextState.log = appendLog(
            nextState.log,
            "Overheat Execution lands before the target can find its footing again.",
          );
          break;
      }
      break;
  }

  if (shouldTriggerElementalReaction(pairing, stage, currentState, actionId)) {
    damage += applyElementalReaction(nextState, stage);
  }

  nextState.enemyIntegrity = Math.max(0, nextState.enemyIntegrity - damage);

  if (nextState.enemyIntegrity === 0) {
    nextState.stageComplete = true;
    nextState.log = appendLog(
      nextState.log,
      `${stage.enemyName} folds. The lane holds. ${stage.rewardText}`,
    );

    return nextState;
  }

  return applyEnemyCounter(nextState, stage, counterMitigation, skipCounter);
}

export function applyMissionCompletion(
  profile: CommandDeckState,
  missionId: string,
  rewards?: RewardPayload,
  eventWindowId: LiveEventWindowId | null = null,
) {
  const mission = getMissionFlow(missionId, eventWindowId);

  if (!mission) {
    return profile;
  }

  const rewardPayload = rewards ?? mission.completionRewards;

  return normalizeCommandDeckState({
    ...profile,
    phase: "recovery",
    selectedMissionId: mission.nextMissionId ?? mission.id,
    explorerRank: profile.explorerRank + rewardPayload.explorerRank,
    humanLevel: profile.humanLevel + rewardPayload.humanLevel,
    aiTier: profile.aiTier + rewardPayload.aiTier,
    resonanceLevel:
      profile.resonanceLevel + rewardPayload.resonanceLevel,
    factionStanding: profile.factionStanding + rewardPayload.factionStanding,
    lastCompletedMissionId: mission.id,
    updatedAt: new Date().toISOString(),
  });
}

export const launchMissionLinks = missionZones.map((mission) => ({
  ...mission,
  href: `/missions/${mission.id}`,
}));