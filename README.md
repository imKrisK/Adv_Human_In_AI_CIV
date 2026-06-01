# Adventure of Human in AI Civilization

Working folder for the concept, systems, and MVP planning of an online AI-civilization adventure game.

## Documents

- `docs/01-one-page-gdd.md` - high-level game vision and core loop
- `docs/02-human-ai-progression.md` - detailed player, AI, and bond progression design
- `docs/03-mvp-saas-architecture.md` - MVP scope and recommended web/online product architecture
- `docs/04-vertical-slice-backlog.md` - reconciled backlog with current slice status, service-production planning, and Phase 13 next work
- `docs/05-first-faction-hub-companions.md` - first playable faction, hub city, and starter AI roster
- `docs/06-companion-mmo-reinvention.md` - original reinterpretation of companion-centric MMO strengths into the AI-civilization direction
- `docs/07-external-pitch.md` - short deck-style external pitch for the companion-first AI-civilization product
- `docs/08-phase-7-10-roadmap.md` - Phase 7 to Phase 13 roadmap covering combat readability, squad flow, Concord Breach, telemetry, and production cutover kickoff
- `docs/09-executive-status-report.md` - collaborator-ready status summary with accomplishments, current risks, and recommended next move
- `docs/10-phase-13-production-foundation.md` - exact Phase 13 scope for hosted identity, Postgres cutover, session-service extraction, and observability
- `docs/11-phase-13-execution-board.md` - two-week execution board with ordered P13 tickets, dependencies, owners, and acceptance criteria
- `docs/12-phase-13-github-issue-pack.md` - GitHub-issue-ready blocks for P13-01 through P13-10 with labels, owner lanes, dependencies, acceptance criteria, and Day-10 exit checklist

## Alignment Snapshot

This project is a web-first online co-op action RPG, not a full MMO and not a medieval game with AI-themed art.

The core identity is a vulnerable human explorer bonded to an evolving AI Instance. The build is defined by the relationship between both halves, not by the human alone.

The world direction is techno-mythic AI civilization: machine city-states, faction politics, relic discovery, elemental computation, and augmentation weaponry.

The first product goal is narrow: prove bonded combat, dual progression, co-op play, and one live event inside a persistent account-based service.

## Current Product Direction

A persistent online action RPG where a human explorer survives and thrives by bonding with evolving AI Instances across rival machine civilizations.

## Current Status

The validated slice is green. The web prototype now covers onboarding, bonded combat, persistence, squad launch and reconnect, Concord Breach event flow, telemetry surfaces, playtest capture, service mapping, and deployment-planning artifacts.

The remaining work is no longer concept design. It is production-foundation implementation: replacing local auth and SQLite assumptions, extracting session authority, and wiring the locked hosted baseline.

## What We Are Building First

1. One hub city players can return to between runs.
2. Two combat or mission zones.
3. Three human weapon disciplines.
4. Three AI partner classes.
5. Three elemental attunements.
6. One recurring live event.
7. Two-to-four player co-op with persistent progression.

## What We Are Not Building Yet

- full open-world MMO scale
- dozens of factions, classes, or companions at launch
- PvP as a core pillar
- pay-to-win progression
- lore expansion before the first fun bonded combat loop exists

## Immediate Priorities

1. Replace local prototype auth and persistence assumptions with the hosted production baseline.
2. Move squad and mission-session authority behind the intended service boundary.
3. Wire observability and live configuration so the validated slice can be promoted safely.

## Single Next Step

Start Phase 13: Production Foundation Implementation.

## Prototype Scaffold

- `apps/web` - Next.js web prototype shell for the player-facing product surface
- `/command-deck` - first-session route for starter loadout selection, AI bonding, and mission staging
- `/missions/ash-circuit` and `/missions/glass-wastes` - playable mission flow routes with bonded combat interactions
- `/api/profile-schema` - prototype persistence contract for player, loadout, AI, and bond state

## Recommended Next Build Sequence

1. Integrate hosted identity and staged Neon Postgres as the real runtime contract for preview and staging.
2. Extract match-session authority and reconnect state from local route handlers into the intended session boundary.
3. Move Concord Breach timing and modifiers out of hardcoded prototype data into managed configuration.
4. Wire PostHog, Sentry, and hosted smoke gates so the current slice can survive staged deployment rehearsal.
