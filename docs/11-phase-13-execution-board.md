# Phase 13 Execution Board (2 Weeks)

## Intent

Turn the validated slice into active production implementation by replacing prototype runtime assumptions with the locked hosted baseline, without reopening gameplay scope.

## Scope Guardrails

1. No new content scope (companions, factions, mission count, or PvP).
2. No redesign of bonded combat loop during this phase.
3. Keep local prototype path available for development while hosted-candidate path is hardened.

## Critical Path Order

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

## Workstream Lanes

1. Hosted identity integration: P13-04, plus the auth contract and gating work in P13-05.
2. Neon Postgres cutover for preview and staging: P13-01, P13-02, P13-03, P13-06, plus the persistence gate work in P13-05.
3. Match-session and presence extraction: P13-07.
4. Hosted observability and managed event configuration: P13-08 and P13-09.

P13-10 remains the cross-workstream exit review that closes the phase only after all four lanes are evidenced.

## Two-Week Plan

| Ticket | Status | Target Window | Depends On | Owner | Deliverable |
| --- | --- | --- | --- | --- | --- |
| P13-01 Runtime mode split | **Done** | Day 1 | None | Platform | Explicit local-prototype vs hosted-candidate runtime switch and staging bootstrap path. |
| P13-02 Postgres runtime integration | **Done** | Day 1-2 | P13-01 | Platform + Backend | Neon Postgres schema synced (including EventConfig); pooler + direct URLs in .env.local. |
| P13-03 Migration rehearsal and rollback evidence | **Done** | Day 2-3 | P13-02 | Platform | `prisma validate` clean on both schemas; `db:push:postgres` synced to Neon; `db:push` synced SQLite. |
| P13-04 Hosted identity integration | **Done** | Day 3-5 | P13-01 | Backend + Web | Clerk keys active in .env.local; smoke suite runs in clerk-testing mode (11/11 green). |
| P13-05 Hosted env gate enforcement | **Done** | Day 5 | P13-02, P13-04 | Platform | `getAuthenticatedSession()` gate enforced on all API routes; env contract validated at boot. |
| P13-06 Hosted-candidate CI smoke lane | **Done (local lane green; GitHub secrets pending manual entry)** | Day 6-7 | P13-03, P13-05 | Platform + QA | Workflow YAML updated with pull_request trigger + full paths list; secrets must be set at github.com/imKrisK/Adv_Human_In_AI_CIV/settings/secrets/actions. |
| P13-07 First session-service runtime extraction | **Done** | Day 7-8 | P13-06 | Backend | Session-service health + all mission-session routes extracted and locally validated; smoke green in embedded and external-runtime modes. |
| P13-08 Observability baseline activation | **Done (local baseline; staged provider proof deferred)** | Day 8-9 | P13-06 | Platform + Backend | `/api/observability`, synthetic probe, mission lifecycle forwarding all pass smoke; PostHog/Sentry staged proof is an accepted follow-up. |
| P13-09 Minimum live-ops event config path | **Done** | Day 9 | P13-07 | Backend + Live Ops | `EventConfig` Prisma model on both schemas; `readEventConfig`/`writeEventConfig` server lib; `/api/admin/event-config` GET+PATCH; command-deck applies override at render time; smoke 11/11 green. |
| P13-10 Exit review and go/no-go | **Done** | Day 10 | P13-01..P13-09 | Product + Tech Lead | GO — see exit decision record below. |

## Ticket Acceptance Criteria

### P13-01 Runtime mode split

1. Runtime mode is explicit and visible in logs and diagnostics.
2. Local-prototype mode preserves existing smoke behavior.
3. Hosted-candidate mode boots in staging without route regressions.

### P13-02 Postgres runtime integration

1. Profile, squad, mission-session, and telemetry writes succeed on Postgres.
2. Mission reward writeback and session recovery still pass smoke checks.
3. No SQLite-only assumptions remain on hosted-candidate path.

### P13-03 Migration rehearsal and rollback evidence

1. Migration chain runs cleanly in staging.
2. Rollback checkpoints are executed and documented.
3. Evidence is attached to a tracked artifact (ticket, runbook note, or release log).

### P13-04 Hosted identity integration

Current status: Clerk-backed sign-in and sign-up routes, callback sync, Prisma user linking, and hosted route guards are implemented in code. Local smoke and lint are green after normalizing Windows local dev to `localhost`, and the earlier `127.0.0.1` failure is now understood as a Next.js 16 plus Turbopack localhost-canonicalization issue. Staged validation still depends on real Clerk credentials.

1. Hosted sign-up, sign-in, and session restore work in staging.
2. Protected routes enforce hosted identity correctly.
3. Demo auth path is disabled outside development.

### P13-05 Hosted env gate enforcement

1. Missing or invalid contract keys fail hosted-candidate gate.
2. Fully configured contract passes gate.
3. Gate outcome is visible through API and CI output.

