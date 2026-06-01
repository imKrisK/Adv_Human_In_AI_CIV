import Link from "next/link";

import {
  definitionOfDone,
  firstFaction,
  firstLiveEvent,
  hubCity,
  missionZones,
  routeCards,
  sliceMetrics,
  starterLoadouts,
  starterCompanions,
} from "@/lib/prototype-data";

export default function Home() {
  return (
    <div className="main-shell space-y-10 py-10 md:py-14">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="glass-panel rounded-[2rem] p-8 md:p-10">
          <p className="section-kicker">Human-plus-AI frontier RPG</p>
          <h1 className="section-title mt-4 max-w-4xl font-semibold tracking-tight">
            A lone human is not enough. A bonded pair might be.
          </h1>
          <p className="muted-copy mt-6 max-w-3xl text-lg leading-8">
            This first web slice turns the concept pack into a playable product
            surface: one sponsor city, three build-defining AI partners, short
            pressure missions, and a route map built around the human-plus-AI
            pairing instead of a shallow companion roster.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
            <Link
              href="/pitch"
              className="rounded-full bg-[color:var(--accent-teal)] px-5 py-3 text-[color:var(--surface-strong)] transition hover:bg-[color:var(--foreground)]"
            >
              Open pitch
            </Link>
            <Link
              href="/command-deck"
              className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
            >
              Open command deck
            </Link>
            <Link
              href="/field-guide"
              className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
            >
              Open field guide
            </Link>
            <Link
              href="/backlog"
              className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
            >
              View vertical slice
            </Link>
            <a
              href="/api/prototype"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 transition hover:border-[color:var(--accent-ember)] hover:bg-white"
            >
              Open JSON contract
            </a>
          </div>
        </div>

        <aside className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">First playable snapshot</p>
          <div className="mt-5 space-y-4">
            {sliceMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-3xl border border-[color:var(--line)] bg-white/65 p-4"
              >
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
                <p className="muted-copy mt-2 text-sm leading-6">{metric.note}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {routeCards.map((card) => (
          <article key={card.href} className="glass-panel rounded-[1.75rem] p-6">
            <p className="section-kicker">{card.label}</p>
            <h2 className="mt-4 text-2xl font-semibold">{card.title}</h2>
            <p className="muted-copy mt-3 min-h-20 text-sm leading-7">
              {card.description}
            </p>
            {card.external ? (
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white"
              >
                Open route
              </a>
            ) : (
              <Link
                href={card.href}
                className="mt-6 inline-flex rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white"
              >
                Open route
              </Link>
            )}
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_1.25fr]">
        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">World anchor</p>
          <h2 className="mt-4 text-3xl font-semibold">{firstFaction.name}</h2>
          <p className="mt-2 font-mono text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
            {firstFaction.bloc} sponsor faction
          </p>
          <p className="muted-copy mt-5 text-base leading-7">
            {firstFaction.promise}
          </p>
          <p className="mt-5 rounded-3xl border border-[color:var(--line)] bg-white/65 p-4 text-sm leading-7">
            <span className="font-semibold">Pressure:</span> {firstFaction.tension}
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {firstFaction.signatureUnits.map((unit) => (
              <span key={unit} className="data-chip">
                {unit}
              </span>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Starter roster</p>
          <h2 className="mt-4 text-3xl font-semibold">
            Three AI partners that define the first pair archetypes
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {starterCompanions.map((companion) => (
              <div
                key={companion.name}
                className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/65 p-5"
              >
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  {companion.className}
                </p>
                <h3 className="mt-3 text-xl font-semibold">{companion.name}</h3>
                <p className="mt-2 text-sm text-[color:var(--accent-teal)]">
                  {companion.callsign}
                </p>
                <p className="muted-copy mt-3 text-sm leading-6">
                  {companion.role}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-white/65 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Hub city
            </p>
            <h3 className="mt-3 text-2xl font-semibold">{hubCity.name}</h3>
            <p className="muted-copy mt-3 text-sm leading-7">{hubCity.fantasy}</p>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-panel rounded-[2rem] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Starter human loadouts</p>
              <h2 className="mt-4 text-3xl font-semibold">
                Three openings that become real pair identities
              </h2>
            </div>
            <Link
              href="/command-deck"
              className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white"
            >
              Configure run
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {starterLoadouts.map((loadout) => (
              <div
                key={loadout.id}
                className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5"
              >
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  {loadout.weaponDiscipline} / {loadout.element}
                </p>
                <h3 className="mt-3 text-xl font-semibold">{loadout.name}</h3>
                <p className="muted-copy mt-3 text-sm leading-6">{loadout.role}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {loadout.stats.map((stat) => (
                    <span key={stat.label} className="data-chip">
                      {stat.label}: {stat.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Live event state machine</p>
          <h2 className="mt-4 text-3xl font-semibold">{firstLiveEvent.name}</h2>
          <p className="muted-copy mt-4 text-sm leading-7">{firstLiveEvent.summary}</p>
          <div className="mt-5 grid gap-3">
            {firstLiveEvent.windows.map((window) => (
              <div
                key={window.id}
                className="rounded-3xl border border-[color:var(--line)] bg-white/70 p-4 text-sm leading-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">{window.label}</p>
                  <span className="data-chip">{window.durationMinutes} min</span>
                </div>
                <p className="muted-copy mt-3">{window.summary}</p>
                <p className="mt-3">
                  <span className="font-semibold">Trigger:</span> {window.trigger}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {firstLiveEvent.rewardFocus.map((reward) => (
              <span key={reward} className="data-chip">
                {reward}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="glass-panel rounded-[2rem] p-8">
        <p className="section-kicker">Mission map</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {missionZones.map((zone) => (
            <article
              key={zone.id}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-6"
            >
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                {zone.category}
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{zone.name}</h2>
              <p className="muted-copy mt-3 text-sm leading-7">{zone.summary}</p>
              <div className="mt-5 space-y-3 text-sm leading-7">
                <p>
                  <span className="font-semibold">Objective:</span> {zone.objective}
                </p>
                <p>
                  <span className="font-semibold">Threat:</span> {zone.threat}
                </p>
                <p>
                  <span className="font-semibold">Reward focus:</span> {zone.rewardFocus}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-8">
        <p className="section-kicker">Slice success conditions</p>
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
    </div>
  );
}
