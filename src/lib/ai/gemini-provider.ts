import type { ChatAction, ChatMessage, ChatProvider, ChatReply } from "./types";
import { systemPrompt } from "./knowledge";

/**
 * Gemini adapter. Uses the REST generateContent endpoint (works without the
 * SDK, so no version coupling — see the SDK-shape flag in VISION.md).
 * gemini-3.5-flash is the site assistant model (VISION.md). Everything
 * Gemini-specific lives here; swapping providers means writing a sibling
 * file, not touching the assistant.
 */
const MODEL = "gemini-3.5-flash";

export class GeminiProvider implements ChatProvider {
  readonly name = "gemini" as const;
  constructor(private apiKey: string) {}

  async respond(messages: ChatMessage[]): Promise<ChatReply> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${this.apiKey}`;
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
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const raw: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";

    return parseActions(raw);
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