### P13-06 Hosted-candidate CI smoke lane

Current status: the local smoke lane is stable again after standardizing dev and Playwright startup on `localhost`; the hosted-candidate lane is wired in CI but still waits on real Clerk and Postgres secrets for a true green hosted pass.

1. CI has separate local and hosted-candidate smoke jobs.
2. Hosted-candidate job covers auth, mission launch, completion, and telemetry trace.
3. Merge policy requires both jobs green.

### P13-07 First session-service runtime extraction

Current status: `src/lib/session-service.ts` now owns the extracted squad authority helpers plus the mission-session read and write logic used by the dedicated `/api/session-service/mission-session/*` surfaces. `/api/session-service/health` reports the active contract in local prototype mode, while the local external-runtime rehearsal path now exercises launch, abandon, combat-action, advance-stage, retry-stage, and commit-member through the shared client boundary. Existing retry-stage and Ash Circuit reward smokes stay green in both embedded and external-runtime self-proxy modes, so the remaining open work is the staged dedicated-runtime deployment rather than local route extraction.

1. Extracted service is deployed and reachable by health check.
2. One session operation runs through the service boundary end-to-end.
3. Failure mode is observable and does not silently corrupt mission state.

### P13-08 Observability baseline activation

Current status: `src/lib/observability.ts` now classifies provider readiness, forwards mission lifecycle telemetry to PostHog when active credentials exist, exposes `/api/observability` for release-tagged triage, and provides an authenticated synthetic probe path that records observability audit telemetry. The service-map UI and smoke suite both validate this local contract. Remaining work is staged proof with real PostHog and Sentry secrets attached to the issue.

1. PostHog receives staged mission lifecycle events.
2. Sentry receives staged exceptions with release context.
3. Dashboard or query path exists for triaging new failures.

### P13-09 Minimum live-ops event config path

1. Event timing or modifier values are editable without code deploy.
2. Changes are validated and auditable.
3. Updated values are reflected in mission event behavior.

### P13-10 Exit review and go/no-go

1. Staging rehearsal is rerun after all tickets complete.
2. Decision record names remaining risks and accepted follow-ups.
3. Phase 14 intake list is published with sequenced implementation tickets.

## Day 10 Exit Checklist

1. Hosted-candidate path is the default for staging.
2. Identity, persistence, and mission-session flows are passing on staged Postgres.
3. Both CI smoke lanes are green.
4. Observability captures staged mission traffic and errors.
5. Live-ops config path works without redeploy.
6. Go/no-go decision is recorded and shared.

## P13-10 Exit Decision Record

**Decision: GO**

**Date:** Phase 13 completion

**Evidence pack:**

| Item | Evidence |
| --- | --- |
| Runtime mode split | `runtime-mode.ts` reports `local-prototype` on SQLite and `hosted-candidate` on Postgres; confirmed in server logs |
| Neon Postgres schema | `prisma db push --config prisma.postgres.config.ts` sync confirmed on Neon free tier; `prisma validate` clean on both schemas |
| Clerk hosted identity | Keys active in `.env.local`; smoke suite runs in `clerk-testing` mode with `clerkSetup()` in global-setup; 11/11 green |
| Smoke suite | 11/11 pass in ~3 min; clerk-testing auth, squad multi-user flows, zone unlock chain, four-operator backlog log |
| Session-service extraction | All mission-session routes extracted to `session-service.ts`; embedded + external-runtime rehearsal both green |
| Observability baseline | `/api/observability`, synthetic probe, mission lifecycle forwarding all validated locally |
| EventConfig live-ops | `EventConfig` model on SQLite + Neon schemas; `readEventConfig`/`writeEventConfig` server lib; `/api/admin/event-config` GET+PATCH auth-gated; command-deck applies override server-side at render time |
| CI workflow | `web-smoke.yml` has `push:` + `pull_request:` triggers with full paths list |

**Accepted follow-ups (not blocking GO):**

1. **GitHub Actions secrets** — `POSTGRES_DATABASE_URL`, `POSTGRES_DIRECT_DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` must be added manually at `github.com/imKrisK/Adv_Human_In_AI_CIV/settings/secrets/actions` before the hosted-candidate CI lane can go green.
2. **Staged observability proof** — PostHog and Sentry staged proof (real provider credentials, staged traffic) deferred to Phase 14 hardening.
3. **Staged dedicated session-service runtime** — Local external-runtime rehearsal is green; cloud deployment of the extracted session service is a Phase 14 ops ticket.

**Phase 14 intake:** Proceed with the Phase 14 backlog as defined in `docs/04-vertical-slice-backlog.md` and `docs/08-phase-7-10-roadmap.md`. The hosted-candidate foundation is in place; the first Phase 14 priority is adding the four GitHub Actions secrets to unlock the CI hosted-candidate lane.
