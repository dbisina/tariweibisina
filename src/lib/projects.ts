/**
 * Placeholder project dataset — names/concepts established in the old
 * prototype (reference-old), not invented. Task #9 (CMS) replaces this with
 * real content Daniel manages, including real thumbnails/media; the gradient
 * placeholders are intentional, not stand-in stock photography.
 */
export interface FeaturedProject {
  slug: string;
  index: string;
  name: string;
  tag: string;
  blurb: string;
  gradient: string;
  side: "engineering" | "business";
  /** Placeholder photography (seeded, deterministic) until the CMS supplies
   * real project imagery — Daniel asked for real placeholder images, not
   * flat gradients. */
  image: string;
}

export const ALL_PROJECTS: FeaturedProject[] = [
  {
    slug: "relay",
    image: "https://picsum.photos/seed/tariwei-relay/1024/704",
    index: "01",
    name: "Relay",
    tag: "SYSTEMS · AGENT INFRA",
    blurb: "Real-time handoff layer for on-call engineering agents.",
    gradient: "linear-gradient(155deg, #2a2a30 0%, #131316 60%, #0b0b0c 100%)",
    side: "engineering",
  },
  {
    slug: "aegis-matrix",
    image: "https://picsum.photos/seed/tariwei-aegis-matrix/1024/704",
    index: "02",
    name: "Aegis Matrix",
    tag: "SYSTEMS · QUALITY GATES",
    blurb: "Six-axis ship-gate scoring for production releases.",
    gradient: "linear-gradient(155deg, #23303a 0%, #121a20 60%, #0b0b0c 100%)",
    side: "engineering",
  },
  {
    slug: "etllm",
    image: "https://picsum.photos/seed/tariwei-etllm/1024/704",
    index: "03",
    name: "ETLLM",
    tag: "SYSTEMS · DATA",
    blurb: "LLM-driven ETL that reasons over pipelines. Zero hand-written rules.",
    gradient: "linear-gradient(155deg, #222a30 0%, #14181c 60%, #0b0b0c 100%)",
    side: "engineering",
  },
  {
    slug: "airfree",
    image: "https://picsum.photos/seed/tariwei-airfree/1024/704",
    index: "04",
    name: "Airfree",
    tag: "SYSTEMS · STORAGE",
    blurb: "Disk reclaim engine that reports what it saved you.",
    gradient: "linear-gradient(155deg, #2c2436 0%, #171220 60%, #0b0b0c 100%)",
    side: "engineering",
  },
  {
    slug: "hebron-hotels",
    image: "https://picsum.photos/seed/tariwei-hebron-hotels/1024/704",
    index: "05",
    name: "Hebron Hotels",
    tag: "BUSINESS · HOSPITALITY",
    blurb: "Booking platform built for a boutique hotel group.",
    gradient: "linear-gradient(155deg, #3a2a22 0%, #1e1712 60%, #0b0b0c 100%)",
    side: "business",
  },
  {
    slug: "wayfarian",
    image: "https://picsum.photos/seed/tariwei-wayfarian/1024/704",
    index: "06",
    name: "Wayfarian",
    tag: "BUSINESS · TRAVEL",
    blurb: "Trip planning that thinks in routes, not lists.",
    gradient: "linear-gradient(155deg, #223530 0%, #121e1a 60%, #0b0b0c 100%)",
    side: "business",
  },
  {
    slug: "studyrag",
    image: "https://picsum.photos/seed/tariwei-studyrag/1024/704",
    index: "07",
    name: "StudyRAG",
    tag: "BUSINESS · EDUCATION",
    blurb: "Course material Q&A grounded in the student's own notes.",
    gradient: "linear-gradient(155deg, #33222e 0%, #1d121a 60%, #0b0b0c 100%)",
    side: "business",
  },
  {
    slug: "uncle-stans",
    image: "https://picsum.photos/seed/tariwei-uncle-stans/1024/704",
    index: "08",
    name: "Uncle Stan's",
    tag: "BUSINESS · FOOD",
    blurb: "Ordering and loyalty for a family kitchen brand.",
    gradient: "linear-gradient(155deg, #383023 0%, #201b12 60%, #0b0b0c 100%)",
    side: "business",
  },
  {
    slug: "deusx",
    image: "https://picsum.photos/seed/tariwei-deusx/1024/704",
    index: "09",
    name: "DeusX",
    tag: "FOUNDER · AI SYSTEMS",
    blurb: "The company. AI-native operating systems from the metal up.",
    gradient: "linear-gradient(155deg, #35232a 0%, #1e1216 60%, #0b0b0c 100%)",
    side: "engineering",
  },
];

export const FEATURED_PROJECTS = ALL_PROJECTS.slice(0, 3);
