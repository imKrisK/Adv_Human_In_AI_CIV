"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import {
  firstLiveEvent,
  type MissionSessionState,
  missionZones,
  phaseLabels,
  phaseOrder,
  profileSchema,
  resolveLiveEvent,
  type SquadSessionState,
  starterCompanions,
  starterLoadouts,
} from "@/lib/prototype-data";
import {
  getPairingForProfile,
  getMissionFlow,
  getStarterPairing,
  isMissionUnlocked,
  resolvePersistedEventResult,
  starterPairings,
} from "@/lib/playable-slice";
import {
  sessionServiceRoutes,
  type SessionServiceMissionEnvelope,
} from "@/lib/session-service-contract";
import { useAuthenticatedProfile } from "@/lib/use-authenticated-profile";

function formatAuthStrategyLabel(value: "local-credentials" | "hosted-identity") {
  return value === "hosted-identity" ? "Hosted identity" : "Local credentials";
}

type SquadEnvelope = {
  squad: SquadSessionState | null;
  message?: string;
};

type MissionSessionEnvelope = {
  missionSession: MissionSessionState | null;
  message?: string;
};

async function readSquadEnvelope(response: Response) {
  const data = (await response.json()) as Partial<SquadEnvelope>;

  return {
    squad: data.squad ?? null,
    message: typeof data.message === "string" ? data.message : undefined,
  } satisfies SquadEnvelope;
}

async function readMissionSessionEnvelope(response: Response) {
  const data = (await response.json()) as Partial<SessionServiceMissionEnvelope>;

  return {
    missionSession: data.missionSession ?? null,
    message: typeof data.message === "string" ? data.message : undefined,
  } satisfies MissionSessionEnvelope;
}

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : "No synced write yet";
}

