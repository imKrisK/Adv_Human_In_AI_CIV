# Prisma Postgres Migration Runbook

## Purpose

This runbook turns the locked Neon Postgres decision into a staged Prisma migration rehearsal.
The goal is to replace the local SQLite-only path without treating production as the first time the team runs a schema change.

## Current Prototype State

- `prisma/schema.prisma` still declares `provider = "sqlite"`.
- `prisma/schema.postgres.prisma` now mirrors the current data model with a Postgres datasource for migration rehearsal.
- `prisma.postgres.config.ts` now isolates the Postgres rehearsal config and migration path from the local SQLite runtime.
- `src/lib/db.ts` still creates Prisma through `PrismaBetterSqlite3`.
- `prisma.config.ts` already reads `DATABASE_URL`, which can stay as the primary Prisma URL once the datasource moves to Postgres.
- `dev.db` remains local-only and is never part of the hosted rollout path.

## Scope

- VS-22 / P12-01 only.
- Preview and staging rehearsal before any production promotion.
- No live cutover until hosted staging passes `npm run build` and `npm run test:smoke`.

## Planned File Changes

1. Update `prisma/schema.prisma`:
   - change the datasource provider from `sqlite` to `postgresql`
   - move the active runtime off the SQLite datasource after the rehearsal path is green
2. Update `src/lib/db.ts`:
   - remove the `PrismaBetterSqlite3` adapter path
   - instantiate `PrismaClient` directly for Postgres-backed runtimes
3. Clean up package dependencies after staging passes:
   - remove `@prisma/adapter-better-sqlite3`
   - remove `better-sqlite3`

## Environment Prerequisites

Required before rehearsal:

- `POSTGRES_DATABASE_URL` points at the Neon pooled connection string for the rehearsal target
- `POSTGRES_DIRECT_DATABASE_URL` points at the Neon direct connection string for Prisma migrations
- preview and staging use separate Neon databases or branches
- the current migration folder is committed before the Postgres baseline branch begins
- the local SQLite runtime keeps its existing `DATABASE_URL=file:./dev.db` contract during this parallel slice

## Rehearsal Sequence

### 1. Prepare the branch

```bash
git checkout -b chore/postgres-migration-rehearsal
```

### 2. Switch the datasource and client path

- keep the runtime on SQLite for now and use the parallel Postgres schema plus config for rehearsal work
- confirm `POSTGRES_DATABASE_URL` and `POSTGRES_DIRECT_DATABASE_URL` resolve to staging-safe Neon targets

### 3. Generate the first Postgres migration for review

```bash
npm run db:validate:postgres
npm run db:migrate:postgres:create -- --name postgres_baseline
```

Review the generated SQL before it is applied anywhere outside the branch.

### 4. Apply in preview or staging

```bash
npm run db:migrate:postgres:deploy
npm run build
npm run test:smoke
```

Promotion stops here unless all three commands pass.

### 5. Record rollback notes for the release

For each migration in the production chain, write:

- the migration folder name
- the affected tables or columns
- whether rollback is restore-only or can be handled by a down migration plan
- the exact stop condition that blocks promotion

## Rollback Guardrails

- If `prisma migrate deploy` fails in staging, stop and fix the migration chain before any web release is promoted.
- If `npm run test:smoke` fails after the datasource switch, revert to the last green SQLite-compatible branch and inspect the client and schema diff.
- Do not delete `dev.db`; keep it as the local prototype baseline until the hosted Postgres path is the default development contract.

## Release Gate

This runbook is complete only when:

- the migration chain is committed
- the rollback note exists for each production schema step
- staging Postgres passes `npx prisma migrate deploy`, `npm run build`, and `npm run test:smoke`