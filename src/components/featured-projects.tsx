"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ALL_PROJECTS } from "@/lib/projects";

/**
 * Selected-work section in podium.global's work-grid language
 * (DESIGN-NOTES.md): a near-black band with staggered columns of media
 * cards that flow at different rates as you scroll (cross-flow parallax),
 * bold condensed uppercase titles BELOW the media with year/client right,
 * titles dim until their card is in the active center band.
 */

const YEAR = "2025";
const PICKS = [
  ALL_PROJECTS[0], // Relay
  ALL_PROJECTS[4], // Hebron Hotels
  ALL_PROJECTS[2], // ETLLM
  ALL_PROJECTS[5], // Wayfarian
  ALL_PROJECTS[1], // Aegis Matrix
  ALL_PROJECTS[7], // Uncle Stan's
];

// column layout: [columnIndex, aspect, topOffsetPx]
const SLOTS: [number, string, number][] = [
  [0, "3/4", 0],
  [1, "16/10", 140],
  [2, "3/4", 60],
  [0, "16/10", 90],
  [1, "3/4", 120],
  [2, "16/10", 80],
];

// parallax speed per column — middle drifts against the outer two
const COL_SPEED = [-0.06, 0.09, -0.045];

function FlowCard({
  project,
  aspect,
  topOffset,
}: {
  project: (typeof ALL_PROJECTS)[number];
  aspect: string;
  topOffset: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setActive(e.isIntersecting)),
      { rootMargin: "-30% 0px -30% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      href={`/projects/${project.slug}`}
      className="group block"
      style={{ marginTop: topOffset }}
    >
      <div
        className="w-full overflow-hidden bg-[#101013]"
        style={{ aspectRatio: aspect }}
      >
        <div
          className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.045]"
          style={{ backgroundImage: `url(${project.image})`, filter: active ? "none" : "saturate(0.8) brightness(0.85)" , transition: "filter .5s ease, transform .7s ease"}}
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <h3
          className="font-display text-xl font-bold uppercase tracking-[0.01em] transition-colors duration-400 md:text-2xl"
          style={{ color: active ? "#f4f3ef" : "#5c5b57" }}
        >
          {project.name}
        </h3>
        <div className="text-right font-mono text-[9.5px] leading-snug tracking-[0.1em] text-[#5c5b57]">
          {YEAR}
          <br />
          {project.tag.split("·")[1]?.trim() ?? project.tag}
        </div>
      </div>
    </Link>
  );
}

export function FeaturedProjects() {
  const sectionRef = useRef<HTMLElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);

  // cross-flow: columns translate against scroll at different rates
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const sec = sectionRef.current;
      if (sec) {
        const r = sec.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = (vh - r.top) / (vh + r.height); // 0 entering, 1 leaving
        const centered = (progress - 0.5) * r.height;
        colRefs.current.forEach((col, i) => {
          if (col) col.style.transform = `translateY(${centered * COL_SPEED[i]}px)`;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const cols: { project: (typeof ALL_PROJECTS)[number]; aspect: string; top: number }[][] = [
    [],
    [],
    [],
  ];
  PICKS.forEach((p, i) => {
    const [c, aspect, top] = SLOTS[i];
    cols[c].push({ project: p, aspect, top });
  });

  return (
    // podium's work band stays near-black in both realms
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[#050506] px-6 py-28 md:px-10 md:py-36"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-[0.22em] text-[#5c5b57]">
            SELECTED WORK
          </span>
          <Link
            href="/business/catalog"
            className="font-mono text-[10px] tracking-[0.22em] text-[#f4f3ef] transition-colors hover:text-acc"
          >
            FULL CATALOG →
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {cols.map((col, i) => (
            <div
              key={i}
              ref={(el) => {
                colRefs.current[i] = el;
              }}
              className="flex flex-col gap-14 will-change-transform"
            >
              {col.map(({ project, aspect, top }) => (
                <FlowCard key={project.slug} project={project} aspect={aspect} topOffset={top} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
