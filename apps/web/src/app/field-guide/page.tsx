import type { Metadata } from "next";

import {
  bondTierDefinitions,
  firstFaction,
  hubCity,
  starterCompanions,
} from "@/lib/prototype-data";

import FieldGuideEventSummary from "./field-guide-event-summary";

export const metadata: Metadata = {
  title: "Field Guide",
  description: "First sponsor faction, hub city, and build-defining starter AI partners.",
};

export default function FieldGuidePage() {
  return (
    <div className="main-shell space-y-10 py-10 md:py-14">
      <section className="glass-panel rounded-[2rem] p-8 md:p-10">
        <p className="section-kicker">Companion-first world foundation</p>
        <h1 className="section-title mt-4 font-semibold tracking-tight">
          One sponsor faction. One machine sanctuary. Eight build-defining AI partners.
        </h1>
        <p className="muted-copy mt-6 max-w-3xl text-lg leading-8">
          The first playable does not begin with a zoo of disposable companions.
          It begins inside a Harmony-aligned city-state where choosing an AI
          partner defines the player&apos;s combat role, political value, and early
          social identity.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Faction sponsor</p>
          <h2 className="mt-4 text-3xl font-semibold">{firstFaction.name}</h2>
          <p className="mt-2 font-mono text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
            {firstFaction.bloc}
          </p>
          <div className="mt-6 space-y-4 text-sm leading-7">
            <p>
              <span className="font-semibold">Promise:</span> {firstFaction.promise}
            </p>
            <p>
              <span className="font-semibold">Hidden tension:</span> {firstFaction.tension}
            </p>
            <p>
              <span className="font-semibold">Player relationship:</span>{" "}
              {firstFaction.playerRole}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {firstFaction.signatureUnits.map((unit) => (
              <span key={unit} className="data-chip">
                {unit}
              </span>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Hub city</p>
          <h2 className="mt-4 text-3xl font-semibold">{hubCity.name}</h2>
          <p className="muted-copy mt-5 text-sm leading-7">{hubCity.fantasy}</p>
          <div className="mt-6 space-y-3">
            {hubCity.services.map((service) => (
              <div
                key={service}
                className="rounded-3xl border border-[color:var(--line)] bg-white/65 px-4 py-3 text-sm"
              >
                {service}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="glass-panel rounded-[2rem] p-8">
        <p className="section-kicker">City districts</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {hubCity.districts.map((district) => (
            <article
              key={district.name}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5"
            >
              <h3 className="text-xl font-semibold">{district.name}</h3>
              <p className="muted-copy mt-3 text-sm leading-6">{district.fiction}</p>
              <p className="mt-4 text-sm leading-6 text-[color:var(--accent-teal)]">
                {district.sliceUse}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-8">
        <p className="section-kicker">Build-defining AI companions</p>
        <p className="muted-copy mt-4 max-w-3xl text-sm leading-7">
          Eight AI partners across five factions, each with a distinct combat logic,
          political alignment, and public identity. Choose one and that choice defines
          the pair&#39;s role, element, and diplomatic standing on the frontier.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          {starterCompanions.map((companion) => (
            <article
              key={companion.name}
              className="rounded-[1.75rem] border border-[color:var(--line)] bg-white/70 p-6"
            >
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                {companion.className}
              </p>
              <h3 className="mt-3 text-2xl font-semibold">{companion.name}</h3>
              <p className="mt-2 text-sm text-[color:var(--accent-teal)]">
                {companion.callsign}
              </p>
              <p className="muted-copy mt-4 text-sm leading-7">
                {companion.personality}
              </p>
              <div className="mt-5 space-y-3 text-sm leading-6">
                <p>
                  <span className="font-semibold">Role:</span> {companion.role}
                </p>
                <p>
                  <span className="font-semibold">Bond signature:</span>{" "}
                  {companion.bondSignature}
                </p>
                <p>
                  <span className="font-semibold">Recommended start:</span>{" "}
                  {companion.recommendedBuild}
                </p>
                <p>
                  <span className="font-semibold">Intro beat:</span> {companion.introBeat}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <FieldGuideEventSummary />

      <section className="glass-panel rounded-[2rem] p-8">
        <p className="section-kicker">Bond progression tiers</p>
        <p className="muted-copy mt-4 max-w-3xl text-sm leading-7">
          Bond depth is not a bar that fills. It is a shared frequency that either
          stabilizes or fractures under pressure. Each tier unlocks new capabilities
          for both partners and reshapes the pair&#39;s presence on the frontier.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bondTierDefinitions.map((tier) => (
            <article
              key={tier.id}
              className="rounded-[1.75rem] border border-[color:var(--line)] bg-white/70 p-6"
            >
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Resonance ≥ {tier.resonanceThreshold} · AI tier {tier.aiTierRequired}+
              </p>
              <h3 className="mt-3 text-xl font-semibold">{tier.name}</h3>
              <p className="muted-copy mt-3 text-sm leading-6">{tier.summary}</p>
              <div className="mt-5 space-y-3 text-sm leading-6">
                <p>
                  <span className="font-semibold">Human unlock:</span>{" "}
                  {tier.humanUnlock}
                </p>
                <p>
                  <span className="font-semibold">AI unlock:</span>{" "}
                  {tier.aiUnlock}
                </p>
                <p className="rounded-[1rem] border border-[color:var(--accent-teal)] bg-[rgba(13,122,122,0.07)] px-3 py-2 text-[color:var(--accent-teal)]">
                  <span className="font-semibold">Bond unlock:</span>{" "}
                  {tier.bondUnlock}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}