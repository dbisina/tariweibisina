"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Block, ProjectDoc } from "@/lib/content";
import { galleryImage } from "@/lib/content";
import { LazyBg } from "@/components/lazy-bg";

/**
 * Full-screen investor pitch deck — lamalama.com/#pitchdeck language: a
 * fixed, scroll-snapped stack of single-focus slides instead of a scrolling
 * page. Only the intro slide runs dark; every slide after it (including the
 * closing ask) is light, mirroring their deck exactly. A slim index rail on
 * the left jumps between slides; the active one tracks via
 * IntersectionObserver so the rail and the URL-less "you are here" state
 * stay in sync without a scroll library.
 */

interface Slide {
  id: string;
  label: string;
  dark?: boolean;
  render: () => React.ReactNode;
}

function FadeIn({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && (setSeen(true), io.disconnect()),
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`${className ?? ""} ${seen ? "anim-fade-up" : ""}`} style={seen ? undefined : { opacity: 0 }}>
      {children}
    </div>
  );
}

function SlideLabel({ text }: { text: string }) {
  return (
    <p className="font-mono text-[11px] tracking-[0.3em] opacity-60">[ {text.toUpperCase()} ]</p>
  );
}

function SlideHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mt-5 font-display font-medium leading-[0.98] tracking-tight"
      style={{ fontSize: "clamp(2.2rem, 6vw, 5rem)" }}
    >
      {children}
    </h2>
  );
}

/** one Pitch block, rendered big and single-focus for the deck rather than
 * the compact case-study treatment BlocksView uses. */
