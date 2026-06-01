# Vertical-Slice Backlog

## Slice Intent

Build a first playable that proves the core promise of the project:

One human, one bonded AI Instance, one faction-aligned hub city, two mission zones, a recurring live event, and persistent progression inside a web-first online product.

The slice must prove that the game's identity comes from a bonded human-plus-AI pairing, not from pet collection, passive stat growth, or MMO grind sprawl.

## Reinvention Rules

1. The AI partner must feel like a co-agent, not a pet or passive stat stick.
2. The first session must be pressure-driven and readable, not a field-grind treadmill.
3. Player identity should come from pair archetypes, not from a bloated companion roster.
4. Depth of bond interaction matters more than quantity of collectible units.

## Slice Walkthrough

1. The player creates or loads an account and enters Lattice Haven.
2. The player selects a starter weapon discipline and bonds with one AI companion that defines the first build identity.
3. The player completes a guided mission in the Ash Circuit.
4. The player unlocks one elemental attunement and one bond combo.
5. The player returns to the hub, upgrades the human, AI, and bond tracks, and joins a live event queue.
6. The player completes a public event in the Glass Wastes with up to three other players.
7. Rewards update the account, loadout, AI state, and bond state.

## Definition Of Done

1. A new player can complete a full first session in 15 to 20 minutes without developer tools.
2. Each starter AI companion feels like a build-defining co-agent with a distinct combat and social identity.
3. The live event changes zone priorities in a visible way instead of being a background timer.
4. A four-player co-op run completes without progression loss or severe state desync.
5. The web client can surface the same core content in both UI pages and an API contract.
6. The first slice proves a pressure-driven mission loop without drifting into passive field grinding.

## Current Status Snapshot

- Slice validation status: green
- Smoke coverage: 10 Playwright smoke checks passing on May 31, 2026
- Exit call: advance into broader service production
- Remaining prototype-era gaps: hosted identity, Neon Postgres runtime cutover, session-service extraction, live-ops controls, and hosted observability wiring
- Reconciliation source: roadmap and in-app backlog contract are now aligned through Phase 13 kickoff

## Milestone 0: Product Skeleton

| ID | Status | Task | Done When |
| --- | --- | --- | --- |
| VS-01 | Done | Scaffold the player-facing web prototype under `apps/web`. | The app boots with Next.js, lint passes, and the project has a stable route structure. |
| VS-02 | Done | Create a shared content model for the first playable. | The home page, field guide, backlog page, and API route all render from the same prototype data source. |
| VS-03 | Done | Add route-level metadata and product copy that reflects the actual game direction. | The scaffold no longer contains generic framework placeholder text. |

## Milestone 1: First-Session Flow

| ID | Status | Task | Done When |
| --- | --- | --- | --- |
| VS-04 | Done | Build the onboarding flow from Lattice Haven into the first mission. | A player can move from hub view to mission briefing to mission completion in one clear path. |
| VS-05 | Done | Lock one starter human loadout per weapon discipline. | Arc Blade, Rail Caster, and Flux Gauntlet each have a clear role and starter stats. |
| VS-06 | Done | Implement the starter AI selection moment. | The player chooses CAIRN-7, VEIL-3, or TALON-9 and sees the choice reflected in the session state. |

## Milestone 2: Bonded Combat Prototype

| ID | Status | Task | Done When |
| --- | --- | --- | --- |
| VS-07 | Done | Prototype one light attack, one heavy attack, one dodge, and one bond command per starter build. | The player can test a full combat loop with one input set and one partner command set. |
| VS-08 | Done | Implement one bond finisher for each starter AI companion. | Each companion can trigger a unique linked ability with visible audiovisual feedback. |
| VS-09 | Done | Add enemy telegraphs and elemental reactions for the first two mission zones. | The player can read threats and exploit Ember, Frost, or Storm interactions. |

## Milestone 3: Content And World Foundation

| ID | Status | Task | Done When |
| --- | --- | --- | --- |
| VS-10 | Done | Define the first playable faction, hub city, and starter AI roster. | The faction, hub districts, and three starter companions are documented and mirrored in the prototype data. |
| VS-11 | Done | Block out the two launch mission zones. | Ash Circuit and Glass Wastes have objective flow, encounter roles, and reward identities. |
| VS-12 | Done | Script the first-contact narrative arc. | The player receives a faction intro, a hub arrival moment, and a first crisis mission with resolution. |

