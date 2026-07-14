import crypto from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import type { ChannelResult, Lead, LeadSource, StructuredBrief } from "@/lib/leads";

/**
 * Postgres persistence via Prisma (v7, driver-adapter based — see
 * prisma.config.ts for the connection URL and prisma/schema.prisma for the
 * 4 models this owns). Env-gated: every function below is a no-op returning
 * a safe default when DATABASE_URL is unset, so the site runs today and
 * durable storage flips on the moment it's set.
 *
 * The client is a module-level singleton stashed on `globalThis` so dev's
 * hot-reload doesn't spawn a new connection pool on every edit.
 *
 * The generated client (src/generated/prisma/client.ts) ships with a
 * `@ts-nocheck` on the new "prisma-client" generator, which loses real
 * generic typing on the constructed instance — query results below type as
 * `any`, same as the old hand-rolled `pg` version of this file did on
 * purpose. Runtime shape is still correct (verified via the actual schema);
 * this is a types-only gap in a very new generator, not a behavior gap.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}

export async function saveLead(lead: Lead): Promise<boolean> {
  const prisma = getClient();
  if (!prisma) return false;
  try {
    await prisma.lead.upsert({
      where: { id: lead.id },
      create: {
        id: lead.id,
        ts: BigInt(lead.ts),
        source: lead.source,
        name: lead.name,
        contact: lead.contact,
        budget: lead.budget ?? null,
        detail: lead.detail,
        brief: (lead.brief as unknown as Prisma.InputJsonValue) ?? undefined,
        channels: (lead.channels as unknown as Prisma.InputJsonValue) ?? undefined,
      },
      update: {}, // id already exists — leave the original record alone
    });
    return true;
  } catch (e) {
    console.error("db: saveLead failed:", e);
    return false;
  }
}

export async function listLeads(limit = 200): Promise<Lead[]> {
  const prisma = getClient();
  if (!prisma) return [];
  try {
    const rows = await prisma.lead.findMany({ orderBy: { ts: "desc" }, take: limit });
    return rows.map((r: any) => ({
      id: r.id,
      ts: Number(r.ts),
      source: r.source as LeadSource,
      name: r.name,
      contact: r.contact,
      budget: r.budget ?? undefined,
      detail: r.detail,
      brief: (r.brief as StructuredBrief | null) ?? undefined,
      channels: (r.channels as ChannelResult | null) ?? undefined,
    }));
  } catch (e) {
    console.error("db: listLeads failed:", e);
    return [];
  }
}

/** Server-side pageview log (separate from the client Studio ring buffer) —
 * durable enough to power the weekly WhatsApp digest. Fire-and-forget by
 * design: a failed insert never breaks the page. */
export async function logVisit(path: string, ref: string): Promise<boolean> {
  const prisma = getClient();
  if (!prisma) return false;
  try {
    await prisma.visit.create({
      data: { id: crypto.randomUUID(), ts: BigInt(Date.now()), path, ref: ref || null },
    });
    return true;
  } catch (e) {
    console.error("db: logVisit failed:", e);
    return false;
  }
}

export interface VisitSummary {
  total: number;
  since: number;
  topPaths: { path: string; count: number }[];
  topRefs: { ref: string; count: number }[];
}

/** Aggregate visits over the last `days` days, for the weekly digest / /visits command. */
export async function visitSummary(days = 7): Promise<VisitSummary> {
  const prisma = getClient();
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  if (!prisma) return { total: 0, since, topPaths: [], topRefs: [] };
  try {
    const sinceTs = BigInt(since);
    const [total, byPath, byRef] = await Promise.all([
      prisma.visit.count({ where: { ts: { gte: sinceTs } } }),
      prisma.visit.groupBy({
        by: ["path"],
        where: { ts: { gte: sinceTs } },
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 5,
      }),
      prisma.visit.groupBy({
        by: ["ref"],
        where: { ts: { gte: sinceTs } },
        _count: { ref: true },
        orderBy: { _count: { ref: "desc" } },
        take: 5,
      }),
    ]);
    return {
      total,
      since,
      topPaths: byPath.map((p: any) => ({ path: p.path, count: p._count.path })),
      topRefs: byRef.map((r: any) => ({ ref: r.ref || "direct", count: r._count.ref })),
    };
  } catch (e) {
    console.error("db: visitSummary failed:", e);
    return { total: 0, since, topPaths: [], topRefs: [] };
  }
}

const AD_CONFIG_ID = "default";

