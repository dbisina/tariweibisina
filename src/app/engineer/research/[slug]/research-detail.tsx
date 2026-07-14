"use client";

import { useStudioStore } from "@/lib/studio";
import type { ResearchEntry } from "@/lib/research";

/** Continues the orientation its list card used — even index: image left,
 * text right; odd (inverted): image right, text left. `seed` is the
 * build-time entry (fast first paint / SEO); a live Studio edit for this
 * slug overrides it once the store hydrates, same pattern as ProjectDetail. */
export function ResearchDetail({ seed, index }: { seed: ResearchEntry; index: number }) {
  const live = useStudioStore((s) => s.config.research.find((r) => r.slug === seed.slug));
  const entry = live ?? seed;
  const inverted = index % 2 === 1;

  return (
    <div
      className={`mt-10 grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-16 ${
        inverted ? "md:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div
        className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-cover bg-center md:sticky md:top-32"
        style={{ backgroundImage: `url(${entry.image})` }}
      />
      <div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.16em] text-acc">{entry.tag}</span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-mut">{entry.publication}</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-5xl">
          {entry.title}
        </h1>
        <p className="mt-6 font-sans text-lg leading-relaxed text-mut">{entry.summary}</p>
        <div className="mt-10 space-y-6 border-t border-ln pt-10">
          {entry.body.map((para, i) => (
            <p key={i} className="font-sans text-[15px] leading-relaxed text-ink/90">
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
