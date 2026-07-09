/**
 * Placeholder project dataset — sourced from names/concepts already
 * established in the old prototype (reference-old), not invented. Task #9
 * (CMS) replaces this with real content Daniel manages, including real
 * thumbnails/media; the gradient placeholders here are intentional, not
 * stand-in stock photography.
 */
export interface FeaturedProject {
  slug: string;
  index: string;
  name: string;
  tag: string;
  blurb: string;
  gradient: string;
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    slug: "relay",
    index: "01",
    name: "Relay",
    tag: "SYSTEMS · AGENT INFRA",
    blurb: "Real-time handoff layer for on-call engineering agents.",
    gradient: "linear-gradient(155deg, #2a2a30 0%, #131316 60%, #0b0b0c 100%)",
  },
  {
    slug: "hebron-hotels",
    index: "02",
    name: "Hebron Hotels",
    tag: "BUSINESS · HOSPITALITY",
    blurb: "Booking platform built for a boutique hotel group.",
    gradient: "linear-gradient(155deg, #3a2a22 0%, #1e1712 60%, #0b0b0c 100%)",
  },
  {
    slug: "etllm",
    index: "03",
    name: "ETLLM",
    tag: "SYSTEMS · DATA",
    blurb: "LLM-driven ETL that profiles and reasons over pipelines — zero hand-written rules.",
    gradient: "linear-gradient(155deg, #222a30 0%, #14181c 60%, #0b0b0c 100%)",
  },
];
