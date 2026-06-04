# Phase 7 To Phase 13 Roadmap

## Current Baseline

The prototype has already cleared the foundation phases:

- product shell
- first-session flow
- bonded combat prototype
- content and world foundation
- authenticated persistence and reward writeback
- smoke coverage for the current solo deployment path
- shared mission-session launch and per-member squad reward writeback

Phase 7 has now started inside the web mission prototype with per-stage enemy telegraphs, elemental reaction windows, and a smoke assertion on the first Ash Circuit telegraph surface.

## Phase 7: Combat Readability And Reaction Layer

Objective: make the first two mission zones readable, teachable, and tactically distinct before co-op complexity is added.

| ID | Status | Ticket | Done When |
| --- | --- | --- | --- |
| P7-01 | Done | Add per-stage enemy telegraphs to the mission data and encounter console. | Every stage surfaces a telegraph name, cue, counterplay hint, and live or resolved state in the mission UI. |
| P7-02 | Done | Add one elemental reaction window per mission stage. | Each stage exposes a reaction element, reaction name, and authored reaction outcome that a matching pair can trigger. |
| P7-03 | Done | Add smoke coverage for the first telegraph and reaction surface. | The Ash Circuit smoke path asserts that the first telegraph and its reaction-ready state render in the browser. |
| P7-04 | Done | Tune telegraph surge pressure and reaction bonus damage across all six stages. | Storm, Frost, and Ember pairings all survive their intended routes without collapsing into one dominant answer. |
| P7-05 | Done | Teach telegraphs and reactions in the first-session flow. | A new player gets one readable explanation of telegraph timing, reaction matching, and why pair choice matters before the first mission clear. |
| P7-06 | Later | Add stronger visual state changes for telegraph break, reaction fire, and suppress windows. | The encounter console makes telegraph breakpoints and reaction triggers obvious without reading the log line by line. |

## Phase 8: Squad Foundations

Objective: move from a validated solo bonded-combat slice into a reliable two-to-four player mission launch flow.

| ID | Status | Ticket | Done When |
| --- | --- | --- | --- |
| P8-01 | Done | Define the party session contract for squad members, selected pairings, and staged mission choice. | The app can persist a squad record with player slots, selected pair identities, and current mission target. |
| P8-02 | Done | Build a command-deck squad create and join flow. | A player can create a squad, share a join code or link, and see another player appear in the staging surface. |
| P8-03 | Done | Add mission-ready launch gating for squads. | A mission cannot launch until each squad member has locked a loadout, AI partner, and ready state. |
| P8-04 | Done | Support per-player reward writeback after squad mission completion. | Every squad member receives the correct progression writeback without overwriting another member's selected pairing or mission history. |
| P8-05 | Done | Add reconnect and host-handoff rules for a single mission run. | A dropped player can re-enter a squad session, and one disconnect does not collapse the entire run. |
| P8-06 | Done | Persist shared mission stage progress and add host-led mission recovery. | Stage and combat progress survive reconnect through `MissionSession`, and a host or solo operator can abandon a stuck deployment without waiting on reward commit cleanup. |

## Phase 9: Concord Breach Live Event

Objective: turn the current Glass Wastes proof-of-play into the first true recurring public event loop.

| ID | Status | Ticket | Done When |
| --- | --- | --- | --- |
| P9-01 | Done | Define the event-state model for inactive, warning, live, and recovery windows. | The prototype can represent Concord Breach as a timed state machine instead of a static mission card. |
| P9-02 | Done | Convert Glass Wastes into a rotating Concord Breach event mode. | The zone changes objective emphasis and messaging based on current event state. |
| P9-03 | Done | Add contribution tracking and reward bands for the live event. | The player earns distinct event credit for defense, support, and completion performance. |
| P9-04 | Done | Surface event state across overview, command deck, and field guide routes. | The user can see when Concord Breach is warming up, active, or cooling down without entering mission routes first. |
| P9-05 | Later | Add a lightweight live-ops control surface for event timing and modifier tuning. | Start time, active modifiers, and reward multipliers can change without a code deploy. |

## Phase 10: Telemetry, Balance, And Slice Exit

Objective: decide whether the slice is production-worthy by measuring it, balancing it, and testing it with a full squad.

| ID | Status | Ticket | Done When |
| --- | --- | --- | --- |
| P10-01 | Done | Instrument onboarding, mission completion, and phase progression funnels. | The team can see where players drop in arrival, pairing, briefing, mission, and recovery. |
| P10-02 | Done | Instrument pair selection, telegraph failure, and reaction trigger rates. | The prototype reports which pairings are chosen, where players fail, and whether elemental reactions are actually being used. |
| P10-03 | Done | Create a starter-build balance checklist for time-to-kill, survivability, and reaction uptime. | Each starter pair has a measurable target range instead of qualitative balance guesswork. |
| P10-04 | Done | Run one four-player playtest and log issues by severity. | The slice has a recorded squad playtest with critical, major, and polish issues separated clearly. |
| P10-05 | Done | Make the slice exit decision. | The team decides whether to spend one more polish phase on combat and co-op stability or advance into broader service production. |

Current exit call: advance into broader service production. The reviewed four-player Ash Circuit pass now clears with no critical, major, or polish findings, so Phase 11 starts from a clean validated session baseline.

## Phase 11: Broader Service Production Planning

Objective: convert the validated slice into the smallest credible production-service plan without reopening core combat scope.

