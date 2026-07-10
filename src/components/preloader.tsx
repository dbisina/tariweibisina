"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";

const MIN_DURATION_MS = 3050;

/** Signature written out letter by letter (Logo variant="draw"), with a
 * small live percentage counting up beside it. Exit is a curtain raise: the
 * black panel lifts, and an orange band (bottom third) sweeps up trailing
 * behind it, on a slower timing. */
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
    // slower curtain: black ~1.15s, orange band trails to ~1.65s
    const done = window.setTimeout(onDone, MIN_DURATION_MS + 1650);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(lift);
      window.clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[500] overflow-hidden">
      {/* orange band — bottom third, sweeps up behind the black, delayed */}
      <div
        className="absolute inset-x-0 bottom-0 bg-acc"
        style={{
          height: "30vh",
          transform: lifting ? "translateY(-135vh)" : "translateY(0)",
          transition: "transform 1.35s cubic-bezier(0.7, 0, 0.2, 1) 0.28s",
        }}
      />
      {/* black curtain with the signature */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-bg"
        style={{
          transform: lifting ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 1.15s cubic-bezier(0.7, 0, 0.2, 1)",
        }}
      >
        <div className="relative flex items-start gap-3">
          <Logo variant="draw" drawDelay={0.15} className="w-[min(680px,74vw)] h-auto text-ink" />
          <span className="mt-1 font-mono text-[11px] tabular-nums tracking-[0.12em] text-mut">
            {String(pct).padStart(3, "0")}%
          </span>
        </div>
      </div>
    </div>
  );
}
