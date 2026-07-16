"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/** Visual identity per block type — the add-picker and block headers lead
 * with these so media/embeds/demos are discoverable at a glance instead of
 * hiding inside a dropdown of same-looking text labels. */
const BLOCK_META: Record<BlockType, { icon: string; label: string; blurb: string; media?: boolean }> = {
  prose: { icon: "¶", label: "Paragraph", blurb: "Heading + body text" },
  stats: { icon: "88", label: "Stat grid", blurb: "Big numbers row" },
  specs: { icon: "≣", label: "Spec table", blurb: "Label / value rows" },
  features: { icon: "◆", label: "Features", blurb: "Titled feature cards" },
  steps: { icon: "1.", label: "Steps", blurb: "Numbered process" },
  chips: { icon: "#", label: "Tech tags", blurb: "Stack / technology pills" },
  quote: { icon: "❝", label: "Quote", blurb: "Pull quote + author" },
  gallery: { icon: "▣", label: "Photos", blurb: "Image grid with captions", media: true },
  video: { icon: "▶", label: "Video", blurb: "MP4 / YouTube / Vimeo", media: true },
  embed: { icon: "◱", label: "Live embed", blurb: "Real site or app in a device frame", media: true },
  demo: { icon: "↗", label: "Live demo", blurb: "Launch-the-app card", media: true },
  walkthrough: { icon: "␦", label: "Walkthrough", blurb: "Step-by-step screenshots", media: true },
};

const EMBED_FRAMES = ["browser", "phone", "tablet", "desktop", "bare"] as const;

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

/** Graphify — kick off a deep repo index (README, file tree, LLM-written
 * architecture/module docs) and watch its status. The pack lands in
 * Postgres and Rimuru reads it via the get_repo_doc tool. */
function GraphifyControl({ slug, repoUrl }: { slug: string; repoUrl: string | null }) {
  const [status, setStatus] = useState<"none" | "pending" | "indexing" | "ready" | "error">("none");
  const [detail, setDetail] = useState<string>("");
  // a check() that was already in flight when Graphify was clicked would
  // resolve with the PRE-click DB state and stomp the optimistic
  // "indexing" (killing the poll loop) — ignore stale reads briefly
  const startedAtRef = useRef(0);

  const check = useCallback(async () => {
    try {
      const res = await fetch(`/api/repo-index?slug=${encodeURIComponent(slug)}`);
      if (res.status === 401) {
        setStatus("error");
        setDetail("session expired — reload /studio");
        return;
      }
      const d = await res.json();
      if (!res.ok) return;
      if (Date.now() - startedAtRef.current < 4000 && d.status !== "indexing" && d.status !== "pending") return;
      setStatus(d.status ?? "none");
      if (d.status === "ready") {
        setDetail(`${d.docTitles?.length ?? 0} docs · ${d.updatedTs ? new Date(d.updatedTs).toLocaleString() : ""}`);
      } else if (d.status === "error") {
        setDetail(d.error ?? "failed");
      } else {
        setDetail("");
      }
    } catch {
      /* status stays as-is; next poll retries */
    }
  }, [slug]);

  useEffect(() => {
    // fetch-on-mount status check — every setState in check() happens after
    // an await, not synchronously; same pattern as panels.tsx's refresh().
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: async fetch-on-mount, not a cascading render
    check();
  }, [check]);

  useEffect(() => {
    if (status !== "indexing" && status !== "pending") return;
    const t = setInterval(check, 3000);
    return () => clearInterval(t);
  }, [status, check]);

  const start = async () => {
    if (!repoUrl) return;
    startedAtRef.current = Date.now();
    setStatus("indexing");
    setDetail("");
    try {
      const res = await fetch("/api/repo-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, repoUrl }),
      });
      if (!res.ok) {
        const d = await res.json();
        setStatus("error");
        setDetail(d.error ?? "couldn't start");
      }
    } catch {
      setStatus("error");
      setDetail("couldn't start");
    }
  };

  const clear = async () => {
    try {
      const res = await fetch("/api/repo-index", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        setStatus("none");
        setDetail("");
      }
    } catch {
      /* leave state as-is */
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-ln px-3 py-2.5">
      <div className="min-w-0">
        <span className="font-sans text-[13px] text-ink">Repo knowledge (graphify)</span>
        <p className="truncate font-mono text-[10px] text-mut">
          {!repoUrl
            ? "Set a repo URL first"
            : status === "indexing" || status === "pending"
              ? "Indexing — reading the tree, manifests and writing docs…"
              : status === "ready"
                ? `Ready · ${detail}`
                : status === "error"
                  ? `Failed · ${detail}`
                  : "Not indexed yet — Rimuru only knows the case study"}
        </p>
      </div>
      <div className="flex flex-none items-center gap-1.5">
        {(status === "ready" || status === "error") && (
          <Btn variant="danger" onClick={clear}>
            Clear
          </Btn>
        )}
        <Btn onClick={start} disabled={!repoUrl || status === "indexing" || status === "pending"}>
          {status === "indexing" || status === "pending" ? "Indexing…" : status === "ready" ? "Re-index" : "Graphify"}
        </Btn>
      </div>
    </div>
  );
}

