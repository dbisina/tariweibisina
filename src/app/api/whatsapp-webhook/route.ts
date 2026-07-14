import { NextResponse } from "next/server";
import { handleCommand } from "@/lib/whatsapp-bot";
import { sendWhatsApp } from "@/lib/notify";

/**
 * Inbound webhook for the open-wa EASY API (https://www.open-wa.org/#quickstart).
 * Run open-wa as its own process pointed at this URL, e.g.:
 *
 *   npx @open-wa/wa-automate --port 8082 --key $OPENWA_API_KEY \
 *     --webhook "https://<site>/api/whatsapp-webhook?secret=$OPENWA_WEBHOOK_SECRET"
 *
 * open-wa POSTs every inbound message event here. This is deliberately a
 * private control channel, not a public bot: only messages from OPENWA_TO
 * (Daniel's own number) are acted on; everything else is silently 200'd so
 * open-wa doesn't retry.
 */
export const runtime = "nodejs";

interface OpenWaMessage {
  body?: string;
  text?: string;
  from?: string;
  chatId?: string;
  sender?: { id?: string };
  isGroupMsg?: boolean;
}

function verifySecret(req: Request): boolean {
  const expected = process.env.OPENWA_WEBHOOK_SECRET;
  if (!expected) return true; // no secret configured — open (dev convenience, document the risk)
  const url = new URL(req.url);
  const got = req.headers.get("x-webhook-secret") ?? url.searchParams.get("secret");
  return got === expected;
}

export async function POST(req: Request) {
  if (!verifySecret(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let msg: OpenWaMessage;
  try {
    msg = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const from = msg.from ?? msg.chatId ?? msg.sender?.id ?? "";
  const body = msg.body ?? msg.text ?? "";
  const admin = process.env.OPENWA_TO;

  // Only Daniel's own number can drive the bot; group chats and everyone
  // else are ignored (still 200, so open-wa doesn't retry the webhook).
  if (msg.isGroupMsg || !admin || from !== admin || !body) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const reply = await handleCommand(body);
  if (reply) await sendWhatsApp(reply, from);

  return NextResponse.json({ ok: true });
}
