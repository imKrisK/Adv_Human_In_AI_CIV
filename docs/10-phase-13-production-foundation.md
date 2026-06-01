# Phase 13: Production Foundation Implementation

Date: May 31, 2026

## Why Phase 13 Exists

The validated slice already proves the product idea. The next risk is no longer whether the bonded human-plus-AI loop works. The next risk is whether the project can carry that loop into a hosted, supportable service without regressing the slice.

Phase 13 should therefore be an implementation phase, not another concept phase.

## Phase Objective

Replace the prototype-only runtime assumptions with the first real hosted production foundation while keeping the current slice behavior intact.

## Non-Goals

- no new faction or mission content
- no roster expansion beyond the current starter trio
- no PvP work
- no broad visual-polish phase
- no reopening of core combat design unless Phase 13 exposes a blocking defect

## Entrance Criteria

- Phase 7 through Phase 12 planning and validation are complete.
- The current Playwright smoke suite passes.
- The current slice exit call remains advance, not hold.

## Exit Criteria

Phase 13 is done when all of the following are true:

1. Authentication is hosted and shared.
2. Preview and staging run against Neon Postgres, not SQLite.
3. Squad and mission-session authority are no longer local-route-only concerns.
4. Presence and reconnect state have a real coordination layer.
5. Observability is live in staged environments.
6. Concord Breach timing and modifier control are managed outside hardcoded prototype data.
7. Hosted smoke checks pass after staged deployment.

## Workstreams

### P13-01 Hosted Identity Integration

Goal: replace local credential auth with the locked Clerk contract.

Deliver:

- Clerk-backed sign-in and sign-up flow
- shared operator session claims across portal, command deck, and admin-oriented planning routes
- staff-claim support for internal surfaces
- compatibility path for the existing demo operator flow in non-production environments only

Done when:

- the web prototype no longer relies on the hand-rolled local auth path for staged environments
- session restore works across the current product surfaces
- admin-only routes can distinguish staff access from player access

### P13-02 Neon Postgres Runtime Cutover

Goal: move durable state from prototype-local SQLite assumptions to staged Postgres.

Deliver:

- Prisma runtime configured for Neon Postgres in preview and staging
- profile, squad, mission-session, telemetry, and reward tables migrated cleanly
- migration rehearsal documented against the staged database
- local SQLite retained only as an optional local developer fallback, not as the staged source of truth

Done when:

- preview and staging boot on Postgres
- persistence reads and writes still pass smoke coverage
- rollback notes exist for the schema steps required by the current slice

### P13-03 Match-Session And Presence Extraction

Goal: move live squad and mission authority toward the intended service boundary.

Deliver:

- session-service contract for squad staging, launch, reconnect, host handoff, and mission recovery
- Redis-backed presence, short-lived coordination state, and reconnect hints
- web app continues to own launch and recovery surfaces, but no longer acts as the only authority for shared mission runtime

Done when:

- reconnect and host handoff no longer depend on single-process route state
- the web app talks to the session boundary rather than directly owning every shared runtime concern
- squad smoke coverage still passes against the extracted path

### P13-04 Observability And Managed Event Configuration

Goal: turn the validated slice into something that can be operated, observed, and tuned.

Deliver:

- PostHog wired for onboarding, mission, and pair telemetry in staged environments
- Sentry wired for browser and server failures
- Concord Breach schedule, modifiers, and reward-band values moved into managed configuration
- first admin-facing configuration workflow for event tuning, even if minimal

Done when:

- staged traffic produces real analytics and error events
- the first event-loop tuning change can happen without editing hardcoded prototype data
- smoke and manual checks confirm the event still resolves correctly after configuration reads

## Recommended Order

1. Hosted identity and Postgres cutover first.
2. Session-service and presence extraction second.
3. Observability and managed configuration third.
4. Staged deployment rehearsal and smoke confirmation last.

## Risks To Watch

1. Auth migration can break the demo-friendly onboarding flow if development and staging behavior are not separated clearly.
2. SQLite-to-Postgres differences can surface latent assumptions in profile or session writes.
3. Session extraction can destabilize reconnect behavior if authority boundaries are only partially moved.
4. Managed event configuration can accidentally fork from the prototype data contract if versioning is loose.

## Exact Recommendation

If the team only does one thing next, it should be this:

Make the current validated slice run on the locked hosted baseline before adding any new gameplay scope.