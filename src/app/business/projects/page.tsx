"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ALL_PROJECTS } from "@/lib/projects";

/**
 * Business PROJECTS — the presentational view (podium/semler reference
 * language): every business-side project as a large editorial card that
 * opens its full case presentation. The raw, no-narrative view of all work
 * lives at /catalog instead.
 */

const BUSINESS = ALL_PROJECTS.filter((p) => p.side === "business");

function CaseCard({
  project,
  index,
  large,
}: {
  project: (typeof ALL_PROJECTS)[number];
  index: number;
  large: boolean;
}) {
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
          style={{ backgroundImage: `url(${project.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <span className="font-mono text-[10px] tracking-[0.22em] text-[#f4f3ef]/70">
            {String(index + 1).padStart(2, "0")} · {project.tag.split("·")[1]?.trim()}
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
        <span className="font-mono text-[10px] tracking-[0.14em] text-mut">2025</span>
      </div>
      <p className="mt-1 max-w-md font-sans text-sm text-mut">{project.blurb}</p>
    </Link>
  );
}

export default function BusinessProjectsPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 pt-40 pb-24 md:px-10 md:pt-48">
        <p className="font-mono text-[11px] tracking-[0.24em] text-acc">
          BUSINESS · {String(BUSINESS.length).padStart(2, "0")} CASE STUDIES
        </p>
        <h1
          className="mt-5 font-display font-medium leading-[0.94] tracking-[-0.035em] text-ink"
          style={{ fontSize: "clamp(2.8rem, 8vw, 6.5rem)" }}
        >
          The work, <span className="font-accent italic font-normal">presented.</span>
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-mut">
          Each one a full case: the problem, what got built, the live thing. Want the raw
          index with no narrative?{" "}
          <Link href="/catalog" className="text-ink underline underline-offset-4 hover:text-acc">
            See the catalog.
          </Link>
        </p>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
          {BUSINESS.map((p, i) => (
            <CaseCard key={p.slug} project={p} index={i} large={i % 3 === 0} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
