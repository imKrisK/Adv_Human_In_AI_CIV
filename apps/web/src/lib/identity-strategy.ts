export const identityStrategies = [
  "local-credentials",
  "hosted-identity",
] as const;

export type IdentityStrategy = (typeof identityStrategies)[number];

export type IdentityStrategyResolution = {
  strategy: IdentityStrategy;
  reason: string;
  signInUrl: string | null;
  signUpUrl: string | null;
  localCredentialsEnabled: boolean;
  demoModeAvailable: boolean;
};

export const hostedIdentityCallbackPath = "/auth/complete";

function readAppRoute(value: string | undefined) {
  return typeof value === "string" && value.startsWith("/") ? value : null;
}

export function resolveIdentityStrategy(
  env: NodeJS.ProcessEnv = process.env,
): IdentityStrategyResolution {
  const signInUrl = readAppRoute(env.NEXT_PUBLIC_CLERK_SIGN_IN_URL);
  const signUpUrl = readAppRoute(env.NEXT_PUBLIC_CLERK_SIGN_UP_URL);
  const hostedIdentityConfigured = Boolean(
    env.CLERK_SECRET_KEY &&
      env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      signInUrl &&
      signUpUrl,
  );

  if (hostedIdentityConfigured) {
    return {
      strategy: "hosted-identity",
      reason:
        "Hosted identity contract is configured. The command deck should hand session creation and restore through the provider routes instead of local credentials.",
      signInUrl,
      signUpUrl,
      localCredentialsEnabled: false,
      demoModeAvailable: false,
    };
  }

  return {
    strategy: "local-credentials",
    reason:
      "Hosted identity is not configured yet, so the command deck stays on the local email-and-password prototype path.",
    signInUrl,
    signUpUrl,
    localCredentialsEnabled: true,
    demoModeAvailable: env.NODE_ENV !== "production",
  };
}