import { NextResponse } from "next/server";
import { executeTool } from "@/lib/ai/tools";

/**
 * Executes one of Rimuru's tools (get_project_details / show_project) on
 * behalf of the browser during a Live API session. The WebSocket connection
 * terminates in the browser (see rimuru.tsx), but the tools themselves
 * (GitHub fetches, project lookups) are server-only modules — this is the
 * bridge between the two. Same executeTool() the text-chat loop uses
 * (gemini-provider.ts), so both surfaces behave identically.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  let name: string, args: Record<string, unknown>;
  try {
    const body = await req.json();
    name = String(body?.name ?? "");
    args = (body?.args ?? {}) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const result = await executeTool({ name, args });
  return NextResponse.json(result);
}
