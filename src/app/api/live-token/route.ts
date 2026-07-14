import { NextResponse } from "next/server";
import { GoogleGenAI, Modality, type ToolListUnion } from "@google/genai";
import { nextGeminiKey } from "@/lib/ai/key-pool";
import { systemPrompt } from "@/lib/ai/knowledge";
import { TOOLS } from "@/lib/ai/tools";

// TOOLS is written as plain JSON-schema (lowercase "object"/"string" types)
// because it's shared with gemini-provider.ts's raw REST fetch() call, which
// takes those over the wire as-is. The SDK used here wants its own strict
// `Type`/`Modality` enums instead of raw strings — same JSON on the wire
// either way, so this cast is safe, not a behavior difference.
const SDK_TOOLS = TOOLS as unknown as ToolListUnion;

/**
 * Mints a short-lived Gemini Live API token so the browser can open the
 * WebSocket directly (wss://generativelanguage.googleapis.com/...) without
 * ever seeing the real API key — see
 * https://ai.google.dev/gemini-api/docs/ephemeral-tokens. The token is
 * locked to our model/system-instruction/tools via `liveConnectConstraints`
 * so a visitor can't repurpose it into a general-purpose Gemini session, and
 * is single-use with a short window (this endpoint gets called fresh every
 * time Rimuru's "Go Live" button is pressed).
 */
export const runtime = "nodejs";

const MODEL = "gemini-3.1-flash-live-preview";

export async function POST() {
  const apiKey = nextGeminiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Live voice isn't configured (no Gemini API key set)." }, { status: 501 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey, apiVersion: "v1alpha" });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: { parts: [{ text: systemPrompt() }] },
            tools: SDK_TOOLS,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
      },
    });
    if (!token.name) throw new Error("no token returned");
    return NextResponse.json({ token: token.name, model: MODEL });
  } catch (e) {
    console.error("live-token: mint failed:", e);
    return NextResponse.json({ error: "Couldn't start a live session — try again in a moment." }, { status: 502 });
  }
}
