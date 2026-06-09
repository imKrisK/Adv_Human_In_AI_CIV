import { expect, test, type Page } from "@playwright/test";

import {
  authenticateAdditionalOperator,
  authenticatePrimaryOperator,
} from "./smoke-auth";

const smokeRuntimeMode = process.env.SMOKE_RUNTIME_MODE ?? "local-prototype";
const smokeRuntimeLabel =
  smokeRuntimeMode === "local-prototype" ? "local prototype" : "hosted candidate";
const smokeRuntimeModeSource =
  process.env.SMOKE_RUNTIME_MODE_SOURCE ??
  (smokeRuntimeMode === "local-prototype" ? "inferred-from-database-url" : "env");
const smokeEnvGate =
  process.env.SMOKE_ENV_GATE ??
  (smokeRuntimeMode === "local-prototype" ? "warn" : "fail");
const smokeEnvironmentApiStatus = Number(
  process.env.SMOKE_ENV_API_STATUS ??
    (smokeRuntimeMode === "local-prototype" ? "200" : "503"),
);
const smokeExpectContractReady =
  (process.env.SMOKE_EXPECT_CONTRACT_READY ?? "false") === "true";
const smokeExpectInvalidDatabaseUrl =
  (process.env.SMOKE_EXPECT_INVALID_DATABASE_URL ??
    (smokeRuntimeMode === "local-prototype" ? "true" : "false")) === "true";
const smokeExpectedMissingEnvKey =
  process.env.SMOKE_EXPECT_MISSING_ENV_KEY ??
  (smokeExpectContractReady ? "" : "CLERK_SECRET_KEY");

function isSmokePlaceholderValue(value: string | undefined) {
  return typeof value === "string" && /replace_me|placeholder|example|smoke/i.test(value);
}

function resolveSmokeObservabilityAnalyticsMode() {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? process.env.POSTHOG_PROJECT_API_KEY;

  if (!host || !key) {
    return "missing" as const;
  }

  return isSmokePlaceholderValue(host) || isSmokePlaceholderValue(key)
    ? ("placeholder" as const)
    : ("active" as const);
}

function resolveSmokeObservabilityErrorMode() {
  const dsn = process.env.SENTRY_DSN;
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;

  if (!dsn || !org || !project) {
    return "missing" as const;
  }

  return isSmokePlaceholderValue(dsn) ||
    isSmokePlaceholderValue(org) ||
    isSmokePlaceholderValue(project)
    ? ("placeholder" as const)
    : ("active" as const);
}

const smokeExpectedObservabilityAnalyticsMode =
  process.env.SMOKE_EXPECT_OBSERVABILITY_ANALYTICS_MODE ??
  resolveSmokeObservabilityAnalyticsMode();
const smokeExpectedObservabilityErrorMode =
  process.env.SMOKE_EXPECT_OBSERVABILITY_ERROR_MODE ??
  resolveSmokeObservabilityErrorMode();

async function lockPairAndReady(page: Page) {
  await page.getByTestId("toggle-squad-lock").click();
  // Wait for the lock API to commit before clicking ready
  await expect(page.getByTestId("toggle-squad-ready")).toBeEnabled();
  await page.getByTestId("toggle-squad-ready").click();
  // Wait for the ready API to commit before returning
  await expect(page.getByTestId("toggle-squad-ready")).toBeEnabled();
}

async function readProfileSnapshotValue(page: Page, label: string) {
  const profileSnapshot = page.locator("article").filter({
    hasText: "Profile storage snapshot",
  });
  const value = profileSnapshot
    .getByText(label, { exact: true })
    .locator("xpath=following-sibling::p[1]");

  await expect(value).toBeVisible();

  return (await value.textContent())?.trim() ?? "";
}

type EncounterStep =
  | "rewards-committed"
  | "commit-rewards"
  | "advance-objective"
  | "retry-stage"
  | "finisher"
  | "heavy"
  | "bond"
  | "light";

async function waitForEncounterStep(page: Page): Promise<EncounterStep> {
  let nextStep: EncounterStep | null = null;

  await expect(async () => {
    const rewardsCommitted = page.getByRole("button", {
      name: "Rewards committed",
    });
    const commitRewards = page.getByRole("button", {
      name: "Commit rewards and close mission",
    });
    const advanceObjective = page.getByRole("button", {
      name: "Advance objective",
    });
    const retryStage = page.getByRole("button", { name: "Retry stage" });
    const finisher = page.getByRole("button", { name: "Storm Bulwark Crash" });
    const heavy = page.getByRole("button", { name: "Gauntlet Crash" });
    const bond = page.getByRole("button", { name: "Ward Intercept" });
    const light = page.getByRole("button", { name: "Arc Jab" });

    nextStep = (await rewardsCommitted.isVisible())
      ? "rewards-committed"
      : (await commitRewards.isVisible()) && (await commitRewards.isEnabled())
        ? "commit-rewards"
        : (await advanceObjective.isVisible()) && (await advanceObjective.isEnabled())
          ? "advance-objective"
          : (await retryStage.isVisible()) && (await retryStage.isEnabled())
            ? "retry-stage"
            : (await finisher.isEnabled())
              ? "finisher"
              : (await page.getByText("Enemy exposed", { exact: true }).isVisible()) &&
                  (await heavy.isEnabled())
                ? "heavy"
                : (await bond.isEnabled())
                  ? "bond"
                  : (await light.isEnabled())
                    ? "light"
                    : null;

    expect(nextStep).not.toBeNull();
  }).toPass({ timeout: 10000 });

  return nextStep!;
}

