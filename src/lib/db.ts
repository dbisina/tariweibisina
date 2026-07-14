import crypto from "crypto";
import type { Lead } from "@/lib/leads";

/**
 * Postgres persistence for leads (VISION.md). Env-gated and dependency-soft:
 *   - needs DATABASE_URL and the `pg` package (`npm i pg`).
 *   - if either is missing, every call is a safe no-op and the client-side
 *     Studio store remains the record. So the site runs today; flip on
 *     durable storage by setting DATABASE_URL and installing pg.
 *
 * `pg` is a literal `import("pg")` (not a variable specifier / webpackIgnore)
 * so Next's standalone-output file tracer actually bundles it — a dynamic
 * import with a computed specifier is invisible to the tracer and would
 * silently vanish from .next/standalone/node_modules in production, making
 * every DB call below fail closed with no error surfaced anywhere. It's
 * still soft: `pg` failing to resolve at runtime is caught below and treated
 * as "not installed," same no-op fallback as before.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
let poolPromise: Promise<any> | null = null;

async function getPool(): Promise<any | null> {
  if (!process.env.DATABASE_URL) return null;
  if (!poolPromise) {
    poolPromise = (async () => {
      try {
        const pg: any = await import("pg");
        const Pool = pg.Pool ?? pg.default?.Pool;
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
        });
        await pool.query(`
          create table if not exists leads (
            id text primary key,
            ts bigint not null,
            source text not null,
            name text not null,
            contact text not null,
            budget text,
            detail text not null,
            brief jsonb,
            channels jsonb
          );
          create table if not exists visits (
            id text primary key,
            ts bigint not null,
            path text not null,
            ref text
          );
          create table if not exists ad_config (
            id text primary key,
            config jsonb not null,
            updated_ts bigint not null
          );
        `);
        return pool;
      } catch (e) {
        console.error("db: pg unavailable, staying no-op:", e);
        return null;
      }
    })();
  }
  return poolPromise;
}

export async function saveLead(lead: Lead): Promise<boolean> {
  const pool = await getPool();
  if (!pool) return false;
  try {
    await pool.query(
      `insert into leads (id, ts, source, name, contact, budget, detail, brief, channels)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (id) do nothing`,
      [
        lead.id,
        lead.ts,
        lead.source,
        lead.name,
        lead.contact,
        lead.budget ?? null,
        lead.detail,
        lead.brief ? JSON.stringify(lead.brief) : null,
        lead.channels ? JSON.stringify(lead.channels) : null,
      ]
    );
    return true;
  } catch (e) {
    console.error("db: saveLead failed:", e);
    return false;
  }
}

/** Server-side pageview log (separate from the client Studio ring buffer) —
 * durable enough to power the weekly WhatsApp digest. Fire-and-forget by
 * design: a failed insert never breaks the page. */
export async function logVisit(path: string, ref: string): Promise<boolean> {
  const pool = await getPool();
  if (!pool) return false;
  try {
    await pool.query(`insert into visits (id, ts, path, ref) values ($1,$2,$3,$4)`, [
      crypto.randomUUID(),
      Date.now(),
      path,
      ref || null,
    ]);
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
  const pool = await getPool();
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  if (!pool) return { total: 0, since, topPaths: [], topRefs: [] };
  try {
    const { rows } = await pool.query(
      `select path, ref from visits where ts >= $1`,
      [since]
    );
    const paths = new Map<string, number>();
    const refs = new Map<string, number>();
    for (const r of rows as { path: string; ref: string | null }[]) {
      paths.set(r.path, (paths.get(r.path) ?? 0) + 1);
      const ref = r.ref || "direct";
      refs.set(ref, (refs.get(ref) ?? 0) + 1);
    }
    const top = (m: Map<string, number>, key: string) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, count]) => ({ [key]: k, count })) as never;
    return { total: rows.length, since, topPaths: top(paths, "path"), topRefs: top(refs, "ref") };
  } catch (e) {
    console.error("db: visitSummary failed:", e);
    return { total: 0, since, topPaths: [], topRefs: [] };
  }
}

const AD_CONFIG_ID = "default";

/** Server-authoritative override for the ad slot, set via the /adspot
 * WhatsApp command. Null when unset — the client Studio config (or its
 * localStorage edit) then applies as-is with no override. */
export async function getAdConfigRow(): Promise<Record<string, unknown> | null> {
  const pool = await getPool();
  if (!pool) return null;
  try {
    const { rows } = await pool.query(`select config from ad_config where id = $1`, [AD_CONFIG_ID]);
    return rows[0]?.config ?? null;
  } catch (e) {
    console.error("db: getAdConfigRow failed:", e);
    return null;
  }
}

export async function setAdConfigRow(patch: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const pool = await getPool();
  if (!pool) return null;
  try {
    const current = (await getAdConfigRow()) ?? {};
    const merged = { ...current, ...patch };
    await pool.query(
      `insert into ad_config (id, config, updated_ts) values ($1,$2,$3)
       on conflict (id) do update set config = $2, updated_ts = $3`,
      [AD_CONFIG_ID, JSON.stringify(merged), Date.now()]
    );
    return merged;
  } catch (e) {
    console.error("db: setAdConfigRow failed:", e);
    return null;
  }
}

export async function listLeads(limit = 200): Promise<Lead[]> {
  const pool = await getPool();
  if (!pool) return [];
  try {
    const { rows } = await pool.query(
      `select * from leads order by ts desc limit $1`,
      [limit]
    );
    return rows.map((r: any) => ({
      id: r.id,
      ts: Number(r.ts),
      source: r.source,
      name: r.name,
      contact: r.contact,
      budget: r.budget ?? undefined,
      detail: r.detail,
      brief: r.brief ?? undefined,
      channels: r.channels ?? undefined,
    }));
  } catch (e) {
    console.error("db: listLeads failed:", e);
    return [];
  }
}
