"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { RESEARCH_ENTRIES } from "@/lib/research";

/**
 * Research list — alternating cards, whole card clickable to its own
 * internal detail page (never an external reference):
 *  - even rows:  image left, details right — title, publication, full summary.
 *  - odd rows:   inverted — image right, details left, lighter (title +
 *    publication only), continuing that same orientation onto the detail page.
 * On scroll into view the image reveals first, the text follows a beat later.
 */

function ResearchCard({
  entry,
  index,
}: {
  entry: (typeof RESEARCH_ENTRIES)[number];
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
          backgroundImage: `url(${entry.image})`,
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

export default function ResearchPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1500px] px-4 pt-40 pb-32 md:px-6">
        <p className="font-mono text-[10px] tracking-[0.24em] text-acc">FOR ENGINEERS</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-ink">
          Research.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg text-mut">
          Working notes and longer investigations — the unpolished thinking behind the shipped
          systems.
        </p>

        <div className="mt-16 border-b border-ln">
          {RESEARCH_ENTRIES.map((entry, i) => (
            <ResearchCard key={entry.slug} entry={entry} index={i} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
