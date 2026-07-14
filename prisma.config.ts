import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 moved the connection URL out of schema.prisma and into here (the
 * Prisma CLI — `generate`, `migrate deploy` — runs as its own process
 * outside Next.js, so it doesn't get Next's automatic .env.local loading;
 * `dotenv` fills that gap for local dev). On Railway, DATABASE_URL is
 * already injected into the real process env at build time, so these
 * loadEnv() calls are harmless no-ops there (dotenv never overwrites an
 * already-set variable).
 */
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
