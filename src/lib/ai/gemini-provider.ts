import type { ChatAction, ChatMessage, ChatProvider, ChatReply, ProjectCard } from "./types";
import { systemPrompt } from "./knowledge";
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
// the taught flow is get_project_details → get_repo_doc → answer, and a
// comparison question doubles that — 3 rounds made the failure string a
// normal path instead of a pathological one
const MAX_TOOL_ROUNDS = 5;

interface GenReply {
  text: string;
  cards: ProjectCard[];
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

  const cards: ProjectCard[] = [];

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
      return { text: parts.map((p) => p.text ?? "").join(""), cards };
    }

    contents.push({ role: "model", parts });
    const responseParts = [];
    for (const call of calls) {
      const { response, card } = await executeTool(call);
      if (card && !cards.some((c) => c.slug === card.slug)) cards.push(card);
      responseParts.push({ functionResponse: { name: call.name, response } });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return { text: "That took more steps than expected — try asking again.", cards };
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
        const { text: raw, cards } = await callGemini(key, messages);
        return parseActions(raw, cards);
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
 * Pull those into real chips and strip them from the visible text. Projects
 * the model surfaced via show_project arrive as rich cards instead —
 * skip duplicating them as text chips. */
function parseActions(raw: string, cards: ProjectCard[]): ChatReply {
  const actions: ChatAction[] = [];
  const m = raw.match(/ACTIONS:\s*(.+)\s*$/i);
  let text = raw;
  if (m) {
    text = raw.slice(0, m.index).trim();
    const re = /\[([^\]]+)\]\(([^)]+)\)/g;
    let a: RegExpExecArray | null;
    while ((a = re.exec(m[1])) && actions.length < 3) {
      const target = a[2].trim();
      if (cards.some((c) => c.path === target)) continue; // already a card
      if (target.startsWith("/")) actions.push({ label: a[1].trim(), path: target });
      else if (target.startsWith("http")) actions.push({ label: a[1].trim(), href: target });
    }
  }
  return {
    text: text || raw,
    actions: actions.length ? actions : undefined,
    cards: cards.length ? cards.slice(0, 4) : undefined,
    provider: "gemini",
  };
}