/** Small server-authoritative override for the ad slot, set via the /adspot
 * WhatsApp command — layered on top of whatever StudioConfig.content.ad
 * currently is (see studio-apply.tsx). Null when unset. */
export async function getAdConfigRow(): Promise<Record<string, unknown> | null> {
  const prisma = getClient();
  if (!prisma) return null;
  try {
    const row = await prisma.adConfig.findUnique({ where: { id: AD_CONFIG_ID } });
    return (row?.config as Record<string, unknown>) ?? null;
  } catch (e) {
    console.error("db: getAdConfigRow failed:", e);
    return null;
  }
}

export async function setAdConfigRow(
  patch: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  const prisma = getClient();
  if (!prisma) return null;
  try {
    const current = (await getAdConfigRow()) ?? {};
    const merged = { ...current, ...patch };
    await prisma.adConfig.upsert({
      where: { id: AD_CONFIG_ID },
      create: { id: AD_CONFIG_ID, config: merged as Prisma.InputJsonValue, updatedTs: BigInt(Date.now()) },
      update: { config: merged as Prisma.InputJsonValue, updatedTs: BigInt(Date.now()) },
    });
    return merged;
  } catch (e) {
    console.error("db: setAdConfigRow failed:", e);
    return null;
  }
}

const STUDIO_CONFIG_ID = "default";

/** The whole Studio CMS document (StudioConfig from lib/studio.ts), published
 * as one unit from /studio's Publish button. This — not localStorage — is
 * the source of truth the live site hydrates from (see studio-apply.tsx). */
export async function getStudioConfigRow(): Promise<Record<string, unknown> | null> {
  const prisma = getClient();
  if (!prisma) return null;
  try {
    const row = await prisma.studioConfig.findUnique({ where: { id: STUDIO_CONFIG_ID } });
    return (row?.config as Record<string, unknown>) ?? null;
  } catch (e) {
    console.error("db: getStudioConfigRow failed:", e);
    return null;
  }
}

// ── Repo knowledge packs ("graphify" — see lib/ai/repo-indexer.ts) ─────────

export interface RepoDoc {
  title: string;
  content: string;
}

export interface RepoIndexRow {
  slug: string;
  repoUrl: string;
  status: "pending" | "indexing" | "ready" | "error";
  error: string | null;
  docs: RepoDoc[];
  updatedTs: number;
}

export async function getRepoIndexRow(slug: string): Promise<RepoIndexRow | null> {
  const prisma = getClient();
  if (!prisma) return null;
  try {
    const row = await prisma.repoIndex.findUnique({ where: { id: slug } });
    if (!row) return null;
    return {
      slug: row.id,
      repoUrl: row.repoUrl,
      status: row.status as RepoIndexRow["status"],
      error: row.error ?? null,
      docs: (row.docs as unknown as RepoDoc[]) ?? [],
      updatedTs: Number(row.updatedTs),
    };
  } catch (e) {
    console.error("db: getRepoIndexRow failed:", e);
    return null;
  }
}

export async function setRepoIndexRow(
  slug: string,
  patch: { repoUrl: string; status: RepoIndexRow["status"]; error?: string | null; docs?: RepoDoc[] }
): Promise<boolean> {
  const prisma = getClient();
  if (!prisma) return false;
  try {
    const data = {
      repoUrl: patch.repoUrl,
      status: patch.status,
      error: patch.error ?? null,
      docs: (patch.docs ?? []) as unknown as Prisma.InputJsonValue,
      updatedTs: BigInt(Date.now()),
    };
    await prisma.repoIndex.upsert({
      where: { id: slug },
      create: { id: slug, ...data },
      update: data,
    });
    return true;
  } catch (e) {
    console.error("db: setRepoIndexRow failed:", e);
    return false;
  }
}

/** Full replace, not a patch — Publish always pushes the entire current
 * config, matching the "explicit publish" model (no debounced/partial
 * writes racing each other from multiple open Studio tabs). */
export async function setStudioConfigRow(config: Record<string, unknown>): Promise<boolean> {
  const prisma = getClient();
  if (!prisma) return false;
  try {
    await prisma.studioConfig.upsert({
      where: { id: STUDIO_CONFIG_ID },
      create: { id: STUDIO_CONFIG_ID, config: config as Prisma.InputJsonValue, updatedTs: BigInt(Date.now()) },
      update: { config: config as Prisma.InputJsonValue, updatedTs: BigInt(Date.now()) },
    });
    return true;
  } catch (e) {
    console.error("db: setStudioConfigRow failed:", e);
    return false;
  }
}
