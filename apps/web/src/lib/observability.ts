import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import {
  resolveRuntimeMode,
  type RuntimeMode,
  type RuntimeModeSource,
} from "@/lib/runtime-mode";

const placeholderValuePattern = /replace_me|placeholder|example|smoke/i;

export const telemetryForwardingEventTypes = [
  "mission_launched",
  "mission_completed",
] as const;

export const observabilityAuditEventTypes = [
  "observability_probe_requested",
  "observability_analytics_delivered",
  "observability_analytics_failed",
  "observability_analytics_skipped",
  "observability_error_delivered",
  "observability_error_failed",
  "observability_error_skipped",
] as const;

type ForwardedTelemetryEventType = (typeof telemetryForwardingEventTypes)[number];
export type ObservabilityAuditEventType =
  (typeof observabilityAuditEventTypes)[number];

type ObservabilityTelemetryEvent = {
  userId?: string | null;
  eventType: string;
  phase?: string | null;
  missionId?: string | null;
  context?: Record<string, unknown> | null;
  createdAt?: Date;
};

type ObservabilityAuditTelemetryEvent = Omit<
  ObservabilityTelemetryEvent,
  "eventType"
> & {
  eventType: ObservabilityAuditEventType;
};

export type ObservabilityProviderMode = "active" | "placeholder" | "missing";
export type ObservabilityProbeDelivery = "delivered" | "failed" | "skipped";

type ProviderStatusBase = {
  provider: "PostHog" | "Sentry";
  mode: ObservabilityProviderMode;
  reason: string;
  endpoint: string | null;
};

type PostHogProviderStatus = ProviderStatusBase & {
  provider: "PostHog";
  captureKey: string | null;
};

type SentryProviderStatus = ProviderStatusBase & {
  provider: "Sentry";
  dsn: string | null;
};

export type ObservabilityAuditSummary = {
  eventType: ObservabilityAuditEventType;
  delivery: ObservabilityProbeDelivery | "requested";
  createdAt: string;
  release: string;
  detail: string;
  endpoint: string | null;
  httpStatus: number | null;
  eventId: string | null;
};

export type ObservabilityProviderView = {
  provider: "PostHog" | "Sentry";
  mode: ObservabilityProviderMode;
  reason: string;
  endpoint: string | null;
  latestAudit: ObservabilityAuditSummary | null;
};

export type ObservabilityStatus = {
  release: string;
  runtimeMode: RuntimeMode;
  runtimeModeSource: RuntimeModeSource;
  telemetryForwardingEventTypes: ForwardedTelemetryEventType[];
  headline: string;
  nextStep: string;
  analytics: ObservabilityProviderView;
  errorTracking: ObservabilityProviderView;
  triage: {
    queryPath: "/api/observability";
    syntheticCheckPath: "/api/observability";
    latestProbeAt: string | null;
    latestFailureCount: number;
  };
};

export type ObservabilityProbeProviderResult = {
  provider: "PostHog" | "Sentry";
  delivery: ObservabilityProbeDelivery;
  detail: string;
  endpoint: string | null;
  httpStatus: number | null;
  eventId: string | null;
};

export type ObservabilityProbeResult = {
  release: string;
  runtimeMode: RuntimeMode;
  runtimeModeSource: RuntimeModeSource;
  requestedAt: string;
  analytics: ObservabilityProbeProviderResult;
  errorTracking: ObservabilityProbeProviderResult;
};

function hasPlaceholderValue(value: string | null | undefined) {
  return typeof value === "string" && placeholderValuePattern.test(value);
}

