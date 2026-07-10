"use client";

import { useEffect, useRef, useState } from "react";
import type { CasePresentation } from "@/lib/case-studies";

/**
 * Shared case-study / pitch-deck presentation, modeled on the semlerpremium
 * Aventador page as observed live (DESIGN-NOTES.md): full-bleed dark hero
 * with a brighter centered "window" panel and giant thin title, a persistent
 * bottom stats pill through the whole scroll, label-left/body-right sections
 * with slow fade-ins, hairline spec tables, one dramatic scarcity line, and
 * a persistent CTA bottom-right.
 */

/** Scroll-reveal via our own IntersectionObserver + CSS keyframes. Framer
 * entrance animations were observed inert on this route (elements left at
 * their SSR-rendered initial values); plain IO + CSS has no such failure
 * mode. */
function FadeIn({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "p" | "h2";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "-10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`${className ?? ""} ${seen ? "anim-fade-up" : ""}`}
      style={seen ? undefined : { opacity: 0 }}
    >
      {children}
    </Tag>
  );
}

function SpecTable({ heading, rows }: { heading: string; rows: { label: string; value: string }[] }) {
  return (
    <div>
      <h3 className="font-sans text-lg text-ink">{heading}</h3>
      <div className="mt-6">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-6 border-b border-ln py-3.5"
          >
            <span className="font-sans text-sm text-mut">{r.label}</span>
            <span className="text-right font-sans text-sm text-ink">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CasePresentationView({ data }: { data: CasePresentation }) {
  return (
    <div className="relative">
      {/* hero */}
      <section className="relative flex h-screen items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: data.project.gradient,
            backgroundImage: `url(${data.project.image}), ${data.project.gradient}`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/55" />
        {/* brighter portrait "window" over the same image (semler hero device) */}
        <div
          className="absolute left-1/2 top-1/2 h-[64vh] w-[min(38vw,340px)] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: data.project.gradient,
            backgroundImage: `url(${data.project.image}), ${data.project.gradient}`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(1.15) saturate(1.05)",
            boxShadow: "0 0 120px rgba(0,0,0,0.5)",
          }}
        />
        {/* hero backdrop is always dark regardless of realm, so hero type is
            fixed light — var(--ink) would go dark-on-dark in light realm */}
        <div className="relative z-10 text-center">
          {/* CSS keyframes, not framer: framer entrance animations (both
              animate-on-mount and whileInView) were observed left inert at
              their SSR initial values on this route in real Chrome */}
          <p
            className="anim-fade-up font-mono text-[11px] tracking-[0.3em] text-[#f4f3ef]/80"
            style={{ animationDelay: "0.3s" }}
          >
            {data.eyebrow}
          </p>
          <h1
            className="anim-fade-up mt-3 font-display font-light uppercase text-[#f4f3ef]"
            style={{
              fontSize: "clamp(2.6rem, 8.5vw, 7rem)",
              letterSpacing: "0.06em",
              lineHeight: 1,
              animationDelay: "0.45s",
            }}
          >
            {data.title}
          </h1>
        </div>
        <p className="absolute bottom-24 left-6 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-[#f4f3ef]/60 md:left-10">
          ↓ SCROLL
        </p>
      </section>

      {/* description — label left, body right */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-32 md:grid-cols-[1fr_1.4fr] md:px-10 md:py-44">
        <FadeIn as="h2" className="font-sans text-2xl text-ink md:text-3xl">
          {data.descriptionLabel}
        </FadeIn>
        <FadeIn as="p" className="max-w-xl font-sans text-base leading-relaxed text-mut">
          {data.description}
        </FadeIn>
      </section>

      {/* spec tables */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 pb-32 md:grid-cols-2 md:px-10 md:pb-44">
        <FadeIn>
          <SpecTable heading={data.specsA.heading} rows={data.specsA.rows} />
        </FadeIn>
        <FadeIn>
          <SpecTable heading={data.specsB.heading} rows={data.specsB.rows} />
        </FadeIn>
      </section>

      {/* scarcity line */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 pb-40 md:grid-cols-[1fr_1.4fr] md:px-10">
        <FadeIn as="h2" className="font-sans text-2xl text-ink md:text-3xl">
          WORTH KNOWING
        </FadeIn>
        <FadeIn as="p" className="max-w-xl font-sans text-base text-mut">
          {data.scarcityLine}
        </FadeIn>
      </section>

      {/* atmospheric media break */}
      <section className="relative flex h-[70vh] items-center justify-center overflow-hidden bg-black">
        <FadeIn className="relative h-[52vh] w-[min(44vw,380px)]">
          <div
            className="h-full w-full"
            style={{
              background: data.project.gradient,
              backgroundImage: `url(${data.project.image}), ${data.project.gradient}`,
              backgroundSize: "cover",
              backgroundPosition: "center 30%",
            }}
          />
        </FadeIn>
      </section>

      <div className="h-40" />

      {/* persistent bottom stats pill */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <div className="pointer-events-auto flex items-stretch divide-x divide-ln overflow-hidden rounded-2xl border border-ln bg-bg/85 backdrop-blur-md">
          {data.stats.map((s) => (
            <div key={s.label} className="flex flex-col justify-center px-5 py-3 text-center md:px-8">
              <span className="font-sans text-sm text-ink md:text-base">{s.value}</span>
              <span className="mt-0.5 font-mono text-[9px] tracking-[0.14em] text-mut">{s.label}</span>
            </div>
          ))}
          <button
            aria-label="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center px-4 text-acc"
          >
            ↑
          </button>
        </div>
      </div>

      {/* persistent CTA */}
      <div className="fixed bottom-4 right-4 z-40 hidden md:block">
        {data.liveUrl ? (
          <a
            href={data.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-sans text-sm text-[color:var(--bg)]"
          >
            {data.ctaLabel} <span className="text-acc">→</span>
          </a>
        ) : (
          <a
            href="/contact"
            className="flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-sans text-sm text-[color:var(--bg)]"
          >
            {data.mode === "pitch-deck" ? data.ctaLabel : "Get in touch"}{" "}
            <span className="text-acc">→</span>
          </a>
        )}
      </div>
    </div>
  );
}
