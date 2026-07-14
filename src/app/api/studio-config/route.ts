import { NextResponse } from "next/server";
import { getStudioConfigRow, setStudioConfigRow } from "@/lib/db";
import { isStudioAuthed } from "@/lib/studio-auth";

/**
 * The whole Studio CMS document, published as one unit from /studio's
 * Publish button (see lib/studio.ts's publish() action). GET is public —
 * every page load hydrates from this before localStorage (studio-apply.tsx)
 * so a Publish from one device shows up everywhere. POST is guarded the same
 * way as GET /api/lead and POST /api/ad-config.
 */
export const runtime = "nodejs";

export async function GET() {
  const config = await getStudioConfigRow();
  return NextResponse.json({ config });
}

export async function POST(req: Request) {
  if (!isStudioAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let config: Record<string, unknown>;
  try {
    config = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!config || typeof config !== "object")
    return NextResponse.json({ error: "config object required" }, { status: 400 });
  const ok = await setStudioConfigRow(config);
  return NextResponse.json({ ok });
}
