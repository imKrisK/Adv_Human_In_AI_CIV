import { clerkSetup } from "@clerk/testing/playwright";

export default async function globalSetup() {
  if (process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    await clerkSetup();
  }
}
