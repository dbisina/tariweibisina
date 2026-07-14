"use client";

import { useEffect, useState } from "react";
import { useSiteStore } from "@/lib/store";
import { currentTrackTitle, isClassicalPlaying, toggleClassicalAudio } from "@/lib/classical-audio";

/** Small floating pill — only shown in Classical mode — so a visitor can
 * pause/resume the day's piece without hunting for a volume control. */
export function ClassicalPlayerControl() {
  const audioMode = useSiteStore((s) => s.audioMode);
  const [playing, setPlaying] = useState(true);
  const title = currentTrackTitle();

  useEffect(() => {
    if (audioMode === "classical") setPlaying(isClassicalPlaying());
  }, [audioMode]);

  if (audioMode !== "classical" || !title) return null;

  return (
    <button
      onClick={() => setPlaying(toggleClassicalAudio())}
      aria-label={playing ? "Pause music" : "Play music"}
      className="fixed bottom-[6.5rem] right-5 z-[430] flex max-w-[220px] items-center gap-2 rounded-full border border-ln bg-bg/90 px-3.5 py-2 backdrop-blur-md transition-colors hover:border-acc"
    >
      <span className="flex-none font-mono text-[11px] text-acc">{playing ? "⏸" : "▶"}</span>
      <span className="truncate font-mono text-[10px] tracking-[0.08em] text-mut">{title}</span>
    </button>
  );
}
