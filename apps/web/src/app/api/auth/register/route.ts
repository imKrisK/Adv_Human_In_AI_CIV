import { NextResponse } from "next/server";
import { z } from "zod";

import {
  attachSessionCookie,
  authenticatedSessionPayload,
  createSessionForUser,
  profileRecordToState,
  registerUser,
  unauthenticatedSessionPayload,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveIdentityStrategy } from "@/lib/identity-strategy";
import { recordTelemetryEvents } from "@/lib/telemetry";

const credentialsSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(72),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (resolveIdentityStrategy().strategy === "hosted-identity") {
    return NextResponse.json(
      unauthenticatedSessionPayload(
        "Hosted identity is active for this runtime. Create the operator session through the hosted sign-up route instead of the local credential form.",
      ),
      { status: 409 },
    );
  }

  try {
    const parsed = credentialsSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        unauthenticatedSessionPayload(
          "Use a valid operator email and a password with at least 8 characters.",
        ),
        { status: 400 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        unauthenticatedSessionPayload(
          "A bonded operator profile already exists for that email.",
        ),
        { status: 409 },
      );
    }

    const user = await registerUser(email, parsed.data.password);
    const { rawToken, expiresAt } = await createSessionForUser(user.id);
    const response = NextResponse.json(
      authenticatedSessionPayload(
        user.email,
        profileRecordToState(user.profile!),
        "Bonded operator profile created and session started.",
      ),
      { status: 201 },
    );

    await recordTelemetryEvents([
      {
        userId: user.id,
        eventType: "operator_registered",
        phase: "arrival",
        context: { via: "register" },
      },
      {
        userId: user.id,
        eventType: "phase_reached",
        phase: "arrival",
        context: { via: "register" },
      },
    ]);

    return attachSessionCookie(response, rawToken, expiresAt);
  } catch {
    return NextResponse.json(
      unauthenticatedSessionPayload(
        "Unable to create the operator profile right now.",
      ),
      { status: 500 },
    );
  }
}