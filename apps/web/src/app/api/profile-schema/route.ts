import { NextResponse } from "next/server";

import {
  defaultCommandDeckState,
  profileSchema,
  starterCompanions,
  starterLoadouts,
} from "@/lib/prototype-data";
import { missionFlows, starterPairings } from "@/lib/playable-slice";

export async function GET() {
  return NextResponse.json({
    profileSchema,
    defaultCommandDeckState,
    starterLoadouts,
    starterCompanions,
    starterPairings,
    missionFlows,
  });
}