"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStudioStore } from "@/lib/studio";
import type { ProjectDoc } from "@/lib/content";

/**
 * Selected-work grid — podium.global's card-flow, measured directly off the
 * live site (not guessed): a smoothed scroll value lags behind the real
 * scroll position, and each column reads that lag through its own signed
 * multiplier — alternating direction, decreasing magnitude column to column
 * (measured ratios ≈ -1, +0.8, -0.6, +0.5). During fast scrolling the lag
 * grows and each column drifts its own way; once scrolling settles, the lag
 * decays to zero and every card relaxes back into its resting grid position.
 * Four columns, two cards each, CMS-controlled (featured flags, else the
 * first eight by order).
 */

// every card the same proportions — the podium/deviate/80wintires reference
// grids read as uniform blocks, not a checkerboard of tall/wide sizes.
const ASPECT = "4/5";

// static top offset per column (px) — staggers the columns so their tops
// don't line up in one flat row, on top of the scroll-driven motion below.
const COL_OFFSET = [0, 90, 40, 130];

// signed multiplier per column, applied to the scroll lag (px) — kept
// deliberately tiny: the reference sites' parallax is a whisper, not a
// slide, and there's no opacity fade at all, just a near-still drift.
const COL_MULTIPLIER = [-1, 0.8, -0.6, 0.5];
const LAG_SCALE = 0.045;
const DAMPING = 0.07; // how quickly the smoothed value chases the real one

function FlowCard({ project }: { project: ProjectDoc }) {
  const category = project.tag.split("·")[1]?.trim() ?? project.tag;

  return (
    <Link
      href={`/projects/${project.slug}`}
      data-perch="FEATURED PROJECT"
      className="group relative block w-full overflow-hidden bg-[#101013]"
      style={{ aspectRatio: ASPECT }}
    >
      <div
        className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.045]"
        style={{ backgroundImage: `url(${project.image})` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{ background: "linear-gradient(to top, rgba(5,5,6,0.92) 0%, rgba(5,5,6,0.35) 55%, transparent 100%)" }}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-5">
        <h3 className="font-display text-lg font-bold uppercase leading-[1.02] tracking-[-0.01em] text-[#f4f3ef] md:text-2xl">
          {project.name}
        </h3>
        <div className="flex-none text-right font-mono text-[9.5px] leading-snug tracking-[0.1em] text-[#f4f3ef]/70">
          {project.year}
          <br />
          {category}
        </div>
      </div>
    </Link>
  );
}

export function FeaturedProjects() {
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const filteredY = useRef(0); // fast-follow: absorbs native scroll's step jumps into a continuous ramp
  const smoothedY = useRef(0); // slow-follow: chases filteredY — the gap between the two IS the lag
  const initialized = useRef(false);

  // the column-offset stagger + scroll-lag parallax is a 4-across desktop
  // art-direction detail — folded into 1 or 2 stacked columns on smaller
  // screens it reads as random dead whitespace and per-block jitter, not a
  // podium effect, so below lg it's plain, evenly-spaced, uniform cards.
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    // can't use a lazy useState initializer instead — matchMedia needs
    // `window`, which doesn't exist during SSR, and computing it eagerly on
    // the client's first render (but not the server's) is a hydration
    // mismatch; this one-time read on mount is the standard escape hatch
    // (same "detect client, then check" shape as the `mounted` pattern
    // elsewhere in this app, e.g. studio/page.tsx).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: matchMedia needs `window`, unavailable during SSR; avoids a hydration mismatch
    setDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => {
      setDesktop(e.matches);
      // crossing below lg mid-session: the rAF loop's direct DOM writes
      // (transform/opacity) would otherwise stick after it stops running
      if (!e.matches) {
        colRefs.current.forEach((col) => {
          if (!col) return;
          col.style.transform = "";
          col.style.opacity = "";
        });
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // CMS-controlled selection: featured flags, else the first eight projects.
  const all = useStudioStore((s) => s.config.projects);
  const featured = all.filter((p) => p.featured);
  const PICKS = (featured.length >= 8 ? featured : all).slice(0, 8);

  useEffect(() => {
    if (!desktop) return;
    let raf = 0;
    const tick = () => {
      const rawY = window.scrollY;
      if (!initialized.current) {
        filteredY.current = rawY;
        smoothedY.current = rawY; // no lag on first paint
        initialized.current = true;
      } else {
        // native (non-momentum) scroll delivers scrollY in discrete jumps —
        // this fast filter turns each jump into a quick continuous ramp
        // instead of a teleport, so the lag below never has a raw step to
        // spring back from (that spring-back was the reported "jitter").
        filteredY.current += (rawY - filteredY.current) * 0.35;
        smoothedY.current += (filteredY.current - smoothedY.current) * DAMPING;
      }
      const lag = (filteredY.current - smoothedY.current) * LAG_SCALE;

      colRefs.current.forEach((col, i) => {
        if (!col) return;
        const colLag = lag * COL_MULTIPLIER[i];
        col.style.transform = `translateY(${colLag}px)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [desktop]);

  const cols: ProjectDoc[][] = [[], [], [], []];
  PICKS.forEach((p, i) => cols[i % 4].push(p));

  return (
    <section className="relative w-full overflow-hidden bg-[#050506] px-4 py-28 md:px-6 md:py-36">
      <div className="mx-auto max-w-[1800px]">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-[0.22em] text-[#5c5b57]">
            SELECTED WORK
          </span>
          <Link
            href="/catalog"
            className="font-mono text-[10px] tracking-[0.22em] text-[#f4f3ef] transition-colors hover:text-acc"
          >
            FULL CATALOG →
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-10 xs:grid-cols-2 lg:grid-cols-4">
          {cols.map((col, i) => (
            <div
              key={i}
              ref={(el) => {
                colRefs.current[i] = el;
              }}
              className={desktop ? "flex flex-col gap-10 will-change-transform" : "flex flex-col gap-6"}
              style={desktop ? { marginTop: COL_OFFSET[i] } : undefined}
            >
              {col.map((project) => (
                <FlowCard key={project.slug} project={project} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
