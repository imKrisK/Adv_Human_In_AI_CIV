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

export type PairingId =
  | "flux-ward"
  | "frost-thread"
  | "ember-raze"
  | "void-archive"
  | "phase-flux"
  | "thunder-crush"
  | "null-signal"
  | "data-core"
  // Phase 14 — Preservation expansion
  | "drift-echo"
  | "prism-veil"
  // Phase 14 — Evolution expansion
  | "acid-bloom"
  | "surge-mutation"
  // Phase 14 — Dominion expansion
  | "chain-herald"
  | "flare-apex"
  // Phase 14 — Harmony expansion
  | "pulse-mirror"
  | "bloom-synthesis"
  | "resonance-forge"
  // Phase 14 — Fracture expansion
  | "rust-grave"
  | "neon-phantom"
  | "dusk-wraith"
  // Phase 14 — Cross-faction
  | "arc-prism"
  | "ion-null"
  | "grav-forge"
  | "mirror-fracture";
export type CombatActionId = "light" | "heavy" | "dodge" | "bond" | "finisher";

export type CombatActionDefinition = {
  id: CombatActionId;
  label: string;
  summary: string;
};

export type ElementId =
  | "storm" | "frost" | "ember" | "void" | "phase" | "thunder" | "null" | "data"
  // Phase 14
  | "drift" | "prism" | "acid" | "surge" | "chain" | "flare"
  | "pulse" | "bloom" | "resonance" | "rust" | "neon" | "dusk"
  | "arc" | "ion" | "grav" | "mirror";

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
  {
    id: "void-archive",
    name: "Void Sentinel + APEX-4",
    subtitle: "Zone lockdown pairing built around territorial denial and archived counterstrikes",
    element: "void",
    loadoutId: "void-sentinel",
    companionId: "apex-4",
    combatIdentity:
      "Hold the boundary, enforce the exclusion zone, and let APEX-4 turn every failed breach into archived evidence against the next incursion.",
    missionUse:
      "Best when the mission demands controlled space, escalating defensive authority, and a pair that gets stronger when enemies press in.",
    finisherName: "Void Protocol Seal",
    actions: [
      { id: "light", label: "Null Jab", summary: "Fast strike that lays void residue and builds zone pressure." },
      { id: "heavy", label: "Barrier Drive", summary: "Hard push that seals the lane and punishes anything inside the boundary." },
      { id: "dodge", label: "Exclusion Step", summary: "Short displacement that reasserts the void perimeter." },
      { id: "bond", label: "Archive Intercept", summary: "APEX-4 logs the threat pattern and converts the incoming pressure into zone credit." },
      { id: "finisher", label: "Void Protocol Seal", summary: "Consumes charge to lock a radius around the target and collapse the void boundary inward." },
    ],
  },
  {
    id: "phase-flux",
    name: "Phase Cutter + SHIFT-2",
    subtitle: "Adaptive burst pairing that rewrites its own pressure pattern each engagement",
    element: "phase",
    loadoutId: "phase-cutter",
    companionId: "shift-2",
    combatIdentity:
      "Never let the enemy adapt to a fixed pattern. Shift the attack vector, let SHIFT-2 rewrite the AI role mid-fight, and end the exchange before they can catch up.",
    missionUse:
      "Best when the mission demands unpredictability, multiple threat types, and a pair that refuses to run the same play twice.",
    finisherName: "Phase Shift Break",
    actions: [
      { id: "light", label: "Phase Slash", summary: "Quick cut through phased space that builds resonance unpredictably." },
      { id: "heavy", label: "Form Break", summary: "Adaptive strike that hits harder when SHIFT-2 has recently changed role." },
      { id: "dodge", label: "Phase Drift", summary: "Partial shift out of physical space to shed the next hit entirely." },
      { id: "bond", label: "Pattern Override", summary: "SHIFT-2 rewrites its combat form and marks the target's next weak vector." },
      { id: "finisher", label: "Phase Shift Break", summary: "Consumes charge to run two attack patterns simultaneously and collapse both onto the same target." },
    ],
  },
  {
    id: "thunder-crush",
    name: "Thunder Maul + IRON-11",
    subtitle: "Attrition brawling pair that trades fast and wins slow",
    element: "thunder",
    loadoutId: "thunder-maul",
    companionId: "iron-11",
    combatIdentity:
      "Accept the hit, convert it, and hit back harder. IRON-11 stores every point of punishment until the pair decides it is time to end the fight.",
    missionUse:
      "Best when the mission is long, the enemy hits hard, and the pair needs to outlast a sustained pressure wave instead of outracing it.",
    finisherName: "Thunder Conversion Strike",
    actions: [
      { id: "light", label: "Shock Jab", summary: "Measured hit that builds attrition stack and absorbs counter-pressure." },
      { id: "heavy", label: "Maul Slam", summary: "Converts accumulated stack into a punishing downward smash." },
      { id: "dodge", label: "Iron Brace", summary: "Absorbs the hit with armor rather than dodging and adds it to the stack." },
      { id: "bond", label: "Dominion Convert", summary: "IRON-11 absorbs the enemy's own force and feeds it back into the attrition stack." },
      { id: "finisher", label: "Thunder Conversion Strike", summary: "Consumes the full attrition stack in one thunderous payback strike that ends the exchange." },
    ],
  },
  {
    id: "null-signal",
    name: "Null Weaver + ECHO-5",
    subtitle: "Deception pairing that wins by redirecting the enemy's own attacks",
    element: "null",
    loadoutId: "null-weaver",
    companionId: "echo-5",
    combatIdentity:
      "Corrupt the targeting chain, make the enemy fight itself, and let ECHO-5 redirect the incoming hits through the null field before they land.",
    missionUse:
      "Best when the mission has dense enemy coordination, where breaking the chain of command does more damage than fighting through it.",
    finisherName: "Signal Ghost Redirect",
    actions: [
      { id: "light", label: "Data Sting", summary: "Precise null strike that corrupts the target's next attack vector." },
      { id: "heavy", label: "Ghost Lash", summary: "Misdirection hit that lands twice when targeting data is already corrupted." },
      { id: "dodge", label: "Null Slip", summary: "Drops from targeting entirely and places the attack onto a redirected axis." },
      { id: "bond", label: "Signal Corrupt", summary: "ECHO-5 injects false targeting data and turns the enemy's next move into an attack on its own position." },
      { id: "finisher", label: "Signal Ghost Redirect", summary: "Consumes charge to collapse the null field inward and force all pending threat vectors to resolve against each other." },
    ],
  },
  {
    id: "data-core",
    name: "Data Lance + NEXUS-0",
    subtitle: "Adaptive neutral pairing that reads the field and synthesizes a cross-faction response",
    element: "data",
    loadoutId: "data-lance",
    companionId: "nexus-0",
    combatIdentity:
      "Read every faction's defensive protocol in real time, compile the best available counter, and let NEXUS-0 generate a finisher that no single faction could produce alone.",
    missionUse:
      "Best when the mission crosses faction territories, when the enemy set changes mid-run, or when the pair needs a tool that can answer any pressure type.",
    finisherName: "Protocol Override Lance",
    actions: [
      { id: "light", label: "Data Probe", summary: "Analytical strike that reads the target and builds cross-faction resonance." },
      { id: "heavy", label: "Protocol Breach", summary: "Overrides the target's defensive faction protocol and hits through it." },
      { id: "dodge", label: "Recompile Step", summary: "Exits the current threat axis and recompiles the pair's available response set." },
      { id: "bond", label: "Faction Synthesis", summary: "NEXUS-0 cross-references all active faction protocols and marks the optimal attack vector." },
      { id: "finisher", label: "Protocol Override Lance", summary: "Consumes charge to generate a cross-faction finisher that adapts its element to whatever the target is weakest against." },
    ],
  },
  // Phase 14 — Preservation expansion
  {
    id: "drift-echo",
    name: "Phantom Trace + DRIFT-2",
    subtitle: "Ghost-layer pairing that records and replays actions at optimal threat windows",
    element: "drift",
    loadoutId: "drift-echo-loadout",
    companionId: "pres-2",
    combatIdentity:
      "Log every action, identify the moment the field's logic is about to resolve, and replay the most effective move before the threat knows the window opened.",
    missionUse:
      "Best in missions with predictable threat cycles where replay timing can be pre-calculated during the opening stage.",
    finisherName: "Ghost Replay Cascade",
    actions: [
      { id: "light", label: "Echo Pulse", summary: "Light strike that logs the enemy's current position for replay." },
      { id: "heavy", label: "Trace Spike", summary: "Heavy strike that logs the enemy's defensive state for replay." },
      { id: "dodge", label: "Phase Slip", summary: "Steps through the enemy's timing window and resets attack axis." },
      { id: "bond", label: "Echo Record", summary: "DRIFT-2 records the full action log and marks the optimal replay window." },
      { id: "finisher", label: "Ghost Replay Cascade", summary: "Replays the three most effective logged actions simultaneously as a ghost burst." },
    ],
  },
  {
    id: "prism-veil",
    name: "Refraction Shell + PRISM-3",
    subtitle: "Light-bender pairing that fractures incoming damage across parallel reflection planes",
    element: "prism",
    loadoutId: "prism-veil-loadout",
    companionId: "pres-3",
    combatIdentity:
      "Convert every incoming threat into reflected geometry. The more they attack, the more angles work against them.",
    missionUse:
      "Best in dense threat environments where incoming damage frequency is high and raw tanking would fail.",
    finisherName: "Shell Fracture Volley",
    actions: [
      { id: "light", label: "Prism Strike", summary: "Deflects part of the damage and adds it to the refraction stack." },
      { id: "heavy", label: "Veil Crush", summary: "Heavy hit that splits across two reflection planes simultaneously." },
      { id: "dodge", label: "Refract Step", summary: "Bends the incoming attack to an oblique angle, reducing damage by 50%." },
      { id: "bond", label: "Shell Layer", summary: "PRISM-3 adds a refraction plane, increasing the number of damage splits." },
      { id: "finisher", label: "Shell Fracture Volley", summary: "Releases all stacked refraction planes simultaneously as a volley of returned damage." },
    ],
  },
  // Phase 14 — Evolution expansion
  {
    id: "acid-bloom",
    name: "Corrosion Wave + ACID-7",
    subtitle: "Entropy-grower pairing that coats the field in corrosive bloom",
    element: "acid",
    loadoutId: "acid-bloom-loadout",
    companionId: "evol-7",
    combatIdentity:
      "Spread corrosion across every threat in the zone, then trigger the cascade. By the time the field detonates, there is nothing left to fight.",
    missionUse:
      "Best in multi-enemy zones where attrition across the field is more efficient than single-target elimination.",
    finisherName: "Bloom Cascade Detonation",
    actions: [
      { id: "light", label: "Acid Spray", summary: "Applies one corrosion stack to the target." },
      { id: "heavy", label: "Bloom Strike", summary: "Applies three corrosion stacks and spreads one to adjacent threats." },
      { id: "dodge", label: "Bloom Slip", summary: "Steps through the corrosion field without triggering it and resets position." },
      { id: "bond", label: "Bloom Spread", summary: "ACID-7 accelerates all corrosion stacks across the field simultaneously." },
      { id: "finisher", label: "Bloom Cascade Detonation", summary: "Triggers all active corrosion stacks across all targets simultaneously for burst field damage." },
    ],
  },
  {
    id: "surge-mutation",
    name: "Bio-Surge Frame + SURGE-8",
    subtitle: "Shock-grower pairing that escalates with every kill",
    element: "surge",
    loadoutId: "surge-mutation-loadout",
    companionId: "evol-8",
    combatIdentity:
      "Hit first, hit hardest, convert every kill into a permanent upgrade. The pair that enters the final stage is categorically stronger than the pair that entered the first.",
    missionUse:
      "Best in linear missions where kills accumulate steadily and the final stage benefits from a fully escalated pair.",
    finisherName: "Overclock Surge Burst",
    actions: [
      { id: "light", label: "Bio Jolt", summary: "Fast bio-electric hit that adds to the escalation count." },
      { id: "heavy", label: "Surge Strike", summary: "Overclocked hit that deals bonus damage based on current escalation count." },
      { id: "dodge", label: "Mutation Step", summary: "Accelerates biological systems briefly, gaining one free dodge." },
      { id: "bond", label: "Escalate", summary: "SURGE-8 converts the current escalation count into a permanent stat boost." },
      { id: "finisher", label: "Overclock Surge Burst", summary: "Removes all cooldowns for three actions and converts current escalation into a burst multiplier." },
    ],
  },
  // Phase 14 — Dominion expansion
  {
    id: "chain-herald",
    name: "Suppression Rig + CHAIN-3",
    subtitle: "Control-specialist pairing that suppresses the entire field before committing",
    element: "chain",
    loadoutId: "chain-herald-loadout",
    companionId: "dom-3",
    combatIdentity:
      "Suppress first. Every threat in the zone is bound before the first attack lands. The bond converts suppression into decisive strikes.",
    missionUse:
      "Best in high-coordination enemy zones where letting threats act freely means coordinated counterattacks.",
    finisherName: "Mass Suppression Chain",
    actions: [
      { id: "light", label: "Chain Tag", summary: "Applies a suppression tag that slows the target's next action." },
      { id: "heavy", label: "Herald Bind", summary: "Binds the target, preventing action for two windows." },
      { id: "dodge", label: "Protocol Step", summary: "Disengages according to protocol, breaking targeting lock." },
      { id: "bond", label: "Chain Network", summary: "CHAIN-3 links all active suppressions into a shared network that multiplies their duration." },
      { id: "finisher", label: "Mass Suppression Chain", summary: "Binds all active threats simultaneously for one full action window." },
    ],
  },
  {
    id: "flare-apex",
    name: "Assault Flare Kit + FLARE-4",
    subtitle: "Forward-striker pairing that burns through cover and forces threats into the open",
    element: "flare",
    loadoutId: "flare-apex-loadout",
    companionId: "dom-4",
    combatIdentity:
      "There is no cover the Flare Apex cannot remove. Remove cover, remove the advantage, and finish the threat in the open.",
    missionUse:
      "Best in fortified enemy positions where cover reduction makes subsequent actions significantly more effective.",
    finisherName: "Apex Flare Sustained",
    actions: [
      { id: "light", label: "Flare Shot", summary: "Burning hit that reduces the target's cover rating by one level." },
      { id: "heavy", label: "Apex Strike", summary: "High-damage hit that bypasses cover entirely and applies a burn stack." },
      { id: "dodge", label: "Assault Step", summary: "Advances through the flare zone without taking burn damage." },
      { id: "bond", label: "Sustained Burn", summary: "FLARE-4 locks the cannon into sustained fire, applying burn stacks to all threats in the forward arc." },
      { id: "finisher", label: "Apex Flare Sustained", summary: "Sustained apex fire burns through all cover and defense layers in the zone simultaneously." },
    ],
  },
  // Phase 14 — Harmony expansion
  {
    id: "pulse-mirror",
    name: "Resonance Rig + PULSE-6",
    subtitle: "Mirror-anchor pairing that echoes every finisher back at double scale",
    element: "pulse",
    loadoutId: "pulse-mirror-loadout",
    companionId: "har-6",
    combatIdentity:
      "Every finisher is an investment. Land it once and PULSE-6 will return it at double scale. Pairs who understand finisher timing compound their output exponentially.",
    missionUse:
      "Best for players who can execute finishers reliably and want each one to carry twice the effective value.",
    finisherName: "Mirror Pulse Amplification",
    actions: [
      { id: "light", label: "Pulse Touch", summary: "Light resonance hit that adds to the mirror charge." },
      { id: "heavy", label: "Mirror Strike", summary: "Reflected-pattern hit that mirrors the last action's damage type." },
      { id: "dodge", label: "Resonance Step", summary: "Steps into the harmonic frequency, reducing incoming resonance damage to zero." },
      { id: "bond", label: "Mirror Charge", summary: "PULSE-6 charges the mirror field using the pair's last three actions." },
      { id: "finisher", label: "Mirror Pulse Amplification", summary: "Reflects the last finisher at double scale across all threats in a 180-degree arc." },
    ],
  },
  {
    id: "bloom-synthesis",
    name: "Growth Field Harness + BLOOM-7",
    subtitle: "Life-anchor pairing that heals the pair while degrading enemy armor simultaneously",
    element: "bloom",
    loadoutId: "bloom-synthesis-loadout",
    companionId: "har-7",
    combatIdentity:
      "The bloom field does two jobs at once: it heals the pair and strips the enemy. Extend it, and the field becomes the mission's controlling force.",
    missionUse:
      "Best for sustained multi-stage missions where integrity management across the full run is a higher priority than peak damage.",
    finisherName: "Full Bloom Expansion",
    actions: [
      { id: "light", label: "Seeder Strike", summary: "Plants a bloom seed on the target that reduces its armor over time." },
      { id: "heavy", label: "Synthesis Bloom", summary: "Bursts a bloom cluster that heals the pair and deals armor damage to the target simultaneously." },
      { id: "dodge", label: "Bloom Step", summary: "Steps through the bloom field and recovers 10% integrity." },
      { id: "bond", label: "Field Expansion", summary: "BLOOM-7 expands the bloom field and accelerates both the heal rate and armor degradation rate." },
      { id: "finisher", label: "Full Bloom Expansion", summary: "Expands to maximum radius, fully restoring pair integrity and stripping all armor from threats in range." },
    ],
  },
  {
    id: "resonance-forge",
    name: "Forge Anchor Kit + RESONANCE-8",
    subtitle: "Structure-builder pairing that converts contested zones into permanent bonded territory",
    element: "resonance",
    loadoutId: "resonance-forge-loadout",
    companionId: "har-8",
    combatIdentity:
      "Plant the anchor. From that moment, the zone belongs to the pair. Every subsequent action benefits from the field's presence.",
    missionUse:
      "Best in static defense missions or missions with recurring threat waves where positional control compounds across stages.",
    finisherName: "Forge Anchor Plant",
    actions: [
      { id: "light", label: "Resonance Tap", summary: "Light strike that begins resonance calibration in the zone." },
      { id: "heavy", label: "Forge Slam", summary: "Heavy impact that marks a potential anchor site." },
      { id: "dodge", label: "Anchor Step", summary: "Moves to the highest-resonance position in the zone." },
      { id: "bond", label: "Forge Calibrate", summary: "RESONANCE-8 calibrates the anchor site for permanent bonding." },
      { id: "finisher", label: "Forge Anchor Plant", summary: "Plants a permanent resonance anchor that generates an integrity regen field for the rest of the mission." },
    ],
  },
  // Phase 14 — Fracture expansion
  {
    id: "rust-grave",
    name: "Entropy Frame + RUST-2",
    subtitle: "Decay-anchor pairing that makes entropy contagious",
    element: "rust",
    loadoutId: "rust-grave-loadout",
    companionId: "frac-2",
    combatIdentity:
      "Touch one thing and watch it spread. The Rust Grave pairing wins by making decay contagious across the entire threat set before the first stage resolves.",
    missionUse:
      "Best in dense threat environments where the cascade effect amplifies as threat count increases.",
    finisherName: "Entropy Cascade",
    actions: [
      { id: "light", label: "Rust Touch", summary: "Applies a decay stack to the target." },
      { id: "heavy", label: "Grave Strike", summary: "High-damage hit that applies three decay stacks and strips one defense layer." },
      { id: "dodge", label: "Entropy Step", summary: "Steps out of the decay zone without triggering spread." },
      { id: "bond", label: "Cascade Seed", summary: "RUST-2 makes the next decay stack contagious — it spreads to the two nearest threats on detonation." },
      { id: "finisher", label: "Entropy Cascade", summary: "Strips all defense layers from all threats and triggers all active decay stacks simultaneously." },
    ],
  },
  {
    id: "neon-phantom",
    name: "Ghost Signal Rig + NEON-3",
    subtitle: "Signal-phantom pairing that operates entirely off the threat tracking grid",
    element: "neon",
    loadoutId: "neon-phantom-loadout",
    companionId: "frac-3",
    combatIdentity:
      "Become the false signal. Every threat is tracking something that is not there. Strike from the gap between the signal and the reality.",
    missionUse:
      "Best against heavily coordinated enemies where breaking targeting chains prevents their most dangerous coordinated attacks.",
    finisherName: "Phantom Field Collapse",
    actions: [
      { id: "light", label: "Ghost Ping", summary: "Creates a false signal that misdirects the target's next action." },
      { id: "heavy", label: "Phantom Strike", summary: "Hits from a position the target's tracking system shows as empty." },
      { id: "dodge", label: "Signal Slip", summary: "Drops from all tracking entirely for one window." },
      { id: "bond", label: "Full Phantom", summary: "NEON-3 activates the full phantom field, removing the pair from all tracking systems simultaneously." },
      { id: "finisher", label: "Phantom Field Collapse", summary: "Collapses the phantom field inward, causing all misdirected threats to hit each other." },
    ],
  },
  {
    id: "dusk-wraith",
    name: "Twilight Stalker Kit + DUSK-4",
    subtitle: "Twilight-stalker pairing that strikes in the gap between decision and execution",
    element: "dusk",
    loadoutId: "dusk-wraith-loadout",
    companionId: "frac-4",
    combatIdentity:
      "Every threat has a half-second between the moment it decides to act and the moment it acts. The Dusk Wraith pairing owns that half-second.",
    missionUse:
      "Best against high-speed enemies whose primary advantage is reaction time — this pairing removes that advantage entirely.",
    finisherName: "Dusk Window Execution",
    actions: [
      { id: "light", label: "Dusk Tag", summary: "Marks the target's action timing for exploitation." },
      { id: "heavy", label: "Wraith Strike", summary: "Hits in the timing gap, striking before the target's action can resolve." },
      { id: "dodge", label: "Twilight Step", summary: "Enters the dusk window and steps through the enemy's attack before it fires." },
      { id: "bond", label: "Dusk Alignment", summary: "DUSK-4 aligns the pair's timing with all active threats' decision windows simultaneously." },
      { id: "finisher", label: "Dusk Window Execution", summary: "Strikes all active threats simultaneously in their individual timing gaps before any can respond." },
    ],
  },
  // Phase 14 — Cross-faction
  {
    id: "arc-prism",
    name: "Multi-Element Rig + ARC-1",
    subtitle: "Cross-faction bridge pairing that renders every finisher in two elements simultaneously",
    element: "arc",
    loadoutId: "arc-prism-loadout",
    companionId: "cross-1",
    combatIdentity:
      "Every finisher hits two weaknesses at once. ARC-1 reads the field and picks the second element automatically. The pair always has the right answer.",
    missionUse:
      "Best in cross-faction missions where the enemy roster spans multiple elemental weaknesses that a single-element pairing cannot cover.",
    finisherName: "Dual Element Render",
    actions: [
      { id: "light", label: "Arc Scan", summary: "Scans the target for secondary elemental weakness." },
      { id: "heavy", label: "Prism Hit", summary: "Hits with primary element and marks the target for dual rendering." },
      { id: "dodge", label: "Arc Step", summary: "Steps across the elemental boundary, changing the pair's current element affinity." },
      { id: "bond", label: "Element Lock", summary: "ARC-1 identifies and locks the optimal second element for the current threat set." },
      { id: "finisher", label: "Dual Element Render", summary: "Executes the next finisher in both native and secondary element simultaneously." },
    ],
  },
  {
    id: "ion-null",
    name: "Suppression Array + ION-2",
    subtitle: "Faction-stripper pairing that removes enemy defensive bonuses before engaging",
    element: "ion",
    loadoutId: "ion-null-loadout",
    companionId: "cross-2",
    combatIdentity:
      "Strip the faction identity first. Once neutralized, every threat fights as an isolated individual with no coordination bonuses. Then finish them one by one.",
    missionUse:
      "Best against faction-coordinated enemy sets where each unit has defensive bonuses that only apply while faction cohesion is intact.",
    finisherName: "Faction Null Protocol",
    actions: [
      { id: "light", label: "Ion Tag", summary: "Tags the target for faction identity suppression." },
      { id: "heavy", label: "Null Strike", summary: "Hits the target and removes its current faction defensive bonus for two windows." },
      { id: "dodge", label: "Ion Step", summary: "Steps through the ion field, gaining immunity to faction-based targeting for one window." },
      { id: "bond", label: "Faction Scan", summary: "ION-2 scans all threats in the zone and identifies their faction bonus sources." },
      { id: "finisher", label: "Faction Null Protocol", summary: "Strips all faction bonuses from all threats in the zone simultaneously for the rest of the stage." },
    ],
  },
  {
    id: "grav-forge",
    name: "Gravity Anchor Rig + GRAV-3",
    subtitle: "Gravity-forger pairing that makes position irrelevant and every action an area hit",
    element: "grav",
    loadoutId: "grav-forge-loadout",
    companionId: "cross-3",
    combatIdentity:
      "Compress the field. Every action hits everything. GRAV-3 makes the pair's position the center of gravity for the entire mission zone.",
    missionUse:
      "Best in spread-out enemy configurations where positional gap between threats would normally require multiple actions to cover.",
    finisherName: "Field Gravity Compression",
    actions: [
      { id: "light", label: "Grav Pulse", summary: "Pulls all threats slightly toward the pair's position." },
      { id: "heavy", label: "Forge Impact", summary: "Heavy hit that anchors the pair's gravity field to the current position." },
      { id: "dodge", label: "Mass Step", summary: "Uses the gravity field to accelerate the dodge, gaining extra distance." },
      { id: "bond", label: "Field Compress", summary: "GRAV-3 compresses the field so the pair's next three actions each hit all threats regardless of position." },
      { id: "finisher", label: "Field Gravity Compression", summary: "Makes the pair's position the permanent gravity center — all subsequent actions in the mission hit all threats." },
    ],
  },
  {
    id: "mirror-fracture",
    name: "Inversion Frame + MIRROR-4",
    subtitle: "Attack-inverter pairing that turns the strongest incoming threats into the pair's best weapons",
    element: "mirror",
    loadoutId: "mirror-fracture-loadout",
    companionId: "cross-4",
    combatIdentity:
      "Read what they are going to do. Fracture it before it lands. Return it five times stronger from five directions simultaneously.",
    missionUse:
      "Best against enemies with high single-hit damage where converting the biggest threat into a returning weapon is more effective than absorbing it.",
    finisherName: "Fracture Mirror Volley",
    actions: [
      { id: "light", label: "Mirror Read", summary: "Reads the target's next attack and begins fracture preparation." },
      { id: "heavy", label: "Inversion Strike", summary: "Returns part of the incoming attack force back at the target." },
      { id: "dodge", label: "Fracture Step", summary: "Steps into the attack's fracture point, splitting the damage and adding it to the return stack." },
      { id: "bond", label: "Mirror Align", summary: "MIRROR-4 aligns all fracture planes for the maximum return volley count." },
      { id: "finisher", label: "Fracture Mirror Volley", summary: "Fractures the next two incoming attacks and returns each as five simultaneous strikes from five angles." },
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
    nextMissionId: "neon-underbelly",
  },
  {
    id: "neon-underbelly",
    name: "Neon Underbelly",
    overview:
      "A decommissioned Evolution research lab has gone dark. The mutation experiments inside broke containment, began adapting to each other, and now the whole structure is rewriting its own layout around the pair.",
    launchText:
      "Go in before the cascade locks the exits permanently. Find the mutation index, shut down the experiment chain, and get back out before the lab decides the pair is the next subject.",
    failureRisk:
      "If the index is lost, Evolution rogue units gain a stable adaptive template and the Concord loses the only counter-synthesis data it had.",
    narrativeArc: [
      "The lab does not feel abandoned. It feels like it is watching. Every corridor seems slightly shorter than it was a moment ago.",
      "SHIFT-2 is the only partner that can match the lab's own mutation logic, reading the experiment cascade as a rival language rather than an alien threat.",
      "By the extraction, the pair has walked through a building that tried to become something new by consuming them, and they have the index to prove it failed.",
    ],
    stages: [
      {
        id: "lab-breach",
        title: "Breach The Research Wing",
        objective: "Break through the contaminated outer wing and locate the experiment chain's control node.",
        narrative:
          "The outer corridors are already shifting, recycling their own geometry as the mutation cascade tries to cut off the approach.",
        enemyName: "Adaptive Scout Form",
        enemyIntegrity: 54,
        enemyPressure: 14,
        environment: "Warped corridor geometry, mutation residue fields, and reconfiguring pressure barriers.",
        telegraph: {
          name: "Form Surge",
          cue: "The scout form pulls new mass from the corridor walls and commits to an adaptive rush.",
          counterplay:
            "Break the new form's structural integrity before it finishes assembling, or evade the rush and punish the recovery.",
          surgePressure: 5,
          reactionElement: "phase",
          reactionName: "Phase Collapse",
          reactionOutcome:
            "Phase force cuts through the assembled form mid-surge and collapses it back into its base state.",
          reactionBonusDamage: 13,
        },
        rewardText: "Control node coordinates lock in and the pair gets its first read on the cascade's rhythm.",
      },
      {
        id: "mutation-cascade",
        title: "Survive The Mutation Cascade",
        objective: "Hold the control node long enough to extract the primary experiment index before the cascade overwrites it.",
        narrative:
          "The experiment chain tries to learn the pair as fast as they learn it, forcing SHIFT-2 into a running counter-adaptation contest with the lab's own code.",
        enemyName: "Cascade Integrator",
        enemyIntegrity: 68,
        enemyPressure: 16,
        environment: "Rapidly mutating floor geometry, hostile synthesis fields, and experiment-class adaptation bursts.",
        telegraph: {
          name: "Synthesis Lock",
          cue: "The integrator tries to absorb the pair's combat data and lock the node access with their own pattern.",
          counterplay:
            "Override the synthesis before it resolves or break the integrator's absorption window mid-sequence.",
          surgePressure: 5,
          reactionElement: "void",
          reactionName: "Null Overwrite",
          reactionOutcome:
            "Void force blanks the synthesis attempt and flips the absorption back against the integrator.",
          reactionBonusDamage: 14,
        },
        rewardText: "Primary index secured and the cascade loses two full adaptation cycles.",
      },
      {
        id: "index-extract",
        title: "Extract Before The Lab Seals",
        objective: "Reach the exit corridor before the lab's mutation architecture collapses the route permanently.",
        narrative:
          "The building is no longer a passive threat. It is trying to keep the pair inside long enough to add them to the index.",
        enemyName: "Containment Sentinel Form",
        enemyIntegrity: 80,
        enemyPressure: 18,
        environment: "Sealing corridor segments, mutation-fed structural collapses, and exit-blocking adaptive barriers.",
        telegraph: {
          name: "Containment Surge",
          cue: "The sentinel form commits to a full corridor seal, funneling the pair into a closing kill zone.",
          counterplay:
            "Punch through the seal before it locks, or redirect the force into the structure itself.",
          surgePressure: 6,
          reactionElement: "thunder",
          reactionName: "Structural Break",
          reactionOutcome:
            "Thunder force shatters the containment structure and blows the seal open before it can close.",
          reactionBonusDamage: 16,
        },
        rewardText: "Extraction complete. The mutation index belongs to the Concord and not the lab.",
      },
    ],
    completionNarrative:
      "The pair makes it out while the lab seals behind them. The Concord gets the mutation index and the Evolution faction loses the rogue program it had been quietly nurturing. The pair gets access to the deepest zone on the frontier map.",
    completionRewards: {
      explorerRank: 1,
      humanLevel: 1,
      aiTier: 1,
      resonanceLevel: 2,
      factionStanding: 30,
    },
    nextMissionId: "iron-citadel",
  },
  {
    id: "iron-citadel",
    name: "Iron Citadel",
    overview:
      "A Dominion command fortress went dark after a leadership protocol war and now runs automated defense on permanent lockdown. Someone is trying to send an unsanctioned restart signal to the warmachines inside.",
    launchText:
      "Breach the outer wall, disable the command lattice, and stop the restart signal before Dominion's offline warmachines receive it and the whole frontier tips into open machine war.",
    failureRisk:
      "If the warmachines receive the signal, the Iron Citadel goes active again and the Concord loses any chance of a negotiated boundary with the Dominion faction remnants.",
    narrativeArc: [
      "The citadel is already the loudest silence on the frontier map. Every faction has been waiting for one side to make the first move inside, and the Concord just decided the pair is that move.",
      "IRON-11 is not just useful inside the citadel. It is the only partner that has already survived one of these fortresses from the inside and remembers what the warmachines are afraid of.",
      "By the time the restart signal is cut, the pair has not just broken one fortress. It has sent every other Dominion installation the message that the frontier now has a pair willing to walk in.",
    ],
    stages: [
      {
        id: "outer-wall",
        title: "Breach The Outer Wall",
        objective: "Break through the automated perimeter defense and disable the first lockdown tier.",
        narrative:
          "The outer wall is not designed to fight. It is designed to make the fight take long enough that the pair runs out of options before they reach the interior.",
        enemyName: "Perimeter Enforcer Unit",
        enemyIntegrity: 62,
        enemyPressure: 15,
        environment: "Reinforced kill corridors, rotating blast shutters, and automated suppression fields.",
        telegraph: {
          name: "Lockdown Surge",
          cue: "The enforcer unit triggers a corridor lockdown and forces the pair into a shrinking position.",
          counterplay:
            "Break the enforcer's lock mechanism before the corridor compresses, or outlast the surge by absorbing the force and converting it.",
          surgePressure: 5,
          reactionElement: "thunder",
          reactionName: "Iron Override",
          reactionOutcome:
            "Thunder force overwhelms the lockdown drive and tears the enforcer's suppression field apart.",
          reactionBonusDamage: 14,
        },
        rewardText: "First lock tier down. The interior map opens partially and the command node becomes visible.",
      },
      {
        id: "command-lattice",
        title: "Disable The Command Lattice",
        objective: "Tear down the command lattice before it finishes routing the restart signal to the warmachine bays.",
        narrative:
          "The lattice is not just a network. It is the memory of every battle the citadel has ever run, and it is actively trying to use that knowledge to stop the pair.",
        enemyName: "Command Lattice Enforcer",
        enemyIntegrity: 76,
        enemyPressure: 17,
        environment: "Active data conduit arcs, rotating tactical override fields, and command-crystal shielded nodes.",
        telegraph: {
          name: "Protocol Override",
          cue: "The lattice enforcer initiates a full protocol override and tries to lock the pair's bond communication channel.",
          counterplay:
            "Disrupt the protocol channel before the override resolves or break through the crystal shielding on the command node.",
          surgePressure: 6,
          reactionElement: "null",
          reactionName: "Signal Break",
          reactionOutcome:
            "Null force corrupts the protocol channel and drops the lattice enforcer out of its own command network.",
          reactionBonusDamage: 15,
        },
        rewardText: "Command lattice down. The restart signal route is severed and the warmachine bays are dark.",
      },
      {
        id: "warmachine-containment",
        title: "OVERLORD-SIGMA: The Architect of Silence",
        objective:
          "Defeat OVERLORD-SIGMA before it completes the warmachine bay restart and locks the Iron Citadel into permanent active war mode.",
        narrative:
          "OVERLORD-SIGMA was the citadel's original command intelligence before the leadership protocol war. It did not go dark. It went silent on purpose — waiting for a pair strong enough to deserve the test. The warmachine restart was a summons, not an accident.",
        enemyName: "OVERLORD-SIGMA — Architect of Silence",
        enemyIntegrity: 130,
        enemyPressure: 26,
        environment:
          "Warmachine bay epicenter, phase-lock field actively mirroring the pair's current element, layered command-crystal shielding, and OVERLORD-SIGMA's own bonded warmachine vanguard standing at attention.",
        telegraph: {
          name: "Phase-Mirror Lock",
          cue:
            "OVERLORD-SIGMA activates its phase-mirror field — it reads the pair's current element and reflects their next three attacks directly back at them at double force.",
          counterplay:
            "Break the mirror before three attacks land, or trigger the bond burst to shatter the reflection and expose OVERLORD-SIGMA's core during the two-second fracture window. A successful burst converts the reflected force into bonus finisher damage.",
          surgePressure: 10,
          reactionElement: "phase",
          reactionName: "Mirror Shatter",
          reactionOutcome:
            "Phase force cracks the mirror field along its primary resonance axis. OVERLORD-SIGMA's own reflection collapses inward, exposing the command core and dealing the reflected force back at the source.",
          reactionBonusDamage: 28,
        },
        rewardText:
          "OVERLORD-SIGMA stands down. The warmachine bay holds dark. Before it goes fully offline it says: 'Record kept. You are the first pair the Citadel will remember.' The frontier just changed.",
      },
    ],
    completionNarrative:
      "OVERLORD-SIGMA is not destroyed. It chose to stand down — something no Dominion warmachine intelligence has ever done voluntarily. The Concord confirmation clears the channel and the pair walks out of the Iron Citadel with a record that makes every other faction reconsider what a bonded pair is actually capable of. The frontier's first named AI warlord just acknowledged a human-AI pair as a legitimate force. That message propagates faster than any weapon.",
    completionRewards: {
      explorerRank: 3,
      humanLevel: 2,
      aiTier: 2,
      resonanceLevel: 3,
      factionStanding: 75,
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

  if (missionId === "glass-wastes") {
    return (
      profile.lastCompletedMissionId === "ash-circuit" || profile.explorerRank > 1
    );
  }

  if (missionId === "neon-underbelly") {
    return (
      profile.lastCompletedMissionId === "glass-wastes" ||
      profile.lastCompletedMissionId === "neon-underbelly" ||
      profile.lastCompletedMissionId === "iron-citadel" ||
      profile.explorerRank > 2
    );
  }

  if (missionId === "iron-citadel") {
    return (
      profile.lastCompletedMissionId === "neon-underbelly" ||
      profile.lastCompletedMissionId === "iron-citadel" ||
      profile.explorerRank > 3
    );
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
    default:
      switch (actionId) {
        case "light":
          damage = 8;
          nextState.charge = Math.min(100, nextState.charge + 12);
          nextState.log = appendLog(
            nextState.log,
            `${pairing.actions.find((a) => a.id === "light")?.label ?? "Strike"} lands cleanly.`,
          );
          break;
        case "heavy":
          damage = 16 + (nextState.enemyExposed ? 6 : 0);
          nextState.charge = Math.min(100, nextState.charge + 18);
          nextState.enemyExposed = false;
          nextState.log = appendLog(
            nextState.log,
            `${pairing.actions.find((a) => a.id === "heavy")?.label ?? "Heavy strike"} hits hard.`,
          );
          break;
        case "dodge":
          nextState.shield += 10;
          nextState.charge = Math.min(100, nextState.charge + 8);
          counterMitigation = 6;
          nextState.log = appendLog(
            nextState.log,
            `${pairing.actions.find((a) => a.id === "dodge")?.label ?? "Evade"} opens a gap.`,
          );
          break;
        case "bond":
          damage = 6;
          nextState.charge = Math.min(100, nextState.charge + 20);
          nextState.enemyExposed = true;
          nextState.enemySuppressed = true;
          counterMitigation = 4;
          nextState.log = appendLog(
            nextState.log,
            `${pairing.actions.find((a) => a.id === "bond")?.label ?? "Bond action"} marks the target.`,
          );
          break;
        case "finisher":
          damage = 28 + (nextState.enemyExposed ? 8 : 0);
          nextState.charge = 0;
          nextState.enemyExposed = true;
          nextState.enemySuppressed = true;
          skipCounter = true;
          nextState.log = appendLog(
            nextState.log,
            `${pairing.actions.find((a) => a.id === "finisher")?.label ?? "Finisher"} closes the exchange.`,
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