# Production Release Runbook

## Purpose

This runbook turns the last open Phase 12 item into one release sequence the team can rehearse.
It names the stage order, the smoke gate after each promotion step, and the rollback stop that blocks further rollout.

## Scope

- VS-24 / P12-03 only.
- Production promotion order for the locked stack: Vercel web, Fly.io workers and realtime, Neon Postgres, Upstash Redis, Cloudflare R2, Clerk, PostHog, and Sentry.
- Use this only after the Postgres migration rehearsal and environment contract assets are current.

## Release Preconditions

Do not begin the rollout unless all of the following are true:

- staging uses the same provider mix as the locked production baseline
- `npx prisma migrate deploy` passed against the staging Neon target
- `npm run build` passed on the release candidate branch
- `npm run test:smoke` passed against the release candidate branch
- Vercel, Fly, Neon, Upstash, Clerk, PostHog, and Sentry variables match the environment contract
- staging web points `SESSION_SERVICE_BASE_URL` at the dedicated session-service runtime, not back at the web origin
- staging web and the session-service runtime share the same `SESSION_SERVICE_INTERNAL_TOKEN`

## Stage Order

### Stage 0: Provider health and freeze window

- Confirm Neon, Upstash, Fly, Vercel, Clerk, PostHog, and Sentry are operational.
- Freeze non-release config edits while the promotion is in progress.
- Verify the previous production tag or commit is available for rollback.

Smoke gate:

- Vercel preview responds
- Fly health endpoints respond
- Neon accepts a direct connection

Rollback stop:

- If any provider health check is degraded or unavailable, abort before migrations begin.

### Stage 1: Database migration promotion

- Run `npx prisma migrate deploy` against the production `DIRECT_DATABASE_URL`.
- Confirm the migration log matches the reviewed set from staging.
- Record the timestamp and operator for the schema promotion.

Smoke gate:

- migration command exits successfully
- the app can still read mission, profile, and squad tables using the production pooled `DATABASE_URL`

Rollback stop:

- If schema promotion fails or core reads break after migration, stop the rollout and recover the database before any app deploy.

### Stage 2: Content and config baseline

- Verify Cloudflare R2 buckets, PostHog project settings, and Clerk production instance settings are unchanged from the approved contract.
- Confirm feature flags or content-config changes required by the release are already present.

Smoke gate:

- content assets resolve from R2
- Clerk sign-in routes still load
- analytics and error-tracking endpoints are reachable from the production environment

Rollback stop:

- If auth, content delivery, or observability configuration drift is detected, stop before the web release is promoted.

### Stage 3: Web gateway promotion

- Promote the Vercel production deployment for the release candidate commit.
- Confirm the root route, `/command-deck`, `/backlog`, and `/service-map` load on production.

Smoke gate:

- public routes return `200`
- `/api/prototype` and `/api/service-map` return the expected JSON contract
- operator sign-in completes and returns to the command deck

Rollback stop:

- If route rendering, auth, or core API reads fail, revert the Vercel deployment before worker or realtime rollout starts.

### Stage 4: Worker promotion

- Deploy Fly worker processes after the web gateway is green.
- Confirm job consumers can connect to Neon and Upstash with the production secret set.

Smoke gate:

- worker process boots successfully
- queue or scheduled-job heartbeat appears in logs
- no migration-related query failures appear after worker startup

Rollback stop:

- If workers boot with schema, Redis, or secret errors, roll workers back and hold the release before realtime promotion.

### Stage 5: Realtime runtime promotion

- Deploy the Fly realtime app only after web and worker promotion are stable.
- Validate room startup and shared-session connectivity against production services.
- Confirm `/api/session-service/health` reports `contract.mode=external-runtime` through the promoted web surface.
- Rehearse one mission launch and one mission recovery flow so launch and abandon writes traverse the separate runtime instead of the embedded web boundary.

Smoke gate:

- realtime process boots successfully
- squad reconnect and shared mission session endpoints stay reachable
- `/api/session-service/health` returns `200` with `contract.baseUrl` set to the dedicated runtime origin
- an operator can launch Ash Circuit and abandon the session without falling back to the embedded web route
- no sustained connection or authorization failures appear in logs

Rollback stop:

- If session creation, reconnect, or authorization fails, roll realtime back and keep the rest of the stack on the last green runtime.

### Stage 6: Observability confirmation

- Confirm PostHog receives production events after the web deploy.
- Confirm Sentry receives release-tagged traces or error events.
- Check that logs from Vercel and Fly are tagged to the new release.

Smoke gate:

- one successful operator session appears in PostHog
- one intentional handled check or release marker appears in Sentry

Rollback stop:

- If the product is serving traffic but observability is blind, stop further promotion and decide whether to roll back or restore monitoring immediately.

## Final Smoke Gate

After all stages complete, rerun the core release smoke on production:

1. Load `/`, `/command-deck`, `/backlog`, and `/service-map`.
2. Sign in as a release-check operator.
3. Confirm profile and squad session reads succeed.
4. Confirm `/api/prototype`, `/api/service-map`, and `/api/session-service/health` still return the expected payload shape.
5. Launch one mission session and abandon it once to confirm the write path still crosses the separate session-service runtime.
6. Confirm no new high-severity Sentry issues appear during the check window.

## Rollback Rules

- Never continue to a later stage after a failed smoke gate.
- Roll back only the most recently promoted layer first: Vercel web, then Fly workers, then Fly realtime.
- If the failure is data-related, treat Neon recovery as the controlling path and stop all app-layer rollout until data is stable.
- Record the failing stage, smoke result, and rollback action before reopening the release window.

## Completion Criteria

This runbook is complete only when:

- the stage order is rehearsed and accepted
- each stage has one explicit smoke gate
- each stage has one explicit rollback stop
- the production team can identify the stop point without improvising during release