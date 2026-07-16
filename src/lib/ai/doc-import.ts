import { extractText, getDocumentProxy } from "unpdf";
import { nextGeminiKey, poolSize, reportGeminiKeyError } from "./key-pool";
import { emptyBlock, type Block, type Pitch, type Stat } from "@/lib/content";
import type { ResearchEntry } from "@/lib/research";

/**
 * Document import: Daniel uploads a pitch/research/case-study document
 * (PDF or plain text) and Gemini restructures it into the site's own
 * content model — a full Pitch (slides + ask), a ResearchEntry, or a
 * case-study block list — which the Studio then applies to the DRAFT
 * store for review. Nothing goes live without the usual Publish click.
 *
 * The model emits a constrained intermediate shape (enforced with a JSON
 * responseSchema) and we convert to the real uniform Block shape here —
 * safer than trusting a model with 8-field uniform blocks where unused
 * fields must be "".
 */

export type ImportKind = "pitch" | "research" | "case";

/** A document sent to Gemini as raw bytes (base64) — the OCR path for
 * scanned/image-only PDFs and photo uploads. Gemini reads PDFs and images
 * natively, so "OCR" is just attaching the file instead of extracted text. */
export interface InlineDoc {
  mimeType: string;
  data: string; // base64
}

const MODEL = "gemini-2.5-flash";
const MAX_DOC_CHARS = 60000;

export async function extractPdfTextFromBuffer(buf: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(buf);
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim();
}

// ── intermediate shape the model fills ─────────────────────────────────────

interface RawSection {
  type: "prose" | "stats" | "features" | "steps" | "quote" | "chips";
  heading?: string;
  body?: string;
  quote?: string;
  author?: string;
  role?: string;
  items?: { title?: string; body?: string; value?: string; label?: string; text?: string }[];
}

interface RawImport {
  title: string;
  tagline: string;
  heroStats: { value: string; label: string }[];
  sections: RawSection[];
  ask?: { raise: string; use: string };
  summary?: string;
  tag?: string;
}

const SECTION_SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["prose", "stats", "features", "steps", "quote", "chips"] },
    heading: { type: "string" },
    body: { type: "string" },
    quote: { type: "string" },
    author: { type: "string" },
    role: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          value: { type: "string" },
          label: { type: "string" },
          text: { type: "string" },
        },
      },
    },
  },
  required: ["type"],
};

const IMPORT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    tagline: { type: "string" },
    tag: { type: "string", description: "short category tag, e.g. 'FINTECH · AI'" },
    summary: { type: "string" },
    heroStats: {
      type: "array",
      items: {
        type: "object",
        properties: { value: { type: "string" }, label: { type: "string" } },
        required: ["value", "label"],
      },
    },
    sections: { type: "array", items: SECTION_SCHEMA },
    ask: {
      type: "object",
      properties: { raise: { type: "string" }, use: { type: "string" } },
    },
  },
  required: ["title", "tagline", "heroStats", "sections"],
};

function importPrompt(kind: ImportKind, text: string | null): string {
  const shared = [
    `Below is a document Daniel uploaded. Restructure its ACTUAL content into the requested shape — never invent numbers, claims or quotes that aren't in the document. Plain confident prose, no marketing filler. If the document has strong numbers, put the best 3-4 in heroStats. Keep every field concise: headings under 8 words, bodies 1-3 sentences (research bodies may run a full paragraph), stat values short. Leave fields that don't apply as empty strings — never pad or repeat.`,
    `Section guidance: "prose" for narrative (heading + body), "stats" for number grids (items use value+label), "features" for titled points (items use title+body), "steps" for ordered process/roadmap (items use title+body), "quote" for a single strong quotation (quote/author/role), "chips" for technology/tag lists (items use text).`,
  ];
  const perKind: Record<ImportKind, string> = {
    pitch: `Build an INVESTOR PITCH DECK: title = venture name, tagline = one investable sentence, 5-8 sections telling problem → product → traction/why-now → roadmap, ending thoughts. Fill "ask" from the document (raise + use of funds); if absent use raise "In conversation" and a use-of-funds inferred strictly from the document's stated plans.`,
    research: `Build a RESEARCH NOTE: title = a sharp finding-style title (not the document's generic one if it's weak), tagline = unused (put ""), summary = 2-3 sentence abstract in first person, sections = 4-6 "prose" sections ONLY, each body one substantial paragraph, in working-note voice (what was tried, what surprised, what's still open).`,
    case: `Build a PROJECT CASE STUDY: title = project name, tagline = one-liner of what it is, tag = short category, sections = 4-8 sections covering the problem, the approach, how it works, results — use stats/features/steps/chips where the content fits them.`,
  };
  const docPart =
    text === null
      ? `The document is ATTACHED as a file. Read it in full — including scanned pages, images of text, charts and slide layouts — and use only what it actually contains.`
      : `DOCUMENT:\n${text.slice(0, MAX_DOC_CHARS)}`;
  return [shared[0], perKind[kind], shared[1], docPart].join("\n\n");
}

