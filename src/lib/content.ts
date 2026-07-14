import { ALL_PROJECTS, type FeaturedProject } from "./projects";
import { RICH } from "./content-data";

/**
 * Unified, block-based content model — the spine of the CMS.
 *
 * A ProjectDoc carries meta (name, tag, media, links) plus an ordered list of
 * typed content Blocks that make up its case study, and an optional Pitch (its
 * own block list) for the investor view. Both the public pages and the Studio
 * editor read/write this exact shape, so "edit everything" is literally true:
 * every section on every project detail page and pitch deck is a Block the
 * owner can add, remove, reorder and edit.
 *
 * Blocks are a single uniform shape (not a discriminated union) so the editor
 * can be generic and the store stays plain JSON. The renderer switches on
 * `type` and reads the fields that type uses; unused fields stay "" or [].
 */

export type Side = "engineer" | "business";

export type BlockType =
  | "prose" // heading + body paragraph
  | "stats" // heading + [{value,label}]
  | "specs" // heading + [{label,value}] hairline table
  | "features" // heading + [{title,body}]
  | "steps" // heading + ordered [{title,body}]
  | "chips" // heading + [{text}] tech tags
  | "quote" // pull quote {quote,author,role}
  | "gallery" // heading + [{src,caption}] photos
  | "video" // heading + [{src,caption}] file/YouTube/Vimeo player
  | "embed" // heading + body + [{src,label(frame),title,caption}] live app / emulator in a device frame, always paired with an "open live" link. An appetize.io URL in src is auto-detected and rendered as a real Android/iOS app stream, no bezel needed (Appetize supplies its own device chrome).
  | "demo" // heading + body + [{src,title}] launch-the-live-app card
  | "walkthrough"; // heading + body(intro) + ordered [{src(screenshot),title,body(caption)}] — a guided tour, hand-authored or Claude-generated from the live site

export interface BlockItem {
  text?: string;
  value?: string;
  label?: string; // for embed: device frame — browser | phone | tablet | desktop | bare
  title?: string;
  body?: string;
  caption?: string;
  src?: string; // image / video / iframe URL depending on block type
}

export interface Block {
  id: string;
  type: BlockType;
  heading: string;
  body: string;
  quote: string;
  author: string;
  role: string;
  items: BlockItem[];
}

export interface Stat {
  value: string;
  label: string;
}

export interface Pitch {
  eyebrow: string;
  tagline: string;
  heroStats: Stat[];
  blocks: Block[];
  ask: { raise: string; use: string; contact: string };
}

/** Finer-grained than `side` — routes a project to its own listing page.
 * undefined = a regular system/venture, listed on the plain engineer/business
 * projects page. */
export type ProjectKind = "flagship" | "hackathon" | "personal";

export interface ProjectDoc {
  slug: string;
  name: string;
  tag: string;
  side: Side;
  kind?: ProjectKind;
  year: string;
  oneLiner: string;
  image: string;
  gradient: string;
  liveUrl: string | null;
  repoUrl: string | null;
  featured: boolean;
  order: number;
  heroStats: Stat[];
  blocks: Block[];
  pitch: Pitch | null;
}

export const BLOCK_TYPES: { type: BlockType; label: string }[] = [
  { type: "prose", label: "Paragraph" },
  { type: "stats", label: "Stat grid" },
  { type: "specs", label: "Spec table" },
  { type: "features", label: "Feature list" },
  { type: "steps", label: "Steps / process" },
  { type: "chips", label: "Tech tags" },
  { type: "quote", label: "Pull quote" },
  { type: "gallery", label: "Gallery" },
  { type: "video", label: "Video / reel" },
  { type: "embed", label: "Live embed (device frame, or an Appetize.io URL for a real mobile app stream)" },
  { type: "demo", label: "Launch demo card" },
  { type: "walkthrough", label: "Automated walkthrough" },
];

/** A blank block of a given type, for the editor's "add block". */
export function emptyBlock(type: BlockType, id: string): Block {
  return { id, type, heading: "", body: "", quote: "", author: "", role: "", items: [] };
}

// ── Seed content ────────────────────────────────────────────────────────────
// The rich content per slug. Meta (image, gradient, side, tag, name, one-liner,
// order) is taken from ALL_PROJECTS so there is one source for the thumbnails;
// RICH adds the deep blocks. This map is the CMS seed — the Studio store is
// hydrated from it and becomes the live source of truth thereafter.

export interface RichSeed {
  year: string;
  liveUrl: string | null;
  repoUrl: string | null;
  featured: boolean;
  heroStats: Stat[];
  blocks: Block[];
  pitch: Pitch | null;
}

const gimg = (slug: string, n: number) =>
  `https://picsum.photos/seed/tariwei-${slug}-${n}/1200/800`;

function build(p: FeaturedProject, order: number): ProjectDoc {
  const r: RichSeed = RICH[p.slug];
  return {
    slug: p.slug,
    name: p.name,
    tag: p.tag,
    side: p.side === "engineering" ? "engineer" : "business",
    kind: p.kind,
    year: r.year,
    oneLiner: p.blurb,
    image: p.image,
    gradient: p.gradient,
    liveUrl: r.liveUrl,
    repoUrl: r.repoUrl,
    featured: r.featured,
    order,
    heroStats: r.heroStats,
    blocks: r.blocks,
    pitch: r.pitch,
  };
}

export const SEED_PROJECTS: ProjectDoc[] = ALL_PROJECTS.map((p, i) => build(p, i));

/** Server-side seed lookups (used by generateStaticParams + SSR fallback). */
export function seedBySlug(slug: string): ProjectDoc | undefined {
  return SEED_PROJECTS.find((p) => p.slug === slug);
}
export const SEED_PITCHES: ProjectDoc[] = SEED_PROJECTS.filter((p) => p.pitch !== null);

export { gimg as galleryImage };
