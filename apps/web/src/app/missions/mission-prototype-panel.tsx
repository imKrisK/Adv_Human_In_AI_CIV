"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import MissionEncounterConsole from "@/app/missions/mission-encounter-console";
import {
  sessionServiceRoutes,
  type SessionServiceMissionEnvelope,
} from "@/lib/session-service-contract";
import {
  type CombatActionId,
  getMissionFlow,
  getPairingForProfile,
  getStarterPairing,
  isMissionUnlocked,
  starterPairings,
} from "@/lib/playable-slice";
import { type MissionSessionState } from "@/lib/prototype-data";
import { useAuthenticatedProfile } from "@/lib/use-authenticated-profile";

type MissionPrototypePanelProps = {
  missionId: string;
};

async function readMissionSessionEnvelope(response: Response) {
  const data = (await response.json()) as Partial<SessionServiceMissionEnvelope>;

  return {
    missionSession: data.missionSession ?? null,
    message: typeof data.message === "string" ? data.message : undefined,
  } satisfies SessionServiceMissionEnvelope;
}

function formatRoleLabel(value: MissionSessionState["members"][number]["role"]) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMissionMemberStatus(
  value: MissionSessionState["members"][number]["status"],
) {
  if (value === "rewards-committed") {
    return "Rewards committed";
  }

  if (value === "abandoned") {
    return "Mission abandoned";
  }

  return "Live in route";
}

function formatRewardValue(value: number) {
  return `+${value}`;
}

