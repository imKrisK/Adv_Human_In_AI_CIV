import { z } from "zod";

import {
  resolveRuntimeMode,
  runtimeModeEnvKey,
  type RuntimeModeSource,
} from "@/lib/runtime-mode";
import {
  sessionServiceBaseUrlEnvKey,
  sessionServiceCoordinationModeEnvKey,
  sessionServiceCoordinationModes,
  sessionServiceInternalTokenEnvKey,
  sessionServiceModeEnvKey,
  sessionServiceModes,
} from "@/lib/session-service-contract";

const nonEmptyString = z.string().trim().min(1);
const absoluteUrl = z.string().trim().url();
const postgresUrl = z
  .string()
  .trim()
  .regex(/^postgres(ql)?:\/\//i, "Expected a PostgreSQL connection URL.");
const appRoutePath = z.string().trim().regex(/^\//, "Expected an app-relative path.");

type EnvironmentContractDefinition = {
  key: string;
  provider: string;
  summary: string;
  expectedFormat: string;
  validator: z.ZodType<string>;
};

export const environmentContractDefinitions = [
  {
    key: "NODE_ENV",
    provider: "Vercel",
    summary: "Hosted runtime mode for the web app and route handlers.",
    expectedFormat: "development | test | production",
    validator: z.enum(["development", "test", "production"]),
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    provider: "Vercel",
    summary: "Canonical public app URL for the hosted web surface.",
    expectedFormat: "Absolute URL",
    validator: absoluteUrl,
  },
  {
    key: "DATABASE_URL",
    provider: "Neon Postgres",
    summary: "Pooled PostgreSQL connection string for the app runtime.",
    expectedFormat: "postgresql://...",
    validator: postgresUrl,
  },
  {
    key: "DIRECT_DATABASE_URL",
    provider: "Neon Postgres",
    summary: "Direct PostgreSQL connection string for migrations.",
    expectedFormat: "postgresql://...",
    validator: postgresUrl,
  },
  {
    key: "CLERK_SECRET_KEY",
    provider: "Clerk",
    summary: "Server-side Clerk credential for auth routes.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    provider: "Clerk",
    summary: "Client-side Clerk publishable key.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
    provider: "Clerk",
    summary: "App-relative sign-in route.",
    expectedFormat: "/sign-in",
    validator: appRoutePath,
  },
  {
    key: "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
    provider: "Clerk",
    summary: "App-relative sign-up route.",
    expectedFormat: "/sign-up",
    validator: appRoutePath,
  },
  {
    key: "FLY_REALTIME_APP_NAME",
    provider: "Fly.io",
    summary: "Realtime runtime app name.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: sessionServiceModeEnvKey,
    provider: "Session service",
    summary: "Runtime placement for mission session authority.",
    expectedFormat: "embedded-web | external-runtime",
    validator: z.enum(sessionServiceModes),
  },
  {
    key: sessionServiceBaseUrlEnvKey,
    provider: "Session service",
    summary: "Base URL for the dedicated session-service runtime.",
    expectedFormat: "Absolute URL",
    validator: absoluteUrl,
  },
  {
    key: sessionServiceInternalTokenEnvKey,
    provider: "Session service",
    summary: "Shared server-to-server token for internal session-service calls.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: sessionServiceCoordinationModeEnvKey,
    provider: "Session service",
    summary: "Presence and realtime coordination mode for session-service state.",
    expectedFormat: "inline-local | redis-upstash",
    validator: z.enum(sessionServiceCoordinationModes),
  },
  {
    key: "FLY_WORKER_APP_NAME",
    provider: "Fly.io",
    summary: "Background worker app name.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "FLY_PRIMARY_REGION",
    provider: "Fly.io",
    summary: "Primary Fly region for the hosted baseline.",
    expectedFormat: "Region code",
    validator: nonEmptyString,
  },
  {
    key: "UPSTASH_REDIS_REST_URL",
    provider: "Upstash Redis",
    summary: "Redis REST endpoint for coordination and presence.",
    expectedFormat: "Absolute URL",
    validator: absoluteUrl,
  },
  {
    key: "UPSTASH_REDIS_REST_TOKEN",
    provider: "Upstash Redis",
    summary: "Redis REST token for worker and realtime coordination.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "R2_ACCOUNT_ID",
    provider: "Cloudflare R2",
    summary: "Cloudflare account identifier for object storage.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "R2_BUCKET",
    provider: "Cloudflare R2",
    summary: "R2 bucket name for assets and artifacts.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "R2_ACCESS_KEY_ID",
    provider: "Cloudflare R2",
    summary: "R2 access key id for uploads and reads.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "R2_SECRET_ACCESS_KEY",
    provider: "Cloudflare R2",
    summary: "R2 secret access key for uploads and reads.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "R2_PUBLIC_BASE_URL",
    provider: "Cloudflare R2",
    summary: "Public asset base URL for served content.",
    expectedFormat: "Absolute URL",
    validator: absoluteUrl,
  },
  {
    key: "NEXT_PUBLIC_POSTHOG_KEY",
    provider: "PostHog",
    summary: "Client-side PostHog project key.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "NEXT_PUBLIC_POSTHOG_HOST",
    provider: "PostHog",
    summary: "Hosted PostHog ingestion endpoint.",
    expectedFormat: "Absolute URL",
    validator: absoluteUrl,
  },
  {
    key: "POSTHOG_PROJECT_API_KEY",
    provider: "PostHog",
    summary: "Server-side PostHog project API key.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "SENTRY_DSN",
    provider: "Sentry",
    summary: "Server-side Sentry DSN.",
    expectedFormat: "Absolute URL",
    validator: absoluteUrl,
  },
  {
    key: "NEXT_PUBLIC_SENTRY_DSN",
    provider: "Sentry",
    summary: "Client-side Sentry DSN.",
    expectedFormat: "Absolute URL",
    validator: absoluteUrl,
  },
  {
    key: "SENTRY_AUTH_TOKEN",
    provider: "Sentry",
    summary: "Release automation token for Sentry.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "SENTRY_ORG",
    provider: "Sentry",
    summary: "Sentry organization slug.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
  {
    key: "SENTRY_PROJECT",
    provider: "Sentry",
    summary: "Sentry project slug.",
    expectedFormat: "Non-empty string",
    validator: nonEmptyString,
  },
] as const satisfies readonly EnvironmentContractDefinition[];

export type EnvironmentContractVariableId =
  (typeof environmentContractDefinitions)[number]["key"];

export type EnvironmentContractVariableStatus = {
  key: EnvironmentContractVariableId;
  provider: string;
  summary: string;
  expectedFormat: string;
  configured: boolean;
  valid: boolean;
  status: "Ready" | "Missing" | "Invalid";
};

export type EnvironmentContractStatus = {
  runtimeMode: "local-prototype" | "hosted-candidate";
  runtimeModeSource: RuntimeModeSource;
  runtimeModeReason: string;
  runtimeModeEnvKey: string;
  databaseUrlKind: "missing" | "sqlite-file" | "postgres" | "other";
  contractReady: boolean;
  gateStatus: "pass" | "warn" | "fail";
  responseStatus: 200 | 503;
  requiredCount: number;
  configuredCount: number;
  validCount: number;
  missingKeys: EnvironmentContractVariableId[];
  invalidKeys: EnvironmentContractVariableId[];
  configuredKeys: EnvironmentContractVariableId[];
  headline: string;
  gateSummary: string;
  nextStep: string;
  variables: EnvironmentContractVariableStatus[];
};

export function readEnvironmentContractStatus(
  env: NodeJS.ProcessEnv = process.env,
): EnvironmentContractStatus {
  const runtimeModeResolution = resolveRuntimeMode(env);
  const variables = environmentContractDefinitions.map((definition) => {
    const value = env[definition.key];

    if (typeof value !== "string" || value.trim().length === 0) {
      return {
        key: definition.key,
        provider: definition.provider,
        summary: definition.summary,
        expectedFormat: definition.expectedFormat,
        configured: false,
        valid: false,
        status: "Missing" as const,
      };
    }

    const result = definition.validator.safeParse(value);

    return {
      key: definition.key,
      provider: definition.provider,
      summary: definition.summary,
      expectedFormat: definition.expectedFormat,
      configured: true,
      valid: result.success,
      status: result.success ? ("Ready" as const) : ("Invalid" as const),
    };
  });

  const missingKeys = variables
    .filter((variable) => variable.status === "Missing")
    .map((variable) => variable.key);
  const invalidKeys = variables
    .filter((variable) => variable.status === "Invalid")
    .map((variable) => variable.key);
  const configuredKeys = variables
    .filter((variable) => variable.configured)
    .map((variable) => variable.key);
  const validCount = variables.filter((variable) => variable.valid).length;
  const runtimeMode = runtimeModeResolution.mode;
  const contractReady = missingKeys.length === 0 && invalidKeys.length === 0;
  const gateStatus = contractReady
    ? "pass"
    : runtimeMode === "local-prototype"
      ? "warn"
      : "fail";
  const responseStatus = gateStatus === "fail" ? 503 : 200;

  const headline = contractReady
    ? "Hosted environment contract is present and valid for the locked deployment baseline."
    : runtimeMode === "local-prototype"
      ? "Current runtime is still using the local SQLite prototype contract, so the hosted deployment matrix is not configured yet."
      : `Hosted environment contract is incomplete: ${missingKeys.length} missing and ${invalidKeys.length} invalid variables remain.`;

  const gateSummary = contractReady
    ? "Staging gate passes: the hosted provider contract is complete."
    : runtimeMode === "local-prototype"
      ? "Staging gate is informational only while the runtime stays on the local SQLite prototype contract."
      : "Staging gate is blocked until all hosted provider variables are present and valid.";

  const nextStep = contractReady
    ? "Proceed with staged provider checks and promotion rehearsal against the locked stack."
    : runtimeMode === "local-prototype"
      ? "Provision the hosted contract in Vercel, Fly, Neon, Upstash, Clerk, PostHog, Sentry, and Cloudflare R2 before the first staged promotion."
      : "Fill the missing or invalid hosted variables before the first staging promotion.";

  return {
    runtimeMode,
    runtimeModeSource: runtimeModeResolution.source,
    runtimeModeReason: runtimeModeResolution.reason,
    runtimeModeEnvKey,
    databaseUrlKind: runtimeModeResolution.databaseUrlKind,
    contractReady,
    gateStatus,
    responseStatus,
    requiredCount: environmentContractDefinitions.length,
    configuredCount: configuredKeys.length,
    validCount,
    missingKeys,
    invalidKeys,
    configuredKeys,
    headline,
    gateSummary,
    nextStep,
    variables,
  };
}