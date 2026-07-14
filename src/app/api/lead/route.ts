import { NextResponse } from "next/server";
import crypto from "crypto";
import { structureBrief } from "@/lib/ai/structure";
import { notifyLead } from "@/lib/notify";
import { saveLead, listLeads } from "@/lib/db";
import { isStudioAuthed } from "@/lib/studio-auth";
import type { Lead, LeadSource, RawLead } from "@/lib/leads";

/**
 * Lead intake. POST a raw brief → the LLM structures it → it is persisted
 * (Postgres, if configured) → Daniel is pinged on Telegram / WhatsApp / email
 * → the structured brief comes back for the on-page confirmation. GET returns
 * stored leads for the Studio admin panel (guarded by STUDIO_ADMIN_KEY).
 */
export const runtime = "nodejs";

const SOURCES: LeadSource[] = ["hire-me", "quote", "contact", "adspot"];

export async function POST(req: Request) {
  let raw: RawLead;
  try {
    const b = await req.json();
    const source: LeadSource = SOURCES.includes(b?.source) ? b.source : "contact";
    raw = {
      source,
      name: String(b?.name ?? "").slice(0, 200).trim(),
      contact: String(b?.contact ?? "").slice(0, 200).trim(),
      projectType: b?.projectType ? String(b.projectType).slice(0, 120) : undefined,
      budget: b?.budget ? String(b.budget).slice(0, 60) : undefined,
      timeline: b?.timeline ? String(b.timeline).slice(0, 60) : undefined,
      detail: String(b?.detail ?? "").slice(0, 5000).trim(),
    };
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!raw.contact || raw.detail.length < 4)
    return NextResponse.json({ error: "contact and detail required" }, { status: 400 });

  const brief = await structureBrief(raw);
  const lead: Lead = { ...raw, id: crypto.randomUUID(), ts: Date.now(), brief };
  const channels = await notifyLead(lead);
  lead.channels = channels;
  await saveLead(lead);

  return NextResponse.json({ ok: true, id: lead.id, brief, channels });
}

export async function GET(req: Request) {
  if (!isStudioAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const leads = await listLeads();
  return NextResponse.json({ leads });
}
