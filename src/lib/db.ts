import type { Lead } from "@/lib/leads";

/**
 * Postgres persistence for leads (VISION.md). Env-gated and dependency-soft:
 *   - needs DATABASE_URL and the `pg` package (`npm i pg`).
 *   - if either is missing, every call is a safe no-op and the client-side
 *     Studio store remains the record. So the site runs today; flip on
 *     durable storage by setting DATABASE_URL and installing pg.
 *
 * `pg` is imported through a variable specifier on purpose, so the build does
 * not hard-depend on it being installed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
let poolPromise: Promise<any> | null = null;

async function getPool(): Promise<any | null> {
  if (!process.env.DATABASE_URL) return null;
  if (!poolPromise) {
    poolPromise = (async () => {
      try {
        const pkg = "pg";
        const pg: any = await import(/* webpackIgnore: true */ pkg);
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
