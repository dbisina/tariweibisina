/**
 * Shared lead / brief types + a no-key heuristic structurer.
 *
 * A "lead" is anyone who reaches out. Two intents, deliberately different
 * (VISION.md): HIRE-ME is a full project brief (name, budget, details) that
 * the LLM structures into a scoped spec before it reaches Daniel; QUOTE is a
 * lighter "ballpark this" ask. Both flow through /api/lead → structure →
 * persist (Postgres) → notify (Telegram / WhatsApp / email) → Studio.
 *
 * This module is framework-neutral (no "use client", no server-only imports)
 * so the client store, the API route and the notifier all share one shape.
 */

export type LeadSource = "hire-me" | "quote" | "contact";
export type Priority = "low" | "medium" | "high";

/** raw intake straight off the form */
export interface RawLead {
  source: LeadSource;
  name: string;
  contact: string; // email / handle / phone
  projectType?: string;
  budget?: string;
  timeline?: string;
  detail: string; // free-text brief
}

/** what the LLM turns a raw brief into, for Daniel's inbox + Studio */
export interface StructuredBrief {
  title: string;
  summary: string;
  projectType: string;
  budget: string;
  timeline: string;
  scope: string[];
  risks: string[];
  priority: Priority;
  suggestedReply: string;
}

export interface ChannelResult {
  telegram: boolean;
  whatsapp: boolean;
  email: boolean;
}

export interface Lead extends RawLead {
  id: string;
  ts: number;
  brief?: StructuredBrief;
  channels?: ChannelResult;
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

/** budget string → coarse priority (bigger ask = hotter lead) */
export function priorityFromBudget(budget?: string): Priority {
  const n = Number((budget ?? "").replace(/[^0-9.]/g, "")) || 0;
  if (/15k|\+|open/i.test(budget ?? "") || n >= 15000) return "high";
  if (n >= 6000 || /6k/i.test(budget ?? "")) return "medium";
  return "low";
}

/** deterministic fallback when no LLM key is configured — never blocks intake */
export function heuristicBrief(raw: RawLead): StructuredBrief {
  const sentences = raw.detail
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    title: clip(raw.projectType ? `${raw.projectType} — ${raw.name}` : `Inquiry — ${raw.name}`, 80),
    summary: clip(raw.detail || "(no details provided)", 240),
    projectType: raw.projectType || "Unspecified",
    budget: raw.budget || "Not stated",
    timeline: raw.timeline || "Not stated",
    scope: sentences.slice(0, 6),
    risks: [],
    priority: priorityFromBudget(raw.budget),
    suggestedReply: `Hi ${raw.name.split(/[@\s]/)[0] || "there"} — thanks for the brief. Let me scope this and come back with a firm figure.`,
  };
}

/** human-readable block for email / Telegram / WhatsApp */
export function formatBriefText(lead: Lead): string {
  const b = lead.brief;
  const lines = [
    `🟠 New ${lead.source.toUpperCase()} lead`,
    `Name:    ${lead.name}`,
    `Contact: ${lead.contact}`,
    b ? `Budget:  ${b.budget}   ·   Priority: ${b.priority.toUpperCase()}` : `Budget:  ${lead.budget ?? "—"}`,
  ];
  if (b) {
    lines.push(``, `▸ ${b.title}`, b.summary);
    if (b.scope.length) lines.push(``, `Scope:`, ...b.scope.map((s) => `  • ${s}`));
    if (b.risks.length) lines.push(``, `Watch:`, ...b.risks.map((s) => `  • ${s}`));
    lines.push(``, `Suggested reply:`, b.suggestedReply);
  } else {
    lines.push(``, lead.detail);
  }
  return lines.join("\n");
}
