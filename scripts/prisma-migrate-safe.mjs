import { execSync } from "node:child_process";

/**
 * Runs `prisma migrate deploy` only when DATABASE_URL is actually set —
 * matches the rest of the stack's "every integration gracefully degrades
 * when unset" rule (see db.ts, notify.ts). Without this guard, a local
 * `npm run build` with no DB configured would hard-fail instead of just
 * building the app. Node, not a shell script, so it runs the same way on
 * Railway's Linux build and Daniel's local Windows machine.
 */
if (process.env.DATABASE_URL) {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} else {
  console.log("prisma-migrate-safe: DATABASE_URL not set, skipping migrate deploy");
}
