"use client";

import Link from "next/link";
import { useStudioStore } from "@/lib/studio";

export function HackathonsList() {
  const projects = useStudioStore((s) => s.config.projects);
  const entries = projects.filter((p) => p.kind === "hackathon");

  return (
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
  );
}
