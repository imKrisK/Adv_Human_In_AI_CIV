"use client";

import {
  type CombatState,
  getMissionFlow,
  getStarterPairing,
  type CombatActionId,
  type ElementId,
  type PairingId,
} from "@/lib/playable-slice";
import { type LiveEventWindowId } from "@/lib/prototype-data";

type MissionEncounterConsoleProps = {
  missionId: string;
  pairingId: PairingId;
  eventWindowId: LiveEventWindowId | null;
  stageIndex: number;
  combatState: CombatState;
  busyAction: string | null;
  rewardsCommitted: boolean;
  onCombatAction: (actionId: CombatActionId) => Promise<void>;
  onRetryStage: () => Promise<void>;
  onAdvanceObjective: () => Promise<void>;
  onMissionComplete: () => Promise<boolean>;
  savingRewards: boolean;
};

function formatElementLabel(element: ElementId) {
  return element.charAt(0).toUpperCase() + element.slice(1);
}

export default function MissionEncounterConsole({
  missionId,
  pairingId,
  eventWindowId,
  stageIndex,
  combatState,
  busyAction,
  rewardsCommitted,
  onCombatAction,
  onRetryStage,
  onAdvanceObjective,
  onMissionComplete,
  savingRewards,
}: MissionEncounterConsoleProps) {
  const mission = getMissionFlow(missionId, eventWindowId);
  const pairing = getStarterPairing(pairingId);

  if (!mission) {
    return null;
  }

  const activeMission = mission;
  const currentStage = activeMission.stages[stageIndex];
  const reactionReady =
    !combatState.reactionTriggered &&
    pairing.element === currentStage.telegraph.reactionElement &&
    (combatState.telegraphActive || combatState.enemyExposed);
  const telegraphStatus = combatState.telegraphActive
    ? "Telegraph live"
    : combatState.reactionTriggered
      ? `${currentStage.telegraph.reactionName} fired`
      : "Telegraph resolved";

  async function advanceObjective() {
    if (stageIndex === activeMission.stages.length - 1) {
      await onMissionComplete();
      return;
    }

    await onAdvanceObjective();
  }

  return (
    <section className="space-y-6">
      <article className="glass-panel rounded-[2rem] p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">Live encounter lane</p>
            <h2 className="mt-4 text-3xl font-semibold">{currentStage.title}</h2>
            <p className="muted-copy mt-4 max-w-3xl text-sm leading-7">
              {currentStage.narrative}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="data-chip">
              Objective: {stageIndex + 1}/{activeMission.stages.length}
            </span>
            <span className="data-chip">Enemy: {currentStage.enemyName}</span>
            <span className="data-chip">Pressure: {currentStage.enemyPressure}</span>
            <span className="data-chip">Active pair: {pairing.name}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4 rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Operator integrity
                </p>
                <div className="mt-3 h-3 rounded-full bg-[color:var(--line)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--accent-teal)]"
                    style={{ width: `${combatState.playerIntegrity}%` }}
                  />
                </div>
                <p className="mt-2 text-sm">{combatState.playerIntegrity}/100</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Threat integrity
                </p>
                <div className="mt-3 h-3 rounded-full bg-[color:var(--line)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--accent-ember)]"
                    style={{
                      width: `${(combatState.enemyIntegrity / currentStage.enemyIntegrity) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-sm">
                  {combatState.enemyIntegrity}/{currentStage.enemyIntegrity}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Shield
                </p>
                <p className="mt-2 text-2xl font-semibold">{combatState.shield}</p>
              </div>
              <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Resonance
                </p>
                <p className="mt-2 text-2xl font-semibold">{combatState.charge}</p>
              </div>
              <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Momentum
                </p>
                <p className="mt-2 text-2xl font-semibold">{combatState.momentum}</p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Enemy telegraph
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{currentStage.telegraph.name}</h3>
                </div>
                <span className="data-chip">{telegraphStatus}</span>
              </div>
              <p className="muted-copy mt-4 text-sm leading-7">
                {currentStage.telegraph.cue}
              </p>
              <p className="mt-3 text-sm leading-7">
                <span className="font-semibold">Counterplay:</span> {currentStage.telegraph.counterplay}
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--accent-teal)]">
                <span className="font-semibold">Elemental reaction:</span>{" "}
                {formatElementLabel(currentStage.telegraph.reactionElement)} / {currentStage.telegraph.reactionName}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {combatState.enemyExposed ? (
                <span className="data-chip">Enemy exposed</span>
              ) : null}
              {combatState.enemySuppressed ? (
                <span className="data-chip">Enemy suppressed</span>
              ) : null}
              {combatState.telegraphActive ? (
                <span className="data-chip">Telegraph live</span>
              ) : null}
              {reactionReady ? (
                <span className="data-chip">{currentStage.telegraph.reactionName} ready</span>
              ) : null}
              {combatState.lastReaction ? (
                <span className="data-chip">Reaction: {combatState.lastReaction}</span>
              ) : null}
              {combatState.charge >= 60 ? (
                <span className="data-chip">Finisher ready</span>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Bond action rail
                </p>
                <p className="mt-2 text-sm leading-7">{pairing.combatIdentity}</p>
              </div>
              <span className="data-chip">{pairing.finisherName}</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {pairing.actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => void onCombatAction(action.id)}
                  disabled={
                    combatState.stageComplete ||
                    combatState.playerDown ||
                    busyAction !== null ||
                    rewardsCommitted ||
                    (action.id === "finisher" && combatState.charge < 60)
                  }
                  className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-4 text-left transition hover:border-[color:var(--accent-teal)] hover:bg-[color:var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <p className="font-semibold">{action.label}</p>
                  <p className="muted-copy mt-2 text-xs leading-6">{action.summary}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Field log
              </p>
              <p className="mt-2 text-sm leading-7">Pressure target: {currentStage.objective}</p>
            </div>
            <span className="data-chip">Environment: {currentStage.environment}</span>
          </div>
          <div className="mt-5 space-y-3">
            {combatState.log.map((entry, index) => (
              <p
                key={`${entry}-${index}`}
                className="rounded-[1rem] border border-[color:var(--line)] bg-white/75 px-4 py-3 text-sm leading-7"
              >
                {entry}
              </p>
            ))}
          </div>
        </div>

        {combatState.playerDown ? (
          <div className="mt-6 rounded-[1.5rem] border border-[color:var(--accent-ember)] bg-[rgba(217,108,61,0.08)] p-6">
            <h3 className="text-xl font-semibold">Pair destabilized</h3>
            <p className="mt-3 text-sm leading-7">
              The lane overran the pair before the bond could recover tempo.
              Retry the stage to restore formation and keep the deployment alive.
            </p>
            <button
              type="button"
              onClick={() => void onRetryStage()}
              disabled={busyAction !== null}
              className="mt-4 rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
            >
              Retry stage
            </button>
          </div>
        ) : null}

        {combatState.stageComplete ? (
          <div className="mt-6 rounded-[1.5rem] border border-[color:var(--accent-teal)] bg-[rgba(13,122,122,0.08)] p-6">
            <h3 className="text-xl font-semibold">
              {stageIndex === activeMission.stages.length - 1
                ? "Deployment secured"
                : "Lane secured"}
            </h3>
            <p className="mt-3 text-sm leading-7">
              {stageIndex === activeMission.stages.length - 1
                ? activeMission.completionNarrative
                : currentStage.rewardText}
            </p>
            <button
              type="button"
              onClick={() => void advanceObjective()}
              disabled={busyAction !== null || savingRewards || rewardsCommitted}
              className="mt-4 rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {stageIndex === activeMission.stages.length - 1
                ? rewardsCommitted
                  ? "Rewards committed"
                  : "Commit rewards and close mission"
                : "Advance objective"}
            </button>
          </div>
        ) : null}
      </article>
    </section>
  );
}