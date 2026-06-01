"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  playtestFocusAreas,
  playtestFocusLabels,
  playtestIssueSeverities,
  playtestSeverityLabels,
  type PlaytestFocusArea,
  type PlaytestIssueSeverity,
} from "@/lib/playtest-data";
import { missionZones } from "@/lib/prototype-data";
import { useAuthenticatedProfile } from "@/lib/use-authenticated-profile";

type PlaytestActionResponse = {
  playtestSessionId?: string;
  message?: string;
};

type BacklogPlaytestPanelProps = {
  initialSessionId: string | null;
  initialMissionId: string;
};

export default function BacklogPlaytestPanel({
  initialSessionId,
  initialMissionId,
}: BacklogPlaytestPanelProps) {
  const router = useRouter();
  const { status, authenticated, email } = useAuthenticatedProfile();
  const [playtestSessionId, setPlaytestSessionId] = useState<string | null>(
    initialSessionId,
  );
  const [missionId, setMissionId] = useState(initialMissionId);
  const [sessionSummary, setSessionSummary] = useState(
    "Four-operator route pass focused on launch gating, reconnect, reward writeback, route transitions, and final recovery state.",
  );
  const [severity, setSeverity] = useState<PlaytestIssueSeverity>("polish");
  const [area, setArea] = useState<PlaytestFocusArea>("ui");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [busyAction, setBusyAction] = useState<"create-session" | "log-issue" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canLogIssue =
    playtestSessionId !== null &&
    title.trim().length >= 6 &&
    notes.trim().length >= 12;

  async function runPlaytestAction(body: Record<string, unknown>) {
    setBusyAction(body.action === "create-session" ? "create-session" : "log-issue");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/playtest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as PlaytestActionResponse;

      if (!response.ok) {
        setError(payload.message ?? "Unable to update the playtest log right now.");
        return null;
      }

      setMessage(payload.message ?? null);
      router.refresh();
      return payload;
    } catch {
      setError("Unable to update the playtest log right now.");
      return null;
    } finally {
      setBusyAction(null);
    }
  }

  async function createSession() {
    const payload = await runPlaytestAction({
      action: "create-session",
      missionId,
      operatorCount: 4,
      summary: sessionSummary,
    });

    if (payload?.playtestSessionId) {
      setPlaytestSessionId(payload.playtestSessionId);
    }
  }

  async function logIssue() {
    if (!playtestSessionId) {
      setError("Open a four-player playtest session before logging issues.");
      return;
    }

    const payload = await runPlaytestAction({
      action: "log-issue",
      playtestSessionId,
      missionId,
      severity,
      area,
      title,
      notes,
    });

    if (payload) {
      setTitle("");
      setNotes("");
      setSeverity("polish");
      setArea("ui");
    }
  }

  if (status === "loading") {
    return (
      <section className="glass-panel rounded-4xl p-8" data-testid="backlog-playtest-panel">
        <p className="section-kicker">Playtest capture</p>
        <h2 className="mt-4 text-3xl font-semibold">Syncing operator clearance</h2>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section className="glass-panel rounded-4xl p-8" data-testid="backlog-playtest-panel">
        <p className="section-kicker">Playtest capture</p>
        <h2 className="mt-4 text-3xl font-semibold">Operator sign-in required</h2>
        <p className="muted-copy mt-4 text-sm leading-7">
          Open the command deck, sync a bonded operator, then return here to record the four-player playtest session and issue severity.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
          <Link
            href="/command-deck"
            className="rounded-full bg-foreground px-5 py-3 text-(--surface-strong) transition hover:bg-(--accent-teal)"
          >
            Open command deck
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-panel rounded-4xl p-8" data-testid="backlog-playtest-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="section-kicker">Playtest capture</p>
          <h2 className="mt-4 text-3xl font-semibold">Record the latest four-player run</h2>
          <p className="muted-copy mt-4 max-w-3xl text-sm leading-7">
            Use this internal panel to open a four-player session log, then drop critical, major, or polish issues straight into the backlog severity board.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="data-chip">Operator: {email}</span>
          <span className="data-chip" data-testid="playtest-session-chip">
            Session: {playtestSessionId ?? "Not started"}
          </span>
        </div>
      </div>
      {error ? (
        <p className="mt-4 rounded-2xl border border-[color:var(--accent-ember)] bg-[rgba(217,108,61,0.08)] px-4 py-3 text-sm leading-7">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-2xl border border-[color:var(--accent-teal)] bg-[rgba(13,122,122,0.08)] px-4 py-3 text-sm leading-7">
          {message}
        </p>
      ) : null}
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-3xl border border-[color:var(--line)] bg-white/72 p-5">
          <p className="font-semibold">1. Open a four-player playtest session</p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium">
              Mission lane
              <select
                value={missionId}
                onChange={(event) => setMissionId(event.target.value)}
                data-testid="playtest-mission"
                className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
              >
                {missionZones.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Session summary
              <textarea
                value={sessionSummary}
                onChange={(event) => setSessionSummary(event.target.value)}
                data-testid="playtest-session-summary"
                rows={5}
                className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
              />
            </label>
            <button
              type="button"
              onClick={() => void createSession()}
              disabled={busyAction !== null}
              data-testid="start-playtest-session"
              className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-(--surface-strong) transition hover:bg-(--accent-teal) disabled:cursor-not-allowed disabled:opacity-55"
            >
              {playtestSessionId ? "Open a fresh playtest session" : "Start four-player playtest log"}
            </button>
          </div>
        </article>

        <article className="rounded-3xl border border-[color:var(--line)] bg-white/72 p-5">
          <p className="font-semibold">2. Log issues by severity</p>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Severity
                <select
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as PlaytestIssueSeverity)}
                  data-testid="playtest-issue-severity"
                  className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
                >
                  {playtestIssueSeverities.map((value) => (
                    <option key={value} value={value}>
                      {playtestSeverityLabels[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Focus area
                <select
                  value={area}
                  onChange={(event) => setArea(event.target.value as PlaytestFocusArea)}
                  data-testid="playtest-issue-area"
                  className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
                >
                  {playtestFocusAreas.map((value) => (
                    <option key={value} value={value}>
                      {playtestFocusLabels[value]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium">
              Issue title
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                data-testid="playtest-issue-title"
                placeholder="Describe the observed issue"
                className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Issue notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                data-testid="playtest-issue-notes"
                rows={5}
                placeholder="Capture what happened, where it happened, and why it matters for the slice."
                className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
              />
            </label>
            <button
              type="button"
              onClick={() => void logIssue()}
              disabled={busyAction !== null || !canLogIssue}
              data-testid="log-playtest-issue"
              className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
            >
              Log issue
            </button>
            <p className="muted-copy text-xs leading-6">
              Leave the issue fields empty when the reviewed run is clean. Add a title and notes only when there is a real finding to capture.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}