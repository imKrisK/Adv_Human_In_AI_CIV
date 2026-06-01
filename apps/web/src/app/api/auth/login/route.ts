import { NextResponse } from "next/server";
import { z } from "zod";

import {
  attachSessionCookie,
  authenticatedSessionPayload,
  createSessionForUser,
  persistProfileState,
  unauthenticatedSessionPayload,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveIdentityStrategy } from "@/lib/identity-strategy";
import { recordTelemetryEvent } from "@/lib/telemetry";

const credentialsSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(72),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (resolveIdentityStrategy().strategy === "hosted-identity") {
    return NextResponse.json(
      unauthenticatedSessionPayload(
        "Hosted identity is active for this runtime. Restore the operator session through the hosted sign-in route instead of the local credential form.",
      ),
      { status: 409 },
    );
  }

  try {
    const parsed = credentialsSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        unauthenticatedSessionPayload(
          "Use a valid operator email and password.",
        ),
        { status: 400 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        unauthenticatedSessionPayload(
          "No bonded operator profile matches that email.",
        ),
        { status: 404 },
      );
    }

    const passwordValid = await verifyPassword(
      parsed.data.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      return NextResponse.json(
        unauthenticatedSessionPayload(
          "That password did not unlock the operator profile.",
        ),
        { status: 401 },
      );
    }

    const { rawToken, expiresAt } = await createSessionForUser(user.id);
    const profile = await persistProfileState(user.id, {});
    const response = NextResponse.json(
      authenticatedSessionPayload(email, profile, "Operator session restored."),
    );

    await recordTelemetryEvent({
      userId: user.id,
      eventType: "session_restored",
      phase: profile.phase,
      context: { via: "login" },
    });

    return attachSessionCookie(response, rawToken, expiresAt);
  } catch {
    return NextResponse.json(
      unauthenticatedSessionPayload(
        "Unable to reopen the operator session right now.",
      ),
      { status: 500 },
    );
  }
}