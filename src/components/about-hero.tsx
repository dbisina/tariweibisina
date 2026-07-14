"use client";

import { Logo } from "./logo";
import { VisitorTag } from "./visitor-tag";

/**
 * Home hero/about, mauriciojuba.com language (DESIGN-NOTES.md): role
 * eyebrow top-left, the name split into an outlined line and a heavy solid
 * accent line, status chips underneath, and — instead of a photo — the
 * shimmering signature as the personal mark. Rubik carries the hierarchy
 * through weight alone.
 */

const CHIPS = [
  "CO-FOUNDER · DEUSX TECHNOLOGIES",
  "SHIPS THE ENTIRE STACK",
  "OPEN TO PROJECTS & ROLES",
];

export function AboutHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden px-4 pt-32 md:px-6 md:pt-40">
      {/* soft depth behind the headline — flat mono text on an empty
          background is what read as bland on narrow screens where there's
          no other visual weight to balance it against */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[30%] h-[60vh] w-[120vw] -translate-x-1/2 opacity-[0.16] md:opacity-[0.12]"
        style={{ background: "radial-gradient(closest-side, var(--acc), transparent 70%)", filter: "blur(60px)" }}
      />
      <VisitorTag className="anim-fade-up absolute right-6 top-24 hidden text-right md:block md:right-10 md:top-28" />
      <div className="mx-auto max-w-[1800px]">
        <div className="anim-fade-up flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div>
            <p className="font-sans text-[15px] font-medium tracking-[0.04em] text-ink">
              POLYGLOT SOFTWARE &amp; AI SYSTEMS ENGINEER
            </p>
            <p className="mt-1 font-mono text-[10.5px] tracking-[0.18em] text-mut">
              GPU KERNELS · AI-NATIVE OPERATING SYSTEMS · PRODUCTION WEB &amp; MOBILE
            </p>
          </div>
          <VisitorTag className="md:hidden" />
        </div>

        {/* hierarchy per Daniel: surname-first on the top line — BISINA,
            outlined, then DANIEL solid in ink at the SAME size as BISINA
            (Tariwei's weight, not its scale) so the line balances. The
            brand name TARIWEI. stays huge and solid beneath. */}
        <h1 data-perch="THE HEADLINE" className="mt-10 select-none break-words font-display uppercase leading-[0.92]">
          <span
            className="anim-fade-up block"
            style={{
              fontSize: "clamp(1.3rem, 6.5vw, 5.8rem)",
              letterSpacing: "0.02em",
              animationDelay: "0.12s",
            }}
          >
            <span
              className="font-light text-transparent"
              style={{ WebkitTextStroke: "1.5px var(--ink)" }}
            >
              BISINA,
            </span>{" "}
            <span className="font-bold text-ink">DANIEL</span>
          </span>
          <span
            className="anim-fade-up block font-bold text-acc"
            style={{
              fontSize: "clamp(1.8rem, 14.5vw, 13rem)",
              letterSpacing: "-0.01em",
              animationDelay: "0.28s",
            }}
          >
            TARIWEI.
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
          <Logo variant="shimmer" className="h-12 w-auto text-ink md:h-14" />
        </div>
      </div>
    </section>
  );
}
