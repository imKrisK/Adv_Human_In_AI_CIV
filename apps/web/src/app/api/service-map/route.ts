import { NextResponse } from "next/server";

import { readEnvironmentContractStatus } from "@/lib/environment-contract";
import { readObservabilityStatus } from "@/lib/observability";

import {
  executionChecklist,
  hostingBaseline,
  planningAssets,
  productSurfaces,
  serviceBoundaries,
} from "@/lib/prototype-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    productSurfaces,
    serviceBoundaries,
    hostingBaseline,
    executionChecklist,
    planningAssets,
    environmentContractStatus: readEnvironmentContractStatus(),
    observabilityStatus: await readObservabilityStatus(),
  });
}