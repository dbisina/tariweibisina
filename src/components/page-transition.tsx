"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Curtain page transition. On every route change the black+orange column
 * (same look as the preloader exit, but NO logo — that's preloader-only)
 * snaps in covering the viewport, then raises off the top with the orange
 * tail trailing. Skips the very first load, where the preloader owns the
 * reveal.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [playKey, setPlayKey] = useState<string | null>(null);
  const first = useRef(true);
  const seq = useRef(0);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    seq.current += 1;
    setPlayKey(`${pathname}:${seq.current}`);
  }, [pathname]);

  return (
    <>
      {children}
      {playKey && (
        <div
          key={playKey}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[450] overflow-hidden"
        >
          <div
            className="curtain-raise absolute inset-x-0 top-0 flex flex-col"
            style={{ height: "130vh" }}
            onAnimationEnd={() => setPlayKey(null)}
          >
            <div className="h-screen bg-bg" />
            <div className="bg-acc" style={{ height: "30vh" }} />
          </div>
        </div>
      )}
    </>
  );
}
