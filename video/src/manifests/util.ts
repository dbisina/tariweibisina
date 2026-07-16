import type { CursorWaypoint, IntroScene, OutroScene, PageScene } from "../types";

/** Captured-page dimensions written by scripts/capture.mjs (CSS px). */
export type SiteMeta = Record<string, { w: number; h: number; vh: number; dpr: number }>;

// must match Walkthrough.tsx render constants
const FRAME_W = 1680;
const FRAME_H = 920;

/** Build a page scene from capture metadata: scrolls from the top through
 * the page at a comfortable reading pace, capped so long pages don't fly. */
export function pageScene(opts: {
  site: string;
  name: string;
  meta: SiteMeta;
  durationSec: number;
  caption?: string;
  /** 0..1 — how far down the page to travel (default: as far as the cap allows) */
  scrollFraction?: number;
  /** max scroll distance in captured CSS px (keeps pace calm on tall pages) */
  maxScrollPx?: number;
  cursor?: CursorWaypoint[];
  zoom?: { from: number; to: number };
}): PageScene {
  const m = opts.meta[opts.name];
  if (!m) throw new Error(`no capture meta for ${opts.site}/${opts.name} — run: npm run capture ${opts.site}`);
  const viewportCss = m.w * (FRAME_H / FRAME_W); // visible page-height inside the frame
  const maxScroll = Math.max(0, m.h - viewportCss);
  const cap = Math.min(maxScroll, opts.maxScrollPx ?? 2800);
  const to = cap * (opts.scrollFraction ?? 1);
  return {
    kind: "page",
    image: `screens/${opts.site}/${opts.name}.png`,
    capturedWidth: m.w,
    durationSec: opts.durationSec,
    caption: opts.caption,
    scroll: { from: 0, to },
    zoom: opts.zoom,
    cursor: opts.cursor,
  };
}

export function intro(title: string, subtitle: string, accent: string, durationSec = 2.6): IntroScene {
  return { kind: "intro", title, subtitle, accent, durationSec };
}

export function outro(url: string, line: string, accent: string, durationSec = 3): OutroScene {
  return { kind: "outro", url, line, accent, durationSec };
}

/** A natural default cursor path: drift in from the right, browse, click. */
export function browseCursor(clickAt: { x: number; y: number; t: number }): CursorWaypoint[] {
  return [
    { t: 0.4, x: 0.82, y: 0.62 },
    { t: 1.6, x: 0.55, y: 0.42 },
    { t: clickAt.t - 0.7, x: clickAt.x + 0.06, y: clickAt.y + 0.1 },
    { t: clickAt.t, x: clickAt.x, y: clickAt.y, click: true },
    { t: clickAt.t + 1.2, x: clickAt.x + 0.1, y: clickAt.y + 0.16 },
  ];
}
