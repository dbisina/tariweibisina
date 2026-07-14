import { formatBriefText, type ChannelResult, type Lead } from "@/lib/leads";

/**
 * Fan a new lead out to Daniel over Telegram, WhatsApp and email. Every
 * channel is HTTP-only (no SDK deps) and independently env-gated, so the site
 * runs with none, one, or all three configured. A channel that is unset or
 * errors resolves to `false` — notifications never block or fail the intake.
 *
 *   Telegram : TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *   WhatsApp : OPENWA_API_URL, OPENWA_TO   (+ optional OPENWA_API_KEY)   [open-wa]
 *   Email    : RESEND_API_KEY, NOTIFY_EMAIL_TO, NOTIFY_EMAIL_FROM
 */

async function telegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** open-wa exposes a local HTTP API; POST { to, content } to /sendText */
async function whatsapp(text: string): Promise<boolean> {
  const url = process.env.OPENWA_API_URL;
  const to = process.env.OPENWA_TO;
  if (!url || !to) return false;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.OPENWA_API_KEY) headers["Authorization"] = `Bearer ${process.env.OPENWA_API_KEY}`;
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/sendText`, {
      method: "POST",
      headers,
      body: JSON.stringify({ args: { to, content: text } }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function email(subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL_TO;
  const from = process.env.NOTIFY_EMAIL_FROM;
  if (!key || !to || !from) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function notifyLead(lead: Lead): Promise<ChannelResult> {
  const text = formatBriefText(lead);
  const subject = `New ${lead.source} lead — ${lead.brief?.title ?? lead.name}`;
  const [tg, wa, em] = await Promise.all([telegram(text), whatsapp(text), email(subject, text)]);
  return { telegram: tg, whatsapp: wa, email: em };
}
