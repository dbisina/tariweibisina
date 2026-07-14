"use client";

import { useEffect, useRef } from "react";
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

// checkerboard sizing: long (tall) / short (wide), inverted column to column
// — col 0/2 run long-then-short, col 1/3 run short-then-long.
const LONG = "3/4";
const SHORT = "16/9";
function aspectFor(col: number, row: number): string {
  const longFirst = col % 2 === 0;
  const long = row === 0 ? longFirst : !longFirst;
  return long ? LONG : SHORT;
}

// signed multiplier per column, applied to the scroll lag (px)
const COL_MULTIPLIER = [-1, 0.8, -0.6, 0.5];
const LAG_SCALE = 0.22; // tunes the measured podium ratios to our card scale
const DAMPING = 0.07; // how quickly the smoothed value chases the real one
const FADE_SCALE = 60; // how much lag it takes to reach the fade floor
const FADE_FLOOR = 0.35; // slide + fade combined: never fades below this

function FlowCard({ project, aspect }: { project: ProjectDoc; aspect: string }) {
  const category = project.tag.split("·")[1]?.trim() ?? project.tag;

  return (
    <Link
      href={`/projects/${project.slug}`}
      data-perch="FEATURED PROJECT"
      className="group relative block w-full overflow-hidden bg-[#101013]"
      style={{ aspectRatio: aspect }}
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
  const smoothedY = useRef(0);
  const initialized = useRef(false);

  // CMS-controlled selection: featured flags, else the first eight projects.
  const all = useStudioStore((s) => s.config.projects);
  const featured = all.filter((p) => p.featured);
  const PICKS = (featured.length >= 8 ? featured : all).slice(0, 8);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const actualY = window.scrollY;
      if (!initialized.current) {
        smoothedY.current = actualY; // no lag on first paint
        initialized.current = true;
      } else {
        smoothedY.current += (actualY - smoothedY.current) * DAMPING;
      }
      const lag = (actualY - smoothedY.current) * LAG_SCALE;

      colRefs.current.forEach((col, i) => {
        if (!col) return;
        const colLag = lag * COL_MULTIPLIER[i];
        col.style.transform = `translateY(${colLag}px)`;
        col.style.opacity = String(1 - Math.min(1 - FADE_FLOOR, Math.abs(colLag) / FADE_SCALE));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const cols: { project: ProjectDoc; aspect: string }[][] = [[], [], [], []];
  PICKS.forEach((p, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    cols[col].push({ project: p, aspect: aspectFor(col, row) });
  });

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

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {cols.map((col, i) => (
            <div
              key={i}
              ref={(el) => {
                colRefs.current[i] = el;
              }}
              className="flex flex-col gap-10 will-change-transform"
            >
              {col.map(({ project, aspect }) => (
                <FlowCard key={project.slug} project={project} aspect={aspect} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
