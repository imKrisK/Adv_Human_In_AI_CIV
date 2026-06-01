# Phase 13 GitHub Issue Pack

## Purpose

Provide a copy-paste issue block for each Phase 13 ticket so the team can open implementation issues immediately with consistent ownership, dependencies, labels, and done criteria.

## Owner Lanes

- Platform
- Backend
- Web
- QA
- Live Ops
- Product

## Suggested Labels

- phase-13
- critical-path
- p13-01 to p13-10
- workstream-identity
- workstream-postgres
- workstream-session
- workstream-observability
- platform
- backend
- web
- qa
- live-ops
- product
- data
- auth
- observability
- ci-cd

## Two-Week Schedule And Dependency Map

| Ticket | Workstream | Day Window | Depends On | Primary Owner Lane | Supporting Lanes |
| --- | --- | --- | --- | --- | --- |
| P13-01 | Neon Postgres cutover | Day 1 | None | Platform | Backend |
| P13-02 | Neon Postgres cutover | Day 1-2 | P13-01 | Platform | Backend |
| P13-03 | Neon Postgres cutover | Day 2-3 | P13-02 | Platform | Backend |
| P13-04 | Hosted identity integration | Day 3-5 | P13-01 | Backend | Web |
| P13-05 | Hosted identity + Neon Postgres gate | Day 5 | P13-02, P13-04 | Platform | Backend |
| P13-06 | Neon Postgres cutover | Day 6-7 | P13-03, P13-05 | Platform | QA |
| P13-07 | Match-session and presence extraction | Day 7-8 | P13-06 | Backend | Platform |
| P13-08 | Hosted observability and managed event configuration | Day 8-9 | P13-06 | Platform | Backend |
| P13-09 | Hosted observability and managed event configuration | Day 9 | P13-07 | Backend | Live Ops |
| P13-10 | Cross-workstream closeout | Day 10 | P13-01 through P13-09 | Product | Platform, Backend, QA |

## GitHub-Issue-Ready Blocks

### P13-01

Title: P13-01 Runtime Mode Split For Hosted-Candidate Cutover

Workstream: Neon Postgres cutover for preview and staging

Labels: phase-13, critical-path, p13-01, platform, workstream-postgres

Primary owner lane: Platform

Supporting lanes: Backend

Day window: Day 1

Dependencies: None

Status: Done (May 31, 2026)

Summary:
Add an explicit runtime mode split so local-prototype and hosted-candidate execution are both first-class paths during cutover.

Implementation checklist:
- [x] Add explicit runtime mode flag and startup diagnostics.
- [x] Keep local-prototype path behavior unchanged.
- [x] Enable hosted-candidate boot path for staging.

Acceptance criteria:
1. Runtime mode is explicit and visible in app diagnostics.
2. Local-prototype mode still passes existing smoke flows.
3. Hosted-candidate mode boots in staging without route-level regressions.

Definition of done:
1. Pull request merged with runtime mode split.
2. Evidence captured for both mode boots.
3. Follow-on tickets can target hosted-candidate path without local-path breakage.

Evidence for issue attachment:
1. Validation: `npm run lint` and `npm run test:smoke` both pass in `apps/web`.
2. Local mode boot evidence:
	- `APP_RUNTIME_MODE=local-prototype`, `DATABASE_URL=file:./dev.db`
	- Startup log: `[runtime] mode=local-prototype source=env databaseUrlKind=sqlite-file prismaPath=better-sqlite3-adapter`
	- Route evidence: `GET /backlog 200`
3. Hosted-candidate mode boot evidence:
	- `APP_RUNTIME_MODE=hosted-candidate`, `DATABASE_URL=file:./dev.db`
	- Startup log: `[runtime] mode=hosted-candidate source=env databaseUrlKind=sqlite-file prismaPath=better-sqlite3-adapter`
	- Route evidence: `GET /backlog 200`
4. Regression evidence:
	- Playwright smoke suite: `10 passed`.

### P13-02

Title: P13-02 Postgres Runtime Integration For Staging

Workstream: Neon Postgres cutover for preview and staging

Labels: phase-13, critical-path, p13-02, platform, backend, data, workstream-postgres

Primary owner lane: Platform

Supporting lanes: Backend

Day window: Day 1-2

Dependencies: P13-01

Status: In Progress (bootstrap path implemented; staged validation still pending)

Summary:
Move runtime persistence reads and writes onto Postgres for staged environments while preserving gameplay behavior.

Implementation checklist:
- [x] Enable Postgres runtime connection path.
- [ ] Validate profile, squad, mission-session, telemetry, and reward writes.
- [ ] Remove staged SQLite-only assumptions.

Acceptance criteria:
1. Profile, squad, mission-session, telemetry, and reward-writeback flows run against Postgres in staging.
2. Mission completion and recovery flows remain stable under smoke.
3. Hosted-candidate path has no SQLite runtime dependency.

Definition of done:
1. Staging run completes using Postgres-backed runtime.
2. Smoke evidence attached for key write paths.
3. No blocking data regression remains for P13-03.

