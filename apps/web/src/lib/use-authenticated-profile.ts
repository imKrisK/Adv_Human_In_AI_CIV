"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { IdentityStrategy } from "@/lib/identity-strategy";
import {
  defaultCommandDeckState,
  normalizeCommandDeckState,
  type CommandDeckState,
} from "@/lib/prototype-data";

type SessionEnvelope = {
  authenticated: boolean;
  user: { email: string } | null;
  profile: CommandDeckState | null;
  authStrategy: IdentityStrategy;
  authStrategyReason: string;
  authSignInUrl: string | null;
  authSignUpUrl: string | null;
  localCredentialsEnabled: boolean;
  demoModeAvailable: boolean;
  message?: string;
};

type Credentials = {
  email: string;
  password: string;
};

const unauthenticatedSession: SessionEnvelope = {
  authenticated: false,
  user: null,
  profile: null,
  authStrategy: "local-credentials",
  authStrategyReason:
    "Hosted identity is not configured yet, so the command deck stays on the local email-and-password prototype path.",
  authSignInUrl: null,
  authSignUpUrl: null,
  localCredentialsEnabled: true,
  demoModeAvailable: true,
};

async function readSessionEnvelope(response: Response) {
  const data = (await response.json()) as Partial<SessionEnvelope>;

  return {
    authenticated: Boolean(data.authenticated),
    user: data.user ?? null,
    profile: data.profile ? normalizeCommandDeckState(data.profile) : null,
    authStrategy:
      data.authStrategy === "hosted-identity"
        ? "hosted-identity"
        : "local-credentials",
    authStrategyReason:
      typeof data.authStrategyReason === "string"
        ? data.authStrategyReason
        : unauthenticatedSession.authStrategyReason,
    authSignInUrl:
      typeof data.authSignInUrl === "string" ? data.authSignInUrl : null,
    authSignUpUrl:
      typeof data.authSignUpUrl === "string" ? data.authSignUpUrl : null,
    localCredentialsEnabled:
      typeof data.localCredentialsEnabled === "boolean"
        ? data.localCredentialsEnabled
        : unauthenticatedSession.localCredentialsEnabled,
    demoModeAvailable:
      typeof data.demoModeAvailable === "boolean"
        ? data.demoModeAvailable
        : unauthenticatedSession.demoModeAvailable,
    message: typeof data.message === "string" ? data.message : undefined,
  } satisfies SessionEnvelope;
}

export function useAuthenticatedProfile() {
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [session, setSession] = useState<SessionEnvelope>(unauthenticatedSession);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadSession = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setStatus("loading");
      setError(null);
    }

    try {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      const payload = await readSessionEnvelope(response);

      setSession(payload);

      if (!response.ok && payload.message) {
        setError(payload.message);
      }
    } catch {
      setError("Unable to sync bonded operator state right now.");
      setSession(unauthenticatedSession);
    } finally {
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSession(false);
    });
  }, [loadSession]);

  const profile = useMemo(
    () => session.profile ?? defaultCommandDeckState,
    [session.profile],
  );

  async function runAuthAction(endpoint: string, credentials: Credentials) {
    setBusyAction(endpoint);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      const payload = await readSessionEnvelope(response);

      setSession(payload);

      if (!response.ok) {
        setError(payload.message ?? "Unable to authorize this operator.");
        return false;
      }

      return true;
    } catch {
      setError("Unable to authorize this operator.");
      return false;
    } finally {
      setBusyAction(null);
      setStatus("ready");
    }
  }

  async function login(credentials: Credentials) {
    return runAuthAction("/api/auth/login", credentials);
  }

  async function register(credentials: Credentials) {
    return runAuthAction("/api/auth/register", credentials);
  }

  async function demoLogin() {
    setBusyAction("/api/auth/demo");
    setError(null);

    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
      });
      const payload = await readSessionEnvelope(response);

      setSession(payload);

      if (!response.ok) {
        setError(payload.message ?? "Unable to start the demo operator loop.");
        return false;
      }

      return true;
    } catch {
      setError("Unable to start the demo operator loop.");
      return false;
    } finally {
      setBusyAction(null);
      setStatus("ready");
    }
  }

  async function logout() {
    setBusyAction("logout");
    setError(null);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      setSession(unauthenticatedSession);
    } catch {
      setError("Unable to close the current operator session.");
    } finally {
      setBusyAction(null);
    }
  }

  async function saveProfile(patch: Partial<CommandDeckState>) {
    if (!session.authenticated || !session.profile) {
      setError("Sign in before writing bonded operator state.");
      return null;
    }

    setBusyAction("save-profile");
    setError(null);

    const previousProfile = session.profile;
    const optimisticProfile = normalizeCommandDeckState({
      ...session.profile,
      ...patch,
      updatedAt: new Date().toISOString(),
    });

    setSession((current) =>
      current.authenticated
        ? {
            ...current,
            profile: optimisticProfile,
          }
        : current,
    );

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });
      const payload = await readSessionEnvelope(response);

      if (!response.ok) {
        setSession((current) =>
          current.authenticated
            ? {
                ...current,
                profile: previousProfile,
              }
            : current,
        );
        setError(payload.message ?? "Unable to save bonded operator state right now.");
        return null;
      }

      setSession(payload);
      return payload.profile ?? null;
    } catch {
      setSession((current) =>
        current.authenticated
          ? {
              ...current,
              profile: previousProfile,
            }
          : current,
      );
      setError("Unable to save bonded operator state right now.");
      return null;
    } finally {
      setBusyAction(null);
    }
  }

  return {
    status,
    authenticated: session.authenticated,
    email: session.user?.email ?? null,
    profile,
    authStrategy: session.authStrategy,
    authStrategyReason: session.authStrategyReason,
    authSignInUrl: session.authSignInUrl,
    authSignUpUrl: session.authSignUpUrl,
    localCredentialsEnabled: session.localCredentialsEnabled,
    demoModeAvailable: session.demoModeAvailable,
    error,
    busyAction,
    login,
    register,
    demoLogin,
    logout,
    saveProfile,
    refreshSession: loadSession,
  };
}