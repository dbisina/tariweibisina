"use client";

import Link from "next/link";
import { useStudioStore } from "@/lib/studio";

export function DecksList() {
  // select the stable array reference; filter in render (a new array from the
  // selector breaks useSyncExternalStore snapshot caching)
  const projects = useStudioStore((s) => s.config.projects);
  const decks = projects.filter((p) => p.pitch !== null);

  return (
    <div className="mt-16 space-y-4">
      {decks.map((d) => (
        <Link
          key={d.slug}
          href={`/business/pitch-decks/${d.slug}`}
          className="group flex items-baseline justify-between gap-6 border-b border-ln py-8"
        >
          <div className="min-w-0">
            <span className="font-mono text-[10px] tracking-[0.2em] text-mut">
              {d.pitch?.eyebrow || d.tag}
            </span>
            <h2 className="mt-2 font-display text-3xl text-ink transition-colors group-hover:text-acc md:text-5xl">
              {d.name}
            </h2>
            <p className="mt-2 max-w-xl font-sans text-sm text-mut">
              {d.pitch?.tagline || d.oneLiner}
            </p>
          </div>
          <span className="flex-none font-mono text-xs text-acc">VIEW →</span>
        </Link>
      ))}
      {decks.length === 0 && (
        <p className="font-sans text-mut">No decks published yet.</p>
      )}
    </div>
  );
}
