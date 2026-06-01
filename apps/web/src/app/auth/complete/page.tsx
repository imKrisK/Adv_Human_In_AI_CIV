import { redirect } from "next/navigation";

import { getAuthenticatedSession } from "@/lib/auth";
import { resolveIdentityStrategy } from "@/lib/identity-strategy";

export const dynamic = "force-dynamic";

export default async function HostedIdentityCompletePage() {
  const identityStrategy = resolveIdentityStrategy();

  if (identityStrategy.strategy !== "hosted-identity") {
    redirect("/command-deck");
  }

  const session = await getAuthenticatedSession();

  if (!session) {
    redirect(identityStrategy.signInUrl ?? "/command-deck");
  }

  redirect("/command-deck");
}