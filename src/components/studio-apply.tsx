"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStudioStore } from "@/lib/studio";

/**
 * Site-wide effects that don't belong in RealmSync:
 *  1. Analytics capture — logs a pageview into the Studio store on every route
 *     change (path + referrer), powering the dashboard's visitor view.
 *  2. Motion preference — the Appearance "motion" setting flips a root
 *     data-attribute and, at "off", a global animation kill-switch.
 *  3. Ad override hydration — the /adspot WhatsApp command writes a
 *     server-side override (api/ad-config); pull it once on mount so a
 *     WhatsApp edit shows up on the live site without redeploying.
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

  // ad-slot override, set from WhatsApp — pulled once per load
  useEffect(() => {
    fetch("/api/ad-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { config?: Record<string, unknown> } | null) => {
        if (d?.config) setConfig((c) => ({ ...c, content: { ...c.content, ad: { ...c.content.ad, ...d.config } } }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
