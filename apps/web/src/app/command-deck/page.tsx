import type { Metadata } from "next";

import CommandDeckPanel from "@/app/command-deck-panel";

export const metadata: Metadata = {
  title: "Command Deck",
  description:
    "Interactive first-session prototype with starter loadouts, AI bonding, mission staging, and profile schema state.",
};

export default function CommandDeckPage() {
  return (
    <div className="main-shell py-10 md:py-14">
      <CommandDeckPanel />
    </div>
  );
}