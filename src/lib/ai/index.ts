import type { ChatProvider } from "./types";
import { LocalProvider } from "./local-provider";
import { GeminiProvider } from "./gemini-provider";
import { hasGeminiKeys } from "./key-pool";

export type ProviderPref = "auto" | "gemini" | "local";

/** Live default is Gemini when GEMINI_API_KEY(S) is set; otherwise the local
 * keyword fallback keeps the assistant working out of the box. The Studio's
 * AI setting can force a provider: "local" always uses the built-in guide,
 * "gemini" requires a key (falls back to local if absent). GeminiProvider
 * pulls from the round-robin key pool (key-pool.ts) when constructed with no
 * explicit key. To add Claude / GPT / DeepSeek, drop a sibling adapter and
 * branch here. */
export function getProvider(pref: ProviderPref = "auto"): ChatProvider {
  if (pref === "local") return new LocalProvider();
  if (hasGeminiKeys()) return new GeminiProvider();
  return new LocalProvider();
}

export * from "./types";
