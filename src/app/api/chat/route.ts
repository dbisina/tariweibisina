import { NextResponse } from "next/server";
import { getProvider, type ChatMessage, type ProviderPref } from "@/lib/ai";

/**
 * Chat endpoint. Session memory is keyed by a `rimuru_sid` cookie so a
 * returning visitor's quote conversation can be resumed (VISION.md). The
 * store here is in-memory — fine for the dev/foundation stage; the CMS
 * task swaps it for a real DB keyed by cookie/IP.
 */
const SESSIONS = new Map<string, ChatMessage[]>();
const MAX_TURNS = 24;

function sid(cookie: string | null): string {
  const m = cookie?.match(/rimuru_sid=([^;]+)/);
  if (m) return m[1];
  // deterministic-enough id without Math.random/Date restrictions in edge
  return "s_" + Math.abs(hash(cookie ?? "" + performance.now())).toString(36);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export async function POST(req: Request) {
  let message = "";
  let pref: ProviderPref = "auto";
  try {
    const body = await req.json();
    message = String(body?.message ?? "").slice(0, 2000);
    if (body?.provider === "gemini" || body?.provider === "local") pref = body.provider;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!message.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });

  const id = sid(req.headers.get("cookie"));
  const history = SESSIONS.get(id) ?? [];
  history.push({ role: "user", content: message });

  const provider = getProvider(pref);
  let reply;
  try {
    reply = await provider.respond(history);
  } catch (e) {
    // Gemini failed (bad key, quota, network) — degrade to local, never 500
    const { LocalProvider } = await import("@/lib/ai/local-provider");
    reply = await new LocalProvider().respond(history);
    reply.text += `\n\n(Note: live model unavailable, using the built-in guide.)`;
    console.error("chat provider error:", e);
  }

  history.push({ role: "assistant", content: reply.text });
  SESSIONS.set(id, history.slice(-MAX_TURNS));

  const res = NextResponse.json(reply);
  res.cookies.set("rimuru_sid", id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
