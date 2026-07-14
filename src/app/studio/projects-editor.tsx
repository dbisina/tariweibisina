"use client";

import { useRef, useState } from "react";
import { useStudioStore } from "@/lib/studio";
import {
  BLOCK_TYPES,
  emptyBlock,
  type Block,
  type BlockItem,
  type BlockType,
  type ProjectDoc,
  type ProjectKind,
  type Pitch,
  type Stat,
} from "@/lib/content";
import { Field, TextInput, TextArea, Select, Toggle, Btn, Card } from "./ui";

// unique-ish id for new blocks (browser runtime, non-crypto is fine)
const nid = () => "b-" + Math.abs((Math.random() * 1e9) | 0).toString(36) + Date.now().toString(36).slice(-4);

// which item fields each block type edits
const ITEM_FIELDS: Record<BlockType, { key: keyof BlockItem; label: string; area?: boolean }[]> = {
  prose: [],
  quote: [],
  stats: [
    { key: "value", label: "Value" },
    { key: "label", label: "Label" },
  ],
  specs: [
    { key: "label", label: "Label" },
    { key: "value", label: "Value" },
  ],
  features: [
    { key: "title", label: "Title" },
    { key: "body", label: "Body", area: true },
  ],
  steps: [
    { key: "title", label: "Title" },
    { key: "body", label: "Body", area: true },
  ],
  chips: [{ key: "text", label: "Tag" }],
  gallery: [
    { key: "src", label: "Image URL (blank = auto)" },
    { key: "caption", label: "Caption" },
  ],
  video: [
    { key: "src", label: "Video URL (mp4 / YouTube / Vimeo) or upload" },
    { key: "caption", label: "Caption" },
  ],
  embed: [
    { key: "src", label: "Live URL — or paste an appetize.io/embed/... link for a real Android/iOS app stream" },
    { key: "label", label: "Frame: browser | phone | tablet | desktop | bare (ignored for Appetize URLs)" },
    { key: "title", label: "Title" },
    { key: "caption", label: "Caption" },
  ],
  demo: [
    { key: "src", label: "Live app URL" },
    { key: "title", label: "Button title" },
  ],
  walkthrough: [
    { key: "src", label: "Screenshot URL or upload" },
    { key: "title", label: "Step title" },
    { key: "body", label: "Step caption", area: true },
  ],
};

// ── small reusable bits ─────────────────────────────────────────────────────

function MoveDelete({
  onUp,
  onDown,
  onDelete,
}: {
  onUp?: () => void;
  onDown?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onUp} disabled={!onUp} className="px-1.5 font-mono text-sm text-mut hover:text-ink disabled:opacity-25">
        ↑
      </button>
      <button onClick={onDown} disabled={!onDown} className="px-1.5 font-mono text-sm text-mut hover:text-ink disabled:opacity-25">
        ↓
      </button>
      <button onClick={onDelete} className="px-1.5 font-mono text-sm text-mut hover:text-red-400">
        ✕
      </button>
    </div>
  );
}

