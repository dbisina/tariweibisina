import { NextResponse } from "next/server";
import { visitSummary } from "@/lib/db";
import { sendWhatsApp } from "@/lib/notify";

/**
 * Weekly visitation digest, pushed to OPENWA_TO over WhatsApp. Meant to be
 * hit by an external scheduler (Vercel Cron, GitHub Actions cron, cron on
 * Daniel's own box) once a week — this route does no scheduling itself.
 * Guarded by CRON_SECRET so it can't be triggered by randoms.
 */
export const runtime = "nodejs";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const url = new URL(req.url);
    const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret");
    if (got !== expected) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const s = await visitSummary(7);
  const lines = [
    `📅 Weekly visits — ${s.total} in the last 7 days`,
    ``,
    `Top paths:`,
    ...(s.topPaths.length ? s.topPaths.map((p) => `  • ${p.path} — ${p.count}`) : ["  (none)"]),
    ``,
    `Top referrers:`,
    ...(s.topRefs.length ? s.topRefs.map((r) => `  • ${r.ref} — ${r.count}`) : ["  (none)"]),
  ];
  const text = lines.join("\n");
  const sent = await sendWhatsApp(text);

  return NextResponse.json({ ok: true, sent, summary: s });
}
