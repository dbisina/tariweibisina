import { listLeads, visitSummary, getAdConfigRow, setAdConfigRow } from "@/lib/db";
import { formatBriefText } from "@/lib/leads";

/**
 * Command router for the inbound WhatsApp bot (open-wa EASY API webhook →
 * /api/whatsapp-webhook → here). Every command is read-only or a small,
 * explicit mutation — no free-form AI in the loop, so replies are
 * deterministic and cheap.
 *
 *   /help                      list commands
 *   /leads [n]                 last n leads, compact (default 5)
 *   /leads <id>                full brief for one lead
 *   /visits [days]             visit digest, default 7 days
 *   /adspot                    show current ad override
 *   /adspot on|off             enable/disable the ad slot
 *   /adspot set k=v k2=v2 ...  patch headline/body/ctaLabel/ctaHref
 */

const HELP = [
  "🤖 Commands:",
  "/leads [n] — last n leads (default 5)",
  "/leads <id> — full brief for one lead",
  "/visits [days] — visit digest (default 7)",
  "/adspot — show ad config",
  "/adspot on|off — toggle the ad slot",
  "/adspot set headline=... body=... ctaLabel=... ctaHref=...",
].join("\n");

const ADSPOT_FIELDS = ["headline", "body", "ctaLabel", "ctaHref"] as const;

function parseKeyValues(rest: string): Record<string, string> {
  const out: Record<string, string> = {};
  // headline="foo bar" body=baz  — quoted values may contain spaces
  const re = /(\w+)=(?:"([^"]*)"|(\S+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest))) {
    const key = m[1];
    if ((ADSPOT_FIELDS as readonly string[]).includes(key)) out[key] = m[2] ?? m[3] ?? "";
  }
  return out;
}

async function cmdLeads(argStr: string): Promise<string> {
  const arg = argStr.trim();
  const leads = await listLeads(200);
  if (!leads.length) return "No leads on file (DATABASE_URL not configured, or none yet).";

  if (arg && !/^\d+$/.test(arg)) {
    const lead = leads.find((l) => l.id === arg || l.id.startsWith(arg));
    if (!lead) return `No lead matching "${arg}".`;
    return formatBriefText(lead);
  }

  const n = arg ? Math.max(1, Math.min(20, Number(arg))) : 5;
  const slice = leads.slice(0, n);
  const lines = slice.map((l) => {
    const tag = l.brief ? `${l.brief.priority.toUpperCase()} · ${l.brief.title}` : l.detail.slice(0, 50);
    return `• ${l.id.slice(0, 8)} [${l.source}] ${l.name} — ${tag}`;
  });
  return `📋 Last ${slice.length} lead(s):\n${lines.join("\n")}\n\nReply "/leads <id>" for full detail.`;
}

async function cmdVisits(argStr: string): Promise<string> {
  const days = argStr.trim() ? Math.max(1, Math.min(90, Number(argStr.trim()))) : 7;
  const s = await visitSummary(days);
  if (!s.total) return `📊 No visits logged in the last ${days}d (DATABASE_URL not configured, or none yet).`;
  const lines = [
    `📊 Visits, last ${days}d: ${s.total}`,
    ``,
    `Top paths:`,
    ...s.topPaths.map((p) => `  • ${p.path} — ${p.count}`),
    ``,
    `Top referrers:`,
    ...s.topRefs.map((r) => `  • ${r.ref} — ${r.count}`),
  ];
  return lines.join("\n");
}

async function cmdAdspot(argStr: string): Promise<string> {
  const arg = argStr.trim();
  if (!arg) {
    const cfg = await getAdConfigRow();
    if (!cfg) return "🟠 No ad override set — site is using its default ad config from /studio.";
    return `🟠 Ad override:\n${JSON.stringify(cfg, null, 2)}`;
  }
  if (/^on$/i.test(arg)) {
    await setAdConfigRow({ enabled: true });
    return "✅ Ad slot enabled.";
  }
  if (/^off$/i.test(arg)) {
    await setAdConfigRow({ enabled: false });
    return "✅ Ad slot disabled.";
  }
  if (/^set\s+/i.test(arg)) {
    const patch = parseKeyValues(arg.replace(/^set\s+/i, ""));
    if (!Object.keys(patch).length)
      return `No recognized fields. Use: ${ADSPOT_FIELDS.join(", ")} (e.g. headline="New sponsor").`;
    const merged = await setAdConfigRow(patch);
    return merged ? `✅ Ad updated:\n${JSON.stringify(merged, null, 2)}` : "❌ Update failed (DATABASE_URL not configured?).";
  }
  return `Unrecognized /adspot argument "${arg}". Send /help for usage.`;
}

/** Dispatch one inbound message body to a reply string, or null to stay silent. */
export async function handleCommand(body: string): Promise<string | null> {
  const text = body.trim();
  if (!text.startsWith("/")) return null;
  const [cmdRaw, ...restParts] = text.slice(1).split(/\s+/);
  const cmd = cmdRaw.toLowerCase();
  const rest = restParts.join(" ");

  switch (cmd) {
    case "help":
      return HELP;
    case "leads":
      return cmdLeads(rest);
    case "visits":
      return cmdVisits(rest);
    case "adspot":
      return cmdAdspot(rest);
    default:
      return `Unknown command "/${cmd}". Send /help for the list.`;
  }
}
