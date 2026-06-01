import "dotenv/config";
import { defineConfig } from "prisma/config";

function readPostgresDatasourceUrl(env: NodeJS.ProcessEnv) {
  return (
    env["DIRECT_DATABASE_URL"] ??
    env["DATABASE_URL"] ??
    env["POSTGRES_DIRECT_DATABASE_URL"] ??
    env["POSTGRES_DATABASE_URL"]
  );
}

export default defineConfig({
  schema: "prisma/schema.postgres.prisma",
  migrations: {
    path: "prisma/postgres-migrations",
  },
  datasource: {
    url: readPostgresDatasourceUrl(process.env),
  },
});