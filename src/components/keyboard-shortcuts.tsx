"use client";

/**
 * Global keyboard shortcuts:
 *   k / Space → open/close Rimuru chat (when not typing in an input/textarea)
 *   Escape    → close Rimuru chat / dismiss its bubble
 *
 * Dispatches custom events so Rimuru can listen without tight coupling.
 */

import { useEffect } from "react";

export function KeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      switch (e.key) {
        case "k":
        case "K":
          if (!inInput) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("rimuru:toggle"));
          }
          break;
        case " ":
          if (!inInput) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("rimuru:toggle"));
          }
          break;
        case "Escape":
          window.dispatchEvent(new CustomEvent("rimuru:close"));
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
