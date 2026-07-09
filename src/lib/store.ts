"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Realm = "light" | "dark";
export type AudioMode = "none" | "zen" | "classical";

interface SiteState {
  realm: Realm | null;
  audioMode: AudioMode | null;
  hasEnteredBefore: boolean;
  hasCompletedPreload: boolean;
  setRealm: (realm: Realm) => void;
  setAudioMode: (mode: AudioMode) => void;
  completePreload: () => void;
}

export const useSiteStore = create<SiteState>()(
  persist(
    (set) => ({
      realm: null,
      audioMode: null,
      hasEnteredBefore: false,
      hasCompletedPreload: false,
      setRealm: (realm) => set({ realm, hasEnteredBefore: true }),
      setAudioMode: (audioMode) => set({ audioMode }),
      completePreload: () => set({ hasCompletedPreload: true }),
    }),
    {
      name: "tariwei-site-state",
      partialize: (state) => ({
        realm: state.realm,
        audioMode: state.audioMode,
        hasEnteredBefore: state.hasEnteredBefore,
      }),
    }
  )
);
