import { NextResponse } from "next/server";
import { logVisit } from "@/lib/db";

/**
 * Server-side pageview beacon. Separate from the client Studio ring buffer
 * (which is per-browser localStorage) — this is the durable log the weekly
 * WhatsApp digest and /visits command read from. No-ops (ok: false) when
 * DATABASE_URL isn't configured, same degrade-gracefully pattern as /api/lead.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  let path = "";
  let ref = "";
  try {
    const b = await req.json();
    path = String(b?.path ?? "").slice(0, 300);
    ref = String(b?.ref ?? "").slice(0, 200);
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });
  const ok = await logVisit(path, ref);
  return NextResponse.json({ ok });
}
