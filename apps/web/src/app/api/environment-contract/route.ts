import { NextResponse } from "next/server";

import { readEnvironmentContractStatus } from "@/lib/environment-contract";

export async function GET() {
  const environmentContractStatus = readEnvironmentContractStatus();

  return NextResponse.json(environmentContractStatus, {
    status: environmentContractStatus.responseStatus,
  });
}