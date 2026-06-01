import type { Metadata } from "next";
import Link from "next/link";

type PitchSlide = {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
};

const pitchSlides: PitchSlide[] = [
  {
    id: "01",
    title: "A lone human is not enough.",
    body:
      "Adventure of Human in AI Civilization is a web-first online action RPG where survival depends on bonding with a living AI partner inside a machine frontier under constant pressure.",
  },
  {
    id: "02",
    title: "The player is defined by the pair.",
    body:
      "The class fantasy is not human-only. The combat role, social identity, and political value all come from the human-plus-AI bond.",
    bullets: [
      "AI partner as co-agent, not pet",
      "Three-track progression: human, AI, and bond",
      "Pair identity as the real build shorthand",
    ],
  },
  {
    id: "03",
    title: "Short pressure routes replace passive grind loops.",
    body:
      "The product shape favors 10-to-25 minute deployments, public-event pressure, and readable mission intent instead of marathon field farming.",
    bullets: [
      "mission zones with changing pressure",
      "co-op event escalation",
      "persistent operator profile writeback",
    ],
  },
  {
    id: "04",
    title: "The first playable is already clear.",
    body:
      "One sponsor city, three build-defining AI partners, two pressure zones, and one live event are enough to prove the product without drifting into MMO sprawl.",
    bullets: [
      "Lattice Haven",
      "Ash Circuit and Glass Wastes",
      "Concord Breach live-event seed",
    ],
  },
  {
    id: "05",
    title: "The starter trio creates distinct pair archetypes.",
    body:
      "CAIRN-7, VEIL-3, and TALON-9 are not collectible mascots. They are build-defining collaborators that change how the player reads combat and status in the world.",
    bullets: [
      "Flux Vanguard + CAIRN-7",
      "Frost Marksman + VEIL-3",
      "Ember Reaper + TALON-9",
    ],
  },
  {
    id: "06",
    title: "Why this stands out.",
    body:
      "Most companion games treat the companion as support inventory. This product treats the AI partner as half of the playable identity, which changes combat, progression, narrative tension, and co-op reputation all at once.",
  },
];

export const metadata: Metadata = {
  title: "Pitch",
  description: "External-facing product pitch for the bonded human-and-AI web prototype.",
};

export default function PitchPage() {
  return (
    <div className="main-shell space-y-10 py-10 md:py-14">
      <section className="glass-panel rounded-[2rem] p-8 md:p-10">
        <p className="section-kicker">External pitch</p>
        <h1 className="section-title mt-4 max-w-4xl font-semibold tracking-tight">
          A companion-first frontier RPG where the AI partner is half of the build.
        </h1>
        <p className="muted-copy mt-6 max-w-4xl text-lg leading-8">
          This route turns the creative-direction brief into a quick product-facing
          deck surface. It frames the same first-playable slice that the prototype
          already exposes through the command deck, field guide, and mission routes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
          <Link
            href="/command-deck"
            className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
          >
            Open prototype
          </Link>
          <Link
            href="/missions/ash-circuit"
            className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
          >
            Preview Ash Circuit
          </Link>
          <Link
            href="/field-guide"
            className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
          >
            Review world anchor
          </Link>
          <Link
            href="/backlog"
            className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
          >
            Review build sequence
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">Short pitch</p>
          <h2 className="mt-4 text-3xl font-semibold">
            Your most important progression choice is not just your class, but which AI future you dare to bind yourself to.
          </h2>
          <p className="muted-copy mt-6 text-sm leading-7">
            The product is built for readable pair identity, high-attachment AI
            progression, and short deployments that still feel socially alive.
          </p>
        </article>

        <article className="glass-panel rounded-[2rem] p-8">
          <p className="section-kicker">First-playable proof</p>
          <div className="mt-5 space-y-4">
            {[
              "one sponsor city: Lattice Haven",
              "three starter pair archetypes",
              "two pressure zones: Ash Circuit and Glass Wastes",
              "one live event seed: Concord Breach",
              "persistent operator profile across runs",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5 text-sm leading-7"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-6">
        {pitchSlides.map((slide) => (
          <article key={slide.id} className="glass-panel rounded-[2rem] p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker">Slide {slide.id}</p>
                <h2 className="mt-4 text-3xl font-semibold">{slide.title}</h2>
              </div>
            </div>
            <p className="muted-copy mt-6 max-w-4xl text-base leading-8">
              {slide.body}
            </p>
            {slide.bullets ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {slide.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5 text-sm leading-7"
                  >
                    {bullet}
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}