## Milestone 4: Persistence And Services

| ID | Status | Task | Done When |
| --- | --- | --- | --- |
| VS-13 | Done | Define the player profile, loadout, AI instance, and bond state schema. | The data contract supports saving starter choice, unlock state, and last completed mission. |
| VS-14 | Done | Add authenticated save and load flows. | A player can reload the app and recover their current loadout and companion state. |
| VS-15 | Done | Add reward application and progression writeback. | Mission rewards mutate human, AI, and bond progression without manual admin edits. |

## Milestone 5: Co-Op And Live Event

| ID | Status | Task | Done When |
| --- | --- | --- | --- |
| VS-16 | Done | Stand up party creation and join flow for two to four players. | Players can form a squad, launch a mission, and keep their selected companions. |
| VS-17 | Done | Implement the first recurring public event: Concord Breach. | The event rotates on schedule, changes the active zone, and grants distinct rewards. |
| VS-18 | Later | Add a basic live-ops control surface for event tuning. | Event start time, modifiers, and reward values can be changed without a code deploy. |

## Validation And Slice Exit

The slice has already cleared its validation gate.

- Telemetry exists for onboarding, pair selection, phase progression, mission launch and completion, reaction triggers, and telegraph failures.
- The four-player reviewed pass is recorded and the exit decision is now to advance.
- The current validated slice is strong enough to move into service-production implementation without reopening core combat scope.

## Milestone 6: Broader Service Production

| ID | Status | Task | Done When |
| --- | --- | --- | --- |
| VS-19 | Done | Lock the product surface split. | Each surface has a named responsibility set, shared auth assumptions, and clear overlap rules. |
| VS-20 | Done | Define first production service boundaries. | The team knows which responsibilities stay in the web app, which move to realtime or worker services, and what data each boundary owns. |
| VS-21 | Done | Choose the hosted platform baseline. | The repo has an agreed production baseline for frontend hosting, Postgres, Redis, realtime runtime, analytics, and error reporting. |

## Milestone 7: Deployment Execution Readiness

| ID | Status | Task | Done When |
| --- | --- | --- | --- |
| VS-22 | Done | Rehearse the Postgres migration path. | Preview and staging can run the migration chain against Neon Postgres, and the team has a rollback note for each production schema step. |
| VS-23 | Done | Provision the environment and secret contract. | Every preview, staging, and production runtime has an explicit secret owner and verification check. |
| VS-24 | Done | Lock rollout order and release gates. | The release order, smoke checkpoints, and rollback conditions are explicit before the first production promotion. |

## Milestone 8: Phase 13 Production Foundation Implementation

| ID | Status | Task | Done When |
| --- | --- | --- | --- |
| VS-25 | In Progress | Integrate hosted identity. | Clerk-backed sign-in, sign-up, session restore, and staff-claim routing replace the local credential-only auth path. |
| VS-26 | In Progress | Cut the staged runtime over to Neon Postgres. | Preview and staging run the app against Postgres instead of SQLite, and profile, squad, mission-session, and reward writes still pass smoke coverage. |
| VS-27 | In Progress | Extract match-session authority and presence. | Squad staging, host handoff, reconnect, and live mission state run through the intended session boundary with Redis-backed coordination. |
| VS-28 | Next | Wire hosted observability and managed event configuration. | PostHog and Sentry receive real staged traffic, and Concord Breach timing and modifier values stop depending on hardcoded prototype data. |

Execution note: the full implementation sequence for Phase 13 is tracked in `docs/11-phase-13-execution-board.md` with the ordered P13-01 through P13-10 critical path and acceptance criteria.

## Scope Locks

1. Do not add PvP to the first playable.
2. Do not treat AI partners as passive pets or stat sticks.
3. Do not expand beyond one playable faction sponsor, one hub city, and one enemy pressure source before pair identity feels strong.
4. Do not add more than three starter companions before the first trio feels distinct, reactive, and socially legible.
5. Do not build seasonal content tooling, open grind fields, or open-world traversal before one pressure-driven mission loop and one hub loop are already fun.