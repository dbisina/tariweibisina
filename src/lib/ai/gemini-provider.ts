import type { ChatAction, ChatMessage, ChatProvider, ChatReply } from "./types";
import { systemPrompt } from "./knowledge";
import { nextGeminiKey, poolSize, reportGeminiKeyError } from "./key-pool";

/**
 * Gemini adapter. Uses the REST generateContent endpoint (works without the
 * SDK, so no version coupling — see the SDK-shape flag in VISION.md).
 * gemini-3.5-flash is the site assistant model (VISION.md). Everything
 * Gemini-specific lives here; swapping providers means writing a sibling
 * file, not touching the assistant.
 *
 * Keys come from the round-robin pool (key-pool.ts) so a single 429/5xx
 * fails over to the next configured key instead of surfacing an error.
 */
const MODEL = "gemini-3.5-flash";

async function callGemini(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt() }] },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
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
  return (
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""
  );
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
        const raw = await callGemini(key, messages);
        return parseActions(raw);
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
 * Pull those into real chips and strip them from the visible text. */
function parseActions(raw: string): ChatReply {
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
  return { text: text || raw, actions: actions.length ? actions : undefined, provider: "gemini" };
}