### P13-03

Title: P13-03 Migration Rehearsal And Rollback Evidence

Workstream: Neon Postgres cutover for preview and staging

Labels: phase-13, critical-path, p13-03, platform, data, workstream-postgres

Primary owner lane: Platform

Supporting lanes: Backend

Day window: Day 2-3

Dependencies: P13-02

Summary:
Execute a full staged migration rehearsal and validate rollback checkpoints.

Implementation checklist:
- [ ] Run migration chain in staging.
- [ ] Execute rollback checkpoints.
- [ ] Record evidence and update runbook notes.

Acceptance criteria:
1. Migration chain runs cleanly in staged environment.
2. Rollback checkpoints execute successfully.
3. Evidence is attached to the issue and linked to runbook artifacts.

Definition of done:
1. Migration rehearsal log and rollback log are published.
2. Known migration risks are documented.
3. P13-06 hosted smoke lane can rely on staged schema state.

### P13-04

Title: P13-04 Hosted Identity Path Integration

Workstream: Hosted identity integration

Labels: phase-13, critical-path, p13-04, backend, web, auth, workstream-identity

Primary owner lane: Backend

Supporting lanes: Web

Day window: Day 3-5

Dependencies: P13-01

Status: In Progress (provider routes, callback sync, Prisma user linking, and route guards are implemented; staged Clerk validation is still pending)

Summary:
Implement hosted identity path for production-oriented auth and route protection, while keeping demo path development-only.

Implementation checklist:
- [x] Enable hosted sign-up, sign-in, and session restore path.
- [x] Apply protected-route checks against hosted identity.
- [x] Restrict demo auth path to development usage.

Current evidence:
1. Local build, lint, and smoke validation are green after the Clerk integration.
2. Real staged validation remains blocked until Clerk credentials are provisioned.

Acceptance criteria:
1. Hosted sign-up, sign-in, and session restore are functional in staging.
2. Protected routes enforce hosted identity correctly.
3. Demo auth path is unavailable outside development.

Definition of done:
1. Auth flow validation evidence is attached.
2. Route guards are active in hosted-candidate mode.
3. P13-05 can enforce env gates against real hosted auth requirements.

### P13-05

Title: P13-05 Hosted Environment Contract Gate Enforcement

Workstream: Hosted identity integration plus Neon Postgres gate enforcement

Labels: phase-13, critical-path, p13-05, platform, auth, data, workstream-identity, workstream-postgres

Primary owner lane: Platform

Supporting lanes: Backend

Day window: Day 5

Dependencies: P13-02, P13-04

Status: In Progress (failure path and local pass-case evidence are live; real hosted secret rollout is still pending)

Summary:
Turn environment contract checks into promotion gates for hosted-candidate pipelines.

Implementation checklist:
- [x] Fail gate on missing or invalid hosted contract keys.
- [x] Pass gate when hosted contract is complete.
- [x] Expose gate status in CI and API responses.

Current evidence:
1. Failure-path gate enforcement is live through the environment-contract route and CI-facing output.
2. A local hosted-candidate boot with a syntactically complete provider contract returned `STATUS_CODE:200`, `GATE_STATUS:pass`, `CONTRACT_READY:True`, `MISSING_COUNT:0`, and `INVALID_COUNT:0` from `/api/environment-contract`.
3. Real hosted secret-store rollout and staged provider wiring are still pending, so the ticket remains in progress.

Acceptance criteria:
1. Missing or invalid contract keys block hosted-candidate promotion.
2. Fully configured hosted contract passes gate.
3. Gate outcomes are visible and auditable in pipeline output.

Definition of done:
1. Hosted env gate is active and deterministic.
2. Failure and success cases are demonstrated.
3. P13-06 can rely on gate behavior as a required check.

### P13-06

Title: P13-06 Hosted-Candidate CI Smoke Lane

Workstream: Neon Postgres cutover for preview and staging

Labels: phase-13, critical-path, p13-06, platform, qa, ci-cd, workstream-postgres

Primary owner lane: Platform

Supporting lanes: QA

Day window: Day 6-7

Dependencies: P13-03, P13-05

Status: In Progress (workflow job exists; required-check rollout still pending)

Summary:
Add a hosted-candidate CI smoke lane and require it alongside local smoke before merge.

Implementation checklist:
- [x] Add hosted-candidate smoke workflow/job.
- [x] Include auth, mission launch, completion, and telemetry checks.
- [ ] Set GitHub repo secrets `POSTGRES_DATABASE_URL` and `POSTGRES_DIRECT_DATABASE_URL` for the real hosted Postgres path.
- [ ] Enforce merge policy requiring both local and hosted smoke lanes.

Acceptance criteria:
1. CI includes separate local and hosted-candidate smoke lanes.
2. Hosted-candidate lane validates auth, launch, completion, and telemetry traces.
3. Branch protection requires both lanes green.

