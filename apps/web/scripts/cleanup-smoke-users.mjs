/**
 * Deletes all Clerk test users whose email addresses contain "+clerk_test"
 * or end in "@lattice-haven.test". Safe to run — only removes smoke accounts.
 *
 * Usage (from apps/web):
 *   node scripts/cleanup-smoke-users.mjs
 */
import { config } from "dotenv";
import { createClerkClient } from "@clerk/backend";

config({ path: ".env.local", override: true });

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  console.error("CLERK_SECRET_KEY not set");
  process.exit(1);
}

const client = createClerkClient({ secretKey });

async function deleteAllSmokeUsers() {
  let deleted = 0;
  let page = 0;

  while (true) {
    const { data: users, totalCount } = await client.users.getUserList({
      limit: 100,
      offset: page * 100,
    });

    if (users.length === 0) break;

    for (const user of users) {
      const emails = user.emailAddresses.map((e) => e.emailAddress);
      const isSmokeUser = emails.some(
        (e) => e.includes("+clerk_test") || e.endsWith("@lattice-haven.test"),
      );
      if (!isSmokeUser) continue;

      try {
        await client.users.deleteUser(user.id);
        console.log(`  deleted: ${emails.join(", ")}`);
        deleted++;
      } catch (err) {
        console.warn(`  failed to delete ${user.id}: ${err?.message}`);
      }
    }

    if (page * 100 + users.length >= totalCount) break;
    page++;
  }

  console.log(`\nDone. Deleted ${deleted} smoke test users.`);
}

deleteAllSmokeUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
