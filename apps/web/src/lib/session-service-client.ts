import {
  abandonMissionSession,
  advanceMissionSessionStage,
  applyCombatActionToMissionSession,
  commitMissionSessionMember,
  launchMissionSession,
  readCurrentMissionSession,
  readSessionServiceHealth,
  retryMissionSessionStage,
  type SessionServiceHealth,
} from "@/lib/session-service";
import {
  type SessionServiceAbandonMissionRequest,
  type SessionServiceAdvanceStageRequest,
  type SessionServiceCombatActionRequest,
  type SessionServiceCommitMemberRequest,
  readSessionServiceInternalToken,
  resolveSessionServiceConfig,
  sessionServiceInternalTokenHeader,
  sessionServiceRoutes,
  type SessionServiceCurrentMissionRequest,
  type SessionServiceLaunchMissionRequest,
  type SessionServiceMissionEnvelope,
  type SessionServiceMissionRouteResult,
  type SessionServiceRetryStageRequest,
} from "@/lib/session-service-contract";

function createUnavailableMissionResult(
  message: string,
): SessionServiceMissionRouteResult {
  return {
    missionSession: null,
    message,
    status: 503,
  };
}

async function readMissionEnvelope(response: Response) {
  let data: Partial<SessionServiceMissionEnvelope> = {};

  try {
    data = (await response.json()) as Partial<SessionServiceMissionEnvelope>;
  } catch {
    data = {};
  }

  return {
    missionSession: data.missionSession ?? null,
    message: typeof data.message === "string" ? data.message : undefined,
    source: "session-service",
  } satisfies SessionServiceMissionEnvelope;
}

async function postToExternalSessionService<TBody>(
  path: string,
  body: TBody,
): Promise<SessionServiceMissionRouteResult> {
  const config = resolveSessionServiceConfig();
  const internalToken = readSessionServiceInternalToken();

  if (!config.baseUrl || !internalToken) {
    return createUnavailableMissionResult(
      "External session-service contract is not fully configured yet.",
    );
  }

  try {
    const response = await fetch(new URL(path, config.baseUrl).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [sessionServiceInternalTokenHeader]: internalToken,
      },
      cache: "no-store",
      body: JSON.stringify(body),
    });
    const envelope = await readMissionEnvelope(response);

    return {
      missionSession: envelope.missionSession,
      message: envelope.message,
      status: response.status,
    };
  } catch {
    return createUnavailableMissionResult(
      "Unable to reach the external session-service runtime right now.",
    );
  }
}

export async function readCurrentMissionSessionFromService(
  request: SessionServiceCurrentMissionRequest,
): Promise<SessionServiceMissionRouteResult> {
  const config = resolveSessionServiceConfig();

  if (config.mode === "embedded-web") {
    const result = await readCurrentMissionSession(request);

    return {
      missionSession: result.missionSession,
      message: result.message,
      status: 200,
    };
  }

  return postToExternalSessionService(sessionServiceRoutes.currentMission, request);
}

export async function launchMissionSessionFromService(
  request: SessionServiceLaunchMissionRequest,
): Promise<SessionServiceMissionRouteResult> {
  const config = resolveSessionServiceConfig();

  if (config.mode === "embedded-web") {
    return launchMissionSession(request, request.missionId);
  }

  return postToExternalSessionService(sessionServiceRoutes.launchMission, request);
}

export async function abandonMissionSessionFromService(
  request: SessionServiceAbandonMissionRequest,
): Promise<SessionServiceMissionRouteResult> {
  const config = resolveSessionServiceConfig();

  if (config.mode === "embedded-web") {
    return abandonMissionSession(request);
  }

  return postToExternalSessionService(sessionServiceRoutes.abandonMission, request);
}

export async function applyCombatActionToMissionSessionFromService(
  request: SessionServiceCombatActionRequest,
): Promise<SessionServiceMissionRouteResult> {
  const config = resolveSessionServiceConfig();

  if (config.mode === "embedded-web") {
    return applyCombatActionToMissionSession(request);
  }

  return postToExternalSessionService(sessionServiceRoutes.combatAction, request);
}

export async function advanceMissionSessionStageFromService(
  request: SessionServiceAdvanceStageRequest,
): Promise<SessionServiceMissionRouteResult> {
  const config = resolveSessionServiceConfig();

  if (config.mode === "embedded-web") {
    return advanceMissionSessionStage(request);
  }

  return postToExternalSessionService(sessionServiceRoutes.advanceStage, request);
}

export async function retryMissionSessionStageFromService(
  request: SessionServiceRetryStageRequest,
): Promise<SessionServiceMissionRouteResult> {
  const config = resolveSessionServiceConfig();

  if (config.mode === "embedded-web") {
    return retryMissionSessionStage(request);
  }

  return postToExternalSessionService(sessionServiceRoutes.retryStage, request);
}

export async function commitMissionSessionMemberFromService(
  request: SessionServiceCommitMemberRequest,
): Promise<SessionServiceMissionRouteResult> {
  const config = resolveSessionServiceConfig();

  if (config.mode === "embedded-web") {
    return commitMissionSessionMember(request);
  }

  return postToExternalSessionService(sessionServiceRoutes.commitMember, request);
}

export async function readSessionServiceHealthFromService(): Promise<SessionServiceHealth> {
  const config = resolveSessionServiceConfig();
  const internalToken = readSessionServiceInternalToken();

  if (config.mode === "embedded-web" || !config.baseUrl || !internalToken) {
    return readSessionServiceHealth();
  }

  try {
    const response = await fetch(new URL(sessionServiceRoutes.health, config.baseUrl).toString(), {
      headers: {
        [sessionServiceInternalTokenHeader]: internalToken,
      },
      cache: "no-store",
    });

    return (await response.json()) as SessionServiceHealth;
  } catch (error) {
    const fallback = await readSessionServiceHealth();

    return {
      ...fallback,
      status: "degraded",
      database: {
        reachable: false,
        detail:
          error instanceof Error
            ? `External session-service request failed: ${error.message}`
            : "External session-service request failed.",
      },
    };
  }
}