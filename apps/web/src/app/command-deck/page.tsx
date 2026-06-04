import type { Metadata } from "next";

import CommandDeckPanel from "@/app/command-deck-panel";
import { readEventConfig } from "@/lib/event-config";

export const metadata: Metadata = {
  title: "Command Deck",
  description:
    "Interactive first-session prototype with starter loadouts, AI bonding, mission staging, and profile schema state.",
};

export default async function CommandDeckPage() {
  const eventOverride = await readEventConfig();
  return (
    <div className="main-shell py-10 md:py-14">
      <CommandDeckPanel liveEventOverride={eventOverride} />
    </div>
  );
}