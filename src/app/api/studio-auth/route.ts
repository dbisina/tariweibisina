import { NextResponse } from "next/server";
import { verifyPassword, hasValidSession, sessionCookieHeader, clearCookieHeader } from "@/lib/studio-auth";

/**
 * Real Studio login — the password is checked against STUDIO_ADMIN_KEY on
 * the server only and never reaches the client bundle. See lib/studio-auth.ts.
 */
export const runtime = "nodejs";

export async function GET(req: Request) {
  return NextResponse.json({ authed: hasValidSession(req) });
}

export async function POST(req: Request) {
  let key: string;
  try {
    const body = await req.json();
    key = String(body?.key ?? "");
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!key || !verifyPassword(key)) {
    return NextResponse.json({ error: "wrong key" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", sessionCookieHeader());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearCookieHeader());
  return res;
}
