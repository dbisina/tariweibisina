"use client";

import { useEffect } from "react";
import { useSiteStore, type Realm } from "@/lib/store";

const TOKENS: Record<Realm, Record<string, string>> = {
  dark: {
    "--bg": "#0b0b0c",
    "--ink": "#f4f3ef",
    "--mut": "#8b8a84",
    "--ln": "rgba(244, 243, 239, 0.13)",
    "--acc": "#ff5a2c",
    "--acc-2": "#ff4a1c",
  },
  light: {
    "--bg": "#f3f1eb",
    "--ink": "#131316",
    "--mut": "#6f6e68",
    "--ln": "rgba(19, 19, 22, 0.12)",
    "--acc": "#e8430f",
    "--acc-2": "#ff5a2c",
  },
};

/**
 * Applies the chosen realm's token values directly as inline custom
 * properties on the document root. The [data-realm="light"] attribute
 * selector in globals.css is left in place (used for the realm-select
 * cards' locally-scoped previews, which apply it to an isolated subtree),
 * but for the site-wide switch we set properties imperatively rather than
 * relying on attribute-selector cascade — descendants weren't reliably
 * picking up the override otherwise.
 */
export function RealmSync() {
  const realm = useSiteStore((s) => s.realm);

  useEffect(() => {
    const tokens = TOKENS[realm ?? "dark"];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(tokens)) {
      root.style.setProperty(key, value);
    }
    if (realm === "light") {
      root.setAttribute("data-realm", "light");
    } else {
      root.removeAttribute("data-realm");
    }
  }, [realm]);

  return null;
}
