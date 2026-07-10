"use client";

import { Logo } from "./logo";

/**
 * Home hero/about, mauriciojuba.com language (DESIGN-NOTES.md): role
 * eyebrow top-left, the name split into an outlined line and a heavy solid
 * accent line, status chips underneath, and — instead of a photo — the
 * shimmering signature as the personal mark. Rubik carries the hierarchy
 * through weight alone.
 */

const CHIPS = [
  "FOUNDER · DEUSX TECHNOLOGIES",
  "SHIPS THE ENTIRE STACK",
  "OPEN TO PROJECTS & ROLES",
];

export function AboutHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden px-6 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-6xl">
        <div className="anim-fade-up">
          <p className="font-sans text-[15px] font-medium tracking-[0.04em] text-ink">
            POLYGLOT SOFTWARE &amp; AI SYSTEMS ENGINEER
          </p>
          <p className="mt-1 font-mono text-[10.5px] tracking-[0.18em] text-mut">
            GPU KERNELS · AI-NATIVE OPERATING SYSTEMS · PRODUCTION WEB &amp; MOBILE
          </p>
        </div>

        {/* full name, juba-style rhythm: outline / accent solid / outline —
            TARIWEI. stays the dominant line, DANIEL and BISINA frame it */}
        <h1 className="mt-10 select-none font-display uppercase leading-[0.92]">
          <span
            className="anim-fade-up block font-light text-transparent"
            style={{
              fontSize: "clamp(2.9rem, 9.5vw, 8.5rem)",
              WebkitTextStroke: "1.5px var(--ink)",
              letterSpacing: "0.01em",
              animationDelay: "0.12s",
            }}
          >
            DANIEL
          </span>
          <span
            className="anim-fade-up block font-bold text-acc"
            style={{
              fontSize: "clamp(3.6rem, 12.5vw, 11.5rem)",
              letterSpacing: "-0.01em",
              animationDelay: "0.26s",
            }}
          >
            TARIWEI.
          </span>
          <span
            className="anim-fade-up block font-light text-transparent"
            style={{
              fontSize: "clamp(2.9rem, 9.5vw, 8.5rem)",
              WebkitTextStroke: "1.5px var(--ink)",
              letterSpacing: "0.01em",
              animationDelay: "0.4s",
            }}
          >
            BISINA
          </span>
        </h1>

        <div
          className="anim-fade-up mt-8 flex flex-wrap gap-x-7 gap-y-2"
          style={{ animationDelay: "0.42s" }}
        >
          {CHIPS.map((c) => (
            <span
              key={c}
              className="flex items-center gap-2.5 font-mono text-[10.5px] tracking-[0.16em] text-mut"
            >
              <span className="h-1.5 w-1.5 bg-acc" />
              {c}
            </span>
          ))}
        </div>

        <div
          className="anim-fade-up mt-16 flex flex-wrap items-end justify-between gap-8 border-t border-ln pt-8"
          style={{ animationDelay: "0.55s" }}
        >
          <p className="max-w-lg font-sans text-[15.5px] leading-relaxed text-mut">
            From CUDA kernels to the pixels they end up painting — one engineer, the entire
            stack. Founder of <span className="font-medium text-ink">DeusX Technologies</span>,
            building AI-native systems from the metal up.
          </p>
          <Logo variant="shimmer" className="h-10 w-auto text-ink md:h-14" />
        </div>
      </div>
    </section>
  );
}
