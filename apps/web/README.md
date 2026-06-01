# Web Prototype

Player-facing prototype shell for Adventure of Human in AI Civilization.

## Routes

- `/` - overview of the first playable and current prototype direction
- `/command-deck` - authenticated first-session flow with loadout selection, AI bonding, and mission staging
- `/missions/ash-circuit` - playable guided mission flow with bonded combat interaction
- `/missions/glass-wastes` - playable public-event mission flow with bonded combat interaction
- `/field-guide` - first faction, hub city, and starter AI companion reference
- `/backlog` - vertical-slice backlog and scope locks
- `/api/prototype` - JSON contract for the current prototype data
- `/api/profile-schema` - JSON contract for the starter profile, loadout, AI, and bond-state schema

## Auth And Persistence

- `/api/auth/register` - create an authenticated operator account and seed a player profile
- `/api/auth/login` - restore an authenticated session
- `/api/auth/demo` - development-only seeded demo operator login that resets the profile for repeatable flow checks
- `/api/auth/logout` - end the current session
- `/api/auth/session` - inspect the current authenticated session and profile payload
- `/api/profile` - load and update the server-backed player profile
- `/api/session-service/health` - report the current embedded versus external session-service contract state
- `/api/session-service/mission-session/current` - dedicated current-mission read surface for the extracted session-service boundary
- `/api/session-service/mission-session/launch` - dedicated launch write surface for the extracted session-service boundary
- `/api/session-service/mission-session/abandon` - dedicated recovery write surface for the extracted session-service boundary
- `/api/session-service/mission-session/combat-action` - dedicated live combat write surface for the extracted session-service boundary
- `/api/session-service/mission-session/advance-stage` - dedicated shared-objective progression surface for the extracted session-service boundary
- `/api/session-service/mission-session/retry-stage` - dedicated stage-reset surface for the extracted session-service boundary
- `/api/session-service/mission-session/commit-member` - dedicated reward-commit surface for the extracted session-service boundary

## Commands

```bash
npm run dev
npm run lint
npm run build
npx playwright install chromium
npm run test:smoke
```

For local Windows work, prefer `localhost` over `127.0.0.1` when you need to pass an explicit host or port. The stable command is `npm run dev -- --port 3101`, which inherits the repo's `localhost` hostname.

`npm run test:smoke` starts the app on `http://localhost:3000`, signs in through the development-only demo operator path, deploys Ash Circuit, and verifies the reward writeback on the command deck.

Local session-service validation now defaults to an embedded web boundary with inline coordination. That means `/api/session-service/health` can report green in `local-prototype` mode without pretending Fly or Upstash are present. Hosted-candidate validation should set `SESSION_SERVICE_MODE=external-runtime`, `SESSION_SERVICE_BASE_URL=...`, `SESSION_SERVICE_INTERNAL_TOKEN=...`, and `SESSION_SERVICE_COORDINATION_MODE=redis-upstash` alongside the real Fly and Upstash keys. The web app now uses that internal token for server-to-server session-service calls when the contract is switched to the external runtime path.

`next.config.ts` allows both `localhost` and `127.0.0.1` as development origins. In this repo's current Windows setup, Next.js 16 plus Turbopack normalizes localhost-style hosts through a localhost-oriented dev proxy, so binding the app only to `127.0.0.1` can still produce `500` responses even though `http://localhost:<port>` works cleanly.

## Current Purpose

This app is not the final game client. It is the first web surface for the project: a shared prototype shell that can present game direction, authenticated starter onboarding, bonded combat mission flows, and a real profile storage contract before realtime multiplayer is added.
