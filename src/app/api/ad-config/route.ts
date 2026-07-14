import { NextResponse } from "next/server";
import { getAdConfigRow, setAdConfigRow } from "@/lib/db";
import { isStudioAuthed } from "@/lib/studio-auth";

/**
 * Server-authoritative override for the ad slot (StudioConfig.content.ad),
 * set via the /adspot WhatsApp command. GET is public (the live site reads
 * it on mount to reflect a WhatsApp-driven edit); POST is guarded the same
 * way as GET /api/lead, for manual/admin use.
 */
export const runtime = "nodejs";

export async function GET() {
  const config = await getAdConfigRow();
  return NextResponse.json({ config });
}

export async function POST(req: Request) {
  if (!isStudioAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let patch: Record<string, unknown>;
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const config = await setAdConfigRow(patch);
  return NextResponse.json({ ok: !!config, config });
}
