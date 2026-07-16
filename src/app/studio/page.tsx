"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStudioStore } from "@/lib/studio";
import { Logo } from "@/components/logo";
import { Btn } from "./ui";
import {
  OverviewPanel,
  AppearancePanel,
  ContentPanel,
  NavPanel,
  LeadsPanel,
  SettingsPanel,
} from "./panels";
import { ProjectsPanel } from "./projects-editor";
import { ResearchPanel } from "./research-editor";
import { ImportPanel } from "./import-panel";

/**
 * The Studio — Daniel's CMS + analytics console. Everything editable on the
 * public site is driven from here through the `useStudioStore` (persisted to
 * localStorage). Appearance edits recolor the live site, content edits swap
 * the home hero and ad, and the Overview/Leads panels surface the client-side
 * analytics captured by <StudioApply>.
 *
 * The gate is real, server-checked auth (see lib/studio-auth.ts + POST
 * /api/studio-auth): the password never reaches the client, and the session
 * is an httpOnly cookie, not anything readable from the JS bundle. `unlocked`
 * in the store is just a client-side "don't re-show the form" cache of that
 * server session, verified fresh on every mount below.
 */
const SECTIONS = [
  { id: "overview", label: "Overview", Panel: OverviewPanel },
  { id: "appearance", label: "Appearance", Panel: AppearancePanel },
  { id: "content", label: "Content", Panel: ContentPanel },
  { id: "nav", label: "Navigation", Panel: NavPanel },
  { id: "projects", label: "Projects", Panel: ProjectsPanel },
  { id: "research", label: "Research", Panel: ResearchPanel },
  { id: "import", label: "Import", Panel: ImportPanel },
  { id: "leads", label: "Leads", Panel: LeadsPanel },
  { id: "settings", label: "Settings", Panel: SettingsPanel },
] as const;

export default function StudioPage() {
  const unlocked = useStudioStore((s) => s.unlocked);
  const unlock = useStudioStore((s) => s.unlock);
  const lock = useStudioStore((s) => s.lock);
  const publish = useStudioStore((s) => s.publish);
  const publishState = useStudioStore((s) => s.publishState);
  const publishedAt = useStudioStore((s) => s.publishedAt);
  const [mounted, setMounted] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [active, setActive] = useState<(typeof SECTIONS)[number]["id"]>("overview");
  const [key, setKey] = useState("");
  const [err, setErr] = useState(false);

  // avoid a hydration mismatch: persisted `unlocked` only known client-side
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: this is the standard "detect client mount" pattern, no external system to synchronize with
  useEffect(() => setMounted(true), []);

  // real check, every mount: a stale/cleared server session (e.g. cookie
  // expired, or logged out on another device) must not trust the locally
  // cached `unlocked` flag on its own.
  useEffect(() => {
    fetch("/api/studio-auth")
      .then((r) => r.json())
      .then((d) => (d?.authed ? unlock() : lock())) // lock() is a no-op-safe reset when there's nothing to clear
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, [unlock, lock]);

  if (!mounted || checkingSession) return <div className="min-h-screen bg-[color:var(--bg)]" />;

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--bg)] px-6">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (submitting) return;
            setSubmitting(true);
            setErr(false);
            try {
              const res = await fetch("/api/studio-auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key }),
              });
              if (res.ok) unlock();
              else setErr(true);
            } catch {
              setErr(true);
            } finally {
              setSubmitting(false);
            }
          }}
          className="w-full max-w-sm text-center"
        >
          <Logo className="mx-auto h-5 w-auto" />
          <h1 className="mt-6 font-display text-2xl font-semibold text-ink">Studio</h1>
          <p className="mt-1 font-sans text-[13px] text-mut">Owner access only.</p>
          <input
            type="password"
            value={key}
            autoFocus
            onChange={(e) => {
              setKey(e.target.value);
              setErr(false);
            }}
            placeholder="Owner key"
            className="mt-6 w-full rounded-full border border-ln bg-transparent px-4 py-2.5 text-center font-sans text-base text-ink outline-none focus:border-acc"
          />
          {err && <p className="mt-2 font-mono text-[11px] text-red-400">Wrong key.</p>}
          <div className="mt-4 flex justify-center">
            <Btn variant="solid" type="submit" disabled={submitting}>
              {submitting ? "Checking…" : "Enter studio"}
            </Btn>
          </div>
          <Link href="/" className="mt-6 inline-block font-mono text-[10px] tracking-[0.16em] text-mut hover:text-ink">
            ← BACK TO SITE
          </Link>
        </form>
      </div>
    );
  }

  const ActivePanel = SECTIONS.find((s) => s.id === active)!.Panel;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-ink">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-8 px-5 py-8 md:flex-row md:px-8 md:py-12">
        {/* sidebar */}
        <aside className="md:w-52 md:flex-none">
          <div className="flex items-center justify-between md:block">
            <Link href="/" className="inline-flex items-center gap-2">
              <Logo className="h-4 w-auto" />
            </Link>
            <span className="font-mono text-[9px] tracking-[0.18em] text-mut md:mt-1 md:block">STUDIO · CMS</span>
          </div>
          <nav className="mt-6 flex gap-1.5 overflow-x-auto md:mt-8 md:flex-col md:overflow-visible">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex-none rounded-lg px-3 py-2 text-left font-sans text-[13.5px] transition-colors ${
                  active === s.id ? "bg-acc/12 text-ink" : "text-mut hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 border-t border-ln pt-4 md:mt-8">
            <Btn
              variant="solid"
              disabled={publishState === "publishing"}
              onClick={() => publish()}
            >
              {publishState === "publishing" ? "Publishing…" : "Publish"}
            </Btn>
            <p className="mt-2 font-mono text-[9.5px] tracking-[0.1em] text-mut">
              {publishState === "success" && publishedAt
                ? `Published ${new Date(publishedAt).toLocaleTimeString()}`
                : publishState === "error"
                  ? "Publish failed — check DATABASE_URL/STUDIO_ADMIN_KEY"
                  : "Pushes this config live for every visitor"}
            </p>
          </div>
        </aside>

        {/* panel */}
        <main className="min-w-0 flex-1">
          <header className="mb-6">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {SECTIONS.find((s) => s.id === active)!.label}
            </h2>
          </header>
          <ActivePanel />
        </main>
      </div>
    </div>
  );
}
