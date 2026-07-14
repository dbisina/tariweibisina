import { NextResponse } from "next/server";
import { isStudioAuthed } from "@/lib/studio-auth";
import { getRepoIndexRow } from "@/lib/db";
import { graphifyRepo } from "@/lib/ai/repo-indexer";

/**
 * Graphify control surface for the Studio. POST kicks off a background
 * index of a project's GitHub repo (see lib/ai/repo-indexer.ts) and returns
 * immediately; GET polls its status. The Studio sends the repoUrl it has
 * in-hand (which may be edited-but-unpublished) rather than us reading a
 * possibly-stale published config. Runs on the persistent Railway server,
 * so the fire-and-forget promise outlives the request.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isStudioAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: "Graphify needs DATABASE_URL set — the knowledge pack lives in Postgres." }, { status: 501 });

  let slug: string, repoUrl: string;
  try {
    const body = await req.json();
    slug = String(body?.slug ?? "").trim();
    repoUrl = String(body?.repoUrl ?? "").trim();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!slug || !repoUrl) return NextResponse.json({ error: "slug and repoUrl required" }, { status: 400 });

  // fire and forget — status lands in the DB, the Studio polls GET below
  graphifyRepo(slug, repoUrl).catch((e) => console.error("repo-index: background graphify crashed:", e));
  return NextResponse.json({ ok: true, status: "indexing" });
}

export async function GET(req: Request) {
  if (!isStudioAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug")?.trim();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const row = await getRepoIndexRow(slug);
  if (!row) return NextResponse.json({ status: "none" });
  return NextResponse.json({
    status: row.status,
    error: row.error,
    docTitles: row.docs.map((d) => d.title),
    updatedTs: row.updatedTs,
  });
}
