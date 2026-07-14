"use client";

import { useStudioStore } from "@/lib/studio";
import type { ProjectDoc, Stat } from "@/lib/content";
import { BlocksView } from "@/components/block-view";

/**
 * The project detail surface, used for both case studies (mode "case") and
 * pitch decks (mode "pitch"). It reads the live doc from the Studio store by
 * slug, falling back to the server-passed seed for first paint and for
 * visitors who never opened the Studio. Every section below the hero is a
 * Block, so the whole page is editable from /studio.
 */
export function ProjectDetail({ seed, mode }: { seed: ProjectDoc; mode: "case" | "pitch" }) {
  const live = useStudioStore((s) => s.config.projects.find((p) => p.slug === seed.slug));
  const doc = live ?? seed;

  const isPitch = mode === "pitch";
  const pitch = doc.pitch;
  const eyebrow = isPitch ? pitch?.eyebrow || doc.tag : doc.tag;
  const tagline = isPitch ? pitch?.tagline || doc.oneLiner : doc.oneLiner;
  const stats: Stat[] = (isPitch ? pitch?.heroStats : doc.heroStats) ?? [];
  const blocks = isPitch ? pitch?.blocks ?? [] : doc.blocks;

  return (
    <div className="relative">
      {/* hero — semler device: full-bleed dark image, brighter centered window */}
      <section className="relative flex h-screen items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: doc.gradient,
            backgroundImage: `url(${doc.image}), ${doc.gradient}`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div
          className="absolute left-1/2 top-1/2 h-[64vh] w-[min(38vw,340px)] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: doc.gradient,
            backgroundImage: `url(${doc.image}), ${doc.gradient}`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(1.15) saturate(1.05)",
            boxShadow: "0 0 120px rgba(0,0,0,0.5)",
          }}
        />
        <div className="relative z-10 max-w-3xl px-6 text-center">
          <p
            className="anim-fade-up font-mono text-[11px] tracking-[0.3em] text-[#f4f3ef]/80"
            style={{ animationDelay: "0.3s" }}
          >
            {isPitch ? "FOR INVESTORS · " : ""}
            {eyebrow}
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
            {doc.name}
          </h1>
          <p
            className="anim-fade-up mx-auto mt-5 max-w-xl font-sans text-base text-[#f4f3ef]/75 md:text-lg"
            style={{ animationDelay: "0.6s" }}
          >
            {tagline}
          </p>
        </div>
        <p className="absolute bottom-24 left-6 font-mono text-[10px] tracking-[0.2em] text-[#f4f3ef]/60 md:left-10">
          ↓ SCROLL
        </p>
      </section>

      {/* body blocks */}
      <BlocksView blocks={blocks} slug={doc.slug} />

      {/* the ask (pitch only) */}
      {isPitch && pitch && (
        <section className="mx-auto max-w-[1800px] px-4 py-16 md:px-6 md:py-24">
          <div className="rounded-2xl border border-acc/40 p-8 md:p-12">
            <p className="font-mono text-[10px] tracking-[0.24em] text-acc">THE ASK</p>
            <div className="mt-6 grid gap-8 md:grid-cols-3">
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] text-mut uppercase">Raise</div>
                <div className="mt-2 font-display text-xl text-ink">{pitch.ask.raise}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] text-mut uppercase">Use of funds</div>
                <div className="mt-2 font-display text-xl text-ink">{pitch.ask.use}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] text-mut uppercase">Contact</div>
                <a
                  href={`mailto:${pitch.ask.contact}`}
                  className="mt-2 block font-display text-xl text-ink transition-colors hover:text-acc"
                >
                  {pitch.ask.contact}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="h-40" />

      {/* persistent bottom stats pill */}
      {stats.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex items-stretch divide-x divide-ln overflow-hidden rounded-2xl border border-ln bg-bg/85 backdrop-blur-md">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col justify-center px-5 py-3 text-center md:px-8">
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
      )}

      {/* persistent CTA */}
      <div className="fixed bottom-4 right-4 z-40 hidden md:block">
        {!isPitch && doc.liveUrl ? (
          <a
            href={doc.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-sans text-sm text-[color:var(--bg)]"
          >
            Visit the live site <span className="text-acc">→</span>
          </a>
        ) : (
          <a
            href={isPitch ? `mailto:${pitch?.ask.contact ?? "danbis664@gmail.com"}` : "/contact"}
            className="flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-sans text-sm text-[color:var(--bg)]"
          >
            {isPitch ? "Request the deck" : "Get in touch"} <span className="text-acc">→</span>
          </a>
        )}
      </div>
    </div>
  );
}