async function callStructured(prompt: string, doc?: InlineDoc): Promise<RawImport | null> {
  const tries = Math.max(1, poolSize());
  for (let i = 0; i < tries; i++) {
    const key = nextGeminiKey();
    if (!key) return null;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }, ...(doc ? [{ inlineData: doc }] : [])],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              // generous cap + a small real thinking budget: with
              // thinkingBudget 0 this model degenerated into runaway
              // repeated strings on big structured outputs, truncating
              // the JSON at the cap (observed, not hypothetical)
              maxOutputTokens: 30000,
              thinkingConfig: { thinkingBudget: 1024 },
              responseMimeType: "application/json",
              responseSchema: IMPORT_SCHEMA,
            },
          }),
        }
      );
      if (!res.ok) {
        console.error(`doc-import: Gemini ${res.status}:`, (await res.text()).slice(0, 300));
        if (res.status === 429 || res.status >= 500) {
          reportGeminiKeyError(key);
          continue;
        }
        return null;
      }
      const data = await res.json();
      const finish = data?.candidates?.[0]?.finishReason;
      const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      if (finish === "MAX_TOKENS") {
        // truncated JSON is unparseable — retry (next key / next attempt)
        console.error("doc-import: response truncated at MAX_TOKENS, retrying");
        continue;
      }
      return JSON.parse(text) as RawImport;
    } catch (e) {
      console.error("doc-import: attempt failed:", e instanceof Error ? e.message : e);
      reportGeminiKeyError(key);
    }
  }
  return null;
}

// ── conversion into the site's real content model ──────────────────────────

const nid = (prefix: string, i: number) => `${prefix}-imp-${Date.now().toString(36)}-${i}`;

function toBlocks(sections: RawSection[], prefix: string): Block[] {
  return sections.map((s, i) => {
    const b = emptyBlock(s.type, nid(prefix, i));
    b.heading = s.heading ?? "";
    b.body = s.body ?? "";
    b.quote = s.quote ?? "";
    b.author = s.author ?? "";
    b.role = s.role ?? "";
    b.items = (s.items ?? []).map((it) => ({
      title: it.title ?? "",
      body: it.body ?? "",
      value: it.value ?? "",
      label: it.label ?? "",
      text: it.text ?? "",
      caption: "",
      src: "",
    }));
    return b;
  });
}

export interface ImportResult {
  kind: ImportKind;
  title: string;
  pitch?: Pitch;
  research?: ResearchEntry;
  caseStudy?: { name: string; tag: string; oneLiner: string; heroStats: Stat[]; blocks: Block[] };
}

export async function structureDocument(
  kind: ImportKind,
  text: string,
  contact: string,
  doc?: InlineDoc
): Promise<ImportResult | null> {
  const raw = await callStructured(importPrompt(kind, doc ? null : text), doc);
  if (!raw) return null;

  if (kind === "pitch") {
    const pitch: Pitch = {
      eyebrow: raw.title.toUpperCase(),
      tagline: raw.tagline,
      heroStats: raw.heroStats.slice(0, 4),
      blocks: toBlocks(raw.sections, "pitch"),
      ask: { raise: raw.ask?.raise || "In conversation", use: raw.ask?.use || "", contact },
    };
    return { kind, title: raw.title, pitch };
  }

  if (kind === "research") {
    const slug = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "imported-note";
    const research: ResearchEntry = {
      slug,
      title: raw.title,
      publication: `Imported · ${new Date().getFullYear()}`,
      tag: (raw.tag || "NOTES").toUpperCase(),
      summary: raw.summary || raw.tagline,
      image: `https://picsum.photos/seed/tariwei-${slug}/1024/704`,
      body: raw.sections.map((s) => [s.heading, s.body].filter(Boolean).join(" — ")).filter(Boolean),
    };
    return { kind, title: raw.title, research };
  }

  return {
    kind,
    title: raw.title,
    caseStudy: {
      name: raw.title,
      tag: (raw.tag || "PROJECT").toUpperCase(),
      oneLiner: raw.tagline,
      heroStats: raw.heroStats.slice(0, 4),
      blocks: toBlocks(raw.sections, "case"),
    },
  };
}
