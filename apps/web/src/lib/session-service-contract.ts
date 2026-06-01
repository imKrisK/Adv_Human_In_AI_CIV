import {
  resolveRuntimeMode,
  type RuntimeModeResolution,
} from "@/lib/runtime-mode";
import { type CombatActionId } from "@/lib/playable-slice";
import {
  type CommandDeckState,
  type MissionSessionState,
} from "@/lib/prototype-data";

export const sessionServiceRoutes = {
  health: "/api/session-service/health",
  currentMission: "/api/session-service/mission-session/current",
  launchMission: "/api/session-service/mission-session/launch",
  abandonMission: "/api/session-service/mission-session/abandon",
  combatAction: "/api/session-service/mission-session/combat-action",
  advanceStage: "/api/session-service/mission-session/advance-stage",
  retryStage: "/api/session-service/mission-session/retry-stage",
  commitMember: "/api/session-service/mission-session/commit-member",
} as const;

export const sessionServiceModeEnvKey = "SESSION_SERVICE_MODE";
export const sessionServiceBaseUrlEnvKey = "SESSION_SERVICE_BASE_URL";
export const sessionServiceCoordinationModeEnvKey =
  "SESSION_SERVICE_COORDINATION_MODE";
export const sessionServiceInternalTokenEnvKey =
  "SESSION_SERVICE_INTERNAL_TOKEN";
export const sessionServiceInternalTokenHeader =
  "x-session-service-internal-token";

export const sessionServiceModes = ["embedded-web", "external-runtime"] as const;
export type SessionServiceMode = (typeof sessionServiceModes)[number];

export const sessionServiceCoordinationModes = [
  "inline-local",
  "redis-upstash",
] as const;
export type SessionServiceCoordinationMode =
  (typeof sessionServiceCoordinationModes)[number];

export const sessionServiceConfigSources = [
  "env",
  "local-default",
  "hosted-default",
] as const;
export type SessionServiceConfigSource =
  (typeof sessionServiceConfigSources)[number];

export type SessionServiceMissionEnvelope = {
  missionSession: MissionSessionState | null;
  message?: string;
  source: "session-service";
};

export type SessionServiceCurrentMissionRequest = {
  userId: string;
  profile: Pick<CommandDeckState, "activeMissionSessionId" | "phase">;
};

export type SessionServiceAbandonMissionRequest =
  SessionServiceCurrentMissionRequest;

export type SessionServiceAdvanceStageRequest =
  SessionServiceCurrentMissionRequest;

export type SessionServiceRetryStageRequest =
  SessionServiceCurrentMissionRequest;

export type SessionServiceCommitMemberRequest =
  SessionServiceCurrentMissionRequest;

export type SessionServiceCombatActionRequest =
  SessionServiceCurrentMissionRequest & {
    actionId: CombatActionId;
  };

export type SessionServiceLaunchMissionRequest = {
  userId: string;
  missionId: string;
  profile: Pick<
    CommandDeckState,
    "activeMissionSessionId" | "squadRole" | "squadSessionId"
  >;
};

export type SessionServiceMissionRouteResult = {
  missionSession: MissionSessionState | null;
  message?: string;
  status: number;
};

export type SessionServiceConfig = {
  runtime: RuntimeModeResolution;
  mode: SessionServiceMode;
  coordinationMode: SessionServiceCoordinationMode;
  baseUrl: string | null;
  source: SessionServiceConfigSource;
  missingKeys: string[];
};

function normalizeEnumValue<T extends readonly string[]>(
  value: string | undefined,
  allowed: T,
): T[number] | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return allowed.find((entry) => entry === normalized) ?? null;
}

function normalizeNonEmptyValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function readSessionServiceInternalToken(
  env: NodeJS.ProcessEnv = process.env,
) {
  return normalizeNonEmptyValue(env[sessionServiceInternalTokenEnvKey]);
}

export function isValidSessionServiceInternalRequest(
  headerValue: string | null,
  env: NodeJS.ProcessEnv = process.env,
) {
  const expected = readSessionServiceInternalToken(env);
  return Boolean(expected && headerValue === expected);
}

export function resolveSessionServiceConfig(
  env: NodeJS.ProcessEnv = process.env,
): SessionServiceConfig {
  const runtime = resolveRuntimeMode(env);
  const explicitMode = normalizeEnumValue(env[sessionServiceModeEnvKey], sessionServiceModes);
  const explicitCoordinationMode = normalizeEnumValue(
    env[sessionServiceCoordinationModeEnvKey],
    sessionServiceCoordinationModes,
  );
  const explicitBaseUrl = normalizeNonEmptyValue(env[sessionServiceBaseUrlEnvKey]);
  const explicitInternalToken = readSessionServiceInternalToken(env);

  const source: SessionServiceConfigSource =
    explicitMode || explicitCoordinationMode || explicitBaseUrl || explicitInternalToken
      ? "env"
      : runtime.mode === "local-prototype"
        ? "local-default"
        : "hosted-default";

  const mode = explicitMode ?? "embedded-web";
  const coordinationMode =
    explicitCoordinationMode ??
    (runtime.mode === "local-prototype" ? "inline-local" : "redis-upstash");

  const missingKeys: string[] = [];

  if (mode === "external-runtime" && !explicitBaseUrl) {
    missingKeys.push(sessionServiceBaseUrlEnvKey);
  }

  if (mode === "external-runtime" && !explicitInternalToken) {
    missingKeys.push(sessionServiceInternalTokenEnvKey);
  }

  if (coordinationMode === "redis-upstash") {
    if (!env.FLY_REALTIME_APP_NAME) {
      missingKeys.push("FLY_REALTIME_APP_NAME");
    }

    if (!env.UPSTASH_REDIS_REST_URL) {
      missingKeys.push("UPSTASH_REDIS_REST_URL");
    }

    if (!env.UPSTASH_REDIS_REST_TOKEN) {
      missingKeys.push("UPSTASH_REDIS_REST_TOKEN");
    }
  }

  return {
    runtime,
    mode,
    coordinationMode,
    baseUrl: explicitBaseUrl,
    source,
    missingKeys,
  };
}