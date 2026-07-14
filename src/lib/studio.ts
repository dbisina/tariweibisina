"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Realm } from "@/lib/store";
import { SEED_PROJECTS, type ProjectDoc } from "@/lib/content";
import type { Lead } from "@/lib/leads";

export type { Lead } from "@/lib/leads";

/**
 * The Studio store is the site's CMS. Every editable surface — theme tokens,
 * hero/about copy, the ad spot, nav, the project roster — lives here and is
 * read by the live site, so an edit in /studio is reflected immediately.
 *
 * Persistence is localStorage for now (key `tariwei-studio`). The store is the
 * single seam to a real backend later: swap the `persist` storage for a fetch
 * layer and nothing else in the app changes. Analytics + leads are captured
 * client-side into a capped ring buffer — enough for the dashboard and a real
 * "who visited / who reached out" view without a server.
 */

export interface ThemeTokens {
  bg: string;
  ink: string;
  mut: string;
  ln: string;
  acc: string;
  acc2: string;
}

export interface SubLink {
  label: string;
  path: string;
}
export interface NavItem {
  label: string;
  path: string;
  sub?: SubLink[];
}

export interface AdSpot {
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  enabled: boolean;
}

export interface PageView {
  id: string;
  path: string;
  ts: number;
  ref: string;
}

export interface StudioConfig {
  appearance: {
    dark: ThemeTokens;
    light: ThemeTokens;
    radius: number; // px, drives card rounding token
    motion: "full" | "reduced" | "off";
  };
  content: {
    heroTop: string;
    heroName: string;
    aboutLede: string;
    ad: AdSpot;
  };
  nav: NavItem[];
  projects: ProjectDoc[];
  ai: { provider: "auto" | "gemini" | "local" };
  /** Sent as `x-studio-key` on GET /api/lead. Only needed if the server has
   * STUDIO_ADMIN_KEY set; otherwise the endpoint is open. */
  adminKey: string;
}

// ── Defaults ──────────────────────────────────────────────────────────────
// These mirror the values baked into the site today, so an unedited Studio is
// a faithful no-op and "Reset" always returns to the shipped look.

export const DEFAULT_TOKENS: Record<Realm, ThemeTokens> = {
  dark: {
    bg: "#0b0b0c",
    ink: "#f4f3ef",
    mut: "#8b8a84",
    ln: "rgba(244, 243, 239, 0.13)",
    acc: "#ff5a2c",
    acc2: "#ff4a1c",
  },
  light: {
    bg: "#f3f1eb",
    ink: "#131316",
    mut: "#6f6e68",
    ln: "rgba(19, 19, 22, 0.12)",
    acc: "#e8430f",
    acc2: "#ff5a2c",
  },
};

const DEFAULT_NAV: NavItem[] = [
  { label: "Home", path: "/" },
  {
    label: "Engineer",
    path: "/engineer",
    sub: [
      { label: "Projects", path: "/engineer/projects" },
      { label: "Research", path: "/engineer/research" },
      { label: "Hackathons", path: "/engineer/hackathons" },
    ],
  },
  {
    label: "Business",
    path: "/business",
    sub: [
      { label: "Projects", path: "/business/projects" },
      { label: "Pitch Decks", path: "/business/pitch-decks" },
      { label: "Hire Me", path: "/business/hire-me" },
    ],
  },
  { label: "Catalog", path: "/catalog" },
  { label: "Contact", path: "/contact" },
];

function defaultProjects(): ProjectDoc[] {
  // deep clone so store mutations never touch the frozen seed
  return JSON.parse(JSON.stringify(SEED_PROJECTS)) as ProjectDoc[];
}

export function defaultConfig(): StudioConfig {
  return {
    appearance: {
      dark: { ...DEFAULT_TOKENS.dark },
      light: { ...DEFAULT_TOKENS.light },
      radius: 16,
      motion: "full",
    },
    content: {
      heroTop: "From the metal to the pixel.",
      heroName: "Daniel Tariwei Bisina",
      aboutLede:
        "One engineer, the whole stack — from GPU kernels to production products.",
      ad: {
        headline: "Your brand, in good company.",
        body: "A single, tasteful placement seen by engineers, founders and investors who visit this site.",
        ctaLabel: "Enquire about sponsorship",
        ctaHref: "/contact?topic=sponsorship",
        enabled: true,
      },
    },
    nav: DEFAULT_NAV,
    projects: defaultProjects(),
    ai: { provider: "auto" },
    adminKey: "",
  };
}

// ── Store ─────────────────────────────────────────────────────────────────

const RING = 500; // cap for analytics/leads so localStorage never bloats

// Non-crypto id; fine for client-side event keys.
function rid(): string {
  return Math.abs((Math.random() * 1e9) | 0).toString(36) + (Date.now() % 1e6).toString(36);
}

export type PublishState = "idle" | "publishing" | "success" | "error";

