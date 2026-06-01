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
| P13-01 Runtime mode split | Done | Day 1 | None | Platform | Explicit local-prototype vs hosted-candidate runtime switch and staging bootstrap path. |
| P13-02 Postgres runtime integration | In Progress | Day 1-2 | P13-01 | Platform + Backend | Web app read/write flows running on Postgres in staging. |
| P13-03 Migration rehearsal and rollback evidence | Next | Day 2-3 | P13-02 | Platform | Logged migration plus rollback rehearsal using staged Postgres chain. |
| P13-04 Hosted identity integration | In Progress | Day 3-5 | P13-01 | Backend + Web | Hosted auth routes, callback sync, and guards are implemented locally; staged Clerk validation is still pending. |
| P13-05 Hosted env gate enforcement | In Progress | Day 5 | P13-02, P13-04 | Platform | Promotion gate blocks missing or invalid hosted contract variables. |
| P13-06 Hosted-candidate CI smoke lane | In Progress | Day 6-7 | P13-03, P13-05 | Platform + QA | CI requires local smoke and hosted-candidate smoke checks. |
| P13-07 First session-service runtime extraction | In Progress (local boundary validated) | Day 7-8 | P13-06 | Backend | Session-service health plus launch, abandon, combat-action, advance-stage, retry-stage, and commit-member routes are extracted and locally validated in embedded and external-runtime rehearsal modes; staged dedicated-runtime deployment remains open. |
| P13-08 Observability baseline activation | Next | Day 8-9 | P13-06 | Platform + Backend | PostHog and Sentry receive staged release-tagged traffic and errors. |
| P13-09 Minimum live-ops event config path | Next | Day 9 | P13-07 | Backend + Live Ops | Event timing or modifier values update in staging without redeploy. |
| P13-10 Exit review and go/no-go | Next | Day 10 | P13-01..P13-09 | Product + Tech Lead | Evidence pack and Phase 14 intake decision. |

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
