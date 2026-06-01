import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import {
  hostedIdentityCallbackPath,
  resolveIdentityStrategy,
} from "@/lib/identity-strategy";

export const dynamic = "force-dynamic";

export default function HostedSignUpPage() {
  const identityStrategy = resolveIdentityStrategy();

  if (identityStrategy.strategy !== "hosted-identity") {
    return (
      <div className="main-shell py-16">
        <div className="glass-panel mx-auto max-w-2xl rounded-[2rem] p-8">
          <p className="section-kicker">Hosted identity unavailable</p>
          <h1 className="mt-4 text-3xl font-semibold">Hosted sign-up is not configured for this runtime.</h1>
          <p className="muted-copy mt-4 text-sm leading-7">
            The command deck is still using the local prototype auth path. Provision the Clerk keys and sign-up routes before using this surface.
          </p>
          <Link
            href="/command-deck"
            className="mt-6 inline-flex rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:border-[color:var(--accent-teal)] hover:bg-white"
          >
            Return to command deck
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-shell py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 lg:flex-row lg:items-start">
        <div className="glass-panel max-w-xl rounded-[2rem] p-8 lg:flex-1">
          <p className="section-kicker">Hosted identity</p>
          <h1 className="mt-4 text-3xl font-semibold">Create the bonded operator through Clerk.</h1>
          <p className="muted-copy mt-4 text-sm leading-7">
            The redirect callback will create or link the operator record in app persistence before returning to the command deck.
          </p>
        </div>
        <div className="glass-panel rounded-[2rem] p-6 lg:min-w-[24rem]">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl={identityStrategy.signInUrl ?? "/sign-in"}
            forceRedirectUrl={hostedIdentityCallbackPath}
            fallbackRedirectUrl={hostedIdentityCallbackPath}
          />
        </div>
      </div>
    </div>
  );
}