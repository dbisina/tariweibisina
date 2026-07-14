"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStudioStore } from "@/lib/studio";
import type { ProjectDoc } from "@/lib/content";

function CaseCard({ project, index, large }: { project: ProjectDoc; index: number; large: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => e[0].isIntersecting && (setSeen(true), io.disconnect()),
      { rootMargin: "-8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const kicker = project.tag.split("·")[1]?.trim() ?? project.tag;

  return (
    <Link
      ref={ref}
      href={`/projects/${project.slug}`}
      className={`group block ${large ? "md:col-span-2" : ""}`}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "none" : "translateY(28px)",
        transition: "opacity .7s ease, transform .7s cubic-bezier(.22,.7,.16,1)",
      }}
    >
      <div className={`relative overflow-hidden rounded-2xl border border-ln ${large ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.04]"
          style={{ backgroundImage: seen ? `url(${project.image})` : undefined }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <span className="font-mono text-[10px] tracking-[0.22em] text-[#f4f3ef]/70">
            {String(index + 1).padStart(2, "0")} · {kicker}
          </span>
          <div className="flex items-center gap-2 self-start rounded-full bg-acc px-4 py-2 font-mono text-[9px] tracking-[0.2em] text-[#0b0b0c] opacity-0 transition-opacity group-hover:opacity-100">
            OPEN CASE →
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl font-medium text-ink transition-colors group-hover:text-acc md:text-3xl">
          {project.name}
        </h3>
        <span className="font-mono text-[10px] tracking-[0.14em] text-mut">{project.year}</span>
      </div>
      <p className="mt-1 max-w-md font-sans text-sm text-mut">{project.oneLiner}</p>
    </Link>
  );
}

export function CaseCount() {
  const projects = useStudioStore((s) => s.config.projects);
  const n = projects.filter((p) => p.side === "business").length;
  return <>{String(n).padStart(2, "0")}</>;
}

export function CaseGrid() {
  // stable array from the selector; filter in render (see pitch-decks note)
  const projects = useStudioStore((s) => s.config.projects);
  const business = projects.filter((p) => p.side === "business");

  return (
    <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
      {business.map((p, i) => (
        <CaseCard key={p.slug} project={p} index={i} large={i % 3 === 0} />
      ))}
    </div>
  );
}
