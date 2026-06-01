import { NextResponse } from "next/server";

import { readEnvironmentContractStatus } from "@/lib/environment-contract";

import {
  backlogMilestones,
  defaultCommandDeckState,
  definitionOfDone,
  executionChecklist,
  firstFaction,
  firstLiveEvent,
  hostingBaseline,
  hubCity,
  missionZones,
  phaseLabels,
  phaseOrder,
  planningAssets,
  productSurfaces,
  profileSchema,
  resolveLiveEvent,
  routeCards,
  scopeLocks,
  serviceBoundaries,
  sliceMetrics,
  starterLoadouts,
  starterCompanions,
} from "@/lib/prototype-data";
import {
  launchMissionLinks,
  missionFlows,
  starterPairings,
} from "@/lib/playable-slice";

export async function GET() {
  return NextResponse.json({
    sliceMetrics,
    routeCards,
    productSurfaces,
    serviceBoundaries,
    hostingBaseline,
    executionChecklist,
    planningAssets,
    environmentContractStatus: readEnvironmentContractStatus(),
    definitionOfDone,
    firstFaction,
    hubCity,
    starterLoadouts,
    starterCompanions,
    missionZones,
    missionFlows,
    starterPairings,
    launchMissionLinks,
    firstLiveEvent,
    resolvedLiveEvent: resolveLiveEvent(firstLiveEvent),
    phaseOrder,
    phaseLabels,
    profileSchema,
    defaultCommandDeckState,
    backlogMilestones,
    scopeLocks,
  });
}