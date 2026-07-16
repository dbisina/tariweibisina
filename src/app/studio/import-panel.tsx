"use client";

import { useRef, useState } from "react";
import { useStudioStore } from "@/lib/studio";
import type { Block, Pitch, ProjectDoc, Stat } from "@/lib/content";
import type { ResearchEntry } from "@/lib/research";
import { Field, TextArea, Select, Btn, Card } from "./ui";

/**
 * Document import — upload a pitch/research/case-study document (PDF or
 * text) and the model rebuilds it in the site's own presentation language.
 * The result lands in the DRAFT store: review it in the Projects/Research
 * editors, then Publish as usual.
 */

type Kind = "pitch" | "research" | "case";

interface ImportResult {
  kind: Kind;
  title: string;
  pitch?: Pitch;
  research?: ResearchEntry;
  caseStudy?: { name: string; tag: string; oneLiner: string; heroStats: Stat[]; blocks: Block[] };
}

const KIND_OPTIONS = [
  { value: "pitch", label: "Investor pitch deck — attaches to a project" },
  { value: "research", label: "Research note — new entry on /engineer/research" },
  { value: "case", label: "Project case study — new or existing project" },
];

export function ImportPanel() {
  const projects = useStudioStore((s) => s.config.projects);
  const setConfig = useStudioStore((s) => s.setConfig);

  const [kind, setKind] = useState<Kind>("pitch");
  const [target, setTarget] = useState<string>("");
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [applied, setApplied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const needsTarget = kind === "pitch" || kind === "case";
  const targetOptions = [
    ...(kind === "case" ? [{ value: "", label: "→ Create a new project" }] : []),
    ...projects.map((p) => ({ value: p.slug, label: p.name })),
  ];

  const run = async (file?: File) => {
    setBusy(true);
    setErr(null);
    setResult(null);
    setApplied(null);
    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", kind);
        res = await fetch("/api/doc-import", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/doc-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, text: pasted }),
        });
      }
      const data = await res.json();
      if (!res.ok) setErr(data.error ?? "import failed");
      else setResult(data as ImportResult);
    } catch {
      setErr("import failed — is the dev server reachable?");
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (!result) return;
    if (result.kind === "pitch" && result.pitch) {
      const slug = target || projects[0]?.slug;
      if (!slug) return setErr("pick a project to attach the pitch to");
      setConfig((c) => ({
        ...c,
        projects: c.projects.map((p) => (p.slug === slug ? { ...p, pitch: result.pitch! } : p)),
      }));
      setApplied(`Pitch attached to "${projects.find((p) => p.slug === slug)?.name ?? slug}" — review it in Projects, then Publish.`);
    } else if (result.kind === "research" && result.research) {
      const r = result.research;
      setConfig((c) => {
        const slug = c.research.some((x) => x.slug === r.slug) ? `${r.slug}-${Date.now().toString(36).slice(-4)}` : r.slug;
        return { ...c, research: [{ ...r, slug }, ...c.research] };
      });
      setApplied(`Research note "${r.title}" added — review it in Research, then Publish.`);
    } else if (result.kind === "case" && result.caseStudy) {
      const cs = result.caseStudy;
      if (target) {
        setConfig((c) => ({
          ...c,
          projects: c.projects.map((p) =>
            p.slug === target
              ? { ...p, name: cs.name, tag: cs.tag, oneLiner: cs.oneLiner, heroStats: cs.heroStats, blocks: cs.blocks }
              : p
          ),
        }));
        setApplied(`Case study applied to "${projects.find((p) => p.slug === target)?.name ?? target}" — review in Projects, then Publish.`);
      } else {
        const slug = cs.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "imported-project";
        const doc: ProjectDoc = {
          slug,
          name: cs.name,
          tag: cs.tag,
          side: "business",
          year: String(new Date().getFullYear()),
          oneLiner: cs.oneLiner,
          image: `https://picsum.photos/seed/${slug}/1024/704`,
          gradient: "linear-gradient(155deg, #2a2a30 0%, #131316 60%, #0b0b0c 100%)",
          liveUrl: null,
          repoUrl: null,
          featured: false,
          order: projects.length,
          heroStats: cs.heroStats,
          blocks: cs.blocks,
          pitch: null,
        };
        setConfig((c) => ({ ...c, projects: [...c.projects, doc] }));
        setApplied(`New project "${cs.name}" created — set its image/side/kind in Projects, then Publish.`);
      }
    }
  };

  const sectionCount =
    result?.pitch?.blocks.length ?? result?.research?.body.length ?? result?.caseStudy?.blocks.length ?? 0;

  return (
    <div className="space-y-6">
      <Card
        title="Import a document"
        desc="Upload a pitch deck, research paper or project write-up — PDF, photo/screenshot, or plain text. Scanned and image-only documents are read with OCR automatically. The model rebuilds the content in the site's presentation language; everything lands as a draft: review, then Publish."
      >
        <div className="space-y-4">
          <Field label="What is this document?">
            <Select value={kind} onChange={(v) => { setKind(v as Kind); setResult(null); setApplied(null); }} options={KIND_OPTIONS} />
          </Field>
          {needsTarget && (
            <Field label={kind === "pitch" ? "Attach pitch to project" : "Target project"}>
              <Select value={target} onChange={setTarget} options={targetOptions} />
            </Field>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) run(f);
                e.target.value = "";
              }}
            />
            <Btn variant="solid" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? "Working…" : "Upload PDF / text file"}
            </Btn>
            <span className="font-mono text-[10px] text-mut">or paste below</span>
          </div>
          <Field label="Pasted text" hint="min ~200 chars">
            <TextArea value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Paste the document text here…" />
          </Field>
          {pasted.trim().length >= 200 && (
            <Btn onClick={() => run()} disabled={busy}>
              {busy ? "Working…" : "Import pasted text"}
            </Btn>
          )}
          {err && <p className="font-mono text-[11px] text-red-400">{err}</p>}
        </div>
      </Card>

      {result && (
        <Card title="Result" desc="Draft only — nothing is live until you Publish.">
          <div className="space-y-3">
            <div className="rounded-xl border border-ln p-4">
              <span className="font-mono text-[9px] tracking-[0.16em] text-acc uppercase">{result.kind}</span>
              <div className="mt-1 font-display text-lg font-medium text-ink">{result.title}</div>
              <div className="font-mono text-[10px] text-mut">
                {sectionCount} {result.kind === "research" ? "paragraphs" : "sections"}
                {result.pitch ? ` · ask: ${result.pitch.ask.raise}` : ""}
              </div>
            </div>
            {applied ? (
              <p className="font-sans text-[13px] text-acc">{applied}</p>
            ) : (
              <Btn variant="solid" onClick={apply}>
                Apply to draft
              </Btn>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