function normalizeAbsoluteUrl(value: string | undefined) {
  if (!value || value.trim().length === 0) {
    return null;
  }

  try {
    const parsed = new URL(value.trim());

    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

function readReleaseTag(env: NodeJS.ProcessEnv) {
  const candidates = [
    env.APP_RELEASE,
    env.VERCEL_GIT_COMMIT_SHA,
    env.GITHUB_SHA,
    env.COMMIT_SHA,
    env.VERCEL_DEPLOYMENT_ID,
  ];
  const release = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim().length > 0,
  );

  return release?.trim() ?? "local-dev";
}

function readPostHogCaptureKey(env: NodeJS.ProcessEnv) {
  const candidates = [env.NEXT_PUBLIC_POSTHOG_KEY, env.POSTHOG_PROJECT_API_KEY];

  return (
    candidates.find(
      (candidate) => typeof candidate === "string" && candidate.trim().length > 0,
    )?.trim() ?? null
  );
}

function readPostHogProviderStatus(
  env: NodeJS.ProcessEnv = process.env,
): PostHogProviderStatus {
  const host = normalizeAbsoluteUrl(env.NEXT_PUBLIC_POSTHOG_HOST);
  const captureKey = readPostHogCaptureKey(env);

  if (!host || !captureKey) {
    return {
      provider: "PostHog",
      mode: "missing",
      reason:
        "Add NEXT_PUBLIC_POSTHOG_HOST and a PostHog project key before hosted analytics can mirror mission lifecycle events.",
      endpoint: null,
      captureKey: null,
    };
  }

  if (hasPlaceholderValue(host) || hasPlaceholderValue(captureKey)) {
    return {
      provider: "PostHog",
      mode: "placeholder",
      reason:
        "Hosted analytics is wired, but the current PostHog host or project key is still a placeholder value.",
      endpoint: `${host}/i/v0/e/`,
      captureKey,
    };
  }

  return {
    provider: "PostHog",
    mode: "active",
    reason:
      "Mission lifecycle telemetry can be mirrored to PostHog from the server-side telemetry pipeline.",
    endpoint: `${host}/i/v0/e/`,
    captureKey,
  };
}

function parseSentryDsn(dsn: string) {
  try {
    const parsed = new URL(dsn);
    const projectId = parsed.pathname.replace(/^\/+|\/+$/g, "");

    if (!parsed.username || projectId.length === 0) {
      return null;
    }

    return {
      dsn,
      endpoint: `${parsed.protocol}//${parsed.host}/api/${projectId}/envelope/`,
    };
  } catch {
    return null;
  }
}

function readSentryProviderStatus(
  env: NodeJS.ProcessEnv = process.env,
): SentryProviderStatus {
  const dsn = env.SENTRY_DSN?.trim() ?? null;
  const org = env.SENTRY_ORG?.trim() ?? null;
  const project = env.SENTRY_PROJECT?.trim() ?? null;

  if (!dsn || !org || !project) {
    return {
      provider: "Sentry",
      mode: "missing",
      reason:
        "Add SENTRY_DSN, SENTRY_ORG, and SENTRY_PROJECT before hosted error checks can emit release-tagged failures.",
      endpoint: null,
      dsn: null,
    };
  }

  const parsed = parseSentryDsn(dsn);

  if (!parsed || hasPlaceholderValue(dsn) || hasPlaceholderValue(org) || hasPlaceholderValue(project)) {
    return {
      provider: "Sentry",
      mode: "placeholder",
      reason:
        "Hosted error tracking is wired, but the current Sentry DSN or project identifiers are still placeholder values.",
      endpoint: parsed?.endpoint ?? null,
      dsn,
    };
  }

  return {
    provider: "Sentry",
    mode: "active",
    reason:
      "Synthetic handled errors can be emitted to Sentry with runtime and release tags.",
    endpoint: parsed.endpoint,
    dsn,
  };
}

function isForwardedTelemetryEventType(
  eventType: string,
): eventType is ForwardedTelemetryEventType {
  return telemetryForwardingEventTypes.some((value) => value === eventType);
}

function readAuditContext(contextJson: string | null) {
  if (!contextJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(contextJson) as unknown;

    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function readStringContextValue(
  context: Record<string, unknown> | null,
  key: string,
) {
  return typeof context?.[key] === "string" ? context[key] : null;
}

function readNumberContextValue(
  context: Record<string, unknown> | null,
  key: string,
) {
  return typeof context?.[key] === "number" && Number.isFinite(context[key])
    ? context[key]
    : null;
}

function toAuditSummary(event: {
  eventType: string;
  contextJson: string | null;
  createdAt: Date;
}): ObservabilityAuditSummary | null {
  if (!observabilityAuditEventTypes.some((value) => value === event.eventType)) {
    return null;
  }

  const context = readAuditContext(event.contextJson);
  let delivery: ObservabilityAuditSummary["delivery"] = "requested";

  if (event.eventType.endsWith("_delivered")) {
    delivery = "delivered";
  } else if (event.eventType.endsWith("_failed")) {
    delivery = "failed";
  } else if (event.eventType.endsWith("_skipped")) {
    delivery = "skipped";
  }

  return {
    eventType: event.eventType as ObservabilityAuditEventType,
    delivery,
    createdAt: event.createdAt.toISOString(),
    release: readStringContextValue(context, "release") ?? "local-dev",
    detail:
      readStringContextValue(context, "detail") ??
      (delivery === "requested"
        ? "Synthetic observability probe requested."
        : "No delivery detail recorded."),
    endpoint: readStringContextValue(context, "endpoint"),
    httpStatus: readNumberContextValue(context, "httpStatus"),
    eventId: readStringContextValue(context, "eventId"),
  };
}

function buildObservabilityNarrative(args: {
  analyticsMode: ObservabilityProviderMode;
  errorMode: ObservabilityProviderMode;
}) {
  if (args.analyticsMode === "active" && args.errorMode === "active") {
    return {
      headline:
        "Hosted observability is configured: mission lifecycle events can flow to PostHog, and synthetic handled errors can be emitted to Sentry with release context.",
      nextStep:
        "Run an authenticated POST to /api/observability from staging to attach one synthetic analytics event and one handled Sentry error to the release evidence.",
    };
  }

  if (args.analyticsMode === "placeholder" || args.errorMode === "placeholder") {
    return {
      headline:
        "Observability wiring is in place, but one or more hosted providers still use placeholder values instead of real staged credentials.",
      nextStep:
        "Replace the placeholder PostHog and Sentry values in staging or CI, then run the synthetic observability check to capture proof for P13-08.",
    };
  }

  return {
    headline:
      "The local prototype has no hosted observability providers configured yet, so the repo can expose the release contract and triage path without attempting external delivery.",
    nextStep:
      "Keep using /api/observability as the local triage path, then switch to hosted credentials when staging access is ready.",
  };
}

async function readLatestObservabilityAudits() {
  try {
    return await prisma.telemetryEvent.findMany({
      where: {
        eventType: {
          in: [...observabilityAuditEventTypes],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        eventType: true,
        contextJson: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

export async function readObservabilityStatus(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ObservabilityStatus> {
  const runtimeResolution = resolveRuntimeMode(env);
  const release = readReleaseTag(env);
  const analytics = readPostHogProviderStatus(env);
  const errorTracking = readSentryProviderStatus(env);
  const audits = (await readLatestObservabilityAudits())
    .map(toAuditSummary)
    .filter((value): value is ObservabilityAuditSummary => value !== null);
  const latestProbe = audits.find(
    (audit) => audit.eventType === "observability_probe_requested",
  );
  const latestAnalyticsAudit = audits.find((audit) =>
    audit.eventType.startsWith("observability_analytics_"),
  );
  const latestErrorAudit = audits.find((audit) =>
    audit.eventType.startsWith("observability_error_"),
  );
  const latestFailureCount = audits.filter(
    (audit) => audit.delivery === "failed",
  ).length;
  const narrative = buildObservabilityNarrative({
    analyticsMode: analytics.mode,
    errorMode: errorTracking.mode,
  });

  return {
    release,
    runtimeMode: runtimeResolution.mode,
    runtimeModeSource: runtimeResolution.source,
    telemetryForwardingEventTypes: [...telemetryForwardingEventTypes],
    headline: narrative.headline,
    nextStep: narrative.nextStep,
    analytics: {
      provider: analytics.provider,
      mode: analytics.mode,
      reason: analytics.reason,
      endpoint: analytics.endpoint,
      latestAudit: latestAnalyticsAudit ?? null,
    },
    errorTracking: {
      provider: errorTracking.provider,
      mode: errorTracking.mode,
      reason: errorTracking.reason,
      endpoint: errorTracking.endpoint,
      latestAudit: latestErrorAudit ?? null,
    },
    triage: {
      queryPath: "/api/observability",
      syntheticCheckPath: "/api/observability",
      latestProbeAt: latestProbe?.createdAt ?? null,
      latestFailureCount,
    },
  };
}

async function sendPostHogEvent(args: {
  endpoint: string;
  captureKey: string;
  event: string;
  distinctId: string;
  properties: Record<string, unknown>;
  timestamp: string;
}) {
  const response = await fetch(args.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      api_key: args.captureKey,
      event: args.event,
      distinct_id: args.distinctId,
      properties: args.properties,
      timestamp: args.timestamp,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`PostHog capture failed with status ${response.status}.`);
  }

  return response.status;
}

async function sendSentryEnvelope(args: {
  endpoint: string;
  dsn: string;
  release: string;
  runtimeMode: RuntimeMode;
  eventId: string;
  detail: string;
}) {
  const payload = JSON.stringify({
    event_id: args.eventId,
    timestamp: new Date().toISOString(),
    platform: "node",
    level: "error",
    logger: "phase13.observability",
    release: args.release,
    tags: {
      runtime_mode: args.runtimeMode,
      source: "api/observability",
      synthetic: "true",
    },
    exception: {
      values: [
        {
          type: "P13ObservabilityCheck",
          value: args.detail,
        },
      ],
    },
  });
  const envelope = [
    JSON.stringify({
      event_id: args.eventId,
      sent_at: new Date().toISOString(),
      dsn: args.dsn,
    }),
    JSON.stringify({
      type: "event",
      length: Buffer.byteLength(payload),
    }),
    payload,
  ].join("\n");

  const response = await fetch(args.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-sentry-envelope",
    },
    body: envelope,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Sentry envelope failed with status ${response.status}.`);
  }

  return response.status;
}

export async function forwardTelemetryEventsToAnalytics(
  events: ObservabilityTelemetryEvent[],
  env: NodeJS.ProcessEnv = process.env,
) {
  const analytics = readPostHogProviderStatus(env);

  if (analytics.mode !== "active" || !analytics.endpoint || !analytics.captureKey) {
    return;
  }

  const endpoint = analytics.endpoint;
  const captureKey = analytics.captureKey;
  const runtimeResolution = resolveRuntimeMode(env);
  const release = readReleaseTag(env);
  const eligibleEvents = events.filter((event) =>
    isForwardedTelemetryEventType(event.eventType),
  );

  if (eligibleEvents.length === 0) {
    return;
  }

  await Promise.allSettled(
    eligibleEvents.map(async (event) => {
      await sendPostHogEvent({
        endpoint,
        captureKey,
        event: event.eventType,
        distinctId: event.userId ?? `runtime:${runtimeResolution.mode}`,
        properties: {
          phase: event.phase ?? null,
          missionId: event.missionId ?? null,
          runtimeMode: runtimeResolution.mode,
          runtimeModeSource: runtimeResolution.source,
          release,
          source: "server-telemetry-forwarder",
          context: event.context ?? null,
          $process_person_profile: event.userId ? true : false,
        },
        timestamp: (event.createdAt ?? new Date()).toISOString(),
      });
    }),
  );
}

export async function runObservabilityProbe(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ObservabilityProbeResult> {
  const runtimeResolution = resolveRuntimeMode(env);
  const release = readReleaseTag(env);
  const requestedAt = new Date().toISOString();
  const analytics = readPostHogProviderStatus(env);
  const errorTracking = readSentryProviderStatus(env);

  const analyticsPromise = (async (): Promise<ObservabilityProbeProviderResult> => {
    if (analytics.mode !== "active" || !analytics.endpoint || !analytics.captureKey) {
      return {
        provider: "PostHog",
        delivery: "skipped",
        detail: analytics.reason,
        endpoint: analytics.endpoint,
        httpStatus: null,
        eventId: null,
      };
    }

    try {
      const httpStatus = await sendPostHogEvent({
        endpoint: analytics.endpoint,
        captureKey: analytics.captureKey,
        event: "phase13_observability_check",
        distinctId: `release-check:${runtimeResolution.mode}`,
        properties: {
          release,
          runtimeMode: runtimeResolution.mode,
          runtimeModeSource: runtimeResolution.source,
          source: "api/observability",
          trackedEventTypes: [...telemetryForwardingEventTypes],
          synthetic: true,
          $process_person_profile: false,
        },
        timestamp: requestedAt,
      });

      return {
        provider: "PostHog",
        delivery: "delivered",
        detail:
          "Synthetic mission-lifecycle observability check was accepted by the PostHog capture endpoint.",
        endpoint: analytics.endpoint,
        httpStatus,
        eventId: null,
      };
    } catch (error) {
      return {
        provider: "PostHog",
        delivery: "failed",
        detail:
          error instanceof Error
            ? error.message
            : "PostHog capture failed for an unknown reason.",
        endpoint: analytics.endpoint,
        httpStatus: null,
        eventId: null,
      };
    }
  })();

  const errorPromise = (async (): Promise<ObservabilityProbeProviderResult> => {
    if (
      errorTracking.mode !== "active" ||
      !errorTracking.endpoint ||
      !errorTracking.dsn
    ) {
      return {
        provider: "Sentry",
        delivery: "skipped",
        detail: errorTracking.reason,
        endpoint: errorTracking.endpoint,
        httpStatus: null,
        eventId: null,
      };
    }

    const eventId = randomUUID().replace(/-/g, "");

    try {
      const httpStatus = await sendSentryEnvelope({
        endpoint: errorTracking.endpoint,
        dsn: errorTracking.dsn,
        release,
        runtimeMode: runtimeResolution.mode,
        eventId,
        detail: "Synthetic handled error for Phase 13 observability validation.",
      });

      return {
        provider: "Sentry",
        delivery: "delivered",
        detail:
          "Synthetic handled error was accepted by the Sentry envelope endpoint with release context.",
        endpoint: errorTracking.endpoint,
        httpStatus,
        eventId,
      };
    } catch (error) {
      return {
        provider: "Sentry",
        delivery: "failed",
        detail:
          error instanceof Error
            ? error.message
            : "Sentry envelope delivery failed for an unknown reason.",
        endpoint: errorTracking.endpoint,
        httpStatus: null,
        eventId,
      };
    }
  })();

  const [analyticsResult, errorResult] = await Promise.all([
    analyticsPromise,
    errorPromise,
  ]);

  return {
    release,
    runtimeMode: runtimeResolution.mode,
    runtimeModeSource: runtimeResolution.source,
    requestedAt,
    analytics: analyticsResult,
    errorTracking: errorResult,
  };
}

export function createObservabilityAuditEvents(
  result: ObservabilityProbeResult,
): ObservabilityAuditTelemetryEvent[] {
  const createdAt = new Date(result.requestedAt);
  const sharedContext = {
    release: result.release,
    runtimeMode: result.runtimeMode,
    runtimeModeSource: result.runtimeModeSource,
  };

  return [
    {
      eventType: "observability_probe_requested",
      context: sharedContext,
      createdAt,
    },
    {
      eventType:
        result.analytics.delivery === "delivered"
          ? "observability_analytics_delivered"
          : result.analytics.delivery === "failed"
            ? "observability_analytics_failed"
            : "observability_analytics_skipped",
      context: {
        ...sharedContext,
        detail: result.analytics.detail,
        endpoint: result.analytics.endpoint,
        httpStatus: result.analytics.httpStatus,
        eventId: result.analytics.eventId,
      },
      createdAt,
    },
    {
      eventType:
        result.errorTracking.delivery === "delivered"
          ? "observability_error_delivered"
          : result.errorTracking.delivery === "failed"
            ? "observability_error_failed"
            : "observability_error_skipped",
      context: {
        ...sharedContext,
        detail: result.errorTracking.detail,
        endpoint: result.errorTracking.endpoint,
        httpStatus: result.errorTracking.httpStatus,
        eventId: result.errorTracking.eventId,
      },
      createdAt,
    },
  ];
}