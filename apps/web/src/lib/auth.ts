import { compare, hash } from "bcryptjs";
import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";

import type { PlayerProfile } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  resolveIdentityStrategy,
  type IdentityStrategy,
} from "@/lib/identity-strategy";
import {
  defaultCommandDeckState,
  normalizeCommandDeckState,
  sessionCookieName,
  type CommandDeckState,
  type PersistedEventResultState,
} from "@/lib/prototype-data";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
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

type AuthenticatedSession = {
  userId: string;
  email: string;
  rawToken: string;
  profile: CommandDeckState;
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function profileRecordToLastEventResult(
  profile: PlayerProfile,
): PersistedEventResultState | null {
  if (
    !profile.lastEventMissionId ||
    !profile.lastEventWindowId ||
    !profile.lastEventRewardBandId ||
    profile.lastEventTotalScore === null ||
    profile.lastEventDefenseContribution === null ||
    profile.lastEventSupportContribution === null ||
    profile.lastEventCompletionContribution === null ||
    !profile.lastEventCompletedAt
  ) {
    return null;
  }

  return {
    missionId: profile.lastEventMissionId,
    eventWindowId:
      profile.lastEventWindowId as PersistedEventResultState["eventWindowId"],
    rewardBandId:
      profile.lastEventRewardBandId as PersistedEventResultState["rewardBandId"],
    totalScore: profile.lastEventTotalScore,
    defenseContribution: profile.lastEventDefenseContribution,
    supportContribution: profile.lastEventSupportContribution,
    completionContribution: profile.lastEventCompletionContribution,
    completedAt: profile.lastEventCompletedAt.toISOString(),
  };
}

function lastEventResultToRecordInput(
  lastEventResult: PersistedEventResultState | null,
) {
  return {
    lastEventMissionId: lastEventResult?.missionId ?? null,
    lastEventWindowId: lastEventResult?.eventWindowId ?? null,
    lastEventRewardBandId: lastEventResult?.rewardBandId ?? null,
    lastEventTotalScore: lastEventResult?.totalScore ?? null,
    lastEventDefenseContribution: lastEventResult?.defenseContribution ?? null,
    lastEventSupportContribution: lastEventResult?.supportContribution ?? null,
    lastEventCompletionContribution:
      lastEventResult?.completionContribution ?? null,
    lastEventCompletedAt: lastEventResult
      ? new Date(lastEventResult.completedAt)
      : null,
  };
}

export function profileRecordToState(profile: PlayerProfile): CommandDeckState {
  return normalizeCommandDeckState({
    phase: profile.phase as CommandDeckState["phase"],
    selectedLoadoutId: profile.selectedLoadoutId,
    selectedCompanionId: profile.selectedCompanionId,
    selectedMissionId: profile.selectedMissionId,
    activeMissionSessionId: profile.activeMissionSessionId,
    squadSessionId: profile.squadSessionId,
    squadCode: profile.squadCode,
    squadRole: profile.squadRole as CommandDeckState["squadRole"],
    squadLocked: profile.squadLocked,
    squadReady: profile.squadReady,
    explorerRank: profile.explorerRank,
    humanLevel: profile.humanLevel,
    aiTier: profile.aiTier,
    resonanceLevel: profile.resonanceLevel,
    factionStanding: profile.factionStanding,
    lastCompletedMissionId: profile.lastCompletedMissionId,
    lastEventResult: profileRecordToLastEventResult(profile),
    updatedAt: profile.updatedAt.toISOString(),
  });
}

export function profileStateToRecordInput(state: CommandDeckState) {
  const normalized = normalizeCommandDeckState(state);

  return {
    phase: normalized.phase,
    selectedLoadoutId: normalized.selectedLoadoutId,
    selectedCompanionId: normalized.selectedCompanionId,
    selectedMissionId: normalized.selectedMissionId,
    activeMissionSessionId: normalized.activeMissionSessionId,
    squadSessionId: normalized.squadSessionId,
    squadCode: normalized.squadCode,
    squadRole: normalized.squadRole,
    squadLocked: normalized.squadLocked,
    squadReady: normalized.squadReady,
    explorerRank: normalized.explorerRank,
    humanLevel: normalized.humanLevel,
    aiTier: normalized.aiTier,
    resonanceLevel: normalized.resonanceLevel,
    factionStanding: normalized.factionStanding,
    lastCompletedMissionId: normalized.lastCompletedMissionId,
    ...lastEventResultToRecordInput(normalized.lastEventResult),
  };
}

async function ensureProfileForUser(userId: string) {
  const existingProfile = await prisma.playerProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    return existingProfile;
  }

  return prisma.playerProfile.create({
    data: {
      userId,
      ...profileStateToRecordInput(defaultCommandDeckState),
    },
  });
}

function readHostedIdentityEmail(
  user: Awaited<ReturnType<typeof currentUser>>,
) {
  const rawEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;

  return typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : null;
}

