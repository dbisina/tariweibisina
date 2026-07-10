import { ALL_PROJECTS, type FeaturedProject } from "./projects";

/**
 * Case-presentation content per project (semlerpremium template shape, see
 * DESIGN-NOTES.md). The CMS (task #9) becomes the source of truth later;
 * until then content lives here. `mode` decides which vocabulary the shared
 * template renders: case studies show build facts, pitch decks show
 * investor facts.
 */
export interface StatPill {
  value: string;
  label: string;
}

export interface SpecRow {
  label: string;
  value: string;
}

export interface CasePresentation {
  slug: string;
  mode: "case-study" | "pitch-deck";
  eyebrow: string;
  title: string;
  stats: StatPill[]; // the persistent bottom pill, exactly 4
  descriptionLabel: string;
  description: string;
  specsA: { heading: string; rows: SpecRow[] };
  specsB: { heading: string; rows: SpecRow[] };
  scarcityLine: string;
  liveUrl: string | null;
  ctaLabel: string;
  project: FeaturedProject;
}

const bySlug = Object.fromEntries(ALL_PROJECTS.map((p) => [p.slug, p]));

const CASE_OVERRIDES: Record<string, Partial<CasePresentation>> = {
  relay: {
    description:
      "On-call engineering runs on handoffs, and handoffs drop context. Relay keeps a live, structured record of what every agent knows the moment responsibility moves, so the next pair of hands starts warm instead of cold.",
    specsA: {
      heading: "BUILD",
      rows: [
        { label: "Stack", value: "Rust · Go · WebSocket" },
        { label: "Role", value: "Design + build, solo" },
        { label: "Timeline", value: "2025" },
        { label: "Status", value: "Live, internal" },
      ],
    },
    scarcityLine: "Runs the handoffs for every DeusX on-call rotation.",
  },
  "hebron-hotels": {
    description:
      "A boutique hotel group needed direct bookings that didn't feel like a kiosk form. Hebron's platform owns the whole guest path: search, room story, payment, and the follow-through emails, all in the group's own voice.",
    specsA: {
      heading: "BUILD",
      rows: [
        { label: "Stack", value: "Next.js · Postgres · Stripe" },
        { label: "Role", value: "Full build, solo" },
        { label: "Timeline", value: "2024" },
        { label: "Status", value: "Live, client-operated" },
      ],
    },
    scarcityLine: "Direct bookings, zero commission to aggregators.",
  },
  deusx: {
    mode: "pitch-deck",
    eyebrow: "DEUSX TECHNOLOGIES",
    descriptionLabel: "THE THESIS",
    description:
      "Operating systems were designed for people clicking windows. DeusX builds AI-native systems from the metal up: GPU-level runtimes where models are first-class citizens, not processes fighting for scraps.",
    specsA: {
      heading: "TRACTION",
      rows: [
        { label: "Products shipped", value: "4 systems, 5 client builds" },
        { label: "Founder", value: "Daniel Tariwei Bisina" },
        { label: "Stage", value: "Pre-seed" },
        { label: "Model", value: "Products + client services" },
      ],
    },
    specsB: {
      heading: "THE ASK",
      rows: [
        { label: "Raise", value: "In conversation" },
        { label: "Use of funds", value: "Runtime R&D, first hires" },
        { label: "Contact", value: "danbis664@gmail.com" },
      ],
    },
    scarcityLine: "One engineer has shipped the entire current stack.",
    ctaLabel: "Request the deck",
  },
};

function defaultsFor(p: FeaturedProject): CasePresentation {
  return {
    slug: p.slug,
    mode: "case-study",
    eyebrow: p.tag,
    title: p.name,
    stats: [
      { value: p.index, label: "project" },
      { value: p.side === "engineering" ? "SYSTEMS" : "CLIENT", label: "type" },
      { value: "2024–25", label: "period" },
      { value: "LIVE", label: "status" },
    ],
    descriptionLabel: "ABOUT THE PROJECT",
    description: p.blurb,
    specsA: {
      heading: "BUILD",
      rows: [
        { label: "Role", value: "Design + build, solo" },
        { label: "Status", value: "Live" },
      ],
    },
    specsB: {
      heading: "DETAILS",
      rows: [
        { label: "Category", value: p.tag },
        { label: "Index", value: p.index },
      ],
    },
    scarcityLine: "Full case content lands with the CMS.",
    liveUrl: null,
    ctaLabel: "Visit the live site",
    project: p,
  };
}

export function getCasePresentation(slug: string): CasePresentation | null {
  const p = bySlug[slug];
  if (!p) return null;
  return { ...defaultsFor(p), ...CASE_OVERRIDES[slug] };
}

export const PITCH_DECKS = ["deusx"];
