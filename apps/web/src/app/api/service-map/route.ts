import { NextResponse } from "next/server";

import { readEnvironmentContractStatus } from "@/lib/environment-contract";

import {
  executionChecklist,
  hostingBaseline,
  planningAssets,
  productSurfaces,
  serviceBoundaries,
} from "@/lib/prototype-data";

export async function GET() {
  return NextResponse.json({
    productSurfaces,
    serviceBoundaries,
    hostingBaseline,
    executionChecklist,
    planningAssets,
    environmentContractStatus: readEnvironmentContractStatus(),
  });
}