import Link from "next/link";
import type { Metadata } from "next";

import BacklogPlaytestPanel from "@/app/backlog/backlog-playtest-panel";
import { backlogMilestones, definitionOfDone, scopeLocks } from "@/lib/prototype-data";
import { playtestIssueSeverities, playtestSeverityLabels } from "@/lib/playtest-data";
import { readPlaytestSummary, readTelemetrySummary } from "@/lib/telemetry";

export const metadata: Metadata = {
  title: "Backlog",
  description: "Vertical-slice backlog and scope locks for the first playable.",
};

const balanceStatusClassName = {
  "no-data": "status-chip status-later",
  "on-target": "status-chip status-done",
  watch: "status-chip status-next",
} as const;

const balanceStatusLabel = {
  "no-data": "No clear data",
  "on-target": "On target",
  watch: "Needs tuning",
} as const;

const statusClassName = {
  Done: "status-chip status-done",
  "In Progress": "status-chip status-next",
  Next: "status-chip status-next",
  Later: "status-chip status-later",
} as const;

const exitDecisionClassName = {
  pending: "status-chip status-later",
  hold: "status-chip status-next",
  advance: "status-chip status-done",
} as const;

const exitDecisionLabel = {
  pending: "Pending",
  hold: "Hold",
  advance: "Advance",
} as const;

