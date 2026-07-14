import type { ChatAction, ChatMessage, ChatProvider, ChatReply } from "./types";
import { systemPrompt } from "./knowledge";
import { seedBySlug } from "@/lib/content";
import { nextGeminiKey, poolSize, reportGeminiKeyError } from "./key-pool";
import { TOOLS, executeTool, type FunctionCall } from "./tools";

/**
 * Gemini adapter. Uses the REST generateContent endpoint (works without the
 * SDK, so no version coupling — see the SDK-shape flag in VISION.md).
 * gemini-3.5-flash is the site assistant model (VISION.md). Everything
 * Gemini-specific lives here; swapping providers means writing a sibling
 * file, not touching the assistant.
 *
 * Keys come from the round-robin pool (key-pool.ts) so a single 429/5xx
 * fails over to the next configured key instead of surfacing an error.
 *
 * Agentic tools: get_project_details (real case-study + GitHub repo content,
 * fetched on demand — see github-knowledge.ts) and show_project (a real
 * navigation action, not just words) are declared below and executed
 * server-side in a request/response loop, same shape the Live API uses
 * (see live-token/route.ts) so both surfaces share one tool contract.
 */
const MODEL = "gemini-3.5-flash";
const MAX_TOOL_ROUNDS = 3;

interface GenReply {
  text: string;
  shownSlugs: string[];
}

async function callGemini(apiKey: string, messages: ChatMessage[]): Promise<GenReply> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Gemini's content/part shape isn't worth a local type for a request body we only build and serialize
  const contents: any[] = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const shownSlugs: string[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt() }] },
      contents,
      tools: TOOLS,
      generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text();
      const err = new Error(`Gemini ${res.status}: ${detail}`);
      (err as Error & { status?: number }).status = res.status;
      throw err;
    }
    const data = await res.json();
    const parts: { text?: string; functionCall?: FunctionCall }[] = data?.candidates?.[0]?.content?.parts ?? [];
    const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall!);

    if (!calls.length) {
      return { text: parts.map((p) => p.text ?? "").join(""), shownSlugs };
    }

    contents.push({ role: "model", parts });
    const responseParts = [];
    for (const call of calls) {
      const { response, shownSlug } = await executeTool(call);
      if (shownSlug) shownSlugs.push(shownSlug);
      responseParts.push({ functionResponse: { name: call.name, response } });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return { text: "That took more steps than expected — try asking again.", shownSlugs };
}

export class GeminiProvider implements ChatProvider {
  readonly name = "gemini" as const;
  /** kept for back-compat with callers passing a single key explicitly */
  constructor(private apiKey?: string) {}

  async respond(messages: ChatMessage[]): Promise<ChatReply> {
    const tries = this.apiKey ? 1 : Math.max(1, poolSize());
    let lastErr: unknown;
    for (let i = 0; i < tries; i++) {
      const key = this.apiKey ?? nextGeminiKey();
      if (!key) break;
      try {
        const { text: raw, shownSlugs } = await callGemini(key, messages);
        return parseActions(raw, shownSlugs);
      } catch (e) {
        lastErr = e;
        const status = (e as Error & { status?: number }).status;
        if (!this.apiKey && (status === 429 || (status && status >= 500))) {
          reportGeminiKeyError(key);
          continue; // try next key in the pool
        }
        throw e;
      }
    }
    throw lastErr ?? new Error("Gemini: no API key configured");
  }
}

/** The system prompt asks the model to end with "ACTIONS: [label](path), …".
 * Pull those into real chips and strip them from the visible text, then
 * layer in real show_project navigations the model actually invoked (deduped
 * against the text-convention ones, capped at 3 total). */
function parseActions(raw: string, shownSlugs: string[]): ChatReply {
  const actions: ChatAction[] = [];
  const m = raw.match(/ACTIONS:\s*(.+)\s*$/i);
  let text = raw;
  if (m) {
    text = raw.slice(0, m.index).trim();
    const re = /\[([^\]]+)\]\(([^)]+)\)/g;
    let a: RegExpExecArray | null;
    while ((a = re.exec(m[1])) && actions.length < 3) {
      const target = a[2].trim();
      if (target.startsWith("/")) actions.push({ label: a[1].trim(), path: target });
      else if (target.startsWith("http")) actions.push({ label: a[1].trim(), href: target });
    }
  }
  for (const slug of shownSlugs) {
    if (actions.length >= 3) break;
    const path = `/projects/${slug}`;
    if (actions.some((a) => a.path === path)) continue;
    const p = seedBySlug(slug);
    actions.push({ label: p ? `Open ${p.name}` : "Open project", path });
  }
  return { text: text || raw, actions: actions.length ? actions : undefined, provider: "gemini" };
}
