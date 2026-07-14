import { NextResponse } from "next/server";

/**
 * Railway healthcheck target (see railway.toml). Deliberately does not touch
 * Postgres/Cloudinary/etc — those are all optional and env-gated, so a
 * healthcheck that pinged them would false-negative (and restart-loop the
 * deploy) whenever an integration is simply unconfigured. This only proves
 * the Node process is up and serving requests.
 */
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
