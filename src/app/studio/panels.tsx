"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStudioStore, summarize, DEFAULT_TOKENS, type ThemeTokens, type Lead } from "@/lib/studio";
import type { Realm } from "@/lib/store";
import { Field, TextInput, TextArea, Select, ColorField, Toggle, Btn, Card } from "./ui";

// ── Overview / analytics ────────────────────────────────────────────────────

export function OverviewPanel() {
  const views = useStudioStore((s) => s.views);
  const leads = useStudioStore((s) => s.leads);
  const sum = useMemo(() => summarize(views), [views]);
  const maxDay = Math.max(1, ...sum.perDay.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat n={sum.total} label="Pageviews" />
        <Stat n={sum.unique} label="Active days" />
        <Stat n={leads.length} label="Leads" />
        <Stat n={sum.topPaths.length} label="Pages hit" />
      </div>

      <Card title="Traffic by day" desc="Live client-side capture — every route change on the public site is logged here.">
        {sum.perDay.length === 0 ? (
          <Empty>No visits recorded yet. Browse the site in another tab and they will appear.</Empty>
        ) : (
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {sum.perDay.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5" title={`${d.day}: ${d.count}`}>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-acc/70"
                    style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: 3 }}
                  />
                </div>
                <span className="font-mono text-[8px] text-mut">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Top pages">
          <RankList rows={sum.topPaths.map((p) => ({ label: p.path, count: p.count }))} />
        </Card>
        <Card title="Referrers">
          <RankList rows={sum.topRefs.map((r) => ({ label: r.ref, count: r.count }))} />
        </Card>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl border border-ln p-4">
      <div className="font-display text-[30px] font-semibold leading-none text-ink">{n}</div>
      <div className="mt-1.5 font-mono text-[9px] tracking-[0.16em] text-mut uppercase">{label}</div>
    </div>
  );
}

function RankList({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) return <Empty>Nothing yet.</Empty>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="relative overflow-hidden rounded-lg border border-ln px-3 py-1.5">
          <span
            className="absolute inset-y-0 left-0 bg-acc/10"
            style={{ width: `${(r.count / max) * 100}%` }}
          />
          <span className="relative flex items-center justify-between">
            <span className="truncate font-mono text-[12px] text-ink">{r.label}</span>
            <span className="ml-3 font-mono text-[12px] text-mut">{r.count}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center font-sans text-[13px] text-mut">{children}</p>;
}

// ── Appearance ──────────────────────────────────────────────────────────────

const TOKEN_ROWS: { key: keyof ThemeTokens; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "ink", label: "Text / ink" },
  { key: "mut", label: "Muted" },
  { key: "ln", label: "Hairline" },
  { key: "acc", label: "Accent" },
  { key: "acc2", label: "Accent 2" },
];

