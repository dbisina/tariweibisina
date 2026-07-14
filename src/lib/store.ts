"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Realm = "light" | "dark";
export type Path = "engineer" | "business";

interface SiteState {
  realm: Realm | null;
  path: Path | null;
  hasEnteredBefore: boolean;
  hasCompletedPreload: boolean;
  setRealm: (realm: Realm) => void;
  setPath: (path: Path) => void;
  completePreload: () => void;
}

export const useSiteStore = create<SiteState>()(
  persist(
    (set) => ({
      realm: null,
      path: null,
      hasEnteredBefore: false,
      hasCompletedPreload: false,
      setRealm: (realm) => set({ realm, hasEnteredBefore: true }),
      setPath: (path) => set({ path }),
      completePreload: () => set({ hasCompletedPreload: true }),
    }),
    {
      name: "tariwei-site-state",
      // Daniel: realm must be chosen fresh every visit — only remember THAT
      // someone has been here (for the "welcome back" line).
      partialize: (state) => ({
        hasEnteredBefore: state.hasEnteredBefore,
      }),
      // v1 drops realm/audioMode that older visits persisted; without the
      // bump zustand merges the stale values back in on rehydrate
      version: 1,
      migrate: (persisted) => ({
        hasEnteredBefore: Boolean(
          (persisted as { hasEnteredBefore?: boolean } | undefined)?.hasEnteredBefore
        ),
      }),
    }
  )
);