interface StudioState {
  config: StudioConfig;
  views: PageView[];
  leads: Lead[];
  unlocked: boolean;
  publishState: PublishState;
  publishedAt: number | null;
  setConfig: (fn: (c: StudioConfig) => StudioConfig) => void;
  resetConfig: () => void;
  resetProjects: () => void;
  logView: (path: string, ref: string) => void;
  logLead: (lead: Omit<Lead, "id" | "ts">) => void;
  clearAnalytics: () => void;
  unlock: () => void;
  lock: () => void;
  publish: () => Promise<boolean>;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      config: defaultConfig(),
      views: [],
      leads: [],
      unlocked: false,
      publishState: "idle",
      publishedAt: null,
      setConfig: (fn) => set((s) => ({ config: fn(s.config) })),
      resetConfig: () => set({ config: defaultConfig() }),
      resetProjects: () =>
        set((s) => ({ config: { ...s.config, projects: defaultProjects() } })),
      logView: (path, ref) =>
        set((s) => {
          const last = s.views[s.views.length - 1];
          // de-dupe rapid same-path re-fires (StrictMode double-mount, HMR)
          if (last && last.path === path && Date.now() - last.ts < 1200) return s;
          const v: PageView = { id: rid(), path, ts: Date.now(), ref };
          return { views: [...s.views, v].slice(-RING) };
        }),
      logLead: (lead) =>
        set((s) => ({
          leads: [...s.leads, { ...lead, id: rid(), ts: Date.now() }].slice(-RING),
        })),
      clearAnalytics: () => set({ views: [], leads: [] }),
      unlock: () => set({ unlocked: true }),
      lock: () => set({ unlocked: false }),
      /** Pushes the whole current config to Postgres (POST /api/studio-config)
       * in one write — the explicit "Publish" action, not a live/debounced
       * autosave. This is what makes a Studio edit visible on every device,
       * not just the browser that made it (see studio-apply.tsx's hydration). */
      publish: async () => {
        set({ publishState: "publishing" });
        try {
          const { config } = get();
          const res = await fetch("/api/studio-config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(config.adminKey ? { "x-studio-key": config.adminKey } : {}),
            },
            body: JSON.stringify(config),
          });
          const ok = res.ok && (await res.json())?.ok !== false;
          set({ publishState: ok ? "success" : "error", publishedAt: ok ? Date.now() : get().publishedAt });
          return ok;
        } catch {
          set({ publishState: "error" });
          return false;
        }
      },
    }),
    {
      name: "tariwei-studio",
      // v3: the project roster and its shape (added `kind`, all-new real
      // slugs from the portfolio-authoring pass) changed again after v2
      // shipped. Without a version bump, a browser holding a v2-persisted
      // store never re-migrates — `merge` below then overwrites the fresh
      // seed with the stale persisted `projects` array (old slugs, no
      // `kind`), so anything keyed on `kind` (e.g. /engineer/hackathons)
      // silently renders empty after hydration replaces the SSR seed.
      version: 3,
      migrate: (persisted: unknown) => {
        const s = (persisted ?? {}) as StudioState;
        if (s.config) s.config = { ...s.config, projects: defaultProjects() };
        return s;
      },
      // Backfills any config keys added after a user's last visit (e.g.
      // `adminKey`) so persisted state from an older shipped version never
      // ends up missing a field — additive config changes shouldn't need a
      // version bump every time.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StudioState>;
        return { ...current, ...p, config: { ...current.config, ...p.config } };
      },
    }
  )
);

// ── Derived helpers for the dashboard ───────────────────────────────────────

export function tokensToCssVars(t: ThemeTokens): Record<string, string> {
  return {
    "--bg": t.bg,
    "--ink": t.ink,
    "--mut": t.mut,
    "--ln": t.ln,
    "--acc": t.acc,
    "--acc-2": t.acc2,
  };
}

export interface AnalyticsSummary {
  total: number;
  unique: number; // distinct sessions is unavailable client-side; approximate by day-buckets
  topPaths: { path: string; count: number }[];
  topRefs: { ref: string; count: number }[];
  perDay: { day: string; count: number }[];
}

export function summarize(views: PageView[]): AnalyticsSummary {
  const paths = new Map<string, number>();
  const refs = new Map<string, number>();
  const days = new Map<string, number>();
  for (const v of views) {
    paths.set(v.path, (paths.get(v.path) ?? 0) + 1);
    const r = v.ref || "direct";
    refs.set(r, (refs.get(r) ?? 0) + 1);
    const day = new Date(v.ts).toISOString().slice(0, 10);
    days.set(day, (days.get(day) ?? 0) + 1);
  }
  const top = (m: Map<string, number>, key: string) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k, count]) => ({ [key]: k, count })) as never;
  return {
    total: views.length,
    unique: days.size,
    topPaths: top(paths, "path"),
    topRefs: top(refs, "ref"),
    perDay: [...days.entries()].sort().map(([day, count]) => ({ day, count })),
  };
}
