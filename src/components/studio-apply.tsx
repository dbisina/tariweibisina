"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStudioStore } from "@/lib/studio";

/**
 * Two studio-driven, site-wide effects that don't belong in RealmSync:
 *  1. Analytics capture — logs a pageview into the Studio store on every route
 *     change (path + referrer), powering the dashboard's visitor view.
 *  2. Motion preference — the Appearance "motion" setting flips a root
 *     data-attribute and, at "off", a global animation kill-switch.
 */
export function StudioApply() {
  const pathname = usePathname();
  const motion = useStudioStore((s) => s.config.appearance.motion);
  const logView = useStudioStore((s) => s.logView);

  // pageview per route change
  useEffect(() => {
    if (!pathname || pathname.startsWith("/studio")) return; // don't count admin
    const ref = document.referrer && !document.referrer.includes(location.host)
      ? new URL(document.referrer).hostname
      : "";
    logView(pathname, ref);
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

  return null;
}