| ID | Status | Ticket | Done When |
| --- | --- | --- | --- |
| P11-01 | Done | Lock the product surface split across the browser-playable client, player web portal, and admin live-ops console. | Each surface has clear responsibilities, shared auth assumptions, and explicit overlap rules. |
| P11-02 | Done | Define first production service boundaries for identity, progression, match-session, live event, and content configuration. | The team knows which responsibilities stay in the web app, which move to realtime or worker services, and what data each boundary owns. |
| P11-03 | Done | Choose the hosted platform baseline for web, realtime, data, cache, analytics, and error tracking. | The repo has an agreed deployable baseline for frontend hosting, Postgres, Redis, realtime runtime, analytics, and error reporting. |

Current planning baseline: `/service-map` and `/api/service-map` now lock the three player or staff product surfaces, the first five production service boundaries, and one hosted deployment baseline: Vercel for web surfaces, Fly.io for realtime and workers, Neon Postgres, Upstash Redis, Cloudflare R2, Clerk, PostHog, and Sentry.

## Phase 12: Deployment Execution Readiness

Objective: turn the locked Phase 11 stack choice into an execution checklist for migrations, environment setup, and rollout order before production implementation starts.

| ID | Status | Ticket | Done When |
| --- | --- | --- | --- |
| P12-01 | Done | Rehearse the Postgres migration path from local SQLite assumptions into staged Neon Postgres. | Preview and staging can run the production Prisma migration chain against Neon Postgres with rollback notes for each schema step. |
| P12-02 | Done | Provision the environment and secret contract across Vercel, Fly, Neon, Upstash, Clerk, PostHog, and Sentry. | Every preview, staging, and production runtime has a named secret owner and one verification step before promotion. |
| P12-03 | Done | Lock rollout order and release gates for migrations, web deploys, workers, realtime, and smoke checks. | The release runbook names the order of operations, smoke gates after each step, and the stop conditions for rollback. |

Current execution baseline: `/service-map` and `/api/service-map` now carry the shared execution checklist plus three concrete assets: `/planning/prisma-postgres-migration-runbook.md`, `/planning/production-environment-contract.env.example`, and `/planning/production-release-runbook.md`. Phase 12 is now locked as a completed deployment-readiness baseline.

## Phase 13: Production Cutover Kickoff

Objective: move from a validated prototype runtime into active production implementation without reopening gameplay scope.

Phase 13 workstreams:

1. Hosted identity integration: P13-04, plus the auth side of P13-05.
2. Neon Postgres cutover for preview and staging: P13-01, P13-02, P13-03, P13-06, plus the persistence gate side of P13-05.
3. Match-session and presence extraction: P13-07.
4. Hosted observability and managed event configuration: P13-08 and P13-09.

Cross-workstream closeout: P13-10 is the shared exit review after all four workstreams report green evidence.

| ID | Status | Ticket | Done When |
| --- | --- | --- | --- |
| P13-01 | Done | Add explicit runtime mode for local-prototype versus hosted-candidate execution. | Both runtime modes boot cleanly, and hosted-candidate mode can be exercised in staging without changing gameplay behavior. |
| P13-02 | In Progress | Integrate Postgres runtime path for web app reads and writes. | Profile, squad, mission-session, telemetry, and reward-writeback flows run against Postgres in staging. |
| P13-03 | Next | Rehearse migration deploy and rollback in staging. | The Prisma migration path and rollback checkpoints are run end-to-end and recorded with evidence. |
| P13-04 | In Progress (local implementation complete) | Implement hosted identity path for production auth. | Hosted sign-in, sign-up, callback sync, and route guards are implemented in code; local smoke and lint are green on the localhost-normalized dev path, and staged validation is still pending while demo auth stays development-only. |
| P13-05 | In Progress | Enforce hosted environment contract as a release gate. | Hosted-candidate promotion is blocked when required env keys are missing or invalid, and passes when complete. |
| P13-06 | In Progress | Add hosted-candidate smoke coverage in CI. | CI requires both local smoke and hosted-candidate smoke before merge; local smoke is standardized on localhost for Windows stability, while hosted-candidate validation still waits on real secrets. |
| P13-07 | In Progress (local boundary validated) | Extract first session-service runtime skeleton. | A staged service boundary handles health checks and one validated session job path, building on the already-green local extracted mission routes. |
| P13-08 | In Progress (local baseline implemented) | Enable hosted observability baseline. | Release-tagged observability status, triage JSON, synthetic probe path, and mission lifecycle forwarding are implemented locally; staged PostHog and Sentry proof still depends on real hosted secrets. |
| P13-09 | Next | Add minimum live-ops event configuration path. | Concord Breach timing or modifier values can be changed in staging without a redeploy. |
| P13-10 | Next | Run Phase 13 exit review and go or no-go decision. | A full staging rehearsal and evidence pack confirms readiness for Phase 14 implementation intake. |

Critical path order:

1. P13-01
2. P13-02
3. P13-03
4. P13-04
5. P13-05
6. P13-06
7. P13-07
8. P13-08
9. P13-09
10. P13-10

## Recommended Execution Order

1. Finish Phase 7 tuning and teaching before adding more systems.
2. Build only the minimum squad layer needed to launch shared missions.
3. Turn Glass Wastes into the first true event-state loop.
4. Instrument and playtest before expanding world scope, roster size, or feature count.
5. After the exit call is green, lock production surfaces and service boundaries before adding broader live-service feature scope.
6. After the hosted stack is locked, rehearse migrations, provision environment contracts, and sequence rollout gates before implementation work starts.
7. Execute the Phase 13 critical path in order (P13-01 through P13-10) before taking additional feature scope.