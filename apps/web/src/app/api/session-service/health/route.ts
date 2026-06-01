import { NextResponse } from "next/server";

import { readSessionServiceHealth } from "@/lib/session-service";
import { readSessionServiceHealthFromService } from "@/lib/session-service-client";
import {
  isValidSessionServiceInternalRequest,
  sessionServiceInternalTokenHeader,
} from "@/lib/session-service-contract";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const health = isValidSessionServiceInternalRequest(
    request.headers.get(sessionServiceInternalTokenHeader),
  )
    ? await readSessionServiceHealth()
    : await readSessionServiceHealthFromService();

  return NextResponse.json(health, {
    status: health.status === "ok" ? 200 : 503,
  });
}