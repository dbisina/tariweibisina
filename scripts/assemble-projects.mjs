// One-shot: turn authored projects (workflow journal + hand-authored extras)
// into the site's seed files — src/lib/projects.ts (ALL_PROJECTS) and
// src/lib/content-data.ts (RICH). Faithful, deterministic assembly.
//
// Usage:
//   node assemble-projects.mjs <journal.jsonl> [extraFiles,comma,separated] [excludeSlugs,comma,separated] [kindMap.json]
//
// extraFiles: each a JSON array of project objects, same shape as a workflow result.
// excludeSlugs: slugs to drop entirely (e.g. forks that aren't really Daniel's).
// kindMap.json: { slug: "flagship" | "hackathon" | "personal" } — unlisted = regular.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const JOURNAL = process.argv[2];
const EXTRA = (process.argv[3] || "").split(",").map((s) => s.trim()).filter(Boolean);
const EXCLUDE = new Set((process.argv[4] || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
const KIND_MAP_PATH = process.argv[5];
const KIND_MAP = KIND_MAP_PATH && fs.existsSync(KIND_MAP_PATH) ? JSON.parse(fs.readFileSync(KIND_MAP_PATH, "utf8")) : {};

const GRADIENTS = [
  "linear-gradient(155deg, #2a2a30 0%, #131316 60%, #0b0b0c 100%)",
  "linear-gradient(155deg, #23303a 0%, #121a20 60%, #0b0b0c 100%)",
  "linear-gradient(155deg, #222a30 0%, #14181c 60%, #0b0b0c 100%)",
  "linear-gradient(155deg, #2c2436 0%, #171220 60%, #0b0b0c 100%)",
  "linear-gradient(155deg, #3a2a22 0%, #1e1712 60%, #0b0b0c 100%)",
  "linear-gradient(155deg, #223530 0%, #121e1a 60%, #0b0b0c 100%)",
  "linear-gradient(155deg, #33222e 0%, #1d121a 60%, #0b0b0c 100%)",
  "linear-gradient(155deg, #383023 0%, #201b12 60%, #0b0b0c 100%)",
  "linear-gradient(155deg, #35232a 0%, #1e1216 60%, #0b0b0c 100%)",
  "linear-gradient(155deg, #1f2b33 0%, #12181d 60%, #0b0b0c 100%)",
];

const BLOCK_ITEM_KEYS = ["text", "value", "label", "title", "body", "caption", "src"];
const cleanSlug = (s) => String(s).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

function readProjects() {
  const lines = fs.readFileSync(JOURNAL, "utf8").trim().split("\n");
  const out = [];
  for (const l of lines) {
    let o;
    try { o = JSON.parse(l); } catch { continue; }
    if (o?.type === "result" && o.result && typeof o.result === "object") out.push(o.result);
  }
  for (const file of EXTRA) {
    if (!fs.existsSync(file)) continue;
    const extra = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const p of Array.isArray(extra) ? extra : [extra]) out.push(p);
  }
  return out.filter((p) => p && p.worthy && p.slug && Array.isArray(p.blocks))
    .filter((p) => !EXCLUDE.has(cleanSlug(p.slug)));
}

function normItem(it) {
  const o = {};
  for (const k of BLOCK_ITEM_KEYS) o[k] = typeof it?.[k] === "string" ? it[k] : "";
  return o;
}
function normBlock(b, slug, i) {
  return {
    id: `${slug}-${i}`,
    type: b.type,
    heading: b.heading ?? "",
    body: b.body ?? "",
    quote: b.quote ?? "",
    author: b.author ?? "",
    role: b.role ?? "",
    items: Array.isArray(b.items) ? b.items.map(normItem) : [],
  };
}

const KIND_RANK = { flagship: 0, hackathon: 1, personal: 2 };
function rank(p) {
  const slug = cleanSlug(p.slug);
  const kind = KIND_MAP[slug];
  if (kind && kind in KIND_RANK) return KIND_RANK[kind];
  return p.side === "engineering" ? 3 : 4;
}

function build() {
  const raw = readProjects();

  // de-dupe by slug, but a LATER entry (an extras file patch) overrides an
  // earlier one (a journal result) while keeping its original list position —
  // lets a hand-authored extra correct/replace a workflow-authored project.
  const bySlug = new Map();
  const order = [];
  for (const p of raw) {
    const s = cleanSlug(p.slug);
    if (!bySlug.has(s)) order.push(s);
    bySlug.set(s, p);
  }
  let projects = order.map((s) => bySlug.get(s));
  projects.sort((a, b) => rank(a) - rank(b));

  const all = [];
  const rich = {};
  projects.forEach((p, i) => {
    const slug = cleanSlug(p.slug);
    const side = p.side === "business" ? "business" : "engineering";
    const kind = KIND_MAP[slug]; // "flagship" | "hackathon" | "personal" | undefined
    const gradient = GRADIENTS[i % GRADIENTS.length];
    const image = `https://picsum.photos/seed/tariwei-${slug}/1024/704`;
    all.push({
      slug,
      image,
      index: String(i + 1).padStart(2, "0"),
      name: p.name,
      tag: p.tag,
      blurb: p.oneLiner,
      gradient,
      side,
      ...(kind ? { kind } : {}),
    });
    rich[slug] = {
      year: p.year || "2025",
      liveUrl: p.liveUrl || null,
      repoUrl: p.repoUrl || null,
      featured: kind === "flagship" || i < 3,
      heroStats: Array.isArray(p.heroStats)
        ? p.heroStats.slice(0, 4).map((s) => ({ value: String(s.value ?? ""), label: String(s.label ?? "") }))
        : [],
      blocks: p.blocks.map((b, bi) => normBlock(b, slug, bi)),
      pitch: null,
    };
  });
  return { all, rich, count: projects.length };
}

const { all, rich, count } = build();

const projectsTs = `/**
 * Real project dataset — authored from Daniel's GitHub (github.com/dbisina).
 * Generated by scripts/assemble-projects.mjs; edit in /studio (this is the
 * seed the Studio store hydrates from).
 */
export type ProjectKind = "flagship" | "hackathon" | "personal";

export interface FeaturedProject {
  slug: string;
  index: string;
  name: string;
  tag: string;
  blurb: string;
  gradient: string;
  side: "engineering" | "business";
  /** Routes to a dedicated listing page (hackathons) or gets flagship billing.
   * Unset = a regular system/venture on the plain projects page. */
  kind?: ProjectKind;
  /** Seeded placeholder photography until real project imagery is uploaded. */
  image: string;
}

export const ALL_PROJECTS: FeaturedProject[] = ${JSON.stringify(all, null, 2)};

export const FEATURED_PROJECTS = ALL_PROJECTS.slice(0, 3);
`;

const contentTs = `import type { RichSeed } from "./content";

/**
 * Deep per-project content — authored from Daniel's real repos. Engineering
 * pieces carry system design + architecture; business pieces lead with
 * problem, optimization and impact. Generated by scripts/assemble-projects.mjs.
 */

export const RICH: Record<string, RichSeed> = ${JSON.stringify(rich, null, 2)};
`;

fs.writeFileSync(path.join(ROOT, "src/lib/projects.ts"), projectsTs);
fs.writeFileSync(path.join(ROOT, "src/lib/content-data.ts"), contentTs);
console.log(`wrote ${count} projects → projects.ts + content-data.ts`);
console.log("slugs:", all.map((p) => `${p.slug}${p.kind ? `(${p.kind})` : ""}`).join(", "));