async function takePreferredAction(page: Page, nextStep: EncounterStep) {
  if (nextStep === "finisher") {
    await page.getByRole("button", { name: "Storm Bulwark Crash" }).click();
    return;
  }

  if (nextStep === "heavy") {
    await page.getByRole("button", { name: "Gauntlet Crash" }).click();
    return;
  }

  if (nextStep === "bond") {
    await page.getByRole("button", { name: "Ward Intercept" }).click();
    return;
  }

  if (nextStep === "light") {
    await page.getByRole("button", { name: "Arc Jab" }).click();
    return;
  }

  throw new Error(`Encounter step ${nextStep} is not a combat action.`);
}

async function resolveCurrentStage(page: Page) {
  for (let turn = 0; turn < 12; turn += 1) {
    const nextStep = await waitForEncounterStep(page);

    if (nextStep === "rewards-committed") {
      return;
    }

    if (nextStep === "commit-rewards") {
      const commitRewards = page.getByRole("button", {
        name: "Commit rewards and close mission",
      });
      const rewardsCommitted = page.getByRole("button", {
        name: "Rewards committed",
      });

      await commitRewards.click();
      await expect(rewardsCommitted).toBeVisible({ timeout: 15_000 });
      return;
    }

    if (nextStep === "advance-objective") {
      const advanceObjective = page.getByRole("button", {
        name: "Advance objective",
      });

      await advanceObjective.click();
      return;
    }

    if (nextStep === "retry-stage") {
      const retryStage = page.getByRole("button", { name: "Retry stage" });

      await retryStage.click();
      continue;
    }

    await takePreferredAction(page, nextStep);
  }

  throw new Error("Unable to resolve the current mission stage.");
}

async function clearMission(page: Page) {
  for (let stage = 0; stage < 3; stage += 1) {
    await resolveCurrentStage(page);
  }
}

test("operator can retry a destabilized mission stage and recover the live lane", async ({
  page,
}) => {
  await authenticatePrimaryOperator(page, "retry-stage.primary");

  await page.getByRole("button", { name: "Ember Reaper + TALON-9" }).click();
  // activatePairing is async — wait for the deploy button to be enabled before clicking
  await expect(page.getByTestId("deploy-ash-circuit")).toBeEnabled({ timeout: 10_000 });
  await page.getByTestId("deploy-ash-circuit").click();

  await expect(page).toHaveURL(/\/missions\/ash-circuit$/, { timeout: 15_000 });

  // The mission panel may render in "briefing" phase while useEffect re-runs
  // the live session fetch on first mount. Clicking "Reconnect mission state"
  // forces an immediate re-fetch and transitions to the active stage buttons.
  const reconnectBtn = page.getByRole("button", { name: "Reconnect mission state" });
  if (await reconnectBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await reconnectBtn.click();
  }

  await expect(
    page.getByRole("button", { name: "Afterburn Step" }),
  ).toBeVisible({ timeout: 15_000 });

  const retryStage = page.getByRole("button", { name: "Retry stage" });

  for (let attempt = 0; attempt < 16; attempt += 1) {
    await page.getByRole("button", { name: "Afterburn Step" }).click();
  }

  await expect(
    page.getByRole("heading", { name: "Pair destabilized", exact: true }),
  ).toBeVisible();
  await expect(retryStage).toBeVisible();

  await retryStage.click();

  await expect(
    page.getByRole("heading", { name: "Pair destabilized", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Telegraph live", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Afterburn Step" }),
  ).toBeEnabled();
});

test("pitch route renders and links back into playable routes", async ({ page }) => {
  await page.goto("/pitch");

  await expect(
    page.getByRole("heading", {
      name: "A companion-first frontier RPG where the AI partner is half of the build.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open prototype" }),
  ).toHaveAttribute("href", "/command-deck");
  await expect(
    page.getByRole("link", { name: "Preview Ash Circuit" }),
  ).toHaveAttribute("href", "/missions/ash-circuit");
});

