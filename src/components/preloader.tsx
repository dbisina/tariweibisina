"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";

const MIN_DURATION_MS = 3050;

/** Signature written out letter by letter (Logo variant="draw"), with a
 * small live percentage counting up beside it. Exits by lifting the whole
 * screen with a clip-path curtain. */
export function Preloader({ onDone }: { onDone: () => void }) {
  const [lifting, setLifting] = useState(false);
  const [pct, setPct] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setPct(Math.min(100, Math.round((elapsed / MIN_DURATION_MS) * 100)));
    }, 40);

    const lift = window.setTimeout(() => {
      window.clearInterval(interval);
      setPct(100);
      setLifting(true);
    }, MIN_DURATION_MS);
    const done = window.setTimeout(onDone, MIN_DURATION_MS + 850);

    return () => {
      window.clearInterval(interval);
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
      <div className="relative flex items-start gap-3">
        <Logo variant="draw" drawDelay={0.15} className="w-[min(680px,74vw)] h-auto text-ink" />
        <span className="mt-1 font-mono text-[11px] tabular-nums tracking-[0.12em] text-mut">
          {String(pct).padStart(3, "0")}%
        </span>
      </div>
    </div>
  );
}
