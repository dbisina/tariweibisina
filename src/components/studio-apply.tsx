"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStudioStore, type StudioConfig } from "@/lib/studio";

/**
 * Site-wide effects that don't belong in RealmSync:
 *  1. Analytics capture — logs a pageview into the Studio store on every route
 *     change (path + referrer), powering the dashboard's visitor view.
 *  2. Motion preference — the Appearance "motion" setting flips a root
 *     data-attribute and, at "off", a global animation kill-switch.
 *  3. Config hydration from Postgres — the DB is the source of truth (see
 *     lib/db.ts, lib/studio.ts's publish()), localStorage is just a
 *     same-browser instant-edit cache until the next Publish. Sequenced as
 *     one effect on purpose: the full Studio config loads first, then the
 *     /adspot WhatsApp override is layered on top of *that* — two separate
 *     effects would race and the ad override could get clobbered if the
 *     studio-config fetch resolved second.
 */
export function StudioApply() {
  const pathname = usePathname();
  const motion = useStudioStore((s) => s.config.appearance.motion);
  const logView = useStudioStore((s) => s.logView);
  const setConfig = useStudioStore((s) => s.setConfig);

  // pageview per route change
  useEffect(() => {
    if (!pathname || pathname.startsWith("/studio")) return; // don't count admin
    const ref = document.referrer && !document.referrer.includes(location.host)
      ? new URL(document.referrer).hostname
      : "";
    logView(pathname, ref);
    // best-effort server-side log for the WhatsApp weekly digest; never blocks the page
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, ref }),
    }).catch(() => {});
  }, [pathname, logView]);

  // motion preference
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = motion;
    let style: HTMLStyleElement | null = null;
    if (motion === "off") {
      style = document.createElement("style");
      style.id = "studio-motion-off";
      style.textContent =
        "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}";
      document.head.appendChild(style);
    }
    return () => {
      style?.remove();
    };
  }, [motion]);

  // DB config hydration, sequenced: whole Studio config first, then the
  // small /adspot override on top — see the block comment above.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/studio-config");
        const d = r.ok ? await r.json() : null;
        if (!cancelled && d?.config) {
          setConfig((c) => ({ ...c, ...(d.config as Partial<StudioConfig>) }));
        }
      } catch {
        // no DB configured, or the fetch failed — localStorage stays authoritative
      }
      try {
        const r = await fetch("/api/ad-config");
        const d = r.ok ? await r.json() : null;
        if (!cancelled && d?.config) {
          setConfig((c) => ({ ...c, content: { ...c.content, ad: { ...c.content.ad, ...d.config } } }));
        }
      } catch {
        // ditto
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