export function AppearancePanel() {
  const appearance = useStudioStore((s) => s.config.appearance);
  const setConfig = useStudioStore((s) => s.setConfig);
  const [realm, setRealm] = useState<Realm>("dark");
  const tokens = appearance[realm];

  const setToken = (key: keyof ThemeTokens, value: string) =>
    setConfig((c) => ({
      ...c,
      appearance: { ...c.appearance, [realm]: { ...c.appearance[realm], [key]: value } },
    }));

  return (
    <div className="space-y-6">
      <Card
        title="Theme tokens"
        desc="Recolors the whole site live. Switch the realm you're editing; changes apply instantly wherever that realm is active."
      >
        <div className="mb-4 inline-flex rounded-full border border-ln p-0.5">
          {(["dark", "light"] as Realm[]).map((r) => (
            <button
              key={r}
              onClick={() => setRealm(r)}
              className={`rounded-full px-4 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors ${
                realm === r ? "bg-acc text-[color:var(--bg)]" : "text-mut hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {TOKEN_ROWS.map((t) => (
            <ColorField key={t.key} label={t.label} value={tokens[t.key]} onChange={(v) => setToken(t.key, v)} />
          ))}
        </div>

        <div className="mt-4">
          <Btn onClick={() => setConfig((c) => ({ ...c, appearance: { ...c.appearance, [realm]: { ...DEFAULT_TOKENS[realm] } } }))}>
            Reset {realm} palette
          </Btn>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Corner radius" desc="Drives the --radius token used by cards and panels.">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={28}
              value={appearance.radius}
              onChange={(e) =>
                setConfig((c) => ({ ...c, appearance: { ...c.appearance, radius: Number(e.target.value) } }))
              }
              className="flex-1 accent-[color:var(--acc)]"
            />
            <span className="w-12 text-right font-mono text-[13px] text-ink">{appearance.radius}px</span>
          </div>
        </Card>

        <Card title="Motion" desc="Global animation intensity for visitors.">
          <Select
            value={appearance.motion}
            onChange={(v) =>
              setConfig((c) => ({ ...c, appearance: { ...c.appearance, motion: v as "full" | "reduced" | "off" } }))
            }
            options={[
              { value: "full", label: "Full — all animation" },
              { value: "reduced", label: "Reduced — respect prefers-reduced-motion" },
              { value: "off", label: "Off — kill animation globally" },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

// ── Content ─────────────────────────────────────────────────────────────────

export function ContentPanel() {
  const content = useStudioStore((s) => s.config.content);
  const setConfig = useStudioStore((s) => s.setConfig);
  const set = (patch: Partial<typeof content>) =>
    setConfig((c) => ({ ...c, content: { ...c.content, ...patch } }));
  const setAd = (patch: Partial<typeof content.ad>) =>
    setConfig((c) => ({ ...c, content: { ...c.content, ad: { ...c.content.ad, ...patch } } }));

  return (
    <div className="space-y-6">
      <Card title="Hero & about" desc="Headline copy shown on the home page.">
        <div className="space-y-4">
          <Field label="Hero line">
            <TextInput value={content.heroTop} onChange={(e) => set({ heroTop: e.target.value })} />
          </Field>
          <Field label="Name">
            <TextInput value={content.heroName} onChange={(e) => set({ heroName: e.target.value })} />
          </Field>
          <Field label="About lede">
            <TextArea value={content.aboutLede} onChange={(e) => set({ aboutLede: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card title="Ad spot" desc="The sponsorship slot on the home page. Disable to remove it entirely (live).">
        <div className="space-y-4">
          <Toggle checked={content.ad.enabled} onChange={(v) => setAd({ enabled: v })} label="Show sponsorship slot" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Headline">
              <TextInput value={content.ad.headline} onChange={(e) => setAd({ headline: e.target.value })} />
            </Field>
            <Field label="Body">
              <TextInput value={content.ad.body} onChange={(e) => setAd({ body: e.target.value })} />
            </Field>
            <Field label="CTA label">
              <TextInput value={content.ad.ctaLabel} onChange={(e) => setAd({ ctaLabel: e.target.value })} />
            </Field>
            <Field label="CTA link">
              <TextInput value={content.ad.ctaHref} onChange={(e) => setAd({ ctaHref: e.target.value })} spellCheck={false} />
            </Field>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Navigation ──────────────────────────────────────────────────────────────

export function NavPanel() {
  const nav = useStudioStore((s) => s.config.nav);
  const setConfig = useStudioStore((s) => s.setConfig);
  const setItem = (i: number, patch: Partial<(typeof nav)[number]>) =>
    setConfig((c) => ({ ...c, nav: c.nav.map((n, j) => (j === i ? { ...n, ...patch } : n)) }));
  const remove = (i: number) => setConfig((c) => ({ ...c, nav: c.nav.filter((_, j) => j !== i) }));
  const add = () => setConfig((c) => ({ ...c, nav: [...c.nav, { label: "New", path: "/" }] }));

  return (
    <div className="space-y-4">
      <p className="font-sans text-[13px] text-mut">
        The site&apos;s primary navigation. Sublinks power the nav extension panel.
      </p>
      {nav.map((item, i) => (
        <div key={i} className="rounded-2xl border border-ln p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
              <Field label="Label">
                <TextInput value={item.label} onChange={(e) => setItem(i, { label: e.target.value })} />
              </Field>
            </div>
            <div className="min-w-[160px] flex-1">
              <Field label="Path">
                <TextInput value={item.path} onChange={(e) => setItem(i, { path: e.target.value })} spellCheck={false} />
              </Field>
            </div>
            <Btn variant="danger" onClick={() => remove(i)}>
              Remove
            </Btn>
          </div>
          {item.sub && item.sub.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-ln pt-3">
              {item.sub.map((sl, k) => (
                <div key={k} className="flex items-center gap-2">
                  <TextInput
                    value={sl.label}
                    onChange={(e) =>
                      setItem(i, { sub: item.sub!.map((s, j) => (j === k ? { ...s, label: e.target.value } : s)) })
                    }
                    className="flex-1"
                  />
                  <TextInput
                    value={sl.path}
                    spellCheck={false}
                    onChange={(e) =>
                      setItem(i, { sub: item.sub!.map((s, j) => (j === k ? { ...s, path: e.target.value } : s)) })
                    }
                    className="flex-1"
                  />
                  <button
                    onClick={() => setItem(i, { sub: item.sub!.filter((_, j) => j !== k) })}
                    className="px-2 font-mono text-[13px] text-mut hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3">
            <Btn onClick={() => setItem(i, { sub: [...(item.sub ?? []), { label: "Sublink", path: "/" }] })}>
              + Sublink
            </Btn>
          </div>
        </div>
      ))}
      <Btn variant="solid" onClick={add}>
        + Add nav item
      </Btn>
    </div>
  );
}

// ── Leads ───────────────────────────────────────────────────────────────────

export function LeadsPanel() {
  const localLeads = useStudioStore((s) => s.leads);
  const adminKey = useStudioStore((s) => s.config.adminKey);
  const [serverLeads, setServerLeads] = useState<Lead[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setFetching(true);
    setFetchErr(null);
    try {
      const res = await fetch("/api/lead", {
        headers: adminKey ? { "x-studio-key": adminKey } : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchErr(
          res.status === 401
            ? "Unauthorized — set the studio admin key in Settings."
            : data?.error ?? "Fetch failed"
        );
      } else {
        setServerLeads(data.leads ?? []);
      }
    } catch {
      setFetchErr("Postgres unreachable or not configured — showing local leads only.");
    } finally {
      setFetching(false);
    }
  }, [adminKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Merge server (Postgres, durable, cross-device) with local (this browser's
  // ring buffer, always available) — dedupe by id, server wins on conflict
  // since it reflects what actually reached Daniel.
  const merged = useMemo(() => {
    const byId = new Map<string, Lead>();
    for (const l of localLeads) byId.set(l.id, l);
    for (const l of serverLeads) byId.set(l.id, l);
    return [...byId.values()].sort((a, b) => b.ts - a.ts);
  }, [localLeads, serverLeads]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(merged, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tariwei-leads.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-sans text-[13px] text-mut">
          Quotes, briefs and messages — structured by the LLM before they reach you.
          {serverLeads.length > 0 && " Synced from Postgres."}
        </p>
        <div className="flex gap-2">
          <Btn onClick={refresh}>{fetching ? "Syncing…" : "Refresh"}</Btn>
          <Btn onClick={exportJson}>Export JSON</Btn>
        </div>
      </div>
      {fetchErr && <p className="font-mono text-[11px] text-mut">{fetchErr}</p>}
      {merged.length === 0 ? (
        <Empty>No leads yet.</Empty>
      ) : (
        <div className="space-y-3">
          {merged.map((l) => (
            <div key={l.id} className="rounded-2xl border border-ln p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-ln px-2 py-0.5 font-mono text-[9px] tracking-[0.14em] text-acc uppercase">
                    {l.source}
                  </span>
                  <span className="font-display text-[15px] font-medium text-ink">{l.name || "Anonymous"}</span>
                </div>
                <span className="font-mono text-[11px] text-mut">{new Date(l.ts).toLocaleString()}</span>
              </div>
              <p className="mt-1 font-mono text-[12px] text-mut">{l.contact}</p>
              {l.brief ? (
                <div className="mt-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[8px] tracking-[0.14em] uppercase"
                      style={{
                        border: "1px solid var(--ln)",
                        color:
                          l.brief.priority === "high"
                            ? "var(--acc)"
                            : l.brief.priority === "medium"
                            ? "var(--acc-2)"
                            : "var(--mut)",
                      }}
                    >
                      {l.brief.priority}
                    </span>
                    <span className="font-display text-[13px] font-medium text-ink">{l.brief.title}</span>
                    <span className="font-mono text-[11px] text-mut">
                      · {l.brief.budget} · {l.brief.timeline}
                    </span>
                  </div>
                  <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-mut">{l.brief.summary}</p>
                  {l.brief.scope.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {l.brief.scope.map((s, i) => (
                        <li key={i} className="font-sans text-[12px] text-ink">
                          › {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <>
                  {l.budget && <p className="mt-1 font-sans text-[13px] text-ink">Budget: {l.budget}</p>}
                  {l.detail && <p className="mt-2 font-sans text-[13px] leading-relaxed text-mut">{l.detail}</p>}
                </>
              )}
              {l.channels && (
                <div className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1">
                  {(["telegram", "whatsapp", "email"] as const).map((c) => (
                    <span key={c} className="flex items-center gap-1 font-mono text-[9px] tracking-[0.12em] uppercase">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: l.channels?.[c] ? "var(--acc)" : "var(--ln)" }}
                      />
                      <span style={{ color: l.channels?.[c] ? "var(--ink)" : "var(--mut)" }}>{c}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────

export function SettingsPanel() {
  const ai = useStudioStore((s) => s.config.ai);
  const adminKey = useStudioStore((s) => s.config.adminKey);
  const setConfig = useStudioStore((s) => s.setConfig);
  const reset = useStudioStore((s) => s.resetConfig);
  const clear = useStudioStore((s) => s.clearAnalytics);
  const lock = useStudioStore((s) => s.lock);

  return (
    <div className="space-y-6">
      <Card
        title="AI assistant"
        desc="Which provider Rimuru uses. Auto picks Gemini when a server key is set, else the built-in local guide. The Gemini key itself is a server env var and never touches the browser."
      >
        <Field label="Provider">
          <Select
            value={ai.provider}
            onChange={(v) => setConfig((c) => ({ ...c, ai: { provider: v as "auto" | "gemini" | "local" } }))}
            options={[
              { value: "auto", label: "Auto (recommended)" },
              { value: "gemini", label: "Force Gemini" },
              { value: "local", label: "Force local guide" },
            ]}
          />
        </Field>
      </Card>

      <Card
        title="Leads access"
        desc="Only needed if the server has STUDIO_ADMIN_KEY set (see .env.example). Sent as x-studio-key when the Leads panel fetches the Postgres-backed list."
      >
        <Field label="Studio admin key">
          <TextInput
            type="password"
            value={adminKey ?? ""}
            onChange={(e) => setConfig((c) => ({ ...c, adminKey: e.target.value }))}
            placeholder="Leave blank if unset on the server"
            spellCheck={false}
          />
        </Field>
      </Card>

      <Card title="Danger zone" desc="Destructive. There is no undo.">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-ln px-3 py-2.5">
            <span className="font-sans text-[13px] text-ink">Clear all analytics & leads</span>
            <Btn variant="danger" onClick={clear}>
              Clear data
            </Btn>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-ln px-3 py-2.5">
            <span className="font-sans text-[13px] text-ink">Reset all content to defaults</span>
            <Btn variant="danger" onClick={reset}>
              Reset config
            </Btn>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-ln px-3 py-2.5">
            <span className="font-sans text-[13px] text-ink">Lock the studio</span>
            <Btn onClick={lock}>Lock</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