function DeckBlockBody({ block, slug }: { block: Block; slug: string }) {
  switch (block.type) {
    case "prose":
      return <p className="mt-8 max-w-2xl font-sans text-xl leading-relaxed opacity-80">{block.body}</p>;

    case "stats":
      return (
        <div className="mt-10 grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-4">
          {block.items.map((it, i) => (
            <div key={i}>
              <div className="font-display text-4xl font-semibold leading-none md:text-5xl">{it.value}</div>
              <div className="mt-2.5 font-mono text-[10px] tracking-[0.16em] opacity-60 uppercase">{it.label}</div>
            </div>
          ))}
        </div>
      );

    case "specs":
      return (
        <div className="mt-10 max-w-2xl">
          {block.items.map((it, i) => (
            <div key={i} className="flex items-baseline justify-between gap-6 border-b border-current/15 py-4">
              <span className="font-sans text-base opacity-60">{it.label}</span>
              <span className="text-right font-sans text-base">{it.value}</span>
            </div>
          ))}
        </div>
      );

    case "features":
      return (
        <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
          {block.items.map((it, i) => (
            <div key={i}>
              <h3 className="font-display text-xl font-medium">{it.title}</h3>
              <p className="mt-2 font-sans text-base leading-relaxed opacity-70">{it.body}</p>
            </div>
          ))}
        </div>
      );

    case "steps":
      return (
        <div className="mt-10 max-w-2xl space-y-8">
          {block.items.map((it, i) => (
            <div key={i} className="flex gap-5">
              <span className="mt-0.5 font-mono text-lg opacity-50">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-display text-xl font-medium">{it.title}</h3>
                <p className="mt-1.5 font-sans text-base leading-relaxed opacity-70">{it.body}</p>
              </div>
            </div>
          ))}
        </div>
      );

    case "chips":
      return (
        <div className="mt-10 flex flex-wrap gap-3">
          {block.items.map((it, i) => (
            <span key={i} className="rounded-full border border-current/20 px-5 py-2.5 font-mono text-sm tracking-[0.06em]">
              {it.text}
            </span>
          ))}
        </div>
      );

    case "quote":
      return (
        <div className="mt-8 max-w-3xl">
          <p className="font-display text-3xl font-light leading-snug md:text-5xl">&ldquo;{block.quote}&rdquo;</p>
          {(block.author || block.role) && (
            <p className="mt-6 font-mono text-xs tracking-[0.18em] opacity-60 uppercase">
              {block.author}
              {block.role ? ` · ${block.role}` : ""}
            </p>
          )}
        </div>
      );

    case "gallery":
      return (
        <div className="mt-10 grid w-full max-w-5xl grid-cols-2 gap-4 md:grid-cols-3">
          {block.items.slice(0, 6).map((it, i) => (
            <LazyBg
              key={i}
              src={it.src || galleryImage(slug, i)}
              className="aspect-[4/3] overflow-hidden rounded-xl bg-cover bg-center"
            />
          ))}
        </div>
      );

    case "video":
    case "embed":
    case "demo":
    case "walkthrough": {
      const first = block.items[0];
      return (
        <div className="mt-10 w-full max-w-4xl">
          {first?.src && (
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-current/15 bg-black/5">
              {block.type === "video" || block.type === "walkthrough" ? (
                <LazyBg src={first.src} className="h-full w-full bg-cover bg-center" />
              ) : (
                <iframe src={first.src} title={first.title || "Preview"} className="h-full w-full border-0" loading="lazy" />
              )}
            </div>
          )}
          {first?.src && (
            <a
              href={first.src}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex font-mono text-xs tracking-[0.14em] underline underline-offset-4 opacity-70"
            >
              OPEN LIVE ↗
            </a>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

export function PitchDeckViewer({ doc }: { doc: ProjectDoc }) {
  const pitch = doc.pitch!;
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const slides: Slide[] = [
    {
      id: "intro",
      label: "for investors",
      dark: true,
      render: () => (
        <>
          <FadeIn>
            <SlideLabel text={pitch.eyebrow || doc.tag} />
            <SlideHeading>{doc.name}</SlideHeading>
            <p className="mx-auto mt-6 max-w-xl font-sans text-lg leading-relaxed opacity-80 md:text-xl">
              {pitch.tagline || doc.oneLiner}
            </p>
          </FadeIn>
        </>
      ),
    },
    {
      id: "glance",
      label: "at a glance",
      render: () => (
        <FadeIn>
          <SlideLabel text="At a glance" />
          <SlideHeading>The numbers.</SlideHeading>
          <div className="mt-10 grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-4">
            {pitch.heroStats.map((s, i) => (
              <div key={i}>
                <div className="font-display text-4xl font-semibold leading-none md:text-5xl">{s.value}</div>
                <div className="mt-2.5 font-mono text-[10px] tracking-[0.16em] opacity-60 uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      ),
    },
    ...pitch.blocks.map((block, i) => ({
      id: block.id,
      label: block.heading || `slide ${String(i + 3).padStart(2, "0")}`,
      render: () => (
        <FadeIn>
          {block.heading && <SlideLabel text={block.heading} />}
          {block.type === "quote" ? null : block.heading && (
            <SlideHeading>{block.heading}</SlideHeading>
          )}
          <DeckBlockBody block={block} slug={doc.slug} />
        </FadeIn>
      ),
    })),
    {
      id: "ask",
      label: "the ask",
      render: () => (
        <FadeIn>
          <SlideLabel text="The ask" />
          <SlideHeading>Let&apos;s build this.</SlideHeading>
          <div className="mt-10 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] opacity-60 uppercase">Raise</div>
              <div className="mt-2 font-display text-xl">{pitch.ask.raise}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] opacity-60 uppercase">Use of funds</div>
              <div className="mt-2 font-display text-xl">{pitch.ask.use}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] opacity-60 uppercase">Contact</div>
              <div className="mt-2 font-display text-xl">{pitch.ask.contact}</div>
            </div>
          </div>
          <a
            href={`mailto:${pitch.ask.contact}`}
            className="mt-10 inline-flex rounded-full bg-[#131316] px-8 py-4 font-sans text-sm font-medium text-[#f4f3ef]"
          >
            Request the deck →
          </a>
        </FadeIn>
      ),
    },
  ];

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = slideRefs.current.findIndex((el) => el === e.target);
            if (i >= 0) setActive(i);
          }
        });
      },
      { root: containerRef.current, threshold: 0.6 }
    );
    slideRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [slides.length]);

  const jump = (i: number) => slideRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="fixed inset-0 z-[200] bg-black">
      {/* close */}
      <Link
        href="/business/pitch-decks"
        aria-label="Exit pitch deck"
        className="fixed right-5 top-5 z-[210] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 font-sans text-white backdrop-blur-md transition-colors hover:border-white/50"
      >
        ✕
      </Link>

      {/* index rail — desktop only */}
      <div className="fixed left-5 top-1/2 z-[210] hidden -translate-y-1/2 flex-col gap-3 md:flex">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => jump(i)}
            aria-label={`Go to slide ${i + 1}: ${s.label}`}
            className="group flex items-center gap-3"
          >
            <span
              className="h-1.5 w-1.5 flex-none rounded-full transition-all"
              style={{
                background: i === active ? "var(--acc)" : "rgba(255,255,255,0.35)",
                transform: i === active ? "scale(1.6)" : "scale(1)",
              }}
            />
            <span
              className="max-w-0 overflow-hidden whitespace-nowrap font-mono text-[10px] tracking-[0.14em] text-white opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:opacity-70"
            >
              {s.label.toUpperCase()}
            </span>
          </button>
        ))}
      </div>

      {/* slides */}
      <div ref={containerRef} className="h-full w-full snap-y snap-mandatory overflow-y-auto scroll-smooth">
        {slides.map((s, i) => (
          <section
            key={s.id}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            className="flex h-dvh w-full snap-start flex-col items-center justify-center px-6 text-center md:px-16"
            style={{
              background: s.dark ? "#0b0b0c" : "#f4f3ef",
              color: s.dark ? "#f4f3ef" : "#131316",
              backgroundImage:
                s.dark && doc.image
                  ? `linear-gradient(rgba(11,11,12,0.72), rgba(11,11,12,0.86)), url(${doc.image})`
                  : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center">{s.render()}</div>
          </section>
        ))}
      </div>

      {/* scroll hint on first slide only */}
      {active === 0 && (
        <p className="pointer-events-none fixed bottom-8 left-1/2 z-[205] -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-white/60">
          ↓ SCROLL
        </p>
      )}
    </div>
  );
}
