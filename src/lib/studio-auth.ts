import crypto from "crypto";

/**
 * Server-verified Studio auth. Replaces the old client-side gate (a
 * hardcoded string compared in the browser — readable straight out of the
 * JS bundle) with a real check: the password is compared against
 * STUDIO_ADMIN_KEY server-side only, and a session is an httpOnly cookie
 * holding a token *derived* from that secret (HMAC), never the secret
 * itself — so it can't be read by client JS and isn't a raw copy of the key
 * even if the cookie leaked.
 *
 * Falls back to a fixed dev password when STUDIO_ADMIN_KEY is unset, same
 * "gracefully degrades locally, real once configured" pattern as every
 * other env-gated integration in this app (see lib/db.ts).
 */
export const SESSION_COOKIE = "studio_session";
const DEV_FALLBACK_KEY = "tariwei";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** null = auth is impossible (prod with no key configured) — every check
 * fails closed. The dev fallback is dev-only on purpose: it's a constant
 * that lives in source, and the session token is a deterministic HMAC of
 * it, so allowing it in production would make the admin cookie publicly
 * computable the moment a deploy forgets the env var. */
function adminKey(): string | null {
  if (process.env.STUDIO_ADMIN_KEY) return process.env.STUDIO_ADMIN_KEY;
  return process.env.NODE_ENV === "production" ? null : DEV_FALLBACK_KEY;
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** The password Daniel types into the /studio gate. */
export function verifyPassword(candidate: string): boolean {
  const key = adminKey();
  return !!key && timingSafeEqual(candidate, key);
}

/** Deterministic session token derived from the secret — never the secret
 * itself. Null when auth is disabled (prod, no key). */
function sessionToken(): string | null {
  const key = adminKey();
  if (!key) return null;
  return crypto.createHmac("sha256", key).update("studio-session").digest("hex");
}

function cookieValue(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

/** True if this request carries a valid Studio session cookie. */
export function hasValidSession(req: Request): boolean {
  const token = sessionToken();
  if (!token) return false;
  const cookie = cookieValue(req, SESSION_COOKIE);
  return !!cookie && timingSafeEqual(cookie, token);
}

/** True if this request is authorized either way: a browser session cookie
 * (the Studio UI) or the raw `x-studio-key` header (scripts/bots/curl —
 * only valid when STUDIO_ADMIN_KEY is actually set server-side). */
export function isStudioAuthed(req: Request): boolean {
  if (hasValidSession(req)) return true;
  const need = process.env.STUDIO_ADMIN_KEY;
  if (!need) return false;
  const got = req.headers.get("x-studio-key");
  return !!got && timingSafeEqual(got, need);
}

export function sessionCookieHeader(): string | null {
  const token = sessionToken();
  if (!token) return null;
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearCookieHeader(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
