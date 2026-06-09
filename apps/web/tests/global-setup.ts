import { clerkSetup } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/nextjs/server";

export default async function globalSetup() {
  if (
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    await clerkSetup();
    await cleanupStaleSmokeUsers();
  }
}

/**
 * Deletes Clerk smoke test users created more than 1 hour ago.
 * Smoke emails contain "+clerk_test" (clerk-testing mode) or "@lattice-haven.test"
 * (local-demo mode). We check Clerk's createdAt timestamp so cleanup works
 * regardless of the email format used in any prior run.
 * This keeps MAU below the Clerk dev 100-user limit across multiple daily runs.
 */
async function cleanupStaleSmokeUsers() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return;

  const cutoffMs = Date.now() - 60 * 60 * 1000; // 1 hour ago
  const client = createClerkClient({ secretKey });

  let offset = 0;
  let deleted = 0;

  while (true) {
    let users;
    try {
      const result = await client.users.getUserList({ limit: 100, offset });
      users = result.data;
      if (users.length === 0) break;
    } catch {
      break;
    }

    for (const user of users) {
      const emails = user.emailAddresses.map((e) => e.emailAddress);
      const isSmokeUser = emails.some(
        (e) =>
          e.includes("+clerk_test") || e.endsWith("@lattice-haven.test"),
      );
      if (!isSmokeUser) continue;
      // createdAt is a Unix timestamp in milliseconds
      if ((user.createdAt ?? 0) > cutoffMs) continue;

      try {
        await client.users.deleteUser(user.id);
        deleted++;
      } catch {
        // Non-fatal
      }
    }

    offset += users.length;
    if (users.length < 100) break;
  }

  if (deleted > 0) {
    console.log(`[global-setup] Cleaned up ${deleted} stale smoke test users.`);
  }
}
