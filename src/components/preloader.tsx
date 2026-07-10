"use client";

import { useEffect, useState } from "react";
import { Logo } from "./logo";

const MIN_DURATION_MS = 3050;

/** Signature draw-in from the reference prototype — strokes trace, then
 * fill. No progress bar / caption row (Daniel cut the underline). Exits by
 * lifting the whole screen with a clip-path curtain. */
export function Preloader({ onDone }: { onDone: () => void }) {
  const [lifting, setLifting] = useState(false);

  useEffect(() => {
    const lift = window.setTimeout(() => setLifting(true), MIN_DURATION_MS);
    const done = window.setTimeout(onDone, MIN_DURATION_MS + 850);
    return () => {
      window.clearTimeout(lift);
      window.clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-bg"
      style={{
        clipPath: lifting ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        transition: "clip-path 0.85s cubic-bezier(0.7, 0, 0.2, 1)",
      }}
    >
      <Logo variant="draw" drawDelay={0.15} className="w-[min(680px,74vw)] h-auto text-ink" />
    </div>
  );
}
