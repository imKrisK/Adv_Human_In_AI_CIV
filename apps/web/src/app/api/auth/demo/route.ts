import { NextResponse } from "next/server";

import {
  attachSessionCookie,
  authenticatedSessionPayload,
  createSessionForUser,
  persistProfileState,
  registerUser,
  unauthenticatedSessionPayload,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { defaultCommandDeckState } from "@/lib/prototype-data";
import { recordTelemetryEvents } from "@/lib/telemetry";

const demoEmail = "demo.operator@lattice-haven.test";
const demoPassword = "PrototypePass123!";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      unauthenticatedSessionPayload(
        "Demo operator access is only available in development.",
      ),
      { status: 403 },
    );
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email: demoEmail },
      include: { profile: true },
    });

    if (!user) {
      user = await registerUser(demoEmail, demoPassword);
    }

    const profile = await persistProfileState(user.id, defaultCommandDeckState);
    const { rawToken, expiresAt } = await createSessionForUser(user.id);
    const response = NextResponse.json(
      authenticatedSessionPayload(
        user.email,
        profile,
        "Demo operator reset, re-paired, and signed in.",
      ),
    );

    await recordTelemetryEvents([
      {
        userId: user.id,
        eventType: "demo_session_started",
        phase: profile.phase,
        context: { via: "demo" },
      },
      {
        userId: user.id,
        eventType: "phase_reached",
        phase: "arrival",
        context: { via: "demo" },
      },
    ]);

    return attachSessionCookie(response, rawToken, expiresAt);
  } catch {
    return NextResponse.json(
      unauthenticatedSessionPayload(
        "Unable to start the demo operator loop right now.",
      ),
      { status: 500 },
    );
  }
}