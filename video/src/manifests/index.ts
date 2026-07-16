import type { SiteManifest } from "../types";
import { browseCursor, intro, outro, pageScene, type SiteMeta } from "./util";
import portfolioMeta from "../../public/screens/portfolio/meta.json";
import airfreeMeta from "../../public/screens/airfree/meta.json";
import mamazeeMeta from "../../public/screens/mamazee/meta.json";
import uhopMeta from "../../public/screens/uhop/meta.json";

/**
 * One walkthrough manifest per site. Screens are pixel-exact captures of
 * the real, live sites (scripts/capture.mjs) — the video shows the actual
 * product, choreographed with scroll pans, a live cursor and captions.
 */

const ACCENTS = {
  portfolio: "#ff5a2c",
  airfree: "#2f8f5b",
  mamazee: "#e0913c",
  luvsallure: "#c98ba4",
  uhop: "#4aa6f5",
};

export const portfolio: SiteManifest = {
  id: "portfolio",
  name: "tariwei",
  accent: ACCENTS.portfolio,
  scenes: [
    intro("tariwei.", "PORTFOLIO · AI-NATIVE SYSTEMS", ACCENTS.portfolio),
    pageScene({
      site: "portfolio",
      name: "home",
      meta: portfolioMeta as SiteMeta,
      durationSec: 9,
      caption: "One engineer, the entire stack — with Rimuru, a live AI guide",
      cursor: browseCursor({ x: 0.5, y: 0.55, t: 4.5 }),
    }),
    pageScene({
      site: "portfolio",
      name: "engineer",
      meta: portfolioMeta as SiteMeta,
      durationSec: 6.5,
      caption: "The engineering realm — systems, research, hackathons",
      cursor: [
        { t: 0.6, x: 0.75, y: 0.5 },
        { t: 2.4, x: 0.42, y: 0.36, click: true },
        { t: 4.5, x: 0.6, y: 0.6 },
      ],
    }),
    pageScene({
      site: "portfolio",
      name: "project-relay",
      meta: portfolioMeta as SiteMeta,
      durationSec: 8,
      caption: "Every project is a full case study — architecture and all",
      maxScrollPx: 3200,
    }),
    pageScene({
      site: "portfolio",
      name: "business",
      meta: portfolioMeta as SiteMeta,
      durationSec: 6,
      caption: "A second language for business visitors — proof of impact",
    }),
    pageScene({
      site: "portfolio",
      name: "hire-me",
      meta: portfolioMeta as SiteMeta,
      durationSec: 6,
      caption: "AI-structured briefs land straight in Daniel's inbox",
      cursor: browseCursor({ x: 0.32, y: 0.55, t: 3.2 }),
    }),
    outro("tariweibisina.com", "Built by Daniel Tariwei Bisina", ACCENTS.portfolio),
  ],
};

export const airfree: SiteManifest = {
  id: "airfree",
  name: "Airfree Geospatial",
  accent: ACCENTS.airfree,
  scenes: [
    intro("Airfree", "GEOSPATIAL CONSULTANCY · LIVE CMS", ACCENTS.airfree),
    pageScene({
      site: "airfree",
      name: "home",
      meta: airfreeMeta as SiteMeta,
      durationSec: 9,
      caption: "Marketing site with a custom Redis-backed CMS",
      cursor: browseCursor({ x: 0.7, y: 0.08, t: 4.2 }),
    }),
    pageScene({
      site: "airfree",
      name: "services",
      meta: airfreeMeta as SiteMeta,
      durationSec: 7,
      caption: "Every service page editable live — no code required",
    }),
    pageScene({
      site: "airfree",
      name: "about",
      meta: airfreeMeta as SiteMeta,
      durationSec: 6,
      caption: "Content managed by non-technical staff",
    }),
    pageScene({
      site: "airfree",
      name: "contact",
      meta: airfreeMeta as SiteMeta,
      durationSec: 5,
      caption: "Enquiries straight to the team",
      cursor: browseCursor({ x: 0.5, y: 0.5, t: 2.8 }),
    }),
    outro("airfree-zeta.vercel.app", "Built by Daniel Tariwei Bisina", ACCENTS.airfree),
  ],
};

export const mamazee: SiteManifest = {
  id: "mamazee",
  name: "Mamazee",
  accent: ACCENTS.mamazee,
  scenes: [
    intro("Mamazee", "NIGERIAN GROCERY · ECOMMERCE", ACCENTS.mamazee),
    pageScene({
      site: "mamazee",
      name: "home",
      meta: mamazeeMeta as SiteMeta,
      durationSec: 9,
      caption: "Pantry staples, spices and snacks — with card checkout",
      cursor: browseCursor({ x: 0.5, y: 0.45, t: 4.5 }),
    }),
    pageScene({
      site: "mamazee",
      name: "shop",
      meta: mamazeeMeta as SiteMeta,
      durationSec: 8,
      caption: "The full storefront, stock managed from a no-code admin",
      cursor: [
        { t: 0.8, x: 0.3, y: 0.4 },
        { t: 2.6, x: 0.52, y: 0.5, click: true },
        { t: 4.6, x: 0.7, y: 0.62 },
      ],
    }),
    pageScene({
      site: "mamazee",
      name: "about",
      meta: mamazeeMeta as SiteMeta,
      durationSec: 5.5,
      caption: "A brand story, not just a shop",
    }),
    outro("mamazee-three.vercel.app", "Built by Daniel Tariwei Bisina", ACCENTS.mamazee),
  ],
};

// NOTE: Luv's Allure is skipped — www.luvsallure.com no longer resolves
// (domain moved/expired). To make its video, run the repo's frontend
// locally (C:\Users\USER\Documents\GitHub\LuvsAllure), point a capture
// entry at that localhost origin, and restore a manifest like the others.

export const uhop: SiteManifest = {
  id: "uhop",
  name: "UHOP",
  accent: ACCENTS.uhop,
  scenes: [
    intro("UHOP", "UNIVERSAL GPU RUNTIME", ACCENTS.uhop),
    pageScene({
      site: "uhop",
      name: "home",
      meta: uhopMeta as SiteMeta,
      durationSec: 11,
      caption: "One decorator — CUDA, ROCm, Metal and OpenCL underneath",
      cursor: browseCursor({ x: 0.5, y: 0.42, t: 4.4 }),
      maxScrollPx: 2200,
    }),
    outro("uhop.dev", "Built by Daniel Tariwei Bisina", ACCENTS.uhop),
  ],
};

export const ALL_MANIFESTS: SiteManifest[] = [portfolio, airfree, mamazee, uhop];