export default function MissionPrototypePanel({
  missionId,
}: MissionPrototypePanelProps) {
  const router = useRouter();
  const {
    status,
    authenticated,
    email,
    profile,
    error,
    busyAction,
    saveProfile,
    refreshSession,
  } = useAuthenticatedProfile();
  const [missionSession, setMissionSession] = useState<MissionSessionState | null>(
    null,
  );
  const [missionSessionStatus, setMissionSessionStatus] = useState<
    "idle" | "loading" | "ready"
  >("idle");
  const [missionSessionError, setMissionSessionError] = useState<string | null>(
    null,
  );
  const [missionSessionMessage, setMissionSessionMessage] = useState<string | null>(
    null,
  );
  const [missionSessionBusyAction, setMissionSessionBusyAction] = useState<
    string | null
  >(null);
  const previewMission = getMissionFlow(missionId);
  const unlocked = isMissionUnlocked(missionId, profile);
  const hasActiveMissionSession = Boolean(profile.activeMissionSessionId);

  const loadMissionSession = useCallback(
    async (preserveMessage = false) => {
      if (!authenticated || !profile.activeMissionSessionId) {
        return;
      }

      setMissionSessionStatus("loading");
      setMissionSessionError(null);

      try {
        const response = await fetch(sessionServiceRoutes.currentMission, {
          cache: "no-store",
        });
        const payload = await readMissionSessionEnvelope(response);

        setMissionSession(payload.missionSession);

        if (response.ok && payload.missionSession === null) {
          setMissionSessionMessage(
            payload.message ?? "Mission session is no longer active.",
          );
          await refreshSession(false);
          return;
        }

        if (!response.ok) {
          setMissionSessionError(
            payload.message ?? "Unable to sync the live mission session right now.",
          );
          if (!preserveMessage) {
            setMissionSessionMessage(null);
          }
          return;
        }

        if (!preserveMessage || payload.message) {
          setMissionSessionMessage(payload.message ?? null);
        }
      } catch {
        setMissionSessionError("Unable to sync the live mission session right now.");
      } finally {
        setMissionSessionStatus("ready");
      }
    },
    [authenticated, profile.activeMissionSessionId, refreshSession],
  );

  useEffect(() => {
    if (!authenticated || !profile.activeMissionSessionId) {
      return;
    }

    queueMicrotask(() => {
      void loadMissionSession();
    });
  }, [authenticated, loadMissionSession, profile.activeMissionSessionId]);

  if (!previewMission) {
    return null;
  }

  const routeMissionSession =
    missionSession?.missionId === missionId ? missionSession : null;
  const mission = routeMissionSession
    ? getMissionFlow(missionId, routeMissionSession.eventWindowId) ?? previewMission
    : previewMission;
  const currentMissionMember =
    routeMissionSession?.members.find((member) => member.email === email) ?? null;
  const activePairing = currentMissionMember
    ? getPairingForProfile({
        selectedLoadoutId: currentMissionMember.selectedLoadoutId,
        selectedCompanionId: currentMissionMember.selectedCompanionId,
      })
    : getPairingForProfile(profile);
  const routeLockedToAnotherMission = Boolean(
    hasActiveMissionSession && missionSession && missionSession.missionId !== missionId,
  );
  const missionSessionPending = Boolean(
    authenticated &&
      hasActiveMissionSession &&
      missionSessionStatus !== "ready" &&
      missionSession === null,
  );
  const currentMemberRewardsCommitted =
    currentMissionMember?.status === "rewards-committed";
  const currentMemberEventContribution =
    currentMissionMember?.eventContribution ?? null;
  const currentMemberRewardBand =
    currentMemberEventContribution?.rewardBand ?? null;
  const displayedRewards =
    currentMissionMember?.committedRewards ??
    currentMemberEventContribution?.projectedRewards ??
    mission.completionRewards;
  const canRecoverMissionSession = Boolean(
    routeMissionSession &&
      currentMissionMember &&
      !currentMemberRewardsCommitted &&
      (!routeMissionSession.squadSessionId || currentMissionMember.role === "host"),
  );

  async function runMissionSessionAction(
    body: Record<string, unknown>,
    options?: {
      preserveMessage?: boolean;
      refreshProfile?: boolean;
      clearSessionOnSuccess?: boolean;
    },
  ) {
    setMissionSessionBusyAction(String(body.action));
    setMissionSessionError(null);

    if (!options?.preserveMessage) {
      setMissionSessionMessage(null);
    }

    try {
      const route =
        body.action === "combat-action"
          ? sessionServiceRoutes.combatAction
          : body.action === "advance-stage"
            ? sessionServiceRoutes.advanceStage
            : body.action === "retry-stage"
              ? sessionServiceRoutes.retryStage
          : body.action === "abandon"
            ? sessionServiceRoutes.abandonMission
            : "/api/mission-session";

      const response = await fetch(route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = await readMissionSessionEnvelope(response);

      setMissionSession(payload.missionSession);

      if (!response.ok) {
        setMissionSessionError(
          payload.message ?? "Unable to update the shared mission session right now.",
        );
        return false;
      }

      if (payload.message) {
        setMissionSessionMessage(payload.message);
      }

      if (options?.refreshProfile || payload.missionSession === null) {
        await refreshSession(false);
      }

      if (options?.clearSessionOnSuccess) {
        setMissionSession(null);
      }

      return true;
    } catch {
      setMissionSessionError(
        "Unable to update the shared mission session right now.",
      );
      return false;
    } finally {
      setMissionSessionBusyAction(null);
    }
  }

  async function activatePairing(pairingId: (typeof starterPairings)[number]["id"]) {
    if (routeMissionSession) {
      return;
    }

    const pairing = getStarterPairing(pairingId);

    await saveProfile({
      selectedLoadoutId: pairing.loadoutId,
      selectedCompanionId: pairing.companionId,
      selectedMissionId: missionId,
      phase:
        profile.phase === "arrival" || profile.phase === "bonding"
          ? "briefing"
          : profile.phase,
    });
  }

  async function handleMissionComplete() {
    if (!routeMissionSession) {
      setMissionSessionError(
        "Deploy this route from the command deck before committing mission rewards.",
      );
      return false;
    }

    return runMissionSessionAction(
      { action: "commit-member" },
      { preserveMessage: false },
    );
  }

  async function handleCombatAction(actionId: CombatActionId) {
    await runMissionSessionAction({
      action: "combat-action",
      actionId,
    });
  }

  async function handleRetryStage() {
    await runMissionSessionAction({ action: "retry-stage" });
  }

  async function handleAdvanceObjective() {
    await runMissionSessionAction({ action: "advance-stage" });
  }

  async function handleMissionRecovery() {
    const abandoned = await runMissionSessionAction(
      { action: "abandon" },
      { refreshProfile: true, clearSessionOnSuccess: true },
    );

    if (abandoned) {
      router.push("/command-deck");
    }
  }

  if (status === "loading" || missionSessionPending) {
    return (
      <section className="glass-panel rounded-[2rem] p-8 md:p-10">
        <p className="section-kicker">Pressure mission console</p>
        <h1 className="section-title mt-4 font-semibold tracking-tight">
          Syncing deployment clearance...
        </h1>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section className="glass-panel rounded-[2rem] p-8 md:p-10">
        <p className="section-kicker">Mission authorization</p>
        <h1 className="section-title mt-4 font-semibold tracking-tight">
          Command deck clearance is required before deploying to {mission.name}.
        </h1>
        <p className="muted-copy mt-6 max-w-3xl text-lg leading-8">
          These routes read from an authenticated bonded operator profile. Open
          the command deck, confirm the pair, then return here to deploy.
        </p>
        <Link
          href="/command-deck"
          className="mt-8 inline-flex rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
        >
          Open command deck
        </Link>
      </section>
    );
  }

  if (routeLockedToAnotherMission && missionSession) {
    return (
      <section className="glass-panel rounded-[2rem] p-8 md:p-10">
        <p className="section-kicker">Mission redirect</p>
        <h1 className="section-title mt-4 font-semibold tracking-tight">
          Another route is already live for this operator.
        </h1>
        <p className="muted-copy mt-6 max-w-3xl text-lg leading-8">
          The active mission session is attached to {missionSession.missionId}.
          Rejoin that route before opening a different pressure lane.
        </p>
        <Link
          href={`/missions/${missionSession.missionId}`}
          className="mt-8 inline-flex rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
        >
          Rejoin active mission
        </Link>
      </section>
    );
  }

  if (!unlocked && !routeMissionSession) {
    return (
      <section className="glass-panel rounded-[2rem] p-8 md:p-10">
        <p className="section-kicker">Mission lockout</p>
        <h1 className="section-title mt-4 font-semibold tracking-tight">
          {mission.name} stays sealed until Ash Circuit proves the pair.
        </h1>
        <p className="muted-copy mt-6 max-w-3xl text-lg leading-8">
          Clear Ash Circuit first so the Concord can authorize live-event
          deployment beyond the city lattice.
        </p>
        <Link
          href="/missions/ash-circuit"
          className="mt-8 inline-flex rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
        >
          Deploy to Ash Circuit
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-10">
      <section className="glass-panel rounded-[2rem] p-8 md:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">Pressure mission deployment</p>
            <h1 className="section-title mt-4 font-semibold tracking-tight">
              {mission.name}
            </h1>
            <p className="muted-copy mt-6 max-w-4xl text-lg leading-8">
              {mission.overview}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="data-chip">Operator: {email}</span>
            <span className="data-chip">Selected mission: {profile.selectedMissionId}</span>
            <span className="data-chip">Phase: {profile.phase}</span>
            {mission.eventWindowLabel ? (
              <span className="data-chip" data-testid="mission-event-window">
                Window: {mission.eventWindowLabel}
              </span>
            ) : null}
            {routeMissionSession ? (
              <span className="data-chip">Session: {routeMissionSession.id}</span>
            ) : null}
          </div>
        </div>
      </section>

      {mission.modifiers?.length ? (
        <section
          className="glass-panel rounded-[2rem] p-8"
          data-testid="mission-event-modifiers"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="section-kicker">Event-state pressure</p>
              <h2 className="mt-4 text-3xl font-semibold">
                {mission.eventWindowLabel ?? "Dynamic window"} emphasis
              </h2>
            </div>
            <span className="data-chip">{mission.name}</span>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {mission.modifiers.map((modifier) => (
              <div
                key={modifier.label}
                className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5"
              >
                <p className="font-semibold">{modifier.label}</p>
                <p className="muted-copy mt-3 text-sm leading-7">{modifier.effect}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {routeMissionSession ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="glass-panel rounded-[2rem] p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="section-kicker">Shared mission session</p>
                <h2 className="mt-4 text-3xl font-semibold">
                  {routeMissionSession.status === "completed"
                    ? "Mission session closed"
                    : routeMissionSession.status === "abandoned"
                      ? "Mission session recovered"
                      : "Mission session live"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => void loadMissionSession(true)}
                disabled={missionSessionBusyAction !== null}
                className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
              >
                Reconnect mission state
              </button>
            </div>
            <p className="muted-copy mt-4 text-sm leading-7">
              This route now runs against a shared mission-session record. Pair
              snapshots, stage progression, and reward writeback all resolve
              through the same live deployment contract.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="data-chip">Status: {routeMissionSession.status}</span>
              <span className="data-chip">
                Objective: {routeMissionSession.stageIndex + 1}/{mission.stages.length}
              </span>
              <span className="data-chip">
                Launched: {new Date(routeMissionSession.launchedAt).toLocaleString()}
              </span>
              <span className="data-chip">
                Roster: {routeMissionSession.members.length} operator
                {routeMissionSession.members.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium">
              {canRecoverMissionSession ? (
                <button
                  type="button"
                  onClick={() => void handleMissionRecovery()}
                  disabled={missionSessionBusyAction !== null}
                  data-testid="abandon-mission-session"
                  className="rounded-full border border-[color:var(--accent-ember)] bg-white/70 px-5 py-3 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {routeMissionSession.squadSessionId
                    ? "Abandon mission session"
                    : "Abort run and recover"}
                </button>
              ) : routeMissionSession.squadSessionId ? (
                <span className="muted-copy text-sm leading-7">
                  Only the squad host can recover a stuck shared deployment.
                </span>
              ) : null}
            </div>
            {missionSessionError ? (
              <p className="mt-4 rounded-[1rem] border border-[color:var(--accent-ember)] bg-[rgba(217,108,61,0.08)] px-4 py-3 text-sm leading-7 text-[color:var(--foreground)]">
                {missionSessionError}
              </p>
            ) : null}
            {missionSessionMessage ? (
              <p className="mt-4 rounded-[1rem] border border-[color:var(--accent-teal)] bg-[rgba(13,122,122,0.08)] px-4 py-3 text-sm leading-7 text-[color:var(--foreground)]">
                {missionSessionMessage}
              </p>
            ) : null}
          </article>

          <article
            className="glass-panel rounded-[2rem] p-8"
            data-testid="mission-session-roster"
          >
            <p className="section-kicker">Squad runtime</p>
            <h2 className="mt-4 text-3xl font-semibold">Roster state in route</h2>
            <div className="mt-6 grid gap-4">
              {routeMissionSession.members.map((member) => {
                const pairing = getPairingForProfile({
                  selectedLoadoutId: member.selectedLoadoutId,
                  selectedCompanionId: member.selectedCompanionId,
                });

                return (
                  <div
                    key={member.userId}
                    className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold">{member.email}</p>
                        <p className="muted-copy mt-2 text-sm leading-7">{pairing.name}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="data-chip">{formatRoleLabel(member.role)}</span>
                        <span className="data-chip">
                          {formatMissionMemberStatus(member.status)}
                        </span>
                        {member.eventContribution ? (
                          <span className="data-chip">
                            Band: {member.eventContribution.rewardBand.label}
                          </span>
                        ) : null}
                        {member.eventContribution ? (
                          <span className="data-chip">
                            Score: {member.eventContribution.totalScore}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      ) : (
        <section className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Deployment gate</p>
          <h2 className="mt-4 text-3xl font-semibold">
            This route is in preview until a live mission session is launched.
          </h2>
          <p className="muted-copy mt-4 text-sm leading-7">
            Return to the command deck and launch the mission there. The route
            runtime only commits rewards when a shared mission-session record is
            active for this operator.
          </p>
          {missionSessionMessage ? (
            <p className="mt-4 rounded-[1rem] border border-[color:var(--accent-teal)] bg-[rgba(13,122,122,0.08)] px-4 py-3 text-sm leading-7 text-[color:var(--foreground)]">
              {missionSessionMessage}
            </p>
          ) : null}
          {missionSessionError ? (
            <p className="mt-4 rounded-[1rem] border border-[color:var(--accent-ember)] bg-[rgba(217,108,61,0.08)] px-4 py-3 text-sm leading-7 text-[color:var(--foreground)]">
              {missionSessionError}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
            <Link
              href="/command-deck"
              className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
            >
              Deploy from command deck
            </Link>
            <span className="data-chip">Preview only</span>
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Pressure brief</p>
          <div className="mt-5 space-y-4 text-sm leading-7">
            <p>
              <span className="font-semibold">Launch:</span> {mission.launchText}
            </p>
            <p>
              <span className="font-semibold">Failure risk:</span> {mission.failureRisk}
            </p>
          </div>
          <div className="mt-6 space-y-3">
            {mission.narrativeArc.map((beat) => (
              <div
                key={beat}
                className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4 text-sm leading-7"
              >
                {beat}
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-[2rem] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Bond retune</p>
              <h2 className="mt-4 text-3xl font-semibold">Retune the pair before the drop</h2>
            </div>
            <span className="data-chip">Active: {activePairing.name}</span>
          </div>
          {routeMissionSession ? (
            <p className="muted-copy mt-4 text-sm leading-7">
              The launched pair snapshot is locked into the live mission session.
              Return to the command deck after extraction to retune it.
            </p>
          ) : null}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {starterPairings.map((pairing) => {
              const active = pairing.id === activePairing.id;

              return (
                <button
                  key={pairing.id}
                  type="button"
                  onClick={() => void activatePairing(pairing.id)}
                  disabled={busyAction === "save-profile" || routeMissionSession !== null}
                  className={`rounded-[1.5rem] border p-5 text-left transition ${
                    active
                      ? "border-[color:var(--accent-teal)] bg-white shadow-[0_18px_40px_rgba(21,37,52,0.12)]"
                      : "border-[color:var(--line)] bg-white/70 hover:border-[color:var(--accent-teal)] hover:bg-white"
                  } disabled:cursor-not-allowed disabled:opacity-55`}
                >
                  <p className="font-semibold">{pairing.name}</p>
                  <p className="muted-copy mt-3 text-sm leading-7">{pairing.subtitle}</p>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--accent-teal)]">
                    {pairing.missionUse}
                  </p>
                </button>
              );
            })}
          </div>
        </article>
      </section>

      {routeMissionSession && currentMissionMember ? (
        <MissionEncounterConsole
          key={`${routeMissionSession.id}:${activePairing.id}`}
          missionId={missionId}
          pairingId={activePairing.id}
          eventWindowId={routeMissionSession.eventWindowId}
          stageIndex={routeMissionSession.stageIndex}
          combatState={routeMissionSession.combatState}
          busyAction={missionSessionBusyAction}
          rewardsCommitted={currentMemberRewardsCommitted}
          onCombatAction={handleCombatAction}
          onRetryStage={handleRetryStage}
          onAdvanceObjective={handleAdvanceObjective}
          onMissionComplete={handleMissionComplete}
          savingRewards={missionSessionBusyAction === "commit-member"}
        />
      ) : null}

      {currentMemberEventContribution ? (
        <section
          className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"
          data-testid="mission-event-contribution"
        >
          <article className="glass-panel rounded-[2rem] p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="section-kicker">Event contribution</p>
                <h2 className="mt-4 text-3xl font-semibold">
                  Concord response credit
                </h2>
                <p className="muted-copy mt-4 text-sm leading-7">
                  {currentMemberRewardBand?.summary}
                </p>
              </div>
              {currentMemberRewardBand ? (
                <span className="data-chip" data-testid="mission-event-reward-band">
                  {currentMemberRewardBand.label}
                </span>
              ) : null}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="data-chip">
                Window: {mission.eventWindowLabel ?? "Locked"}
              </span>
              <span className="data-chip">
                Score: {currentMemberEventContribution.totalScore}
              </span>
              {currentMemberRewardBand ? (
                <span className="data-chip">
                  Standing bonus: {formatRewardValue(
                    currentMemberRewardBand.bonusRewards.factionStanding,
                  )}
                </span>
              ) : null}
            </div>
          </article>

          <article className="glass-panel rounded-[2rem] p-8">
            <p className="section-kicker">Bucket breakdown</p>
            <h2 className="mt-4 text-3xl font-semibold">How this run is scoring</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {currentMemberEventContribution.buckets.map((bucket) => (
                <div
                  key={bucket.id}
                  className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5"
                >
                  <p className="font-semibold">{bucket.label}</p>
                  <p className="mt-3 text-3xl font-semibold">{bucket.points}</p>
                  <p className="muted-copy mt-3 text-sm leading-7">{bucket.summary}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">
            {currentMemberRewardsCommitted
              ? "Committed rewards"
              : currentMemberEventContribution
                ? "Projected rewards"
                : "Mission rewards"}
          </p>
          {currentMemberRewardBand ? (
            <p className="muted-copy mt-4 text-sm leading-7">
              The locked {mission.eventWindowLabel ?? "event"} window routes this
              payout through the {currentMemberRewardBand.label} band.
            </p>
          ) : null}
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Explorer</p>
              <p className="mt-2 text-2xl font-semibold">{formatRewardValue(displayedRewards.explorerRank)}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Human</p>
              <p className="mt-2 text-2xl font-semibold">{formatRewardValue(displayedRewards.humanLevel)}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">AI tier</p>
              <p className="mt-2 text-2xl font-semibold">{formatRewardValue(displayedRewards.aiTier)}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Resonance</p>
              <p className="mt-2 text-2xl font-semibold">{formatRewardValue(displayedRewards.resonanceLevel)}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Standing</p>
              <p className="mt-2 text-2xl font-semibold">{formatRewardValue(displayedRewards.factionStanding)}</p>
            </div>
          </div>
        </article>

        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Profile mirror</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Explorer</p>
              <p className="mt-2 text-2xl font-semibold">{profile.explorerRank}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Human</p>
              <p className="mt-2 text-2xl font-semibold">{profile.humanLevel}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">AI tier</p>
              <p className="mt-2 text-2xl font-semibold">{profile.aiTier}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Standing</p>
              <p className="mt-2 text-2xl font-semibold">{profile.factionStanding}</p>
            </div>
          </div>
          {error ? (
            <p className="mt-4 rounded-[1rem] border border-[color:var(--accent-ember)] bg-[rgba(217,108,61,0.08)] px-4 py-3 text-sm leading-7 text-[color:var(--foreground)]">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
            <Link
              href="/command-deck"
              className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
            >
              Return to command deck
            </Link>
            {mission.nextMissionId && !hasActiveMissionSession ? (
              <Link
                href={`/missions/${mission.nextMissionId}`}
                className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
              >
                Queue next mission
              </Link>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}