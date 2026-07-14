"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ResearchEntry } from "@/lib/research";

/** On scroll into view the image reveals first, the text follows a beat
 * later — even rows: image left, details right; odd rows: inverted. */
export function ResearchCard({
  entry,
  index,
}: {
  entry: ResearchEntry;
  index: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [revealed, setRevealed] = useState(false);
  const inverted = index % 2 === 1;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && (setRevealed(true), io.disconnect()),
      { rootMargin: "-12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      href={`/engineer/research/${entry.slug}`}
      className={`group grid grid-cols-1 items-center gap-8 border-t border-ln py-14 md:grid-cols-2 md:gap-14 ${
        inverted ? "md:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div
        className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        style={{
          backgroundImage: revealed ? `url(${entry.image})` : undefined,
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateY(0)" : "translateY(28px)",
          transition: "opacity .7s ease, transform .7s ease",
        }}
      />
      <div
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateY(0)" : "translateY(28px)",
          transition: "opacity .7s ease .18s, transform .7s ease .18s",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.16em] text-acc">{entry.tag}</span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-mut">{entry.publication}</span>
        </div>
        <h2 className="mt-3 font-display text-2xl font-medium leading-[1.1] tracking-tight text-ink transition-colors group-hover:text-acc md:text-3xl">
          {entry.title}
        </h2>
        {!inverted && (
          <p className="mt-4 max-w-md font-sans text-[15px] leading-relaxed text-mut">
            {entry.summary}
          </p>
        )}
        <span className="mt-5 inline-flex font-mono text-[11px] tracking-[0.12em] text-acc opacity-0 transition-opacity group-hover:opacity-100">
          READ THE NOTE →
        </span>
      </div>
    </Link>
  );
}
