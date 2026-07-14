import type { ChatProvider } from "./types";
import { LocalProvider } from "./local-provider";
import { GeminiProvider } from "./gemini-provider";

export type ProviderPref = "auto" | "gemini" | "local";

/** Live default is Gemini when GEMINI_API_KEY is set; otherwise the local
 * keyword fallback keeps the assistant working out of the box. The Studio's
 * AI setting can force a provider: "local" always uses the built-in guide,
 * "gemini" requires the key (falls back to local if absent). To add
 * Claude / GPT / DeepSeek, drop a sibling adapter and branch here. */
export function getProvider(pref: ProviderPref = "auto"): ChatProvider {
  if (pref === "local") return new LocalProvider();
  const key = process.env.GEMINI_API_KEY;
  if (key) return new GeminiProvider(key);
  return new LocalProvider();
}

export * from "./types";
