export const runtimeModes = ["local-prototype", "hosted-candidate"] as const;
export type RuntimeMode = (typeof runtimeModes)[number];

export const runtimeModeSources = [
  "env",
  "inferred-from-database-url",
  "default",
] as const;
export type RuntimeModeSource = (typeof runtimeModeSources)[number];

export type DatabaseUrlKind = "missing" | "sqlite-file" | "postgres" | "other";

export type RuntimeModeResolution = {
  mode: RuntimeMode;
  source: RuntimeModeSource;
  databaseUrlKind: DatabaseUrlKind;
  reason: string;
};

export const runtimeModeEnvKey = "APP_RUNTIME_MODE";

function normalizeRuntimeMode(value: string | undefined): RuntimeMode | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "local-prototype" || normalized === "hosted-candidate") {
    return normalized;
  }

  return null;
}

export function classifyDatabaseUrl(
  databaseUrl: string | undefined | null,
): DatabaseUrlKind {
  if (!databaseUrl || databaseUrl.trim().length === 0) {
    return "missing";
  }

  const normalized = databaseUrl.trim().toLowerCase();

  if (normalized.startsWith("file:") || normalized.startsWith("sqlite:")) {
    return "sqlite-file";
  }

  if (
    normalized.startsWith("postgres://") ||
    normalized.startsWith("postgresql://")
  ) {
    return "postgres";
  }

  return "other";
}

export function resolveRuntimeMode(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeModeResolution {
  const rawMode = env[runtimeModeEnvKey];
  const normalizedMode = normalizeRuntimeMode(rawMode);
  const databaseUrlKind = classifyDatabaseUrl(env.DATABASE_URL);

  if (normalizedMode) {
    return {
      mode: normalizedMode,
      source: "env",
      databaseUrlKind,
      reason: `${runtimeModeEnvKey}=${normalizedMode}`,
    };
  }

  if (databaseUrlKind === "sqlite-file") {
    return {
      mode: "local-prototype",
      source: "inferred-from-database-url",
      databaseUrlKind,
      reason: rawMode
        ? `${runtimeModeEnvKey} is invalid (${rawMode}); inferred local-prototype from DATABASE_URL`
        : "Inferred local-prototype from DATABASE_URL",
    };
  }

  if (databaseUrlKind === "postgres" || databaseUrlKind === "other") {
    return {
      mode: "hosted-candidate",
      source: "inferred-from-database-url",
      databaseUrlKind,
      reason: rawMode
        ? `${runtimeModeEnvKey} is invalid (${rawMode}); inferred hosted-candidate from DATABASE_URL`
        : "Inferred hosted-candidate from DATABASE_URL",
    };
  }

  return {
    mode: "local-prototype",
    source: "default",
    databaseUrlKind,
    reason: rawMode
      ? `${runtimeModeEnvKey} is invalid (${rawMode}); defaulted to local-prototype because DATABASE_URL is missing`
      : "Defaulted to local-prototype because DATABASE_URL is missing",
  };
}
