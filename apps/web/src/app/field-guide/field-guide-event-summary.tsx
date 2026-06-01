"use client";

import Link from "next/link";

import { firstLiveEvent, resolveLiveEvent } from "@/lib/prototype-data";
import { resolvePersistedEventResult } from "@/lib/playable-slice";
import { useAuthenticatedProfile } from "@/lib/use-authenticated-profile";

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : "No synced write yet";
}

export default function FieldGuideEventSummary() {
  const { status, authenticated, profile } = useAuthenticatedProfile();
  const activeLiveEvent = resolveLiveEvent(firstLiveEvent);
  const lastEventResult = resolvePersistedEventResult(profile.lastEventResult);

  if (status === "loading") {
    return (
      <section
        className="glass-panel rounded-[2rem] p-8"
        data-testid="field-guide-event-summary"
      >
        <p className="section-kicker">Concord Breach archive</p>
        <h2 className="mt-4 text-3xl font-semibold">Syncing field archive</h2>
        <p className="muted-copy mt-4 text-sm leading-7">
          Pulling the latest operator event result into the field guide.
        </p>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section
        className="glass-panel rounded-[2rem] p-8"
        data-testid="field-guide-event-summary"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="section-kicker">Concord Breach archive</p>
            <h2 className="mt-4 text-3xl font-semibold">No bonded operator synced</h2>
            <p className="muted-copy mt-4 text-sm leading-7">
              Sign in through the command deck to carry saved event bands and bucket scoring into the field guide.
            </p>
          </div>
          <span className="data-chip">Current window: {activeLiveEvent.currentWindow.label}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
          <Link
            href="/command-deck"
            className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
          >
            Open command deck
          </Link>
        </div>
      </section>
    );
  }

  if (!lastEventResult) {
    return (
      <section
        className="glass-panel rounded-[2rem] p-8"
        data-testid="field-guide-event-summary"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="section-kicker">Concord Breach archive</p>
            <h2 className="mt-4 text-3xl font-semibold">No saved event result yet</h2>
            <p className="muted-copy mt-4 text-sm leading-7">
              Clear Glass Wastes during an active Concord Breach cycle to log a reward band and contribution breakdown here.
            </p>
          </div>
          <span className="data-chip">Current window: {activeLiveEvent.currentWindow.label}</span>
        </div>
        <p className="mt-4 rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4 text-sm leading-7">
          <span className="font-semibold">Current directive:</span>{" "}
          {activeLiveEvent.currentWindow.operatorDirective}
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article
        className="glass-panel rounded-[2rem] p-8"
        data-testid="field-guide-event-summary"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="section-kicker">Concord Breach archive</p>
            <h2 className="mt-4 text-3xl font-semibold">
              {lastEventResult.mission?.name ?? firstLiveEvent.name}
            </h2>
            <p className="muted-copy mt-4 text-sm leading-7">
              {lastEventResult.rewardBand.summary}
            </p>
          </div>
          <span className="data-chip" data-testid="field-guide-event-band">
            {lastEventResult.rewardBand.label}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="data-chip">Saved window: {lastEventResult.window.label}</span>
          <span className="data-chip">Current window: {activeLiveEvent.currentWindow.label}</span>
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
        data-testid="field-guide-event-buckets"
      >
        <p className="section-kicker">Contribution buckets</p>
        <h2 className="mt-4 text-3xl font-semibold">Saved Concord Breach scoring</h2>
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
  );
}