/** Live preview of whatever URL is in a media field — the editor shows the
 * actual image/video, not just a URL string, so "did I add the right photo?"
 * is answered at a glance. */
function MediaThumb({ src }: { src?: string }) {
  const [broken, setBroken] = useState(false);
  const isVideo = !!src && (/\.(mp4|webm|mov)(\?|#|$)/i.test(src) || /\/video\/upload\//.test(src));
  const isEmbeddable = !!src && /^https?:\/\//.test(src) && !isVideo;
  if (!src)
    return (
      <div className="flex h-16 w-24 flex-none items-center justify-center rounded-lg border border-dashed border-ln font-mono text-[8px] tracking-[0.12em] text-mut">
        NO MEDIA
      </div>
    );
  if (broken || (!isVideo && !isEmbeddable))
    return (
      <div className="flex h-16 w-24 flex-none items-center justify-center rounded-lg border border-ln font-mono text-[8px] tracking-[0.12em] text-mut">
        LINK
      </div>
    );
  return isVideo ? (
    <video src={src} muted playsInline preload="metadata" className="h-16 w-24 flex-none rounded-lg border border-ln object-cover" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-pasted hosts; next/image would 500 on any host missing from remotePatterns
    <img src={src} alt="" onError={() => setBroken(true)} className="h-16 w-24 flex-none rounded-lg border border-ln object-cover" />
  );
}

/** Tag-pill editor for the chips block — type, press Enter, get a pill.
 * Far closer to how every other CMS does tags than generic item rows. */
function ChipsEditor({ items, onChange }: { items: BlockItem[]; onChange: (items: BlockItem[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, { text }]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span
            key={i}
            className="flex items-center gap-1.5 rounded-full border border-ln px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ink"
          >
            {it.text || "—"}
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-mut hover:text-red-400"
              aria-label={`Remove ${it.text}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <TextInput
          value={draft}
          placeholder="Type a technology and press Enter — e.g. Next.js, CUDA, Postgres"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Btn onClick={add}>Add</Btn>
      </div>
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
  const meta = BLOCK_META[type];
  const addLabel =
    type === "gallery" ? "+ Photo" : type === "video" ? "+ Video" : type === "walkthrough" ? "+ Step" : "+ Item";
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-ln p-3">
          <div className="mb-2 flex items-center justify-between">
            {meta.media ? <MediaThumb src={it.src} /> : <span />}
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
              ) : type === "embed" && f.key === "label" ? (
                <Field key={f.key} label="Device frame" hint="ignored for Appetize URLs — they ship their own">
                  <Select
                    value={(it.label as string) || "browser"}
                    onChange={(v) => set(i, "label", v)}
                    options={EMBED_FRAMES.map((fr) => ({ value: fr, label: fr[0].toUpperCase() + fr.slice(1) }))}
                  />
                </Field>
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
      <Btn onClick={() => onChange([...items, {}])}>{addLabel}</Btn>
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
  const meta = BLOCK_META[block.type];
  return (
    <div className="rounded-xl border border-ln p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-ln font-mono text-[13px]"
            style={{ color: meta.media ? "var(--acc)" : "var(--mut)" }}
          >
            {meta.icon}
          </span>
          <span className="font-mono text-[10px] tracking-[0.16em] text-acc uppercase">{meta.label}</span>
          {block.items.length > 0 && (
            <span className="font-mono text-[9px] text-mut">· {block.items.length}</span>
          )}
        </span>
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

      {block.type === "chips" ? (
        <div className="mt-3">
          <ChipsEditor items={block.items} onChange={(items) => onChange({ ...block, items })} />
        </div>
      ) : (
        ITEM_FIELDS[block.type].length > 0 && (
          <div className="mt-3">
            <ItemsEditor type={block.type} items={block.items} onChange={(items) => onChange({ ...block, items })} />
          </div>
        )
      )}
    </div>
  );
}

/** One-click visual block picker — media types (photos, video, live embed,
 * demo, walkthrough) get accent treatment so they're impossible to miss. */
function AddBlock({ onAdd }: { onAdd: (t: BlockType) => void }) {
  return (
    <div>
      <span className="mb-2 block font-mono text-[10px] tracking-[0.16em] text-mut uppercase">Add a section</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {BLOCK_TYPES.map((b) => {
          const meta = BLOCK_META[b.type];
          return (
            <button
              key={b.type}
              onClick={() => onAdd(b.type)}
              className="group flex items-start gap-2.5 rounded-xl border border-ln p-3 text-left transition-colors hover:border-acc"
            >
              <span
                className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-ln font-mono text-[14px] transition-colors group-hover:border-acc"
                style={{ color: meta.media ? "var(--acc)" : "var(--mut)" }}
              >
                {meta.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[13px] font-medium text-ink">{meta.label}</span>
                <span className="block truncate font-sans text-[11px] text-mut">{meta.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
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
            <Field label="Repo URL" hint="github.com/owner/repo — Rimuru reads the README + file tree to answer real questions">
              <TextInput value={p.repoUrl ?? ""} spellCheck={false} onChange={(e) => patch(p.slug, { repoUrl: e.target.value || null })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="One-liner">
                <TextInput value={p.oneLiner} onChange={(e) => patch(p.slug, { oneLiner: e.target.value })} />
              </Field>
            </div>
            <Field label="Hero image" hint="paste a URL or upload">
              <div className="flex items-center gap-2">
                <MediaThumb src={p.image} />
                <TextInput value={p.image} spellCheck={false} onChange={(e) => patch(p.slug, { image: e.target.value })} />
                <MediaUpload onDone={(url) => patch(p.slug, { image: url })} />
              </div>
            </Field>
            <Field label="Gradient (CSS)">
              <TextInput value={p.gradient} spellCheck={false} onChange={(e) => patch(p.slug, { gradient: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4">
            <Toggle checked={p.featured} onChange={(v) => patch(p.slug, { featured: v })} label="Featured on home" />
          </div>
          <div className="mt-4">
            <GraphifyControl slug={p.slug} repoUrl={p.repoUrl} />
          </div>
        </Card>

        <Card title="Hero stats" desc="The persistent pill on the detail page. Up to four reads best.">
          <StatsEditor stats={p.heroStats} onChange={(heroStats) => patch(p.slug, { heroStats })} />
        </Card>

        <Card
          title="Case study sections"
          desc="The body of the project page — photos, videos, live embeds, launch-demo cards, walkthroughs, tech tags, stats, prose. Add from the grid below, reorder with the arrows, upload media straight to Cloudinary from any media field. For a mobile app, add a Live embed and paste an appetize.io stream URL — real Android/iOS emulation, no screen recording needed."
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
  let applied = oldSlug;
  setProjects((ps) => {
    // a slug that collides with another project would merge their
    // identities — every subsequent patch/delete/repo-index would hit both
    if (ps.some((p) => p.slug === slug && p.slug !== oldSlug)) return ps;
    applied = slug || oldSlug;
    return ps.map((p) => (p.slug === oldSlug ? { ...p, slug: applied } : p));
  });
  setEditing(applied);
}