test("service map route renders the production surfaces and exposes the JSON contract", async ({
  page,
  request,
}) => {
  await page.goto("/service-map");

  await expect(
    page.getByRole("heading", {
      name: "Lock the stack choice, then turn it into the first execution checklist.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("service-map-execution-migrations")).toContainText(
    "Migration checklist",
  );
  await expect(page.getByTestId("service-map-execution-migrations")).toContainText(
    "Done",
  );
  await expect(page.getByTestId("service-map-execution-environment")).toContainText(
    "Environment setup",
  );
  await expect(page.getByTestId("service-map-execution-environment")).toContainText(
    "Done",
  );
  await expect(page.getByTestId("service-map-execution-rollout")).toContainText(
    "Rollout order",
  );
  await expect(page.getByTestId("service-map-execution-rollout")).toContainText(
    "Done",
  );
  await expect(page.getByTestId("service-map-asset-prisma-postgres-migration-runbook")).toHaveAttribute(
    "href",
    "/planning/prisma-postgres-migration-runbook.md",
  );
  await expect(page.getByTestId("service-map-asset-production-environment-contract")).toHaveAttribute(
    "href",
    "/planning/production-environment-contract.env.example",
  );
  await expect(page.getByTestId("service-map-asset-production-release-runbook")).toHaveAttribute(
    "href",
    "/planning/production-release-runbook.md",
  );
  await expect(page.getByTestId("service-map-surface-browser-client")).toContainText(
    "Browser-Playable Client",
  );
  await expect(page.getByTestId("service-map-surface-admin-console")).toContainText(
    "Admin / Live Ops Console",
  );
  await expect(page.getByTestId("service-map-boundary-match-session")).toContainText(
    "Match / Session Service",
  );
  await expect(page.getByTestId("service-map-hosting-web-platform")).toContainText(
    "Vercel",
  );
  await expect(page.getByTestId("service-map-hosting-database")).toContainText(
    "Neon Postgres",
  );
  await expect(page.getByTestId("service-map-environment-contract-status")).toContainText(
    "Needs setup",
  );
  await expect(page.getByTestId("service-map-environment-contract-runtime")).toContainText(
    smokeRuntimeLabel,
  );
  await expect(page.getByTestId("service-map-environment-contract-source")).toContainText(
    smokeRuntimeModeSource,
  );
  await expect(page.getByTestId("service-map-environment-contract-gate")).toContainText(
    smokeEnvGate,
  );
  await expect(page.getByTestId("service-map-observability-analytics")).toContainText(
    smokeExpectedObservabilityAnalyticsMode,
  );
  await expect(page.getByTestId("service-map-observability-errors")).toContainText(
    smokeExpectedObservabilityErrorMode,
  );
  await expect(page.getByTestId("service-map-observability-triage")).toContainText(
    "/api/observability",
  );
  if (smokeExpectedMissingEnvKey) {
    await expect(page.getByTestId("service-map-environment-contract")).toContainText(
      `Missing: ${smokeExpectedMissingEnvKey}`,
    );
  }
  await expect(page.getByRole("link", { name: "Open validation JSON" })).toHaveAttribute(
    "href",
    "/api/environment-contract",
  );
  await expect(page.getByRole("link", { name: "Open observability JSON" })).toHaveAttribute(
    "href",
    "/api/observability",
  );
  await expect(page.getByRole("link", { name: "Open JSON contract" })).toHaveAttribute(
    "href",
    "/api/service-map",
  );

  const response = await request.get("/api/service-map");

  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as {
    executionChecklist: Array<{ id: string; steps: string[] }>;
    environmentContractStatus: {
      contractReady: boolean;
      gateStatus: string;
      runtimeMode: string;
      runtimeModeSource: string;
      missingKeys: string[];
      invalidKeys: string[];
    };
    observabilityStatus: {
      release: string;
      telemetryForwardingEventTypes: string[];
      analytics: {
        mode: string;
        endpoint: string | null;
      };
      errorTracking: {
        mode: string;
        endpoint: string | null;
      };
      triage: {
        queryPath: string;
        syntheticCheckPath: string;
        latestProbeAt: string | null;
      };
    };
    planningAssets: Array<{ id: string; href: string }>;
    productSurfaces: Array<{ id: string; name: string }>;
    serviceBoundaries: Array<{ id: string; ownedData: string[] }>;
    hostingBaseline: {
      platformDecisions: Array<{ id: string; provider: string }>;
    };
  };

  expect(payload.executionChecklist).toHaveLength(3);
  expect(payload.planningAssets).toHaveLength(3);
  expect(payload.productSurfaces).toHaveLength(3);
  expect(payload.serviceBoundaries).toHaveLength(5);
  expect(payload.hostingBaseline.platformDecisions).toHaveLength(9);
  expect(payload.environmentContractStatus.contractReady).toBe(smokeExpectContractReady);
  expect(payload.environmentContractStatus.gateStatus).toBe(smokeEnvGate);
  expect(payload.environmentContractStatus.runtimeMode).toBe(smokeRuntimeMode);
  expect(payload.environmentContractStatus.runtimeModeSource).toBe(
    smokeRuntimeModeSource,
  );
  expect(payload.observabilityStatus.release.length).toBeGreaterThan(0);
  expect(payload.observabilityStatus.telemetryForwardingEventTypes).toContain(
    "mission_launched",
  );
  expect(payload.observabilityStatus.telemetryForwardingEventTypes).toContain(
    "mission_completed",
  );
  expect(payload.observabilityStatus.analytics.mode).toBe(
    smokeExpectedObservabilityAnalyticsMode,
  );
  expect(payload.observabilityStatus.errorTracking.mode).toBe(
    smokeExpectedObservabilityErrorMode,
  );
  expect(payload.observabilityStatus.triage.queryPath).toBe("/api/observability");
  expect(payload.observabilityStatus.triage.syntheticCheckPath).toBe(
    "/api/observability",
  );
  if (smokeExpectedMissingEnvKey) {
    expect(payload.environmentContractStatus.missingKeys).toContain(
      smokeExpectedMissingEnvKey,
    );
  }
  if (smokeExpectInvalidDatabaseUrl) {
    expect(payload.environmentContractStatus.invalidKeys).toContain("DATABASE_URL");
  } else {
    expect(payload.environmentContractStatus.invalidKeys).not.toContain("DATABASE_URL");
  }
  expect(
    payload.executionChecklist.find((section) => section.id === "migrations")?.steps,
  ).toHaveLength(3);
  expect(
    payload.planningAssets.find((asset) => asset.id === "prisma-postgres-migration-runbook")?.href,
  ).toBe("/planning/prisma-postgres-migration-runbook.md");
  expect(
    payload.planningAssets.find((asset) => asset.id === "production-release-runbook")?.href,
  ).toBe("/planning/production-release-runbook.md");
  expect(
    payload.productSurfaces.find((surface) => surface.id === "player-portal")?.name,
  ).toBe("Player Web Portal");
  expect(
    payload.serviceBoundaries.find((service) => service.id === "match-session")?.ownedData,
  ).toContain("mission sessions");
  expect(
    payload.hostingBaseline.platformDecisions.find((decision) => decision.id === "web-platform")?.provider,
  ).toBe("Vercel");
  expect(
    payload.hostingBaseline.platformDecisions.find((decision) => decision.id === "database")?.provider,
  ).toBe("Neon Postgres");

  const migrationRunbookResponse = await request.get(
    "/planning/prisma-postgres-migration-runbook.md",
  );
  const environmentContractResponse = await request.get(
    "/planning/production-environment-contract.env.example",
  );
  const environmentValidationResponse = await request.get(
    "/api/environment-contract",
  );
  const observabilityResponse = await request.get("/api/observability");
  const releaseRunbookResponse = await request.get(
    "/planning/production-release-runbook.md",
  );

  expect(migrationRunbookResponse.ok()).toBeTruthy();
  expect(environmentContractResponse.ok()).toBeTruthy();
  expect(environmentValidationResponse.status()).toBe(smokeEnvironmentApiStatus);
  expect(observabilityResponse.ok()).toBeTruthy();
  expect(releaseRunbookResponse.ok()).toBeTruthy();
  await expect(await migrationRunbookResponse.text()).toContain(
    "# Prisma Postgres Migration Runbook",
  );
  await expect(await environmentContractResponse.text()).toContain(
    "DATABASE_URL=postgresql://",
  );
  await expect(await releaseRunbookResponse.text()).toContain(
    "# Production Release Runbook",
  );

  const environmentValidationPayload = (await environmentValidationResponse.json()) as {
    contractReady: boolean;
    gateStatus: string;
    runtimeMode: string;
    runtimeModeSource: string;
    missingKeys: string[];
  };
  const observabilityPayload = (await observabilityResponse.json()) as {
    release: string;
    telemetryForwardingEventTypes: string[];
    analytics: {
      mode: string;
    };
    errorTracking: {
      mode: string;
    };
    triage: {
      queryPath: string;
      syntheticCheckPath: string;
    };
  };

  expect(environmentValidationPayload.contractReady).toBe(smokeExpectContractReady);
  expect(environmentValidationPayload.gateStatus).toBe(smokeEnvGate);
  expect(environmentValidationPayload.runtimeMode).toBe(smokeRuntimeMode);
  expect(environmentValidationPayload.runtimeModeSource).toBe(
    smokeRuntimeModeSource,
  );
  if (smokeExpectedMissingEnvKey) {
    expect(environmentValidationPayload.missingKeys).toContain(
      smokeExpectedMissingEnvKey,
    );
  }
  expect(observabilityPayload.release.length).toBeGreaterThan(0);
  expect(observabilityPayload.telemetryForwardingEventTypes).toContain(
    "mission_launched",
  );
  expect(observabilityPayload.telemetryForwardingEventTypes).toContain(
    "mission_completed",
  );
  expect(observabilityPayload.analytics.mode).toBe(
    smokeExpectedObservabilityAnalyticsMode,
  );
  expect(observabilityPayload.errorTracking.mode).toBe(
    smokeExpectedObservabilityErrorMode,
  );
  expect(observabilityPayload.triage.queryPath).toBe("/api/observability");
  expect(observabilityPayload.triage.syntheticCheckPath).toBe(
    "/api/observability",
  );
});

test("host can only deploy after the full squad is locked and ready", async ({ browser, page }) => {
  const hostOperator = await authenticatePrimaryOperator(page, "squad.host");
  await page.getByTestId("create-squad").click();

  const squadCode = (await page.getByTestId("squad-code").textContent())
    ?.replace("Code:", "")
    .trim();

  expect(squadCode).toBeTruthy();

  const joinerContext = await browser.newContext();
  const joinerPage = await joinerContext.newPage();
  await authenticateAdditionalOperator(joinerPage, "squad.joiner");
  await joinerPage.getByTestId("join-squad-code").fill(squadCode!);
  await joinerPage.getByTestId("join-squad").click();

  await page.getByRole("button", { name: "Reconnect squad state" }).click();
  await expect(page.getByTestId("launch-blockers")).toContainText(
    hostOperator.email,
  );
  await expect(page.getByRole("button", { name: "Deploy squad" })).toBeDisabled();

  await lockPairAndReady(page);
  await lockPairAndReady(joinerPage);

  await page.getByRole("button", { name: "Reconnect squad state" }).click();
  await expect(page.getByRole("button", { name: "Deploy squad" })).toBeEnabled();

  await page.getByRole("button", { name: "Deploy squad" }).click();
  await expect(page).toHaveURL(/\/missions\/ash-circuit$/);

  await joinerContext.close();
});

test("reconnect repairs host handoff for the next staged operator", async ({ browser, page }) => {
  await authenticatePrimaryOperator(page, "handoff.host");
  await page.getByTestId("create-squad").click();

  const squadCode = (await page.getByTestId("squad-code").textContent())
    ?.replace("Code:", "")
    .trim();

  expect(squadCode).toBeTruthy();

  const joinerContext = await browser.newContext();
  const joinerPage = await joinerContext.newPage();
  await authenticateAdditionalOperator(joinerPage, "handoff.joiner");
  await joinerPage.getByTestId("join-squad-code").fill(squadCode!);
  await joinerPage.getByTestId("join-squad").click();
  await expect(joinerPage.getByTestId("squad-role")).toContainText("Member");

  await page.getByRole("button", { name: "Leave squad" }).click();

  await joinerPage.getByRole("button", { name: "Reconnect squad state" }).click();
  await expect(joinerPage.getByTestId("squad-role")).toContainText("Host");
  await expect(
    joinerPage.getByText(
      "Host control is live: changing the deployment route here now retargets the full squad contract.",
      { exact: true },
    ),
  ).toBeVisible();

  await lockPairAndReady(joinerPage);
  await expect(joinerPage.getByRole("button", { name: "Deploy squad" })).toBeEnabled();

  await joinerContext.close();
});

test("squad launch keeps mission runtime shared while rewards write back per member", async ({
  browser,
  page,
}) => {
  const hostOperator = await authenticatePrimaryOperator(page, "runtime.host");
  await page.getByTestId("create-squad").click();

  const squadCode = (await page.getByTestId("squad-code").textContent())
    ?.replace("Code:", "")
    .trim();

  expect(squadCode).toBeTruthy();

  const joinerContext = await browser.newContext();
  const joinerPage = await joinerContext.newPage();
  const joinerOperator = await authenticateAdditionalOperator(
    joinerPage,
    "runtime.joiner",
  );
  await joinerPage.getByTestId("join-squad-code").fill(squadCode!);
  await joinerPage.getByTestId("join-squad").click();

  await lockPairAndReady(page);
  await lockPairAndReady(joinerPage);

  await page.getByRole("button", { name: "Reconnect squad state" }).click();
  await page.getByRole("button", { name: "Deploy squad" }).click();

  await expect(page).toHaveURL(/\/missions\/ash-circuit$/);
  await expect(page.getByTestId("mission-session-roster")).toContainText(
    hostOperator.email,
  );
  await expect(page.getByTestId("mission-session-roster")).toContainText(
    joinerOperator.email,
  );

  await joinerPage.getByRole("button", { name: "Reconnect squad state" }).click();
  await expect(joinerPage.getByTestId("resume-active-mission")).toBeVisible();
  await joinerPage.getByTestId("resume-active-mission").click();

  await expect(joinerPage).toHaveURL(/\/missions\/ash-circuit$/);
  await expect(joinerPage.getByTestId("mission-session-roster")).toContainText(
    hostOperator.email,
  );
  await expect(joinerPage.getByTestId("mission-session-roster")).toContainText(
    joinerOperator.email,
  );

  await resolveCurrentStage(page);
  await expect(
    page.getByRole("heading", { name: "Stabilize Relay Spine", exact: true }),
  ).toBeVisible();

  await joinerPage.getByRole("button", { name: "Reconnect mission state" }).click();
  await expect(
    joinerPage.getByRole("heading", {
      name: "Stabilize Relay Spine",
      exact: true,
    }),
  ).toBeVisible();

  await clearMission(joinerPage);
  await expect(
    joinerPage.getByRole("button", { name: "Rewards committed" }),
  ).toBeVisible();

  await joinerPage.getByRole("link", { name: "Return to command deck" }).click();

  await expect(joinerPage).toHaveURL(/\/command-deck$/);
  await expect(
    joinerPage.getByText("Last clear: Ash Circuit", { exact: true }),
  ).toBeVisible();
  await expect(
    joinerPage.getByText("Current mission: Glass Wastes", { exact: true }),
  ).toBeVisible();
  await expect(joinerPage.getByTestId("resume-active-mission")).toHaveCount(0);

  await page.getByRole("button", { name: "Reconnect mission state" }).click();
  await expect(page.getByTestId("mission-session-roster")).toContainText(
    "Rewards committed",
  );
  await expect(page.getByTestId("mission-session-roster")).toContainText(
    "Live in route",
  );

  await joinerContext.close();
});

test("host can abandon a stuck shared mission session and recover the squad", async ({
  browser,
  page,
}) => {
  await authenticatePrimaryOperator(page, "recover.host");
  await page.getByTestId("create-squad").click();

  const squadCode = (await page.getByTestId("squad-code").textContent())
    ?.replace("Code:", "")
    .trim();

  expect(squadCode).toBeTruthy();

  const joinerContext = await browser.newContext();
  const joinerPage = await joinerContext.newPage();
  await authenticateAdditionalOperator(joinerPage, "recover.joiner");
  await joinerPage.getByTestId("join-squad-code").fill(squadCode!);
  await joinerPage.getByTestId("join-squad").click();

  await lockPairAndReady(page);
  await lockPairAndReady(joinerPage);

  await page.getByRole("button", { name: "Reconnect squad state" }).click();
  await page.getByRole("button", { name: "Deploy squad" }).click();
  await expect(page).toHaveURL(/\/missions\/ash-circuit$/);

  await joinerPage.getByRole("button", { name: "Reconnect squad state" }).click();
  await joinerPage.getByTestId("resume-active-mission").click();
  await expect(joinerPage).toHaveURL(/\/missions\/ash-circuit$/);

  await page.getByTestId("abandon-mission-session").click();

  await expect(page).toHaveURL(/\/command-deck$/);
  await expect(page.getByTestId("resume-active-mission")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Deploy squad" })).toBeDisabled();

  // The joiner is still on the mission page. The React state retains missionSession
  // (loaded when activeMissionSessionId was set). The button is visible without reload.
  await joinerPage.getByRole("button", { name: "Reconnect mission state" }).click();
  await expect(
    joinerPage.getByText("Mission session is no longer active.", { exact: true }),
  ).toBeVisible();
  await expect(
    joinerPage.getByRole("link", { name: "Deploy from command deck" }),
  ).toBeVisible();

  await joinerPage.getByRole("link", { name: "Deploy from command deck" }).click();
  await expect(joinerPage).toHaveURL(/\/command-deck$/);
  await expect(joinerPage.getByTestId("resume-active-mission")).toHaveCount(0);

  await joinerContext.close();
});

test("primary operator can deploy Ash Circuit and persist rewards", async ({
  page,
}) => {
  const hostOperator = await authenticatePrimaryOperator(
    page,
    "ash-circuit.primary",
  );

  await expect(
    page.getByText(`Operator: ${hostOperator.email}`, {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Last clear: None", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Current mission: Ash Circuit", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Concord Breach", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("live-event-window")).toBeVisible();
  await expect(page.getByText("Next transition", { exact: true })).toBeVisible();

  await page.getByTestId("deploy-ash-circuit").click();

  await expect(page).toHaveURL(/\/missions\/ash-circuit$/);
  await expect(
    page.getByRole("heading", { name: "Ash Circuit", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Molten Ram", { exact: true })).toBeVisible();
  await expect(page.getByText("Telegraph live", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Static Breach ready", { exact: true })).toBeVisible();

  await clearMission(page);

  await expect(
    page.getByRole("button", { name: "Rewards committed" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Return to command deck" }).click();

  await expect(page).toHaveURL(/\/command-deck$/);
  await expect(
    page.getByText("Last clear: Ash Circuit", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Current mission: Glass Wastes", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("deploy-glass-wastes")).toBeEnabled();
});

test("primary operator can unlock and deploy Glass Wastes", async ({ page }) => {
  await authenticatePrimaryOperator(page, "glass-wastes.unlock");

  await expect(page.getByTestId("deploy-glass-wastes")).toBeDisabled();

  await page.getByTestId("deploy-ash-circuit").click();

  await expect(page).toHaveURL(/\/missions\/ash-circuit$/);
  await clearMission(page);
  await expect(
    page.getByRole("button", { name: "Rewards committed" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Return to command deck" }).click();

  await expect(page).toHaveURL(/\/command-deck$/);
  await expect(page.getByTestId("deploy-glass-wastes")).toBeEnabled();

  await page.getByTestId("deploy-glass-wastes").click();

  await expect(page).toHaveURL(/\/missions\/glass-wastes$/);
  await expect(
    page.getByRole("heading", { name: "Glass Wastes", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Selected mission: glass-wastes", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("mission-event-window")).toBeVisible();
  await expect(page.getByTestId("mission-event-modifiers")).toBeVisible();
  await expect(page.getByTestId("mission-event-contribution")).toBeVisible();
  await expect(page.getByTestId("mission-event-reward-band")).toBeVisible();
});

test("primary operator can clear Glass Wastes and persist the final recovery state", async ({
  page,
}) => {
  await authenticatePrimaryOperator(page, "glass-wastes.recovery");

  await page.getByTestId("deploy-ash-circuit").click();
  // The launch API runs 5 sequential DB writes; allow up to 15s for the
  // server-side navigation redirect to complete.
  await expect(page).toHaveURL(/\/missions\/ash-circuit$/, { timeout: 15_000 });
  await page.getByRole("button", { name: "Arc Jab" }).click();
  await clearMission(page);
  await expect(
    page.getByRole("button", { name: "Rewards committed" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Return to command deck" }).click();
  await expect(page).toHaveURL(/\/command-deck$/);
  await expect(page.getByTestId("deploy-glass-wastes")).toBeEnabled();

  await page.getByTestId("deploy-glass-wastes").click();
  await expect(page).toHaveURL(/\/missions\/glass-wastes$/);
  await expect(
    page.getByRole("heading", { name: "Glass Wastes", exact: true }),
  ).toBeVisible();

  await clearMission(page);
  await expect(
    page.getByRole("button", { name: "Rewards committed" }),
  ).toBeVisible();
  await expect(page.getByTestId("mission-event-contribution")).toBeVisible();
  await expect(page.getByTestId("mission-event-reward-band")).toBeVisible();
  const earnedEventBand =
    (await page.getByTestId("mission-event-reward-band").textContent())?.trim() ??
    "";

  await page.getByRole("link", { name: "Return to command deck" }).click();

  const profileSnapshot = page.locator("article").filter({
    hasText: "Profile storage snapshot",
  });

  await expect(page).toHaveURL(/\/command-deck$/);
  await expect(
    page.getByText("Last clear: Glass Wastes", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Current mission: Neon Underbelly", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("command-deck-event-summary")).toBeVisible();
  await expect(page.getByTestId("command-deck-event-band")).toHaveText(
    earnedEventBand,
  );
  await expect(page.getByTestId("command-deck-event-buckets")).toContainText(
    "Defense",
  );
  await expect(page.getByTestId("command-deck-event-buckets")).toContainText(
    "Support",
  );
  await expect(page.getByTestId("command-deck-event-buckets")).toContainText(
    "Completion",
  );
  await expect(profileSnapshot).toContainText("Hub Recovery");
  await expect(profileSnapshot).toContainText("Glass Wastes");
  await expect(profileSnapshot).toContainText(earnedEventBand);

  const concordStanding = Number.parseInt(
    await readProfileSnapshotValue(page, "Concord standing"),
    10,
  );

  await page.getByRole("button", { name: "Frost Marksman + VEIL-3" }).click();
  await expect
    .poll(() => readProfileSnapshotValue(page, "Starter loadout"))
    .toContain("Frost Marksman");
  await expect
    .poll(() => readProfileSnapshotValue(page, "Bonded AI companion"))
    .toContain("VEIL-3");

  await page.goto("/field-guide");

  await expect(page).toHaveURL(/\/field-guide$/);
  await expect(page.getByTestId("field-guide-event-summary")).toBeVisible();
  await expect(page.getByTestId("field-guide-event-band")).toHaveText(
    earnedEventBand,
  );
  await expect(page.getByTestId("field-guide-event-buckets")).toContainText(
    "Defense",
  );
  await expect(page.getByTestId("field-guide-event-buckets")).toContainText(
    "Support",
  );
  await expect(page.getByTestId("field-guide-event-buckets")).toContainText(
    "Completion",
  );

  await page.goto("/backlog");

  await expect(page).toHaveURL(/\/backlog$/);
  await expect(page.getByTestId("backlog-telemetry-summary")).toBeVisible();
  await expect(page.getByTestId("backlog-telemetry-summary")).toContainText(
    "Mission completions",
  );
  await expect(page.getByTestId("backlog-telemetry-pairings")).toBeVisible();
  await expect(page.getByTestId("backlog-balance-flux-ward")).toBeVisible();
  await expect(page.getByTestId("backlog-balance-flux-ward")).toContainText(
    "Target 7-11 actions per clear",
  );
  await expect(page.getByTestId("backlog-balance-flux-ward")).not.toContainText(
    "No completed runs yet",
  );
  await expect(page.getByTestId("backlog-phase-arrival")).toBeVisible();
  await expect(page.getByTestId("backlog-phase-mission")).toBeVisible();
  await expect(page.getByTestId("backlog-phase-recovery")).not.toContainText(
    "Reached by 0 operators",
  );
  expect(
    Number.parseInt(
      (await page.getByTestId("backlog-telemetry-pair-selections").textContent()) ??
        "0",
      10,
    ),
  ).toBeGreaterThan(0);
  expect(
    Number.parseInt(
      (await page.getByTestId("backlog-telemetry-reaction-triggers").textContent()) ??
        "0",
      10,
    ),
  ).toBeGreaterThan(0);
  expect(
    Number.parseInt(
      (await page.getByTestId("backlog-telemetry-telegraph-failures").textContent()) ??
        "0",
      10,
    ),
  ).toBeGreaterThan(0);
  await expect(page.getByTestId("backlog-pairing-frost-thread")).toBeVisible();
  await expect(page.getByTestId("backlog-pairing-frost-thread")).toContainText(
    "Frost Marksman + VEIL-3",
  );

  expect(concordStanding).toBeGreaterThan(40);
});

test("four-operator playtest can be logged and summarized on the backlog", async ({
  browser,
  page,
}) => {
  const hostOperator = await authenticatePrimaryOperator(page, "playtest.host");
  await page.getByTestId("create-squad").click();

  const squadCode = (await page.getByTestId("squad-code").textContent())
    ?.replace("Code:", "")
    .trim();

  expect(squadCode).toBeTruthy();

  const joinerSessions: Array<{
    context: Awaited<ReturnType<typeof browser.newContext>>;
    page: Page;
    email: string;
  }> = [];

  try {
    for (let index = 0; index < 3; index += 1) {
      const joinerContext = await browser.newContext();
      const joinerPage = await joinerContext.newPage();
      const joinerOperator = await authenticateAdditionalOperator(
        joinerPage,
        `playtest.joiner.${index}`,
      );

      joinerSessions.push({
        context: joinerContext,
        page: joinerPage,
        email: joinerOperator.email,
      });

      await joinerPage.getByTestId("join-squad-code").fill(squadCode!);
      await joinerPage.getByTestId("join-squad").click();
    }

    await page.getByRole("button", { name: "Reconnect squad state" }).click();
    await lockPairAndReady(page);

    for (const joiner of joinerSessions) {
      await lockPairAndReady(joiner.page);
    }

    await page.getByRole("button", { name: "Reconnect squad state" }).click();
    await expect(page.getByRole("button", { name: "Deploy squad" })).toBeEnabled();
    await page.getByRole("button", { name: "Deploy squad" }).click();

    await expect(page).toHaveURL(/\/missions\/ash-circuit$/);
    await expect(page.getByTestId("mission-session-roster")).toContainText(
      hostOperator.email,
    );

    for (const joiner of joinerSessions) {
      await expect(page.getByTestId("mission-session-roster")).toContainText(
        joiner.email,
      );
    }

    await joinerSessions[0].page.getByRole("button", { name: "Reconnect squad state" }).click();
    await expect(joinerSessions[0].page.getByTestId("resume-active-mission")).toBeVisible();
    await joinerSessions[0].page.getByTestId("resume-active-mission").click();
    await expect(joinerSessions[0].page).toHaveURL(/\/missions\/ash-circuit$/);
    await expect(joinerSessions[0].page.getByTestId("mission-session-roster")).toContainText(
      hostOperator.email,
    );

    for (const joiner of joinerSessions) {
      await expect(joinerSessions[0].page.getByTestId("mission-session-roster")).toContainText(
        joiner.email,
      );
    }

    await page.goto("/backlog");

    await expect(page).toHaveURL(/\/backlog$/);
    await expect(page.getByTestId("backlog-playtest-panel")).toBeVisible();
    await page.getByTestId("playtest-mission").selectOption("ash-circuit");
    await page.getByTestId("playtest-session-summary").fill(
      "Reviewed four-operator Ash Circuit pass covering squad join, ready-gating, deployment, live roster sync, route transitions, and final recovery after the html shell follow-through landed.",
    );
    await page.getByTestId("start-playtest-session").click();
    await expect(page.getByTestId("playtest-session-chip")).not.toContainText(
      "Not started",
    );
    await expect(page.getByTestId("log-playtest-issue")).toBeDisabled();

    await expect(page.getByTestId("backlog-playtest-summary")).toBeVisible();
    await expect(page.getByTestId("backlog-playtest-summary")).toContainText(
      "Latest reviewed four-player session",
    );
    await expect(page.getByTestId("backlog-playtest-summary")).toContainText(
      "Reviewed four-operator Ash Circuit pass covering squad join, ready-gating, deployment, live roster sync, route transitions, and final recovery after the html shell follow-through landed.",
    );
    await expect(page.getByTestId("backlog-playtest-headline")).toContainText(
      "No critical, major, or polish findings have been logged for the latest session yet.",
    );
    await expect(page.getByTestId("backlog-playtest-critical")).toContainText(
      "No critical issues logged for this session.",
    );
    await expect(page.getByTestId("backlog-playtest-major")).toContainText(
      "No major issues logged for this session.",
    );
    await expect(page.getByTestId("backlog-playtest-polish")).toContainText(
      "No polish issues logged for this session.",
    );
    await expect(page.getByTestId("backlog-exit-decision-status")).toContainText(
      "Advance",
    );
    await expect(page.getByTestId("backlog-exit-decision-title")).toContainText(
      "Advance into broader service production.",
    );
    await expect(page.getByTestId("backlog-exit-decision")).toContainText(
      "Phase 12 is locked. Use the migration runbook, environment contract, rollout runbook, and locked stack choice as the production-planning baseline.",
    );
    await expect(page.getByTestId("backlog-next-phase-title")).toContainText(
      "Next phase: Phase 13 Production Foundation",
    );
    await expect(page.getByTestId("backlog-next-phase-item-VS-25")).toContainText(
      "Integrate hosted identity",
    );
    await expect(page.getByTestId("backlog-next-phase-item-VS-28")).toContainText(
      "Wire hosted observability and managed event configuration",
    );
  } finally {
    for (const joiner of joinerSessions) {
      await joiner.context.close();
    }
  }
});