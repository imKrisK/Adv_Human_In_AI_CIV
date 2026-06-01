import { createClerkClient } from "@clerk/nextjs/server";
import { clerk } from "@clerk/testing/playwright";
import { expect, type Page } from "@playwright/test";

export type SmokeOperatorSession = {
  email: string;
  password: string;
};

type SmokeAuthMode = "local-demo" | "clerk-testing";

const demoOperatorEmail = "demo.operator@lattice-haven.test";
const defaultOperatorPassword = "PrototypePass123!";

if (
  !process.env.CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
) {
  process.env.CLERK_PUBLISHABLE_KEY =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

const smokeAuthMode = resolveSmokeAuthMode();

let smokeOperatorSequence = 0;
let clerkClient: ReturnType<typeof createClerkClient> | null = null;

function resolveSmokeAuthMode(): SmokeAuthMode {
  const requestedMode = process.env.SMOKE_AUTH_MODE?.trim().toLowerCase();

  if (requestedMode === "local-demo" || requestedMode === "clerk-testing") {
    return requestedMode;
  }

  return process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY
    ? "clerk-testing"
    : "local-demo";
}

function buildSmokeOperatorEmail(label: string) {
  const normalizedLabel = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 48);
  const uniqueSuffix = `${Date.now()}-${smokeOperatorSequence++}`;

  if (smokeAuthMode === "clerk-testing") {
    return `smoke.${normalizedLabel}.${uniqueSuffix}+clerk_test@example.com`;
  }

  return `${normalizedLabel}.${uniqueSuffix}@lattice-haven.test`;
}

function createSmokeOperator(label: string): SmokeOperatorSession {
  return {
    email: buildSmokeOperatorEmail(label),
    password: defaultOperatorPassword,
  };
}

function getClerkTestingClient() {
  if (clerkClient) {
    return clerkClient;
  }

  if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
    throw new Error(
      "Hosted smoke auth requires CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY.",
    );
  }

  clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  });

  return clerkClient;
}

async function ensureHostedOperatorUser(operator: SmokeOperatorSession) {
  const client = getClerkTestingClient();
  const existingUsers = await client.users.getUserList({
    emailAddress: [operator.email],
  });
  const existingUser = existingUsers.data[0];

  if (existingUser) {
    await client.users.updateUser(existingUser.id, {
      password: operator.password,
      skipPasswordChecks: true,
      skipLegalChecks: true,
    });
    return;
  }

  await client.users.createUser({
    emailAddress: [operator.email],
    password: operator.password,
    skipPasswordChecks: true,
    skipLegalChecks: true,
  });
}

async function signInWithDemoOperator(page: Page): Promise<SmokeOperatorSession> {
  await page.goto("/command-deck");

  await page.getByRole("button", { name: "Use demo operator" }).click();

  await expect(
    page.getByText(`Operator: ${demoOperatorEmail}`, {
      exact: true,
    }),
  ).toBeVisible();

  return {
    email: demoOperatorEmail,
    password: defaultOperatorPassword,
  };
}

async function registerLocalOperator(
  page: Page,
  operator: SmokeOperatorSession,
) {
  await page.goto("/command-deck");

  await page.getByLabel("Email").fill(operator.email);
  await page.getByLabel("Password").fill(operator.password);
  await page.getByRole("button", { name: "Create bonded operator profile" }).click();

  await expect(
    page.getByText(`Operator: ${operator.email}`, {
      exact: true,
    }),
  ).toBeVisible();
}

async function signInWithHostedOperator(
  page: Page,
  operator: SmokeOperatorSession,
) {
  await ensureHostedOperatorUser(operator);

  await page.goto("/");
  await clerk.loaded({ page });
  await clerk.signIn({
    page,
    emailAddress: operator.email,
  });
  await page.goto("/auth/complete");

  await expect(page).toHaveURL(/\/command-deck$/);
  await expect(
    page.getByText(`Operator: ${operator.email}`, {
      exact: true,
    }),
  ).toBeVisible();
}

export async function authenticatePrimaryOperator(page: Page, label: string) {
  if (smokeAuthMode === "local-demo") {
    return signInWithDemoOperator(page);
  }

  const operator = createSmokeOperator(label);
  await signInWithHostedOperator(page, operator);
  return operator;
}

export async function authenticateAdditionalOperator(page: Page, label: string) {
  const operator = createSmokeOperator(label);

  if (smokeAuthMode === "local-demo") {
    await registerLocalOperator(page, operator);
    return operator;
  }

  await signInWithHostedOperator(page, operator);
  return operator;
}