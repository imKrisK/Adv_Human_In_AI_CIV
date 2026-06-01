import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authenticatedSessionPayload,
  getAuthenticatedSession,
  persistProfileState,
  unauthenticatedSessionPayload,
} from "@/lib/auth";
import { getPairingForProfile } from "@/lib/playable-slice";
import { recordTelemetryEvents } from "@/lib/telemetry";
import {
  missionZones,
  phaseOrder,
  squadRoles,
  starterCompanions,
  starterLoadouts,
} from "@/lib/prototype-data";

const profilePatchSchema = z.object({
  phase: z.enum(phaseOrder).optional(),
  selectedLoadoutId: z
    .string()
    .refine(
      (value) => starterLoadouts.some((loadout) => loadout.id === value),
      "Unknown loadout.",
    )
    .optional(),
  selectedCompanionId: z
    .string()
    .refine(
      (value) => starterCompanions.some((companion) => companion.id === value),
      "Unknown companion.",
    )
    .optional(),
  selectedMissionId: z
    .string()
    .refine(
      (value) => missionZones.some((mission) => mission.id === value),
      "Unknown mission.",
    )
    .optional(),
  activeMissionSessionId: z.string().nullable().optional(),
  squadSessionId: z.string().nullable().optional(),
  squadCode: z.string().min(6).max(12).nullable().optional(),
  squadRole: z.enum(squadRoles).nullable().optional(),
  squadLocked: z.boolean().optional(),
  squadReady: z.boolean().optional(),
  explorerRank: z.number().int().min(1).max(99).optional(),
  humanLevel: z.number().int().min(1).max(99).optional(),
  aiTier: z.number().int().min(1).max(99).optional(),
  resonanceLevel: z.number().int().min(1).max(99).optional(),
  factionStanding: z.number().int().min(0).max(999).optional(),
  lastCompletedMissionId: z
    .string()
    .nullable()
    .refine(
      (value) =>
        value === null || missionZones.some((mission) => mission.id === value),
      "Unknown completed mission.",
    )
    .optional(),
  updatedAt: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthenticatedSession();

  if (!session) {
    return NextResponse.json(
      unauthenticatedSessionPayload(
        "Sign in through the command deck before loading bonded operator state.",
      ),
      { status: 401 },
    );
  }

  return NextResponse.json(
    authenticatedSessionPayload(session.email, session.profile),
  );
}

export async function PATCH(request: Request) {
  const session = await getAuthenticatedSession();

  if (!session) {
    return NextResponse.json(
      unauthenticatedSessionPayload(
        "Sign in through the command deck before saving bonded operator state.",
      ),
      { status: 401 },
    );
  }

  try {
    const parsed = profilePatchSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        authenticatedSessionPayload(
          session.email,
          session.profile,
          "Bonded operator update rejected by the schema validator.",
        ),
        { status: 400 },
      );
    }

    const profile = await persistProfileState(session.userId, parsed.data);

    const telemetryEvents = [] as Parameters<typeof recordTelemetryEvents>[0];

    if (
      profile.selectedLoadoutId !== session.profile.selectedLoadoutId ||
      profile.selectedCompanionId !== session.profile.selectedCompanionId
    ) {
      telemetryEvents.push({
        userId: session.userId,
        eventType: "pairing_selected",
        phase: profile.phase,
        missionId: profile.selectedMissionId,
        context: {
          pairingId: getPairingForProfile(profile).id,
          previousPairingId: getPairingForProfile(session.profile).id,
          selectionMode:
            profile.selectedLoadoutId !== session.profile.selectedLoadoutId &&
            profile.selectedCompanionId !== session.profile.selectedCompanionId
              ? "pairing"
              : profile.selectedLoadoutId !== session.profile.selectedLoadoutId
                ? "loadout"
                : "companion",
          loadoutId: profile.selectedLoadoutId,
          companionId: profile.selectedCompanionId,
          via: "profile_patch",
        },
      });
    }

    if (parsed.data.phase && parsed.data.phase !== session.profile.phase) {
      telemetryEvents.push({
        userId: session.userId,
        eventType: "phase_reached",
        phase: parsed.data.phase,
        context: {
          fromPhase: session.profile.phase,
          via: "profile_patch",
        },
      });
    }

    await recordTelemetryEvents(telemetryEvents);

    return NextResponse.json(
      authenticatedSessionPayload(session.email, profile, "Bonded operator state saved."),
    );
  } catch {
    return NextResponse.json(
      authenticatedSessionPayload(
        session.email,
        session.profile,
        "Unable to save bonded operator state right now.",
      ),
      { status: 500 },
    );
  }
}