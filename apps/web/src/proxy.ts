import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { resolveIdentityStrategy } from "@/lib/identity-strategy";
import {
  isValidSessionServiceInternalRequest,
  sessionServiceInternalTokenHeader,
} from "@/lib/session-service-contract";

const isHostedProtectedRoute = createRouteMatcher([
  "/auth/complete(.*)",
  "/api/profile(.*)",
  "/api/squad(.*)",
  "/api/session-service(.*)",
  "/api/playtest(.*)",
]);
const isSessionServiceRoute = createRouteMatcher(["/api/session-service(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (resolveIdentityStrategy().strategy !== "hosted-identity") {
    return;
  }

  if (
    isSessionServiceRoute(req) &&
    isValidSessionServiceInternalRequest(
      req.headers.get(sessionServiceInternalTokenHeader),
    )
  ) {
    return;
  }

  if (isHostedProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};