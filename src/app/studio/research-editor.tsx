"use client";

import { useRef, useState } from "react";
import { useStudioStore } from "@/lib/studio";
import type { ResearchEntry } from "@/lib/research";
import { Field, TextInput, TextArea, Btn, Card } from "./ui";

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

// upload a real file to /api/upload (Cloudinary) and hand back the URL —
// same helper as projects-editor.tsx's MediaUpload
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
        accept="image/*"
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

function BodyEditor({ body, onChange }: { body: string[]; onChange: (b: string[]) => void }) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= body.length) return;
    const next = [...body];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {body.map((para, i) => (
        <div key={i} className="rounded-lg border border-ln p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-[0.14em] text-mut uppercase">Paragraph {i + 1}</span>
            <MoveDelete
              onUp={i > 0 ? () => move(i, -1) : undefined}
              onDown={i < body.length - 1 ? () => move(i, 1) : undefined}
              onDelete={() => onChange(body.filter((_, j) => j !== i))}
            />
          </div>
          <TextArea value={para} onChange={(e) => onChange(body.map((x, j) => (j === i ? e.target.value : x)))} />
        </div>
      ))}
      <Btn onClick={() => onChange([...body, ""])}>+ Paragraph</Btn>
    </div>
  );
}

// unique-ish slug for a new entry
function nid(): string {
  return "note-" + Math.abs((Math.random() * 1e6) | 0).toString(36);
}

export function ResearchPanel() {
  const research = useStudioStore((s) => s.config.research);
  const setConfig = useStudioStore((s) => s.setConfig);
  const resetResearch = useStudioStore((s) => s.resetResearch);
  const [editing, setEditing] = useState<string | null>(null);

  const setResearch = (fn: (r: ResearchEntry[]) => ResearchEntry[]) =>
    setConfig((c) => ({ ...c, research: fn(c.research) }));
  const patch = (slug: string, up: Partial<ResearchEntry>) =>
    setResearch((rs) => rs.map((r) => (r.slug === slug ? { ...r, ...up } : r)));

  const move = (i: number, d: number) =>
    setResearch((rs) => {
      const j = i + d;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addEntry = () => {
    const slug = nid();
    const entry: ResearchEntry = {
      slug,
      title: "New research note",
      publication: "Working note · 2026",
      tag: "TAG",
      summary: "",
      image: `https://picsum.photos/seed/${slug}/1024/704`,
      body: [""],
    };
    setResearch((rs) => [...rs, entry]);
    setEditing(slug);
  };

  const active = research.find((r) => r.slug === editing) ?? null;

  if (active) {
    const r = active;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Btn onClick={() => setEditing(null)}>← All research</Btn>
          <span className="font-mono text-[10px] tracking-[0.16em] text-mut uppercase">Editing · {r.title}</span>
        </div>

        <Card title="Meta" desc="Identity and media for this note. Publishing swaps in on /engineer/research and its own detail page.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Title">
                <TextInput value={r.title} onChange={(e) => patch(r.slug, { title: e.target.value })} />
              </Field>
            </div>
            <Field label="Slug" hint="URL path">
              <TextInput
                value={r.slug}
                spellCheck={false}
                onChange={(e) => {
                  const slug = e.target.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
                  setResearch((rs) => rs.map((x) => (x.slug === r.slug ? { ...x, slug } : x)));
                  setEditing(slug || r.slug);
                }}
              />
            </Field>
            <Field label="Tag" hint="e.g. GPU · RUNTIME">
              <TextInput value={r.tag} onChange={(e) => patch(r.slug, { tag: e.target.value })} />
            </Field>
            <Field label="Publication" hint="e.g. Working note · 2026">
              <TextInput value={r.publication} onChange={(e) => patch(r.slug, { publication: e.target.value })} />
            </Field>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="Image URL">
                  <TextInput value={r.image} spellCheck={false} onChange={(e) => patch(r.slug, { image: e.target.value })} />
                </Field>
              </div>
              <MediaUpload onDone={(url) => patch(r.slug, { image: url })} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Summary" hint="Shown on the list card and as the page's opening line">
                <TextArea value={r.summary} onChange={(e) => patch(r.slug, { summary: e.target.value })} />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Body" desc="Detail-page paragraphs, in order.">
          <BodyEditor body={r.body} onChange={(body) => patch(r.slug, { body })} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-[13px] text-mut">{research.length} research notes. Arrows reorder.</p>
        <div className="flex gap-2">
          <Btn onClick={resetResearch}>Reset to seed</Btn>
          <Btn variant="solid" onClick={addEntry}>
            + New note
          </Btn>
        </div>
      </div>
      {research.map((r, i) => (
        <div key={r.slug} className="flex items-center justify-between gap-3 rounded-xl border border-ln p-4">
          <div className="min-w-0">
            <span className="truncate font-display text-[15px] font-medium text-ink">{r.title}</span>
            <div className="font-mono text-[9px] tracking-[0.14em] text-mut uppercase">
              {r.tag} · {r.body.length} paragraphs
            </div>
          </div>
          <div className="flex flex-none items-center gap-1">
            <MoveDelete
              onUp={i > 0 ? () => move(i, -1) : undefined}
              onDown={i < research.length - 1 ? () => move(i, 1) : undefined}
              onDelete={() => setResearch((rs) => rs.filter((x) => x.slug !== r.slug))}
            />
            <Btn onClick={() => setEditing(r.slug)}>Edit</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}