async function upsertHostedIdentityUser(
  hostedIdentityId: string,
  email: string,
) {
  const existingHostedUser = await prisma.user.findUnique({
    where: { hostedIdentityId },
    include: { profile: true },
  });

  if (existingHostedUser) {
    if (existingHostedUser.email === email) {
      return existingHostedUser;
    }

    return prisma.user.update({
      where: { id: existingHostedUser.id },
      data: { email },
      include: { profile: true },
    });
  }

  const existingEmailUser = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (existingEmailUser) {
    if (
      existingEmailUser.hostedIdentityId &&
      existingEmailUser.hostedIdentityId !== hostedIdentityId
    ) {
      throw new Error("Hosted identity is already mapped to a different operator.");
    }

    return prisma.user.update({
      where: { id: existingEmailUser.id },
      data: { hostedIdentityId },
      include: { profile: true },
    });
  }

  const passwordHash = await createPasswordHash(
    `hosted:${hostedIdentityId}:${randomBytes(16).toString("hex")}`,
  );

  return prisma.user.create({
    data: {
      email,
      hostedIdentityId,
      passwordHash,
      profile: {
        create: {
          ...profileStateToRecordInput(defaultCommandDeckState),
        },
      },
    },
    include: {
      profile: true,
    },
  });
}

async function getHostedAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const { isAuthenticated, userId } = await clerkAuth();

  if (!isAuthenticated || !userId) {
    return null;
  }

  const hostedUser = await currentUser();
  const email = readHostedIdentityEmail(hostedUser);

  if (!email) {
    return null;
  }

  const userRecord = await upsertHostedIdentityUser(userId, email);
  const ensuredProfile = userRecord.profile ?? (await ensureProfileForUser(userRecord.id));

  return {
    userId: userRecord.id,
    email,
    rawToken: userId,
    profile: profileRecordToState(ensuredProfile),
  };
}

export function unauthenticatedSessionPayload(
  message?: string,
): SessionPayload {
  const identityStrategy = resolveIdentityStrategy();

  return {
    authenticated: false,
    user: null,
    profile: null,
    authStrategy: identityStrategy.strategy,
    authStrategyReason: identityStrategy.reason,
    authSignInUrl: identityStrategy.signInUrl,
    authSignUpUrl: identityStrategy.signUpUrl,
    localCredentialsEnabled: identityStrategy.localCredentialsEnabled,
    demoModeAvailable: identityStrategy.demoModeAvailable,
    message,
  };
}

export function authenticatedSessionPayload(
  email: string,
  profile: CommandDeckState,
  message?: string,
): SessionPayload {
  const identityStrategy = resolveIdentityStrategy();

  return {
    authenticated: true,
    user: { email },
    profile,
    authStrategy: identityStrategy.strategy,
    authStrategyReason: identityStrategy.reason,
    authSignInUrl: identityStrategy.signInUrl,
    authSignUpUrl: identityStrategy.signUpUrl,
    localCredentialsEnabled: identityStrategy.localCredentialsEnabled,
    demoModeAvailable: identityStrategy.demoModeAvailable,
    message,
  };
}

export async function createPasswordHash(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
) {
  return compare(password, passwordHash);
}

export async function registerUser(email: string, password: string) {
  const passwordHash = await createPasswordHash(password);

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: {
          ...profileStateToRecordInput(defaultCommandDeckState),
        },
      },
    },
    include: {
      profile: true,
    },
  });
}

export async function createSessionForUser(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return {
    rawToken,
    expiresAt,
  };
}

export async function revokeSession(rawToken: string | null | undefined) {
  if (!rawToken) {
    return;
  }

  await prisma.session.deleteMany({
    where: {
      tokenHash: hashSessionToken(rawToken),
    },
  });
}

async function getLocalAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(sessionCookieName)?.value;

  if (!rawToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(rawToken),
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  const ensuredProfile = session.user.profile ?? (await ensureProfileForUser(session.user.id));

  return {
    userId: session.user.id,
    email: session.user.email,
    rawToken,
    profile: profileRecordToState(ensuredProfile),
  };
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const identityStrategy = resolveIdentityStrategy();

  if (identityStrategy.strategy === "hosted-identity") {
    return getHostedAuthenticatedSession();
  }

  return getLocalAuthenticatedSession();
}

export async function persistProfileState(
  userId: string,
  patch: Partial<CommandDeckState>,
) {
  const currentProfile = profileRecordToState(await ensureProfileForUser(userId));
  const selectionChangedInSquad =
    Boolean(currentProfile.squadSessionId) &&
    ((typeof patch.selectedLoadoutId === "string" &&
      patch.selectedLoadoutId !== currentProfile.selectedLoadoutId) ||
      (typeof patch.selectedCompanionId === "string" &&
        patch.selectedCompanionId !== currentProfile.selectedCompanionId));
  const nextPatch = {
    ...patch,
    ...(selectionChangedInSquad
      ? {
          squadLocked: false,
          squadReady: false,
        }
      : {}),
    ...(patch.squadLocked === false
      ? {
          squadReady: false,
        }
      : {}),
  } satisfies Partial<CommandDeckState>;
  const nextProfile = normalizeCommandDeckState({
    ...currentProfile,
    ...nextPatch,
    updatedAt: new Date().toISOString(),
  });

  const savedProfile = await prisma.playerProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...profileStateToRecordInput(nextProfile),
    },
    update: profileStateToRecordInput(nextProfile),
  });

  return profileRecordToState(savedProfile);
}

export function attachSessionCookie(
  response: NextResponse,
  rawToken: string,
  expiresAt: Date,
) {
  response.cookies.set({
    name: sessionCookieName,
    value: rawToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });

  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: sessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });

  return response;
}