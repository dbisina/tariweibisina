/**
 * Data model for a site walkthrough. Every video is a sequence of scenes
 * driven entirely by a manifest (src/manifests/*) — the composition code is
 * generic. Coordinates for cursor waypoints are normalized (0..1) within
 * the browser frame's viewport so manifests don't care about render size.
 * Scroll offsets are in CSS pixels of the captured page (see
 * public/screens/<site>/meta.json for each capture's dimensions).
 */

export type CursorWaypoint = {
  /** seconds from scene start */
  t: number;
  /** 0..1 across the viewport */
  x: number;
  /** 0..1 down the viewport */
  y: number;
  /** play a click ripple when arriving here */
  click?: boolean;
};

export type PageScene = {
  kind: "page";
  /** staticFile path under public/, e.g. "screens/portfolio/home.png" */
  image: string;
  /** captured page CSS width (from meta.json) — scales scroll math */
  capturedWidth: number;
  durationSec: number;
  caption?: string;
  /** vertical scroll (CSS px of the captured page) over the scene */
  scroll?: { from: number; to: number };
  /** subtle zoom-in for emphasis, e.g. {from: 1, to: 1.06} */
  zoom?: { from: number; to: number };
  cursor?: CursorWaypoint[];
};

export type IntroScene = {
  kind: "intro";
  title: string;
  subtitle: string;
  accent: string;
  durationSec: number;
};

export type OutroScene = {
  kind: "outro";
  url: string;
  line: string;
  accent: string;
  durationSec: number;
};

export type Scene = IntroScene | PageScene | OutroScene;

export type SiteManifest = {
  id: string;
  name: string;
  accent: string;
  scenes: Scene[];
};