function StatsEditor({ stats, onChange }: { stats: Stat[]; onChange: (s: Stat[]) => void }) {
  return (
    <div className="space-y-2">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <TextInput
            value={s.value}
            placeholder="Value"
            onChange={(e) => onChange(stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
          />
          <TextInput
            value={s.label}
            placeholder="Label"
            onChange={(e) => onChange(stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
          />
          <button onClick={() => onChange(stats.filter((_, j) => j !== i))} className="px-1.5 text-mut hover:text-red-400">
            ✕
          </button>
        </div>
      ))}
      <Btn onClick={() => onChange([...stats, { value: "", label: "" }])}>+ Stat</Btn>
    </div>
  );
}

// upload a real file to /api/upload (Cloudinary) and hand back the URL
function MediaUpload({ onDone }: { onDone: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const upload = async (file: File) => {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setErr(data.error ?? "upload failed");
      else onDone(data.url);
    } catch {
      setErr("upload failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-none flex-col items-end">
      <input
        ref={ref}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <Btn onClick={() => ref.current?.click()}>{busy ? "Uploading…" : "Upload"}</Btn>
      {err && <span className="mt-1 max-w-[170px] text-right font-mono text-[9px] text-red-400">{err}</span>}
    </div>
  );
}

function ItemsEditor({
  type,
  items,
  onChange,
}: {
  type: BlockType;
  items: BlockItem[];
  onChange: (items: BlockItem[]) => void;
}) {
  const fields = ITEM_FIELDS[type];
  const set = (i: number, key: keyof BlockItem, val: string) =>
    onChange(items.map((it, j) => (j === i ? { ...it, [key]: val } : it)));
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-ln p-3">
          <div className="mb-2 flex justify-end">
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="px-1.5 text-mut hover:text-red-400">
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {fields.map((f) =>
              f.area ? (
                <TextArea
                  key={f.key}
                  value={(it[f.key] as string) ?? ""}
                  placeholder={f.label}
                  onChange={(e) => set(i, f.key, e.target.value)}
                />
              ) : f.key === "src" ? (
                <div key={f.key} className="flex items-center gap-2">
                  <TextInput
                    value={(it[f.key] as string) ?? ""}
                    placeholder={f.label}
                    spellCheck={false}
                    onChange={(e) => set(i, f.key, e.target.value)}
                  />
                  <MediaUpload onDone={(url) => set(i, "src", url)} />
                </div>
              ) : (
                <TextInput
                  key={f.key}
                  value={(it[f.key] as string) ?? ""}
                  placeholder={f.label}
                  onChange={(e) => set(i, f.key, e.target.value)}
                />
              )
            )}
          </div>
        </div>
      ))}
      <Btn onClick={() => onChange([...items, {}])}>+ Item</Btn>
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
  onUp,
  onDown,
  onDelete,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onUp?: () => void;
  onDown?: () => void;
  onDelete: () => void;
}) {
  const typeLabel = BLOCK_TYPES.find((t) => t.type === block.type)?.label ?? block.type;
  return (
    <div className="rounded-xl border border-ln p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.16em] text-acc uppercase">{typeLabel}</span>
        <MoveDelete onUp={onUp} onDown={onDown} onDelete={onDelete} />
      </div>

      {block.type !== "quote" && (
        <Field label="Heading">
          <TextInput value={block.heading} onChange={(e) => onChange({ ...block, heading: e.target.value })} />
        </Field>
      )}

      {(block.type === "prose" || block.type === "embed" || block.type === "demo" || block.type === "walkthrough") && (
        <div className="mt-3">
          <Field label={block.type === "prose" ? "Body" : "Intro (optional)"}>
            <TextArea value={block.body} onChange={(e) => onChange({ ...block, body: e.target.value })} />
          </Field>
        </div>
      )}

      {block.type === "quote" && (
        <div className="space-y-3">
          <Field label="Quote">
            <TextArea value={block.quote} onChange={(e) => onChange({ ...block, quote: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Author">
              <TextInput value={block.author} onChange={(e) => onChange({ ...block, author: e.target.value })} />
            </Field>
            <Field label="Role">
              <TextInput value={block.role} onChange={(e) => onChange({ ...block, role: e.target.value })} />
            </Field>
          </div>
        </div>
      )}

      {ITEM_FIELDS[block.type].length > 0 && (
        <div className="mt-3">
          <ItemsEditor type={block.type} items={block.items} onChange={(items) => onChange({ ...block, items })} />
        </div>
      )}
    </div>
  );
}

function AddBlock({ onAdd }: { onAdd: (t: BlockType) => void }) {
  const [t, setT] = useState<BlockType>("prose");
  return (
    <div className="flex items-center gap-2">
      <div className="w-48">
        <Select value={t} onChange={(v) => setT(v as BlockType)} options={BLOCK_TYPES.map((b) => ({ value: b.type, label: b.label }))} />
      </div>
      <Btn variant="solid" onClick={() => onAdd(t)}>
        + Add block
      </Btn>
    </div>
  );
}

// a full block list editor (shared by case body + pitch body)
function BlockList({ blocks, onChange }: { blocks: Block[]; onChange: (b: Block[]) => void }) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <BlockEditor
          key={b.id}
          block={b}
          onChange={(nb) => onChange(blocks.map((x, j) => (j === i ? nb : x)))}
          onUp={i > 0 ? () => move(i, -1) : undefined}
          onDown={i < blocks.length - 1 ? () => move(i, 1) : undefined}
          onDelete={() => onChange(blocks.filter((_, j) => j !== i))}
        />
      ))}
      <AddBlock onAdd={(t) => onChange([...blocks, emptyBlock(t, nid())])} />
    </div>
  );
}

// ── the panel ───────────────────────────────────────────────────────────────

