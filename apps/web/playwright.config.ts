import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });

import { clerkSetup } from "@clerk/testing/playwright";
import { defineConfig, devices } from "@playwright/test";

const sessionServiceFallbackPublishableKey =
  "pk_test_Y2xlcmsuaW5zcGlyZWQucHVtYS03NC5sY2wuZGV2JA";
const sessionServiceFallbackSecretKey = "local-clerk-secret-placeholder";

if (
  !process.env.CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
) {
  process.env.CLERK_PUBLISHABLE_KEY =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

const sessionServiceBaseUrl =
  process.env.SESSION_SERVICE_BASE_URL ?? "http://localhost:4010";
const shouldStartLocalSessionServiceRuntime =
  process.env.SESSION_SERVICE_MODE === "external-runtime" &&
  /localhost:4010|127\.0\.0\.1:4010/i.test(sessionServiceBaseUrl);

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  timeout: 180_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run dev -- --port=3000",
      url: "http://localhost:3000/command-deck",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    ...(shouldStartLocalSessionServiceRuntime
      ? [
          {
            command: "npm run serve:session-service",
            env: {
              ...process.env,
              CLERK_SECRET_KEY:
                process.env.CLERK_SECRET_KEY ?? sessionServiceFallbackSecretKey,
              NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
                process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
                sessionServiceFallbackPublishableKey,
              CLERK_PUBLISHABLE_KEY:
                process.env.CLERK_PUBLISHABLE_KEY ??
                process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
                sessionServiceFallbackPublishableKey,
              NEXT_PUBLIC_CLERK_SIGN_IN_URL:
                process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in",
              NEXT_PUBLIC_CLERK_SIGN_UP_URL:
                process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up",
            },
            url: `${sessionServiceBaseUrl}/api/session-service/health`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
        ]
      : []),
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});