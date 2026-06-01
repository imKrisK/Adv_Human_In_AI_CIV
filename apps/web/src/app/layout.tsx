import type { Metadata } from "next";
import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { IBM_Plex_Mono, Oxanium } from "next/font/google";

import { resolveIdentityStrategy } from "@/lib/identity-strategy";
import "./globals.css";

const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/pitch", label: "Pitch" },
  { href: "/command-deck", label: "Command Deck" },
  { href: "/field-guide", label: "Field Guide" },
  { href: "/service-map", label: "Service Map" },
  { href: "/backlog", label: "Backlog" },
];

export const metadata: Metadata = {
  title: {
    default: "Adventure of Human in AI Civilization",
    template: "%s | Adventure of Human in AI Civilization",
  },
  description:
    "Web-first prototype shell for a bonded human-and-AI co-op action RPG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const identityStrategy = resolveIdentityStrategy();
  const hostedIdentityActive = identityStrategy.strategy === "hosted-identity";

  const shellContent = (
    <>
      <div className="pointer-events-none fixed inset-0 opacity-90">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(141,216,232,0.55),_transparent_62%)]" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(217,108,61,0.22),_transparent_68%)] blur-3xl" />
      </div>
      <div className="relative flex min-h-screen flex-col">
        <header className="border-b border-[color:var(--line)] bg-[color:var(--surface)]/80 backdrop-blur-xl">
          <div className="main-shell flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Link href="/" className="text-lg font-semibold tracking-[0.1em] text-[color:var(--foreground)]">
                Adventure of Human in AI Civilization
              </Link>
              <p className="max-w-2xl text-sm text-[color:var(--muted)]">
                Web-first prototype shell for the first playable slice: one city,
                one bonded AI partner, a staged opening mission, and a live-event-ready frontier.
              </p>
            </div>
            <nav className="flex flex-wrap gap-2 text-sm font-medium">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-[color:var(--line)] bg-white/60 px-4 py-2 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
                >
                  {item.label}
                </Link>
              ))}
              {hostedIdentityActive ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Show when="signed-out">
                    {identityStrategy.signInUrl ? (
                      <Link
                        href={identityStrategy.signInUrl}
                        prefetch={false}
                        className="rounded-full border border-[color:var(--line)] bg-white/60 px-4 py-2 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
                      >
                        Sign in
                      </Link>
                    ) : null}
                    {identityStrategy.signUpUrl ? (
                      <Link
                        href={identityStrategy.signUpUrl}
                        prefetch={false}
                        className="rounded-full bg-[color:var(--foreground)] px-4 py-2 text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
                      >
                        Sign up
                      </Link>
                    ) : null}
                  </Show>
                  <Show when="signed-in">
                    <div className="rounded-full border border-[color:var(--line)] bg-white/70 px-2 py-1">
                      <UserButton />
                    </div>
                  </Show>
                </div>
              ) : null}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[color:var(--line)] bg-white/50">
          <div className="main-shell flex flex-col gap-2 py-6 text-sm text-[color:var(--muted)] md:flex-row md:items-center md:justify-between">
            <p>Current slice target: Lattice Haven, three starter companions, and one recurring live event.</p>
            <p className="font-mono text-xs uppercase tracking-[0.22em]">Next.js prototype shell</p>
          </div>
        </footer>
      </div>
    </>
  );

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${oxanium.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {hostedIdentityActive ? (
          <ClerkProvider afterSignOutUrl="/command-deck">
            {shellContent}
          </ClerkProvider>
        ) : (
          shellContent
        )}
      </body>
    </html>
  );
}
