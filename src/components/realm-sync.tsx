"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSiteStore } from "@/lib/store";
import { useStudioStore, tokensToCssVars } from "@/lib/studio";

/**
 * Applies the chosen realm's token values directly as inline custom
 * properties on the document root. Token values come from the Studio store
 * (the CMS), so an Appearance edit in /studio recolors the whole site live;
 * absent any edit the Studio defaults equal the shipped palette, so this is a
 * faithful no-op out of the box.
 *
 * Properties are set imperatively rather than via the [data-realm] attribute
 * cascade — descendants weren't reliably picking up an attribute-selector
 * override otherwise. The attribute is still toggled for the realm-select
 * cards' locally-scoped previews.
 */
export function RealmSync() {
  const pathname = usePathname();
  const realm = useSiteStore((s) => s.realm);
  const setRealm = useSiteStore((s) => s.setRealm);
  const appearance = useStudioStore((s) => s.config.appearance);

  // The "choose your realm" ceremony (WebGL gate) lives only on "/" — see
  // src/app/page.tsx. A deep link straight into any other route (a shared
  // project URL, a hard refresh, a search hit) never passes through it, so
  // realm stays null forever and Rimuru/theme/sound (all gated on realm)
  // stay inert. Give those loads a silent default instead of the full gate.
  useEffect(() => {
    if (realm || pathname === "/") return;
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    setRealm(prefersLight ? "light" : "dark");
  }, [realm, pathname, setRealm]);

  useEffect(() => {
    const r = realm ?? "dark";
    const tokens = tokensToCssVars(appearance[r]);
    const root = document.documentElement;
    for (const [key, value] of Object.entries(tokens)) {
      root.style.setProperty(key, value);
    }
    root.style.setProperty("--radius", `${appearance.radius}px`);
    if (r === "light") root.setAttribute("data-realm", "light");
    else root.removeAttribute("data-realm");
  }, [realm, appearance]);

  return null;
}
