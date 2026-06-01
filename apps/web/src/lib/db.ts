import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { join } from "node:path";

import { resolveRuntimeMode } from "@/lib/runtime-mode";

type AppPrismaClient = PrismaClient;
type GeneratedPostgresPrismaModule = {
  PrismaClient: new () => AppPrismaClient;
};

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: AppPrismaClient;
};

function logRuntimeBootstrap(
  mode: "local-prototype" | "hosted-candidate",
  source: string,
  databaseUrlKind: string,
  prismaPath: "better-sqlite3-adapter" | "generated-postgres-client",
) {
  console.info(
    `[runtime] mode=${mode} source=${source} databaseUrlKind=${databaseUrlKind} prismaPath=${prismaPath}`,
  );

  if (mode === "hosted-candidate" && databaseUrlKind === "sqlite-file") {
    console.warn(
      "[runtime] Hosted-candidate mode is booting with a SQLite database URL. P13-02 will move this path to staged Postgres runtime.",
    );
  }
}

function createGeneratedPostgresPrismaClient() {
  try {
    const postgresClientModulePath = join(
      process.cwd(),
      "node_modules",
      ".prisma",
      "postgres-client",
    );
    const runtimeRequire = Function(
      "modulePath",
      "return require(modulePath);",
    ) as (modulePath: string) => GeneratedPostgresPrismaModule;
    const postgresModule = runtimeRequire(
      postgresClientModulePath,
    ) as GeneratedPostgresPrismaModule;

    return new postgresModule.PrismaClient();
  } catch {
    throw new Error(
      "Hosted-candidate runtime with a PostgreSQL DATABASE_URL requires the generated Postgres Prisma client. Run `npm run db:generate:postgres` before booting this mode.",
    );
  }
}

function createPrismaClient() {
  const runtimeMode = resolveRuntimeMode();
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (
    runtimeMode.mode === "local-prototype" &&
    runtimeMode.databaseUrlKind !== "sqlite-file"
  ) {
    throw new Error(
      "Local-prototype runtime mode requires a SQLite DATABASE_URL (file:... or sqlite:...).",
    );
  }

  if (runtimeMode.databaseUrlKind === "postgres") {
    logRuntimeBootstrap(
      runtimeMode.mode,
      runtimeMode.source,
      runtimeMode.databaseUrlKind,
      "generated-postgres-client",
    );

    return createGeneratedPostgresPrismaClient();
  }

  if (runtimeMode.databaseUrlKind !== "sqlite-file") {
    throw new Error(
      "Current Prisma runtime in this app requires either a SQLite DATABASE_URL for the local path or a PostgreSQL DATABASE_URL for the hosted-candidate path.",
    );
  }

  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

  logRuntimeBootstrap(
    runtimeMode.mode,
    runtimeMode.source,
    runtimeMode.databaseUrlKind,
    "better-sqlite3-adapter",
  );

  if (runtimeMode.mode === "hosted-candidate") {
    console.warn(
      "[runtime] Hosted-candidate mode is currently using the SQLite adapter while Postgres cutover remains open in P13-02.",
    );
  }

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}