export function ProjectsPanel() {
  const projects = useStudioStore((s) => s.config.projects);
  const setConfig = useStudioStore((s) => s.setConfig);
  const resetProjects = useStudioStore((s) => s.resetProjects);
  const [editing, setEditing] = useState<string | null>(null);

  const setProjects = (fn: (p: ProjectDoc[]) => ProjectDoc[]) =>
    setConfig((c) => ({ ...c, projects: fn(c.projects) }));
  const patch = (slug: string, up: Partial<ProjectDoc>) =>
    setProjects((ps) => ps.map((p) => (p.slug === slug ? { ...p, ...up } : p)));

  const move = (i: number, d: number) =>
    setProjects((ps) => {
      const j = i + d;
      if (j < 0 || j >= ps.length) return ps;
      const next = [...ps];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addProject = () => {
    const slug = "new-project-" + Math.abs((Math.random() * 1e6) | 0).toString(36);
    const doc: ProjectDoc = {
      slug,
      name: "New Project",
      tag: "BUSINESS · NEW",
      side: "business",
      year: "2025",
      oneLiner: "",
      image: `https://picsum.photos/seed/${slug}/1024/704`,
      gradient: "linear-gradient(155deg, #2a2a30 0%, #131316 60%, #0b0b0c 100%)",
      liveUrl: null,
      repoUrl: null,
      featured: false,
      order: projects.length,
      heroStats: [{ value: "NEW", label: "status" }],
      blocks: [emptyBlock("prose", nid())],
      pitch: null,
    };
    setProjects((ps) => [...ps, doc]);
    setEditing(slug);
  };

  const active = projects.find((p) => p.slug === editing) ?? null;

  // ── editing one project ──
  if (active) {
    const p = active;
    const setPitch = (up: Partial<Pitch>) =>
      patch(p.slug, { pitch: p.pitch ? { ...p.pitch, ...up } : null });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Btn onClick={() => setEditing(null)}>← All projects</Btn>
          <span className="font-mono text-[10px] tracking-[0.16em] text-mut uppercase">Editing · {p.name}</span>
        </div>

        <Card title="Meta" desc="Identity, media and links for this project.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <TextInput value={p.name} onChange={(e) => patch(p.slug, { name: e.target.value })} />
            </Field>
            <Field label="Slug" hint="URL path">
              <TextInput value={p.slug} spellCheck={false} onChange={(e) => renameSlug(p.slug, e.target.value, setProjects, setEditing)} />
            </Field>
            <Field label="Tag" hint="e.g. SYSTEMS · DATA">
              <TextInput value={p.tag} onChange={(e) => patch(p.slug, { tag: e.target.value })} />
            </Field>
            <Field label="Year">
              <TextInput value={p.year} onChange={(e) => patch(p.slug, { year: e.target.value })} />
            </Field>
            <Field label="Side">
              <Select
                value={p.side}
                onChange={(v) => patch(p.slug, { side: v as "engineer" | "business" })}
                options={[
                  { value: "engineer", label: "Engineer" },
                  { value: "business", label: "Business" },
                ]}
              />
            </Field>
            <Field label="Kind" hint="routes to a dedicated listing page">
              <Select
                value={p.kind ?? "regular"}
                onChange={(v) => patch(p.slug, { kind: v === "regular" ? undefined : (v as ProjectKind) })}
                options={[
                  { value: "regular", label: "Regular" },
                  { value: "flagship", label: "Flagship" },
                  { value: "hackathon", label: "Hackathon" },
                  { value: "personal", label: "Personal" },
                ]}
              />
            </Field>
            <Field label="Live URL" hint="blank = none">
              <TextInput value={p.liveUrl ?? ""} spellCheck={false} onChange={(e) => patch(p.slug, { liveUrl: e.target.value || null })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="One-liner">
                <TextInput value={p.oneLiner} onChange={(e) => patch(p.slug, { oneLiner: e.target.value })} />
              </Field>
            </div>
            <Field label="Hero image URL">
              <TextInput value={p.image} spellCheck={false} onChange={(e) => patch(p.slug, { image: e.target.value })} />
            </Field>
            <Field label="Gradient (CSS)">
              <TextInput value={p.gradient} spellCheck={false} onChange={(e) => patch(p.slug, { gradient: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4">
            <Toggle checked={p.featured} onChange={(v) => patch(p.slug, { featured: v })} label="Featured on home" />
          </div>
        </Card>

        <Card title="Hero stats" desc="The persistent pill on the detail page. Up to four reads best.">
          <StatsEditor stats={p.heroStats} onChange={(heroStats) => patch(p.slug, { heroStats })} />
        </Card>

        <Card
          title="Case study sections"
          desc="The body of the project page. Add, reorder and edit any block. For a mobile app, add a Live embed block and paste an appetize.io stream URL — real Android/iOS emulation, no screen recording needed."
        >
          <BlockList blocks={p.blocks} onChange={(blocks) => patch(p.slug, { blocks })} />
        </Card>

        <Card title="Pitch deck" desc="When on, this project appears under For Investors with its own investor page.">
          <Toggle
            checked={p.pitch !== null}
            onChange={(v) =>
              patch(p.slug, {
                pitch: v
                  ? {
                      eyebrow: p.name.toUpperCase(),
                      tagline: p.oneLiner,
                      heroStats: [{ value: "Pre-seed", label: "stage" }],
                      blocks: [emptyBlock("prose", nid())],
                      ask: { raise: "In conversation", use: "", contact: "danbis664@gmail.com" },
                    }
                  : null,
              })
            }
            label="Publish an investor pitch deck"
          />
          {p.pitch && (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Eyebrow">
                  <TextInput value={p.pitch.eyebrow} onChange={(e) => setPitch({ eyebrow: e.target.value })} />
                </Field>
                <Field label="Tagline">
                  <TextInput value={p.pitch.tagline} onChange={(e) => setPitch({ tagline: e.target.value })} />
                </Field>
              </div>
              <div>
                <span className="mb-1.5 block font-mono text-[10px] tracking-[0.16em] text-mut uppercase">Pitch hero stats</span>
                <StatsEditor stats={p.pitch.heroStats} onChange={(heroStats) => setPitch({ heroStats })} />
              </div>
              <div>
                <span className="mb-1.5 block font-mono text-[10px] tracking-[0.16em] text-mut uppercase">Pitch sections</span>
                <BlockList blocks={p.pitch.blocks} onChange={(blocks) => setPitch({ blocks })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Ask · raise">
                  <TextInput value={p.pitch.ask.raise} onChange={(e) => setPitch({ ask: { ...p.pitch!.ask, raise: e.target.value } })} />
                </Field>
                <Field label="Ask · use of funds">
                  <TextInput value={p.pitch.ask.use} onChange={(e) => setPitch({ ask: { ...p.pitch!.ask, use: e.target.value } })} />
                </Field>
                <Field label="Ask · contact">
                  <TextInput value={p.pitch.ask.contact} spellCheck={false} onChange={(e) => setPitch({ ask: { ...p.pitch!.ask, contact: e.target.value } })} />
                </Field>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ── project list ──
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-[13px] text-mut">{projects.length} projects. Drag order with the arrows.</p>
        <div className="flex gap-2">
          <Btn onClick={resetProjects}>Reset to seed</Btn>
          <Btn variant="solid" onClick={addProject}>
            + New project
          </Btn>
        </div>
      </div>
      {projects.map((p, i) => (
        <div key={p.slug} className="flex items-center justify-between gap-3 rounded-xl border border-ln p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-2 w-2 flex-none rounded-full" style={{ background: p.featured ? "var(--acc)" : "var(--mut)" }} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-display text-[15px] font-medium text-ink">{p.name}</span>
                {p.pitch && (
                  <span className="rounded-full border border-acc/40 px-2 py-0.5 font-mono text-[8px] tracking-[0.14em] text-acc uppercase">
                    pitch
                  </span>
                )}
              </div>
              <span className="font-mono text-[9px] tracking-[0.14em] text-mut uppercase">
                {p.side} · {p.blocks.length} sections
              </span>
            </div>
          </div>
          <div className="flex flex-none items-center gap-1">
            <MoveDelete
              onUp={i > 0 ? () => move(i, -1) : undefined}
              onDown={i < projects.length - 1 ? () => move(i, 1) : undefined}
              onDelete={() => setProjects((ps) => ps.filter((x) => x.slug !== p.slug))}
            />
            <Btn onClick={() => setEditing(p.slug)}>Edit</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

// renaming a slug must keep the editing pointer in sync
function renameSlug(
  oldSlug: string,
  raw: string,
  setProjects: (fn: (p: ProjectDoc[]) => ProjectDoc[]) => void,
  setEditing: (s: string | null) => void
) {
  const slug = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  setProjects((ps) => ps.map((p) => (p.slug === oldSlug ? { ...p, slug } : p)));
  setEditing(slug || oldSlug);
}