Definition of done:
1. CI configuration merged.
2. One successful hosted-candidate run is linked in issue.
3. Merge policy updated to include the new lane.

### P13-07

Title: P13-07 First Session-Service Runtime Extraction

Workstream: Match-session and presence extraction

Labels: phase-13, critical-path, p13-07, backend, platform, workstream-session

Primary owner lane: Backend

Supporting lanes: Platform

Day window: Day 7-8

Dependencies: P13-06

Status: In Progress (local boundary extracted and validated; staged dedicated-runtime deployment still pending)

Summary:
Extract mission-session authority into the session-service boundary locally first, then finish the staged dedicated-runtime deployment.

Implementation checklist:
- [ ] Deploy dedicated service skeleton with health endpoint in staging.
- [x] Route one session operation through service boundary.
- [x] Validate failure behavior and state integrity.

Current evidence:
1. `/api/session-service/health` reports the session-service contract and mode.
2. Launch, abandon, combat-action, advance-stage, retry-stage, and commit-member now flow through dedicated session-service routes.
3. The existing retry-stage and Ash Circuit reward smokes pass in both embedded-web mode and the local external-runtime self-proxy path, covering mutation success plus recovery behavior without state regression.

Acceptance criteria:
1. Service runtime is deployed and health-checked.
2. One session operation runs through the boundary end-to-end.
3. Failure behavior is observable and does not silently corrupt mission state.

Definition of done:
1. Service endpoint and one real operation are live in staging.
2. Logs and traces confirm healthy execution.
3. P13-09 can build on extracted session authority.

### P13-08

Title: P13-08 Hosted Observability Baseline Activation

Workstream: Hosted observability and managed event configuration

Labels: phase-13, critical-path, p13-08, platform, backend, observability, workstream-observability

Primary owner lane: Platform

Supporting lanes: Backend

Day window: Day 8-9

Dependencies: P13-06

Summary:
Activate staged observability with release context for both telemetry and errors.

Implementation checklist:
- [ ] Send staged mission lifecycle events to analytics.
- [ ] Send staged exceptions to error tracking with release tags.
- [ ] Publish triage view for new failures.

Acceptance criteria:
1. Mission lifecycle events are visible in staged analytics.
2. Exceptions are visible in staged error tracking with release context.
3. Team has a known dashboard or query path for triage.

Definition of done:
1. Observability hooks are merged and verified.
2. Synthetic event and error evidence is attached.
3. P13-10 can use observability output as part of go or no-go evidence.

### P13-09

Title: P13-09 Minimum Live-Ops Event Configuration Path

Workstream: Hosted observability and managed event configuration

Labels: phase-13, critical-path, p13-09, backend, live-ops, workstream-observability

Primary owner lane: Backend

Supporting lanes: Live Ops

Day window: Day 9

Dependencies: P13-07

Summary:
Add minimum managed configuration path so Concord Breach timing or modifier values can change without code deploy.

Implementation checklist:
- [ ] Add staging-safe config update path for event timing or modifiers.
- [ ] Validate input and persist changes.
- [ ] Ensure mission event behavior reflects updated values.

Acceptance criteria:
1. Event timing or modifier values are editable in staging without redeploy.
2. Config changes are validated and auditable.
3. Updated config is reflected in mission event behavior.

Definition of done:
1. Config path is merged and secured for intended users.
2. At least one live config change is demonstrated in staging.
3. Output is ready for final go or no-go review.

### P13-10

Title: P13-10 Phase 13 Exit Review And Go Or No-Go Decision

Workstream: Cross-workstream closeout

Labels: phase-13, critical-path, p13-10, product, platform

Primary owner lane: Product

Supporting lanes: Platform, Backend, QA

Day window: Day 10

Dependencies: P13-01 through P13-09

Summary:
Run final staging rehearsal, assemble evidence, and record go or no-go decision for Phase 14 intake.

Implementation checklist:
- [ ] Re-run staging rehearsal after all Phase 13 tickets are complete.
- [ ] Attach evidence pack from runtime, auth, CI, service extraction, observability, and live-ops config.
- [ ] Publish decision and next-phase intake list.

Acceptance criteria:
1. Staging rehearsal completes with required checks.
2. Decision record includes remaining risks and accepted follow-ups.
3. Phase 14 intake list is published with sequenced implementation tickets.

Definition of done:
1. Decision artifact is shared with collaborators.
2. Go or no-go call is explicit and traceable.
3. Next phase begins from a documented baseline rather than ad-hoc handoff.

## Day-10 Go Or No-Go Exit Checklist

- [ ] Hosted-candidate runtime is the default for staging.
- [ ] Identity, persistence, and mission-session flows pass on staged Postgres.
- [ ] Local smoke lane and hosted-candidate smoke lane are both green.
- [ ] Observability receives staged mission traffic and staged error traces.
- [ ] Live-ops event configuration can change behavior without redeploy.
- [ ] Release risks and accepted follow-ups are explicitly documented.
- [ ] Phase 14 intake board is published and sequenced.
