import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-IP rate limiting so bots/AI crawlers can hit the site freely without
 * being able to crash it. Fixed-window counters, bucketed per (ip, method,
 * route-tier, window). State is an in-memory Map — correct on Railway
 * specifically because the app runs as one long-lived Node process per
 * instance (not Vercel's per-request Edge isolation), so the Map persists
 * across requests within an instance. Multiple Railway replicas each keep
 * their own independent counters — acceptable: the goal is "no single
 * instance falls over," not perfectly fair global accounting.
 *
 * Tiers, generous → strict:
 *   - static assets: skipped entirely (bots need these, they're cheap)
 *   - GET everywhere else (pages, crawling): generous, crawlers burst
 *   - POST/PUT/PATCH to /api/*: stricter — these do real work (DB writes,
 *     external HTTP calls)
 *   - /api/chat POST: strictest — each call spends a Gemini API request
 */
const WINDOW_MS = 60_000;
const DEFAULT_MAX = 180; // generous GET/page budget per IP per minute
const API_WRITE_MAX = 30; // POST/PUT/PATCH under /api/*
const CHAT_MAX = 12; // /api/chat POST specifically

const STATIC_RE = /\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|mjs|map|woff2?|ttf|txt|xml|json)$/i;

function limitFor(pathname: string, method: string): number {
  if (pathname === "/api/chat" && method === "POST") return CHAT_MAX;
  if (pathname.startsWith("/api/") && method !== "GET" && method !== "HEAD") return API_WRITE_MAX;
  return DEFAULT_MAX;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

interface Bucket {
  count: number;
  windowStart: number;
}
const buckets = new Map<string, Bucket>();
const MAX_TRACKED_IPS = 20_000; // hard cap so a rotating-IP flood can't grow the Map unbounded

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    STATIC_RE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const ip = clientIp(req);
  const key = `${ip}:${pathname === "/api/chat" ? "chat" : pathname.startsWith("/api/") ? "api" : "page"}`;
  const max = limitFor(pathname, req.method);

  if (buckets.size > MAX_TRACKED_IPS) {
    for (const [k, b] of buckets) if (b.windowStart !== windowStart) buckets.delete(k);
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.windowStart !== windowStart) {
    bucket = { count: 0, windowStart };
    buckets.set(key, bucket);
  }
  bucket.count++;

  if (bucket.count > max) {
    const retryAfter = Math.max(1, Math.ceil((windowStart + WINDOW_MS - now) / 1000));
    return new NextResponse("Too many requests — slow down and try again shortly.", {
      status: 429,
      headers: { "Retry-After": String(retryAfter), "Content-Type": "text/plain" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
