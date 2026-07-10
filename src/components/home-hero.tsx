"use client";

import { useState } from "react";
import Link from "next/link";
import { ALL_PROJECTS } from "@/lib/projects";

/**
 * Homepage ported from the reference prototype (Tariwei.dc.html HOME route):
 * eyebrow + "From the metal / to the pixel." hero with serif-italic accent,
 * two pill CTAs into the paths, the stack marquee band, then the project
 * accordions ("click to open the schematics"). No portal door cards.
 */

const STACK = [
  "C / C++",
  "CUDA",
  "RUST",
  "GO",
  "PYTHON",
  "FASTAPI / DJANGO",
  "NODE / NEXT.JS",
  "REACT NATIVE",
  "KOTLIN",
  "SWIFT",
  "ROCM / OPENCL",
];

function Marquee() {
  const row = (
    <div className="inline-flex items-center gap-8 pr-8 font-mono text-[12.5px] tracking-[0.14em] text-mut">
      {STACK.map((s) => (
        <span key={s} className="inline-flex items-center gap-8">
          <span>{s}</span>
          <span className="text-acc">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden whitespace-nowrap border-y border-ln py-4">
      <div className="inline-flex animate-[mq_30s_linear_infinite]">
        {row}
        {row}
      </div>
    </div>
  );
}

const SYSTEMS = ALL_PROJECTS.filter((p) => p.side === "engineering").slice(0, 4);

function Accordions() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="mt-24">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="font-mono text-[11px] tracking-[0.22em] text-acc">
            THE WORK — {String(SYSTEMS.length).padStart(2, "0")} SYSTEMS
          </span>
          <span className="font-mono text-[10.5px] tracking-[0.16em] text-mut">
            CLICK TO OPEN THE SCHEMATICS
          </span>
        </div>
        <div className="mt-6 border-t border-ln">
          {SYSTEMS.map((p) => {
            const isOpen = open === p.slug;
            return (
              <div key={p.slug} className="border-b border-ln">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : p.slug)}
                  className="grid w-full cursor-pointer grid-cols-[52px_1fr_44px] items-center gap-4 py-6 text-left"
                >
                  <span className="font-mono text-xs text-mut">{p.index}</span>
                  <span>
                    <span className="block font-display text-[clamp(26px,3.4vw,44px)] font-medium leading-[1.05] tracking-tight text-ink">
                      {p.name}
                    </span>
                    <span className="mt-1 block font-mono text-[10.5px] tracking-[0.16em] text-mut">
                      {p.tag}
                    </span>
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ln text-lg text-acc">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                <div
                  className="grid overflow-hidden transition-[grid-template-rows] duration-500"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="min-h-0">
                    <div className="flex flex-col gap-5 pb-9 md:flex-row md:items-end md:justify-between">
                      <p className="max-w-xl font-sans text-[16px] leading-relaxed text-ink">
                        {p.blurb}
                      </p>
                      <Link
                        href={`/projects/${p.slug}`}
                        className="inline-flex w-fit items-center gap-2 rounded-full border border-ln px-5 py-2.5 font-sans text-sm text-ink transition-colors hover:border-acc"
                      >
                        Open the case <span className="text-acc">↗</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomeHero() {
  return (
    <div className="pt-16">
      <section className="relative overflow-hidden pt-[clamp(90px,16vh,180px)]">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <p className="anim-fade-up font-mono text-[11.5px] tracking-[0.22em] text-acc">
            DANIEL TARIWEI BISINA — POLYGLOT SOFTWARE &amp; AI SYSTEMS ENGINEER
          </p>
          <h1 className="mt-6 font-display font-medium leading-[0.94] tracking-[-0.04em] text-ink">
            <span
              className="anim-fade-up block"
              style={{ fontSize: "clamp(58px, 10.6vw, 164px)", animationDelay: "0.1s" }}
            >
              From the metal
            </span>
            <span
              className="anim-fade-up block"
              style={{ fontSize: "clamp(58px, 10.6vw, 164px)", animationDelay: "0.25s" }}
            >
              to the <span className="font-accent italic font-normal">pixel.</span>
            </span>
          </h1>
          <div className="mt-11 flex flex-wrap items-end justify-between gap-7 pb-16">
            <p
              className="anim-fade-up max-w-lg font-sans text-[clamp(15px,1.3vw,18px)] leading-relaxed text-mut"
              style={{ animationDelay: "0.4s" }}
            >
              GPU kernels, AI-native operating systems, production web &amp; mobile platforms —
              one engineer, the entire stack. Founder of{" "}
              <span className="font-medium text-ink">DeusX Technologies</span>.
            </p>
            <div className="anim-fade-up flex flex-wrap gap-3" style={{ animationDelay: "0.5s" }}>
              <Link
                href="/engineer"
                className="inline-flex items-center gap-2.5 rounded-full border border-ln px-6 py-3 font-sans text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-acc"
              >
                For engineers <span className="text-acc">↘</span>
              </Link>
              <Link
                href="/business"
                className="inline-flex items-center gap-2.5 rounded-full border border-ln px-6 py-3 font-sans text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-acc"
              >
                For business <span className="text-acc">↘</span>
              </Link>
            </div>
          </div>
        </div>
        <Marquee />
      </section>

      <Accordions />

      <footer className="mt-28 border-t border-ln py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 font-mono text-[10.5px] tracking-[0.14em] text-mut md:px-10">
          <span>© 2026 DEUSX TECHNOLOGIES — BUILT BY DANIEL TARIWEI BISINA</span>
          <Link href="/contact" className="text-ink hover:text-acc">
            OPEN TO PROJECTS &amp; ROLES ↗
          </Link>
        </div>
      </footer>
    </div>
  );
}
