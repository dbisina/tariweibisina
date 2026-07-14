"use client";

import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { useStudioStore } from "@/lib/studio";

/** Hackathon / competition builds — CMS-driven (kind: "hackathon" in
 * /studio), so the roster stays real as Daniel ships more. */
export default function HackathonsPage() {
  const projects = useStudioStore((s) => s.config.projects);
  const entries = projects.filter((p) => p.kind === "hackathon");

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1680px] px-4 pt-40 pb-32 md:px-6">
        <p className="font-mono text-[10px] tracking-[0.24em] text-acc">FOR ENGINEERS</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-ink">
          Hackathons.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg text-mut">
          Where half of the systems started: a deadline, a team, and no time to
          overthink.
        </p>

        <div className="mt-16 border-t border-ln">
          {entries.map((p, i) => (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="group grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-ln py-7"
            >
              <span className="font-mono text-xs text-mut">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="block font-display text-[clamp(20px,2.6vw,32px)] font-medium leading-[1.1] tracking-tight text-ink transition-colors group-hover:text-acc">
                  {p.name}
                </span>
                <span className="mt-1 block font-mono text-[10.5px] tracking-[0.16em] text-mut">
                  {p.tag}
                </span>
              </span>
              <span className="font-mono text-xs text-acc">OPEN ↗</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
