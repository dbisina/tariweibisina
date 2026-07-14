/**
 * Round-robin pool over multiple Gemini API keys, so 429/quota errors on one
 * key fail over to the next instead of degrading straight to the local
 * provider. Configure via GEMINI_API_KEYS (comma/newline separated, up to
 * ~15 keys); GEMINI_API_KEY (singular) still works as a one-key pool.
 *
 * State is in-memory per Node process — correct on a persistent server
 * (`next start`), best-effort on serverless (each cold start re-parses env
 * and starts back at index 0, which is fine since the goal is just spreading
 * load / dodging a rate-limited key, not exact fairness).
 */

const COOLDOWN_MS = 60_000;

interface KeyState {
  key: string;
  coolUntil: number;
}

let pool: KeyState[] | null = null;
let cursor = 0;

function loadPool(): KeyState[] {
  const list = process.env.GEMINI_API_KEYS;
  const raw = list
    ? list.split(/[,\n]/).map((k) => k.trim()).filter(Boolean)
    : process.env.GEMINI_API_KEY
      ? [process.env.GEMINI_API_KEY.trim()]
      : [];
  return raw.map((key) => ({ key, coolUntil: 0 }));
}

function getPool(): KeyState[] {
  if (!pool) pool = loadPool();
  return pool;
}

export function hasGeminiKeys(): boolean {
  return getPool().length > 0;
}

export function poolSize(): number {
  return getPool().length;
}

/** Next key to try, skipping ones still in cooldown from a recent failure. */
export function nextGeminiKey(): string | null {
  const p = getPool();
  if (!p.length) return null;
  const now = Date.now();
  for (let i = 0; i < p.length; i++) {
    const idx = (cursor + i) % p.length;
    if (p[idx].coolUntil <= now) {
      cursor = (idx + 1) % p.length;
      return p[idx].key;
    }
  }
  // everyone's cooling down — hand back the least-recently-cooled key anyway
  const soonest = p.reduce((a, b) => (a.coolUntil <= b.coolUntil ? a : b));
  return soonest.key;
}

/** Mark a key as rate-limited/erroring so the pool skips it for COOLDOWN_MS. */
export function reportGeminiKeyError(key: string): void {
  const p = getPool();
  const entry = p.find((k) => k.key === key);
  if (entry) entry.coolUntil = Date.now() + COOLDOWN_MS;
}