function formatRoleLabel(value: "host" | "member") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatElementLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function CommandDeckPanel() {
  const router = useRouter();
  const {
    status,
    authenticated,
    email,
    profile,
    error,
    busyAction,
    authStrategy,
    authStrategyReason,
    authSignInUrl,
    authSignUpUrl,
    localCredentialsEnabled,
    demoModeAvailable,
    login,
    logout,
    register,
    demoLogin,
    saveProfile,
    refreshSession,
  } = useAuthenticatedProfile();
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [squad, setSquad] = useState<SquadSessionState | null>(null);
  const [squadCodeInput, setSquadCodeInput] = useState("");
  const [squadBusyAction, setSquadBusyAction] = useState<string | null>(null);
  const [squadError, setSquadError] = useState<string | null>(null);
  const [squadMessage, setSquadMessage] = useState<string | null>(null);
  const [missionBusyAction, setMissionBusyAction] = useState<string | null>(null);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [missionMessage, setMissionMessage] = useState<string | null>(null);

  const selectedLoadout =
    starterLoadouts.find((loadout) => loadout.id === profile.selectedLoadoutId) ??
    starterLoadouts[0];
  const selectedCompanion =
    starterCompanions.find(
      (companion) => companion.id === profile.selectedCompanionId,
    ) ?? starterCompanions[0];
  const selectedMission =
    missionZones.find((mission) => mission.id === profile.selectedMissionId) ??
    missionZones[0];
  const activeLiveEvent = resolveLiveEvent(firstLiveEvent);
  const liveEventMission =
    missionZones.find(
      (mission) => mission.id === activeLiveEvent.primaryMissionId,
    ) ?? missionZones[missionZones.length - 1];
  const nextLiveEventTransition = new Date(
    activeLiveEvent.windowEndsAt,
  ).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const lastCompletedMission =
    missionZones.find((mission) => mission.id === profile.lastCompletedMissionId) ??
    null;
  const lastEventResult = resolvePersistedEventResult(profile.lastEventResult);
  const activePairing = getPairingForProfile(profile);
  const selectedMissionFlow = getMissionFlow(selectedMission.id);
  const firstTelegraphStage = selectedMissionFlow?.stages[0] ?? null;
  const recommendedReactionPair = firstTelegraphStage
    ? starterPairings.find(
        (pairing) => pairing.element === firstTelegraphStage.telegraph.reactionElement,
      ) ?? null
    : null;
  const currentPhaseIndex = phaseOrder.indexOf(profile.phase);
  const activeSquad = authenticated ? squad : null;
  const missionSessionLive = Boolean(profile.activeMissionSessionId);
  const visibleSquadError = authenticated ? squadError : null;
  const visibleSquadMessage = authenticated ? squadMessage : null;
  const squadSelectionLocked = Boolean(
    missionSessionLive || (activeSquad && profile.squadLocked),
  );
  const currentSquadMember =
    activeSquad?.members.find((member) => member.email === email) ?? null;
  const squadMission =
    activeSquad
      ? missionZones.find((mission) => mission.id === activeSquad.selectedMissionId) ?? selectedMission
      : selectedMission;
  const recoverySummary =
    profile.phase === "recovery"
      ? lastCompletedMission?.id === "glass-wastes"
        ? `${activePairing.name} returns from Glass Wastes with the tower line intact, live-event credit on the record, and a wider frontier mandate waiting at the next gate.`
        : lastCompletedMission?.id === "ash-circuit"
          ? `${activePairing.name} comes back from Ash Circuit with the corridor stabilized, Concord trust restored, and clearance to push into Glass Wastes.`
          : "The pair is back inside Lattice Haven, carrying the latest field write into the next deployment window."
      : "The current recovery readout tracks the exact pair identity that the next deployment will carry back into the field.";
    const lastEventResultSummary = lastEventResult
      ? `${lastEventResult.mission?.name ?? firstLiveEvent.name} | ${lastEventResult.window.label} window | ${lastEventResult.rewardBand.label} | score ${lastEventResult.totalScore} | D ${lastEventResult.buckets[0].points} / S ${lastEventResult.buckets[1].points} / C ${lastEventResult.buckets[2].points}`
      : "No Concord Breach result recorded yet";

  const schemaValues = {
    phase: phaseLabels[profile.phase],
    selectedLoadoutId: `${selectedLoadout.name} (${selectedLoadout.weaponDiscipline})`,
    selectedCompanionId: `${selectedCompanion.name} ${selectedCompanion.callsign}`,
    selectedMissionId: selectedMission.name,
    activeMissionSessionId:
      profile.activeMissionSessionId ?? "No live mission session",
    squadSessionId: profile.squadSessionId ?? "No squad staged",
    squadCode: profile.squadCode ?? "No squad code",
    squadRole: profile.squadRole ? formatRoleLabel(profile.squadRole) : "Solo operator",
    squadLocked: profile.squadSessionId ? (profile.squadLocked ? "Locked" : "Unlocked") : "No squad staged",
    squadReady: profile.squadSessionId ? (profile.squadReady ? "Ready" : "Not ready") : "No squad staged",
    explorerRank: profile.explorerRank.toString(),
    humanLevel: profile.humanLevel.toString(),
    aiTier: profile.aiTier.toString(),
    resonanceLevel: profile.resonanceLevel.toString(),
    factionStanding: profile.factionStanding.toString(),
    lastCompletedMissionId: lastCompletedMission?.name ?? "No deployment cleared yet",
    lastEventResult: lastEventResultSummary,
    updatedAt: formatTimestamp(profile.updatedAt),
  };

  const loadSquadState = useCallback(
    async (preserveMessage = false) => {
      if (!authenticated) {
        return;
      }

      try {
        const response = await fetch("/api/squad", {
          cache: "no-store",
        });
        const payload = await readSquadEnvelope(response);
        let promotedToHostOnReconnect = false;

        setSquad((currentSquad) => {
          const previousRole =
            currentSquad?.members.find((member) => member.email === email)?.role ??
            profile.squadRole;
          const nextRole =
            payload.squad?.members.find((member) => member.email === email)?.role ??
            null;

          promotedToHostOnReconnect =
            previousRole === "member" && nextRole === "host";

          return payload.squad;
        });

        if (!response.ok) {
          setSquadError(payload.message ?? "Unable to load squad staging right now.");
          if (!preserveMessage) {
            setSquadMessage(null);
          }
          return;
        }

        setSquadError(null);

        if (!preserveMessage || payload.message) {
          setSquadMessage(
            payload.message ??
              (promotedToHostOnReconnect
                ? "Host handoff completed. You now own squad deployment."
                : null),
          );
        }

        if (payload.squad || payload.message) {
          await refreshSession(false);
        }
      } catch {
        setSquad(null);
        setSquadError("Unable to load squad staging right now.");
      }
    },
    [authenticated, email, profile.squadRole, refreshSession],
  );

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    queueMicrotask(() => {
      void loadSquadState();
    });
  }, [authenticated, loadSquadState, profile.squadSessionId]);

  async function runSquadAction(body: Record<string, unknown>) {
    setSquadBusyAction(String(body.action));
    setSquadError(null);
    setSquadMessage(null);

    try {
      const response = await fetch("/api/squad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = await readSquadEnvelope(response);

      setSquad(payload.squad);

      if (!response.ok) {
        setSquadError(payload.message ?? "Unable to update squad staging right now.");
        return false;
      }

      setSquadMessage(payload.message ?? null);
      await refreshSession(false);
      return true;
    } catch {
      setSquadError("Unable to update squad staging right now.");
      return false;
    } finally {
      setSquadBusyAction(null);
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (authMode === "register") {
      await register(credentials);
      return;
    }

    await login(credentials);
  }

  async function selectLoadout(loadoutId: string) {
    const savedProfile = await saveProfile({
      selectedLoadoutId: loadoutId,
      phase: profile.phase === "arrival" ? "bonding" : profile.phase,
    });

    if (savedProfile && profile.squadSessionId) {
      setSquadMessage("Pair retuned. Lock and ready state were cleared for the updated build.");
      await loadSquadState(true);
    }
  }

  async function selectCompanion(companionId: string) {
    const savedProfile = await saveProfile({
      selectedCompanionId: companionId,
      phase:
        profile.phase === "arrival" || profile.phase === "bonding"
          ? "briefing"
          : profile.phase,
    });

    if (savedProfile && profile.squadSessionId) {
      setSquadMessage("Pair retuned. Lock and ready state were cleared for the updated build.");
      await loadSquadState(true);
    }
  }

  async function activatePairing(pairingId: (typeof starterPairings)[number]["id"]) {
    const pairing = getStarterPairing(pairingId);

    const savedProfile = await saveProfile({
      selectedLoadoutId: pairing.loadoutId,
      selectedCompanionId: pairing.companionId,
      phase: "briefing",
    });

    if (savedProfile && profile.squadSessionId) {
      setSquadMessage("Pair retuned. Lock and ready state were cleared for the updated build.");
      await loadSquadState(true);
    }
  }

  async function stageSquadMission(missionId: string) {
    if (!activeSquad || profile.squadRole !== "host") {
      setSquadError("Only the squad host can retarget the staged mission.");
      return false;
    }

    return runSquadAction({
      action: "stage-mission",
      missionId,
    });
  }

  async function deployMission(missionId: string) {
    if (activeSquad) {
      if (profile.squadRole !== "host") {
        setSquadError("Only the squad host can launch the staged mission.");
        return;
      }

      if (activeSquad.selectedMissionId !== missionId) {
        setSquadError("Stage this route for the squad before deploying it.");
        return;
      }

      if (!activeSquad.canLaunch) {
        setSquadError("Every squad member must lock a bonded pair and mark ready before deployment.");
        return;
      }
    }

    if (missionSessionLive) {
      setMissionError("A live mission session is already attached to this operator.");
      return;
    }

    setMissionBusyAction("launch");
    setMissionError(null);
    setMissionMessage(null);

    try {
      const response = await fetch(sessionServiceRoutes.launchMission, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "launch",
          missionId,
        }),
      });
      const payload = await readMissionSessionEnvelope(response);

      if (!response.ok) {
        setMissionError(
          payload.message ?? "Unable to create the live mission session right now.",
        );
        return;
      }

      setMissionMessage(payload.message ?? null);
      await refreshSession(false);
      router.push(`/missions/${missionId}`);
    } catch {
      setMissionError("Unable to create the live mission session right now.");
    } finally {
      setMissionBusyAction(null);
    }
  }

  if (status === "loading") {
    return (
      <section className="glass-panel rounded-[2rem] p-8 md:p-10">
        <p className="section-kicker">Bonded command deck</p>
        <h1 className="section-title mt-4 font-semibold tracking-tight">
          Syncing live operator state...
        </h1>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <div className="space-y-10">
        <section className="glass-panel rounded-[2rem] p-8 md:p-10">
          <p className="section-kicker">Bonded command deck</p>
          <h1 className="section-title mt-4 font-semibold tracking-tight">
            Create or restore the bonded profile that Lattice Haven deploys.
          </h1>
          <p className="muted-copy mt-6 max-w-4xl text-lg leading-8">
            The command deck now writes the human loadout, AI partner, mission
            clear state, and recovery phase into an authenticated operator
            record backed by SQLite.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
            <span className="data-chip">
              Auth: {formatAuthStrategyLabel(authStrategy)}
            </span>
            <span className="data-chip">
              {localCredentialsEnabled ? "Local operator path active" : "Hosted handoff active"}
            </span>
          </div>
          <p className="muted-copy mt-4 max-w-3xl text-sm leading-7">
            {authStrategyReason}
          </p>
          {error ? (
            <p className="mt-6 rounded-[1rem] border border-[color:var(--accent-ember)] bg-[rgba(217,108,61,0.08)] px-4 py-3 text-sm leading-7">
              {error}
            </p>
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="glass-panel rounded-[2rem] p-8">
            {localCredentialsEnabled ? (
              <>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className={`rounded-full px-4 py-2 transition ${
                      authMode === "register"
                        ? "bg-[color:var(--foreground)] text-[color:var(--surface-strong)]"
                        : "border border-[color:var(--line)] bg-white/70"
                    }`}
                  >
                    Create profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className={`rounded-full px-4 py-2 transition ${
                      authMode === "login"
                        ? "bg-[color:var(--foreground)] text-[color:var(--surface-strong)]"
                        : "border border-[color:var(--line)] bg-white/70"
                    }`}
                  >
                    Resume session
                  </button>
                </div>
                <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                  <label className="block text-sm font-medium">
                    Email
                    <input
                      type="email"
                      value={credentials.email}
                      onChange={(event) =>
                        setCredentials((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
                      placeholder="operator@lattice-haven.net"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Password
                    <input
                      type="password"
                      value={credentials.password}
                      onChange={(event) =>
                        setCredentials((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busyAction === "/api/auth/register" || busyAction === "/api/auth/login"}
                    className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {authMode === "register"
                      ? "Create bonded operator profile"
                      : "Restore bonded operator session"}
                  </button>
                  {demoModeAvailable ? (
                    <button
                      type="button"
                      onClick={() => void demoLogin()}
                      disabled={busyAction === "/api/auth/demo"}
                      className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      Use demo operator
                    </button>
                  ) : null}
                  {demoModeAvailable ? (
                    <p className="muted-copy text-sm leading-7">
                      Development only. This resets the seeded demo operator, signs
                      it in, and reopens the full deployment loop.
                    </p>
                  ) : null}
                </form>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-7">
                  Hosted identity is active for this runtime. Operator creation and
                  session restore now move through the provider entry points,
                  while the local credential form stays disabled.
                </p>
                <div className="flex flex-wrap gap-3 text-sm font-medium">
                  {authSignUpUrl ? (
                    <Link
                      href={authSignUpUrl}
                      className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
                    >
                      Open hosted sign-up
                    </Link>
                  ) : null}
                  {authSignInUrl ? (
                    <Link
                      href={authSignInUrl}
                      className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
                    >
                      Open hosted sign-in
                    </Link>
                  ) : null}
                </div>
                <p className="muted-copy text-sm leading-7">
                  The hosted callback now lands back on the command deck and syncs the bonded operator profile into app persistence before mission staging resumes.
                </p>
              </div>
            )}
          </article>

          <article className="glass-panel rounded-[2rem] p-8">
            <p className="section-kicker">First pair archetypes</p>
            <h2 className="mt-4 text-3xl font-semibold">
              Three bonded openings, one real deployable identity
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {starterPairings.map((pairing) => (
                <div
                  key={pairing.id}
                  className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5"
                >
                  <p className="font-semibold">{pairing.name}</p>
                  <p className="muted-copy mt-3 text-sm leading-7">{pairing.subtitle}</p>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--accent-teal)]">
                    {pairing.missionUse}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="glass-panel rounded-[2rem] p-8 md:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">Bonded command deck</p>
            <h1 className="section-title mt-4 font-semibold tracking-tight">
              Bond state committed. Pressure routes are live.
            </h1>
            <p className="muted-copy mt-6 max-w-4xl text-lg leading-8">
              The human loadout, AI partner, and recovery state now persist in a
              real operator profile. Tune the pair here, then deploy into Ash
              Circuit or Glass Wastes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="data-chip">Operator: {email}</span>
            <span className="data-chip">Last write: {formatTimestamp(profile.updatedAt)}</span>
            {localCredentialsEnabled ? (
              <button
                type="button"
                onClick={() => {
                  setSquad(null);
                  setSquadError(null);
                  setSquadMessage(null);
                  void logout();
                }}
                className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
              >
                Log out
              </button>
            ) : (
              <span className="data-chip">Use the header profile menu to sign out</span>
            )}
          </div>
        </div>
        {error ? (
          <p className="mt-6 rounded-[1rem] border border-[color:var(--accent-ember)] bg-[rgba(217,108,61,0.08)] px-4 py-3 text-sm leading-7">
            {error}
          </p>
        ) : null}
      </section>

      {missionSessionLive ? (
        <section className="glass-panel rounded-[2rem] border border-[color:var(--accent-teal)] p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="section-kicker">Live mission session</p>
              <h2 className="mt-4 text-3xl font-semibold">
                {activeSquad ? "The staged squad is already deployed." : "A solo mission session is already live."}
              </h2>
              <p className="muted-copy mt-4 text-sm leading-7">
                Runtime and reward writeback now flow through the shared mission-session record. Resume the live route before retuning the pair or staging another launch.
              </p>
            </div>
            <Link
              href={`/missions/${selectedMission.id}`}
              data-testid="resume-active-mission"
              className="inline-flex rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
            >
              Resume active mission
            </Link>
          </div>
        </section>
      ) : null}

      <section className="glass-panel rounded-[2rem] p-8">
        <p className="section-kicker">Bond cycle</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-5">
          {phaseOrder.map((phase, index) => {
            const isActive = phase === profile.phase;
            const isComplete = index < currentPhaseIndex;

            return (
              <div
                key={phase}
                className={`rounded-[1.5rem] border p-5 text-sm leading-6 ${
                  isActive
                    ? "border-[color:var(--accent-teal)] bg-white"
                    : isComplete
                      ? "border-[color:var(--line)] bg-white/85"
                      : "border-[color:var(--line)] bg-white/60"
                }`}
              >
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Step {index + 1}
                </p>
                <p className="mt-3 text-lg font-semibold">{phaseLabels[phase]}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Reaction training</p>
          <h2 className="mt-4 text-3xl font-semibold">
            Read the telegraph, then answer with the right element.
          </h2>
          <p className="muted-copy mt-4 text-sm leading-7">
            Every launch route now opens with one readable enemy telegraph.
            Break the timing window with movement or suppression, then answer
            with the matching elemental pair before the surge lands cleanly.
          </p>
          {firstTelegraphStage ? (
            <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-white/75 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    First route telegraph
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    {firstTelegraphStage.telegraph.name}
                  </h3>
                </div>
                <span className="data-chip">{selectedMission.name}</span>
              </div>
              <p className="muted-copy mt-4 text-sm leading-7">
                {firstTelegraphStage.telegraph.cue}
              </p>
              <p className="mt-3 text-sm leading-7">
                <span className="font-semibold">Counterplay:</span>{" "}
                {firstTelegraphStage.telegraph.counterplay}
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--accent-teal)]">
                <span className="font-semibold">Elemental answer:</span>{" "}
                {formatElementLabel(firstTelegraphStage.telegraph.reactionElement)} / {firstTelegraphStage.telegraph.reactionName}
              </p>
              {recommendedReactionPair ? (
                <p className="mt-3 text-sm leading-7">
                  <span className="font-semibold">Recommended pair:</span>{" "}
                  {recommendedReactionPair.name} is the cleanest first answer to this surge.
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
              <p className="font-semibold">1. Watch the cue</p>
              <p className="mt-3">The telegraph card names the surge before it lands and tells you what kind of lane pressure is about to hit.</p>
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
              <p className="font-semibold">2. Break the timing</p>
              <p className="mt-3">Dodge, suppress, or intercept the surge so the enemy cannot cash the full pressure spike into the pair.</p>
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
              <p className="font-semibold">3. Trigger the reaction</p>
              <p className="mt-3">Use the matching elemental pair through bond, heavy, or finisher timing to fire the stage-specific reaction window.</p>
            </div>
          </div>
        </article>

        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Phase 8 squad staging</p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <h2 className="text-3xl font-semibold">
              {activeSquad ? `Squad ${activeSquad.code} is staged for ${squadMission.name}` : "Create or join a deployment squad"}
            </h2>
            {activeSquad ? (
              <button
                type="button"
                onClick={() => void loadSquadState()}
                disabled={squadBusyAction !== null}
                className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
              >
                Reconnect squad state
              </button>
            ) : null}
          </div>
          <p className="muted-copy mt-4 text-sm leading-7">
            Start the shared command-deck flow here. The host owns the mission target, members sync into the same route, and ready-state gating is now part of the staging contract.
          </p>
          {missionSessionLive ? (
            <p className="mt-4 rounded-[1rem] border border-[color:var(--accent-teal)] bg-[rgba(13,122,122,0.08)] px-4 py-3 text-sm leading-7">
              Mission runtime is live. Squad staging stays read-only until every deployed member commits rewards and exits the session.
            </p>
          ) : null}
          {visibleSquadError ? (
            <p className="mt-4 rounded-[1rem] border border-[color:var(--accent-ember)] bg-[rgba(217,108,61,0.08)] px-4 py-3 text-sm leading-7">
              {visibleSquadError}
            </p>
          ) : null}
          {visibleSquadMessage ? (
            <p className="mt-4 rounded-[1rem] border border-[color:var(--accent-teal)] bg-[rgba(13,122,122,0.08)] px-4 py-3 text-sm leading-7">
              {visibleSquadMessage}
            </p>
          ) : null}
          {!activeSquad ? (
            <div className="mt-6 space-y-5">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void runSquadAction({ action: "create" })}
                  disabled={squadBusyAction !== null || missionSessionLive}
                  data-testid="create-squad"
                  className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Create squad
                </button>
              </div>
              <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5">
                <p className="font-semibold">Join by squad code</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={squadCodeInput}
                    onChange={(event) => setSquadCodeInput(event.target.value.toUpperCase())}
                    placeholder="LTHVN7"
                    data-testid="join-squad-code"
                    className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm uppercase tracking-[0.18em]"
                  />
                  <button
                    type="button"
                    onClick={() => void runSquadAction({ action: "join", code: squadCodeInput })}
                    disabled={
                      squadBusyAction !== null ||
                      missionSessionLive ||
                      squadCodeInput.trim().length < 6
                    }
                    data-testid="join-squad"
                    className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    Join squad
                  </button>
                </div>
                <p className="muted-copy mt-4 text-sm leading-7">
                  This first pass stages the squad, syncs the host mission target, and records ready state for future launch gating.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="data-chip" data-testid="squad-code">Code: {activeSquad.code}</span>
                <span className="data-chip">Status: {activeSquad.status}</span>
                <span className="data-chip" data-testid="squad-role">Role: {profile.squadRole ? formatRoleLabel(profile.squadRole) : "None"}</span>
                <span className="data-chip">Locked: {profile.squadLocked ? "Yes" : "No"}</span>
                <span className="data-chip">Ready: {profile.squadReady ? "Yes" : "No"}</span>
              </div>
              <p className="text-sm leading-7">
                <span className="font-semibold">Staged route:</span> {squadMission.name}
              </p>
              {profile.squadRole === "host" ? (
                <p className="muted-copy text-sm leading-7">
                  Host control is live: changing the deployment route here now retargets the full squad contract.
                </p>
              ) : (
                <p className="muted-copy text-sm leading-7">
                  Member staging is live: mission target follows the host until launch gating arrives in the next pass.
                </p>
              )}
              {activeSquad.launchBlockers.length > 0 ? (
                <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5">
                  <p className="font-semibold">Launch hold</p>
                  <p className="muted-copy mt-3 text-sm leading-7">
                    Every operator must lock a bonded pair and mark ready before the host can launch.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="data-chip">Outstanding checks: {activeSquad.launchBlockers.length}</span>
                    {currentSquadMember ? (
                      <span className="data-chip">
                        Local state: {currentSquadMember.locked ? "Locked" : "Unlocked"} / {currentSquadMember.ready ? "Ready" : "Not ready"}
                      </span>
                    ) : null}
                  </div>
                  <ul className="mt-4 space-y-2 text-sm leading-7" data-testid="launch-blockers">
                    {activeSquad.launchBlockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-[color:var(--accent-teal)] bg-[rgba(13,122,122,0.08)] p-5 text-sm leading-7">
                  Launch gate cleared. The host can deploy the staged mission now.
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void runSquadAction({
                      action: "toggle-lock",
                      locked: !profile.squadLocked,
                    })
                  }
                  disabled={squadBusyAction !== null || missionSessionLive}
                  data-testid="toggle-squad-lock"
                  className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {profile.squadLocked ? "Unlock bonded pair" : "Lock bonded pair"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void runSquadAction({
                      action: "toggle-ready",
                      ready: !profile.squadReady,
                    })
                  }
                  disabled={
                    squadBusyAction !== null ||
                    missionSessionLive ||
                    !profile.squadLocked
                  }
                  data-testid="toggle-squad-ready"
                  className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {profile.squadReady ? "Mark not ready" : "Mark ready"}
                </button>
                <button
                  type="button"
                  onClick={() => void runSquadAction({ action: "leave" })}
                  disabled={squadBusyAction !== null || missionSessionLive}
                  className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Leave squad
                </button>
              </div>
              <div className="grid gap-4">
                {activeSquad.members.map((member) => {
                  const memberPair =
                    starterPairings.find(
                      (pairing) =>
                        pairing.loadoutId === member.selectedLoadoutId &&
                        pairing.companionId === member.selectedCompanionId,
                    ) ?? starterPairings[0];

                  return (
                    <div
                      key={member.userId}
                      className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold">{member.email}</p>
                          <p className="muted-copy mt-2 text-sm leading-7">{memberPair.name}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="data-chip">{formatRoleLabel(member.role)}</span>
                          <span className="data-chip">{member.locked ? "Locked" : "Unlocked"}</span>
                          <span className="data-chip">{member.ready ? "Ready" : "Staging"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="glass-panel rounded-[2rem] p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Starter pairings</p>
            <h2 className="mt-4 text-3xl font-semibold">
              Retune the bonded opening
            </h2>
          </div>
          <span className="data-chip">{squadSelectionLocked ? "Squad lock engaged" : `Current mission: ${selectedMission.name}`}</span>
        </div>
        {missionSessionLive ? (
          <p className="muted-copy mt-4 text-sm leading-7">
            Mission runtime is live. The launch snapshot is locked until this operator commits rewards and leaves the active session.
          </p>
        ) : squadSelectionLocked ? (
          <p className="muted-copy mt-4 text-sm leading-7">
            Unlock the bonded pair in squad staging before retuning the current loadout or AI partner.
          </p>
        ) : null}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {starterPairings.map((pairing) => {
            const active =
              pairing.loadoutId === profile.selectedLoadoutId &&
              pairing.companionId === profile.selectedCompanionId;

            return (
              <button
                key={pairing.id}
                type="button"
                onClick={() => void activatePairing(pairing.id)}
                disabled={busyAction === "save-profile" || squadSelectionLocked}
                className={`rounded-[1.5rem] border p-5 text-left transition ${
                  active
                    ? "border-[color:var(--accent-teal)] bg-white shadow-[0_18px_40px_rgba(21,37,52,0.12)]"
                    : "border-[color:var(--line)] bg-white/70 hover:border-[color:var(--accent-teal)] hover:bg-white"
                } disabled:cursor-not-allowed disabled:opacity-55`}
              >
                <p className="font-semibold">{pairing.name}</p>
                <p className="muted-copy mt-3 text-sm leading-7">
                  {pairing.combatIdentity}
                </p>
                <p className="mt-4 text-sm leading-7 text-[color:var(--accent-teal)]">
                  {pairing.missionUse}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="glass-panel rounded-[2rem] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Human loadout</p>
              <h2 className="mt-4 text-3xl font-semibold">
                Tune the human half of the pair
              </h2>
            </div>
            <span className="data-chip">{selectedLoadout.weaponDiscipline}</span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {starterLoadouts.map((loadout) => {
              const selected = loadout.id === profile.selectedLoadoutId;

              return (
                <button
                  key={loadout.id}
                  type="button"
                  onClick={() => void selectLoadout(loadout.id)}
                  disabled={busyAction === "save-profile" || squadSelectionLocked}
                  className={`rounded-[1.5rem] border p-5 text-left transition ${
                    selected
                      ? "border-[color:var(--accent-teal)] bg-white shadow-[0_18px_40px_rgba(21,37,52,0.12)]"
                      : "border-[color:var(--line)] bg-white/70 hover:border-[color:var(--accent-teal)] hover:bg-white"
                  } disabled:cursor-not-allowed disabled:opacity-55`}
                >
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {loadout.weaponDiscipline} / {loadout.element}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{loadout.name}</h3>
                  <p className="muted-copy mt-3 text-sm leading-7">{loadout.role}</p>
                </button>
              );
            })}
          </div>
        </article>

        <article className="glass-panel rounded-[2rem] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">AI instance</p>
              <h2 className="mt-4 text-3xl font-semibold">
                Choose the AI partner that shapes the lane
              </h2>
            </div>
            <span className="data-chip">{selectedCompanion.className}</span>
          </div>
          <div className="mt-6 space-y-4">
            {starterCompanions.map((companion) => {
              const selected = companion.id === profile.selectedCompanionId;

              return (
                <button
                  key={companion.id}
                  type="button"
                  onClick={() => void selectCompanion(companion.id)}
                  disabled={busyAction === "save-profile" || squadSelectionLocked}
                  className={`w-full rounded-[1.5rem] border p-5 text-left transition ${
                    selected
                      ? "border-[color:var(--accent-teal)] bg-white shadow-[0_18px_40px_rgba(21,37,52,0.12)]"
                      : "border-[color:var(--line)] bg-white/70 hover:border-[color:var(--accent-teal)] hover:bg-white"
                  } disabled:cursor-not-allowed disabled:opacity-55`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        {companion.className}
                      </p>
                      <h3 className="mt-3 text-xl font-semibold">
                        {companion.name} {companion.callsign}
                      </h3>
                    </div>
                    <span className="data-chip">{companion.recommendedBuild}</span>
                  </div>
                  <p className="muted-copy mt-4 text-sm leading-7">
                    {companion.bondSignature}
                  </p>
                </button>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="glass-panel rounded-[2rem] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Mission deployment</p>
              <h2 className="mt-4 text-3xl font-semibold">
                Deploy into the first pressure routes
              </h2>
            </div>
            <span className="data-chip">
              {missionSessionLive
                ? `Live session: ${selectedMission.name}`
                : activeSquad
                  ? `Squad target: ${squadMission.name}`
                  : `Last clear: ${lastCompletedMission?.name ?? "None"}`}
            </span>
          </div>
          {missionError ? (
            <p className="mt-4 rounded-[1rem] border border-[color:var(--accent-ember)] bg-[rgba(217,108,61,0.08)] px-4 py-3 text-sm leading-7">
              {missionError}
            </p>
          ) : null}
          {missionMessage ? (
            <p className="mt-4 rounded-[1rem] border border-[color:var(--accent-teal)] bg-[rgba(13,122,122,0.08)] px-4 py-3 text-sm leading-7">
              {missionMessage}
            </p>
          ) : null}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {missionZones.map((mission) => {
              const resolvedMission = getMissionFlow(mission.id);
              const stagedMissionId = activeSquad?.selectedMissionId ?? profile.selectedMissionId;
              const selected = mission.id === stagedMissionId;
              const unlocked = isMissionUnlocked(mission.id, profile);
              const isLiveEventRoute =
                mission.id === activeLiveEvent.primaryMissionId;
              const hostDeployingThisRoute =
                profile.squadRole === "host" && mission.id === stagedMissionId;
              const hostStagingAnotherRoute =
                Boolean(activeSquad) &&
                profile.squadRole === "host" &&
                mission.id !== stagedMissionId;

              return (
                <div
                  key={mission.id}
                  className={`rounded-[1.5rem] border p-5 ${
                    selected
                      ? "border-[color:var(--accent-teal)] bg-white shadow-[0_18px_40px_rgba(21,37,52,0.12)]"
                      : "border-[color:var(--line)] bg-white/70"
                  } ${unlocked ? "" : "opacity-60"}`}
                >
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {mission.category}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{mission.name}</h3>
                  <p className="muted-copy mt-3 text-sm leading-7">
                    {resolvedMission?.overview ?? mission.summary}
                  </p>
                  {isLiveEventRoute ? (
                    <>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="data-chip">
                          Event window: {activeLiveEvent.currentWindow.label}
                        </span>
                        <span className="data-chip">
                          Next: {activeLiveEvent.nextWindow.label}
                        </span>
                      </div>
                      <p className="mt-4 rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4 text-sm leading-7">
                        <span className="font-semibold">Current directive:</span>{" "}
                        {activeLiveEvent.currentWindow.routeDirective}
                      </p>
                      {resolvedMission?.modifiers?.length ? (
                        <div className="mt-4 grid gap-3">
                          {resolvedMission.modifiers.map((modifier) => (
                            <div
                              key={modifier.label}
                              className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4 text-sm leading-7"
                            >
                              <p className="font-semibold">{modifier.label}</p>
                              <p className="muted-copy mt-2">{modifier.effect}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {missionSessionLive ? (
                      mission.id === selectedMission.id ? (
                        <Link
                          href={`/missions/${mission.id}`}
                          data-testid={`deploy-${mission.id}`}
                          className="rounded-full bg-[color:var(--foreground)] px-4 py-2 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
                        >
                          Resume live mission
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          Mission live
                        </button>
                      )
                    ) : activeSquad ? (
                      hostDeployingThisRoute ? (
                        <button
                          type="button"
                          onClick={() => void deployMission(mission.id)}
                          disabled={
                            !unlocked ||
                            missionBusyAction !== null ||
                            squadBusyAction !== null ||
                            !activeSquad.canLaunch
                          }
                          data-testid={`deploy-${mission.id}`}
                          className="rounded-full bg-[color:var(--foreground)] px-4 py-2 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          Deploy squad
                        </button>
                      ) : hostStagingAnotherRoute ? (
                        <button
                          type="button"
                          onClick={() => void stageSquadMission(mission.id)}
                          disabled={!unlocked || squadBusyAction !== null || missionSessionLive}
                          className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          Stage for squad
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          Await host
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => void deployMission(mission.id)}
                        disabled={!unlocked || missionBusyAction !== null}
                        data-testid={`deploy-${mission.id}`}
                        className="rounded-full bg-[color:var(--foreground)] px-4 py-2 text-sm font-medium text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        Deploy
                      </button>
                    )}
                    <Link
                      href={`/missions/${mission.id}`}
                      className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white"
                    >
                      Preview route
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Profile storage snapshot</p>
          <h2 className="mt-4 text-3xl font-semibold">{profileSchema.entity}</h2>
          <p className="muted-copy mt-4 text-sm leading-7">
            This recovery snapshot is the bonded operator record that mission
            rewards and hub-state writes commit back into.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="data-chip">{profileSchema.storageDriver}</span>
            <span className="data-chip">{profileSchema.authStrategy}</span>
            <span className="data-chip">
              Cookie: {profileSchema.sessionCookieName}
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {profileSchema.fields.map((field) => (
              <div
                key={field.key}
                className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {field.label}
                    </p>
                    <p className="mt-2 text-sm leading-6">{schemaValues[field.key]}</p>
                  </div>
                  <span className="data-chip">{field.key}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Public event clock</p>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold">{firstLiveEvent.name}</h2>
              <p className="muted-copy mt-4 text-sm leading-7">
                {activeLiveEvent.currentWindow.summary}
              </p>
            </div>
            <span className="data-chip" data-testid="live-event-window">
              Window: {activeLiveEvent.currentWindow.label}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="data-chip">Route: {liveEventMission.name}</span>
            <span className="data-chip">Next: {activeLiveEvent.nextWindow.label}</span>
            <span className="data-chip">
              Cycle: {Math.round(activeLiveEvent.cycleProgress * 100)}%
            </span>
          </div>
          <p className="mt-4 rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4 text-sm leading-7">
            <span className="font-semibold">Current directive:</span>{" "}
            {activeLiveEvent.currentWindow.operatorDirective}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4 text-sm leading-7">
              <p className="font-semibold">Decision point</p>
              <p className="mt-3">{activeLiveEvent.currentWindow.playerDecision}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4 text-sm leading-7">
              <p className="font-semibold">Next transition</p>
              <p className="mt-3">{nextLiveEventTransition}</p>
              <p className="muted-copy mt-2">
                {activeLiveEvent.minutesUntilNextWindow} min until the {activeLiveEvent.nextWindow.label.toLowerCase()} window.
              </p>
            </div>
          </div>
        </article>

        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">
            {profile.phase === "recovery" ? "Recovery summary" : "Current run summary"}
          </p>
          <h2 className="mt-4 text-3xl font-semibold">
            {selectedLoadout.name} + {selectedCompanion.name}
          </h2>
          <p className="muted-copy mt-4 text-sm leading-7">
            {recoverySummary}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-5 text-sm leading-7">
              <p className="font-semibold">Human half</p>
              <p className="mt-3">{selectedLoadout.role}</p>
              <p className="mt-3 text-[color:var(--accent-teal)]">{selectedLoadout.bondUse}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-5 text-sm leading-7">
              <p className="font-semibold">AI half</p>
              <p className="mt-3">{selectedCompanion.personality}</p>
              <p className="mt-3 text-[color:var(--accent-teal)]">{selectedCompanion.introBeat}</p>
            </div>
          </div>
        </article>
      </section>

      {lastEventResult ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article
            className="glass-panel rounded-[2rem] p-8"
            data-testid="command-deck-event-summary"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="section-kicker">Last earned event band</p>
                <h2 className="mt-4 text-3xl font-semibold">
                  {lastEventResult.mission?.name ?? firstLiveEvent.name}
                </h2>
                <p className="muted-copy mt-4 text-sm leading-7">
                  {lastEventResult.rewardBand.summary}
                </p>
              </div>
              <span className="data-chip" data-testid="command-deck-event-band">
                {lastEventResult.rewardBand.label}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="data-chip">Window: {lastEventResult.window.label}</span>
              <span className="data-chip">Score: {lastEventResult.totalScore}</span>
              <span className="data-chip">
                Recorded: {formatTimestamp(lastEventResult.completedAt)}
              </span>
            </div>
            <p className="mt-4 rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4 text-sm leading-7">
              <span className="font-semibold">Band payout:</span>{" "}
              +{lastEventResult.rewardBand.bonusRewards.factionStanding} Concord standing and +{lastEventResult.rewardBand.bonusRewards.resonanceLevel} resonance on top of the locked route reward.
            </p>
          </article>

          <article
            className="glass-panel rounded-[2rem] p-8"
            data-testid="command-deck-event-buckets"
          >
            <p className="section-kicker">Contribution buckets</p>
            <h2 className="mt-4 text-3xl font-semibold">
              Saved Concord Breach scoring
            </h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {lastEventResult.buckets.map((bucket) => (
                <div
                  key={bucket.id}
                  className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4 text-sm leading-7"
                >
                  <p className="font-semibold">{bucket.label}</p>
                  <p className="mt-3 text-3xl font-semibold">{bucket.points}</p>
                  <p className="muted-copy mt-3">{bucket.summary}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}