export default async function BacklogPage() {
  const [telemetrySummary, playtestSummary] = await Promise.all([
    readTelemetrySummary(),
    readPlaytestSummary(),
  ]);
  const latestPlanningMilestone = backlogMilestones.at(-1) ?? null;
  const nextPlanningItems = latestPlanningMilestone
    ? latestPlanningMilestone.items.filter((item) => item.status !== "Done")
    : [];
  const planningMilestoneComplete = latestPlanningMilestone
    ? latestPlanningMilestone.items.every((item) => item.status === "Done")
    : false;
  const planningMilestoneItems = latestPlanningMilestone
    ? nextPlanningItems.length > 0
      ? nextPlanningItems
      : latestPlanningMilestone.items
    : [];
  const latestPlaytestSession = playtestSummary.latestSession;
  const latestPlaytestCounts = latestPlaytestSession?.issueCounts ?? {
    critical: 0,
    major: 0,
    polish: 0,
  };
  const latestPlaytestHeadline = latestPlaytestSession
    ? latestPlaytestCounts.critical > 0
      ? `${latestPlaytestCounts.critical} critical blocker${latestPlaytestCounts.critical === 1 ? "" : "s"} logged in the latest session.`
      : latestPlaytestCounts.major > 0
        ? `No critical blockers logged. ${latestPlaytestCounts.major} major risk${latestPlaytestCounts.major === 1 ? " remains" : "s remain"} open.`
        : latestPlaytestCounts.polish > 0
          ? `No critical or major issues logged. ${latestPlaytestCounts.polish} polish follow-up${latestPlaytestCounts.polish === 1 ? " is" : "s are"} tracked.`
          : "No critical, major, or polish findings have been logged for the latest session yet."
    : "Open a four-player session log to capture critical, major, and polish findings in one place.";
  const latestPlaytestRecommendation = latestPlaytestSession
    ? latestPlaytestCounts.critical > 0
      ? "Hold the slice here until the critical blocker list is reduced to zero."
      : latestPlaytestCounts.major > 0
        ? "Treat the slice as playable but not exit-ready until the major-risk list is cleared or accepted."
        : latestPlaytestCounts.polish > 0
          ? "Core flow is holding. The remaining work is polish and presentation follow-through."
          : "This session logged no findings. Keep rerunning the capture after meaningful platform changes so the board stays honest."
    : "The severity board stays provisional until a session is recorded through the capture flow.";
  const trackedCombatOutcomes =
    telemetrySummary.reactionTriggers + telemetrySummary.telegraphFailures;
  const onTargetPairings = telemetrySummary.pairings.filter(
    (pairing) => pairing.balanceStatus === "on-target",
  ).length;
  const watchPairings = telemetrySummary.pairings.filter(
    (pairing) => pairing.balanceStatus === "watch",
  ).length;
  const noDataPairings = telemetrySummary.pairings.filter(
    (pairing) => pairing.balanceStatus === "no-data",
  ).length;
  const hasBlockingPlaytestIssues =
    latestPlaytestCounts.critical > 0 || latestPlaytestCounts.major > 0;
  const hasTelemetryCoverage =
    telemetrySummary.missionCompletions > 0 && trackedCombatOutcomes > 0;
  const exitDecisionState = !latestPlaytestSession
    ? "pending"
    : hasBlockingPlaytestIssues || !hasTelemetryCoverage
      ? "hold"
      : "advance";
  const exitDecisionTitle = !latestPlaytestSession
    ? "Decision blocked until a reviewed squad pass is captured."
    : exitDecisionState === "hold"
      ? "Spend one more polish phase on combat and co-op stability."
      : "Advance into broader service production.";
  const exitDecisionSummary = !latestPlaytestSession
    ? "P10-05 stays open until the latest reviewed four-operator session and the mission telemetry baseline are both real."
    : hasBlockingPlaytestIssues
      ? "The reviewed squad pass still carries blocker-level findings, so the slice should not exit into broader service work yet."
      : !hasTelemetryCoverage
        ? "The severity board is clean, but the supporting mission and combat telemetry set is still too thin to support an exit call."
        : latestPlaytestCounts.polish > 0
          ? "The reviewed squad pass cleared without critical or major issues. The only recorded follow-up is polish, not combat or co-op stability."
          : "The reviewed squad pass and telemetry baseline both clear the slice for broader service work.";
  const exitDecisionNextStep = !latestPlaytestSession
    ? "Record or refresh the reviewed four-operator session before making the slice exit call."
    : hasBlockingPlaytestIssues
      ? "Clear or explicitly accept the blocker list before expanding scope."
      : !hasTelemetryCoverage
        ? "Run one more reviewed mission that leaves launch, completion, and combat-outcome traces in telemetry."
        : latestPlaytestCounts.polish > 0
          ? "Carry the logged polish item as a short cleanup while broader service work starts."
          : "Phase 12 is locked. Use the migration runbook, environment contract, rollout runbook, and locked stack choice as the production-planning baseline.";
  const exitDecisionEvidence = [
    latestPlaytestSession
      ? `Severity board: ${latestPlaytestCounts.critical} critical, ${latestPlaytestCounts.major} major, ${latestPlaytestCounts.polish} polish in the latest reviewed session.`
      : "Severity board: no reviewed four-operator session has been logged yet.",
    `Mission funnel: ${telemetrySummary.missionCompletions} completion${telemetrySummary.missionCompletions === 1 ? "" : "s"} from ${telemetrySummary.missionLaunches} launch${telemetrySummary.missionLaunches === 1 ? "" : "es"} (${telemetrySummary.completionRate}% clear rate).`,
    trackedCombatOutcomes > 0
      ? `Combat outcomes: ${telemetrySummary.reactionTriggers} reactions and ${telemetrySummary.telegraphFailures} telegraph failures (${telemetrySummary.reactionSuccessRate}% reaction success).`
      : "Combat outcomes: no tracked telegraph results have been recorded yet.",
    `Starter balance coverage: ${onTargetPairings} on target, ${watchPairings} need tuning, ${noDataPairings} without clear run data.`,
  ];

  return (
    <div className="main-shell space-y-10 py-10 md:py-14">
      <section className="glass-panel rounded-[2rem] p-8 md:p-10">
        <p className="section-kicker">Vertical-slice backlog</p>
        <h1 className="section-title mt-4 font-semibold tracking-tight">
          Build the first playable in a sequence that keeps the bond mechanic
          central.
        </h1>
        <p className="muted-copy mt-6 max-w-3xl text-lg leading-8">
          The backlog is ordered to prove one complete session loop before the
          project expands into larger live-service scope.
        </p>
      </section>

      <section
        className="glass-panel rounded-[2rem] p-8"
        data-testid="backlog-telemetry-summary"
      >
        <p className="section-kicker">Phase 10 telemetry preview</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold">First-session funnel instrumentation</h2>
            <p className="muted-copy mt-4 max-w-3xl text-sm leading-7">
              The prototype now records onboarding, pair selection, phase progression,
              mission launch, mission completion, reaction triggers, and costly missed
              telegraphs so the team can inspect both funnel drop-off and combat learning.
            </p>
          </div>
          <span className="data-chip">
            Latest event: {telemetrySummary.latestEventAt ? new Date(telemetrySummary.latestEventAt).toLocaleString() : "No telemetry yet"}
          </span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Operators</p>
            <p className="mt-3 text-3xl font-semibold">{telemetrySummary.totalOperators}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Registrations</p>
            <p className="mt-3 text-3xl font-semibold">{telemetrySummary.registrations}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Session restores</p>
            <p className="mt-3 text-3xl font-semibold">{telemetrySummary.sessionRestores}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Demo runs</p>
            <p className="mt-3 text-3xl font-semibold">{telemetrySummary.demoSessions}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Mission launches</p>
            <p className="mt-3 text-3xl font-semibold">{telemetrySummary.missionLaunches}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Mission completions</p>
            <p className="mt-3 text-3xl font-semibold">{telemetrySummary.missionCompletions}</p>
            <p className="muted-copy mt-2">Completion rate {telemetrySummary.completionRate}%</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Pair selections</p>
            <p
              className="mt-3 text-3xl font-semibold"
              data-testid="backlog-telemetry-pair-selections"
            >
              {telemetrySummary.pairSelections}
            </p>
            <p className="muted-copy mt-2">Explicit bonded retunes saved through the profile API.</p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Reaction triggers</p>
            <p
              className="mt-3 text-3xl font-semibold"
              data-testid="backlog-telemetry-reaction-triggers"
            >
              {telemetrySummary.reactionTriggers}
            </p>
            <p className="muted-copy mt-2">Successful elemental answers recorded during live telegraphs.</p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Telegraph failures</p>
            <p
              className="mt-3 text-3xl font-semibold"
              data-testid="backlog-telemetry-telegraph-failures"
            >
              {telemetrySummary.telegraphFailures}
            </p>
            <p className="muted-copy mt-2">Live telegraphs that still cost the pair integrity before recovery.</p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Reaction success</p>
            <p
              className="mt-3 text-3xl font-semibold"
              data-testid="backlog-telemetry-reaction-rate"
            >
              {telemetrySummary.reactionSuccessRate}%
            </p>
            <p className="muted-copy mt-2">Share of tracked telegraph outcomes that ended in a reaction instead of a hit.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          {telemetrySummary.phases.map((phase) => (
            <div
              key={phase.phase}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7"
              data-testid={`backlog-phase-${phase.phase}`}
            >
              <p className="font-semibold">{phase.label}</p>
              <p className="mt-3 text-3xl font-semibold">{phase.reachedUsers}</p>
              <p className="muted-copy mt-2">
                Reached by {phase.reachedUsers} operator{phase.reachedUsers === 1 ? "" : "s"}
              </p>
              <p className="mt-3">Transitions recorded: {phase.transitions}</p>
              <p className="muted-copy mt-2">
                {phase.dropFromPrevious === null
                  ? "Entry point of the current funnel."
                  : `Drop from previous step: ${phase.dropFromPrevious}`}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6" data-testid="backlog-telemetry-pairings">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker">Pair telemetry</p>
              <h3 className="text-2xl font-semibold">Which bonded openings are being chosen, clearing cleanly, and staying within target</h3>
            </div>
            <span className="data-chip">P10-03 checklist</span>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {telemetrySummary.pairings.map((pairing) => (
              <div
                key={pairing.pairingId}
                className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7"
                data-testid={`backlog-pairing-${pairing.pairingId}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold">{pairing.label}</p>
                  <span className={balanceStatusClassName[pairing.balanceStatus]}>
                    {balanceStatusLabel[pairing.balanceStatus]}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="data-chip">Selections: {pairing.selections}</span>
                  <span className="data-chip">Completed runs: {pairing.completedRuns}</span>
                  <span className="data-chip">Reactions: {pairing.reactionTriggers}</span>
                  <span className="data-chip">Telegraph failures: {pairing.telegraphFailures}</span>
                </div>
                <p className="mt-4 text-3xl font-semibold">{pairing.reactionRate}%</p>
                <p className="muted-copy mt-2">Reaction success across tracked telegraph outcomes for this bonded pair.</p>
                <div
                  className="mt-5 rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 p-4"
                  data-testid={`backlog-balance-${pairing.pairingId}`}
                >
                  <p className="font-semibold">Starter-build balance checklist</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        Time-to-kill proxy
                      </p>
                      <p className="mt-1 text-sm">
                        Target {pairing.balanceTargets.actionsPerClear.min}-{pairing.balanceTargets.actionsPerClear.max} actions per clear
                      </p>
                      <p className="muted-copy mt-1">
                        Observed {pairing.averageActionsPerClear === null ? "No completed runs yet" : `${pairing.averageActionsPerClear} actions per clear`}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        Survivability
                      </p>
                      <p className="mt-1 text-sm">
                        Target {pairing.balanceTargets.finalIntegrity.min}-{pairing.balanceTargets.finalIntegrity.max} final integrity
                      </p>
                      <p className="muted-copy mt-1">
                        Observed {pairing.averageFinalIntegrity === null ? "No completed runs yet" : `${pairing.averageFinalIntegrity} final integrity`}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        Reaction uptime
                      </p>
                      <p className="mt-1 text-sm">
                        Target {pairing.balanceTargets.reactionRate.min}-{pairing.balanceTargets.reactionRate.max}% successful reactions
                      </p>
                      <p className="muted-copy mt-1">
                        Observed {pairing.trackedOutcomes === 0 ? "No tracked telegraph outcomes yet" : `${pairing.reactionRate}% across ${pairing.trackedOutcomes} tracked outcomes`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <BacklogPlaytestPanel
          initialSessionId={latestPlaytestSession?.playtestSessionId ?? null}
          initialMissionId={latestPlaytestSession?.missionId ?? "glass-wastes"}
        />

        <article
          className="glass-panel rounded-[2rem] p-8"
          data-testid="backlog-playtest-summary"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="section-kicker">P10-04 playtest log</p>
              <h2 className="mt-4 text-3xl font-semibold">Latest reviewed four-player session</h2>
            </div>
            <span className="data-chip">
              {latestPlaytestSession
                ? `${latestPlaytestSession.operatorCount} operators`
                : "No session logged yet"}
            </span>
          </div>
          {latestPlaytestSession ? (
            <div className="mt-5 space-y-5">
              <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="data-chip">Mission: {latestPlaytestSession.missionLabel}</span>
                  <span className="data-chip">Logged by: {latestPlaytestSession.loggedBy}</span>
                  <span className="data-chip">Recorded: {new Date(latestPlaytestSession.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-4">{latestPlaytestSession.summary}</p>
              </div>
              <div
                className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7"
                data-testid="backlog-playtest-headline"
              >
                <p className="font-semibold">{latestPlaytestHeadline}</p>
                <p className="muted-copy mt-3">{latestPlaytestRecommendation}</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {playtestIssueSeverities.map((severity) => (
                  <div
                    key={severity}
                    className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5"
                    data-testid={`backlog-playtest-${severity}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{playtestSeverityLabels[severity]}</p>
                      <span className="data-chip">
                        {latestPlaytestSession.issueCounts[severity]}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3 text-sm leading-7">
                      {playtestSummary.issuesBySeverity[severity].length > 0 ? (
                        playtestSummary.issuesBySeverity[severity].map((issue) => (
                          <div
                            key={`${issue.createdAt}:${issue.title}`}
                            className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 p-4"
                          >
                            <p className="font-semibold">{issue.title}</p>
                            <p className="muted-copy mt-2">{issue.area} | {issue.loggedBy}</p>
                            <p className="mt-3">{issue.notes}</p>
                          </div>
                        ))
                      ) : (
                        <p className="muted-copy">No {severity} issues logged for this session.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="muted-copy mt-5 text-sm leading-7">
              Open a four-player session on the left, then log critical, major, or polish issues so the latest playtest stays visible here.
            </p>
          )}
          <div
            className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7"
            data-testid="backlog-exit-decision"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="section-kicker">P10-05 exit decision</p>
                <h3
                  className="mt-3 text-2xl font-semibold"
                  data-testid="backlog-exit-decision-title"
                >
                  {exitDecisionTitle}
                </h3>
              </div>
              <span
                className={exitDecisionClassName[exitDecisionState]}
                data-testid="backlog-exit-decision-status"
              >
                {exitDecisionLabel[exitDecisionState]}
              </span>
            </div>
            <p className="mt-4">{exitDecisionSummary}</p>
            <p className="muted-copy mt-3">{exitDecisionNextStep}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {exitDecisionEvidence.map((evidence) => (
                <div
                  key={evidence}
                  className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 p-4"
                >
                  {evidence}
                </div>
              ))}
            </div>
          </div>
          {latestPlanningMilestone ? (
            <div
              className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7"
              data-testid="backlog-next-phase"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="section-kicker">Phase launch</p>
                  <h3
                    className="mt-3 text-2xl font-semibold"
                    data-testid="backlog-next-phase-title"
                  >
                    {planningMilestoneComplete
                      ? `Current planning baseline: ${latestPlanningMilestone.name}`
                      : `Next phase: ${latestPlanningMilestone.name}`}
                  </h3>
                </div>
                <span className="data-chip">
                  {planningMilestoneComplete
                    ? "Planning locked"
                    : latestPlanningMilestone.phase}
                </span>
              </div>
              <p className="mt-4">{latestPlanningMilestone.objective}</p>
              <p className="muted-copy mt-3">
                {planningMilestoneComplete
                  ? "The service map now locks this milestone as a completed planning baseline with linked runbooks, explicit rollout gates, and shared contract coverage."
                  : "The slice exit call now turns into concrete production planning rather than more combat-slice expansion."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium">
                <Link
                  href="/service-map"
                  className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
                >
                  Open service map
                </Link>
                <a
                  href="/api/service-map"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
                >
                  Open JSON contract
                </a>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {planningMilestoneItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 p-4"
                    data-testid={`backlog-next-phase-item-${item.id}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                        {item.id}
                      </p>
                      <span className={statusClassName[item.status]}>{item.status}</span>
                    </div>
                    <p className="mt-4 font-semibold">{item.title}</p>
                    <p className="muted-copy mt-3">{item.outcome}</p>
                    <p className="mt-3 text-sm">
                      <span className="font-semibold">Done when:</span> {item.doneWhen}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      </section>

      <section className="glass-panel rounded-[2rem] p-8">
        <p className="section-kicker">Definition of done</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {definitionOfDone.map((item) => (
            <div
              key={item}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5 text-sm leading-7"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        {backlogMilestones.map((milestone) => (
          <article key={milestone.name} className="glass-panel rounded-[2rem] p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="section-kicker">{milestone.phase}</p>
                <h2 className="mt-3 text-3xl font-semibold">{milestone.name}</h2>
              </div>
              <p className="muted-copy max-w-2xl text-sm leading-7">
                {milestone.objective}
              </p>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {milestone.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      {item.id}
                    </p>
                    <span className={statusClassName[item.status]}>{item.status}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="muted-copy mt-3 text-sm leading-7">{item.outcome}</p>
                  <p className="mt-4 text-sm leading-7">
                    <span className="font-semibold">Done when:</span> {item.doneWhen}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="glass-panel rounded-[2rem] p-8">
        <p className="section-kicker">Scope locks</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {scopeLocks.map((rule) => (
            <div
              key={rule}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5 text-sm leading-7"
            >
              {rule}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}