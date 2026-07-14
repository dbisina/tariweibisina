"use client";

import { useEffect, useRef, useState } from "react";
import type { Block } from "@/lib/content";
import { galleryImage } from "@/lib/content";
import { LazyBg } from "@/components/lazy-bg";

/**
 * Renders the block content model into the site's case-study / pitch-deck
 * language. Each block type maps to a section pattern drawn from the
 * semlerpremium reference (label-left / body-right prose, hairline spec
 * tables, quiet stat rows). Every section fades in on scroll via our own
 * IntersectionObserver + CSS keyframes (framer entrance anims were observed
 * inert on these routes).
 */

function FadeIn({
  children,
  className,
  as: Tag = "div",
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "p" | "h2";
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && (setSeen(true), io.disconnect()),
      { rootMargin: "-10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`${className ?? ""} ${seen ? "anim-fade-up" : ""}`}
      style={seen ? (delay ? { animationDelay: `${delay}s` } : undefined) : { opacity: 0 }}
    >
      {children}
    </Tag>
  );
}

/** label-left / body-right two-column frame used by most sections */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto grid max-w-[1800px] grid-cols-1 gap-8 px-4 py-16 md:grid-cols-[1fr_1.5fr] md:px-6 md:py-24">
      <FadeIn as="h2" className="font-sans text-xl text-ink md:text-2xl">
        {label}
      </FadeIn>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function OneBlock({ block, slug }: { block: Block; slug: string }) {
  switch (block.type) {
    case "prose":
      return (
        <Row label={block.heading || "Overview"}>
          <FadeIn as="p" className="max-w-2xl font-sans text-lg leading-relaxed text-mut">
            {block.body}
          </FadeIn>
        </Row>
      );

    case "stats":
      return (
        <Row label={block.heading || "At a glance"}>
          <FadeIn className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {block.items.map((it, i) => (
              <div key={i}>
                <div className="font-display text-3xl font-semibold leading-none text-ink md:text-4xl">
                  {it.value}
                </div>
                <div className="mt-2 font-mono text-[10px] tracking-[0.14em] text-mut uppercase">
                  {it.label}
                </div>
              </div>
            ))}
          </FadeIn>
        </Row>
      );

    case "specs":
      return (
        <Row label={block.heading || "Details"}>
          <FadeIn>
            {block.items.map((it, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between gap-6 border-b border-ln py-3.5"
              >
                <span className="font-sans text-sm text-mut">{it.label}</span>
                <span className="text-right font-sans text-sm text-ink">{it.value}</span>
              </div>
            ))}
          </FadeIn>
        </Row>
      );

    case "features":
      return (
        <Row label={block.heading || "What it does"}>
          <FadeIn className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
            {block.items.map((it, i) => (
              <div key={i}>
                <h3 className="font-display text-lg font-medium text-ink">{it.title}</h3>
                <p className="mt-1.5 font-sans text-[15px] leading-relaxed text-mut">{it.body}</p>
              </div>
            ))}
          </FadeIn>
        </Row>
      );

    case "steps":
      return (
        <Row label={block.heading || "How it works"}>
          <FadeIn className="space-y-7">
            {block.items.map((it, i) => (
              <div key={i} className="flex gap-5">
                <span className="mt-0.5 font-mono text-sm text-acc">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-medium text-ink">{it.title}</h3>
                  <p className="mt-1 font-sans text-[15px] leading-relaxed text-mut">{it.body}</p>
                </div>
              </div>
            ))}
          </FadeIn>
        </Row>
      );

    case "chips":
      return (
        <Row label={block.heading || "Stack"}>
          <FadeIn className="flex flex-wrap gap-2.5">
            {block.items.map((it, i) => (
              <span
                key={i}
                className="rounded-full border border-ln px-4 py-2 font-mono text-[11px] tracking-[0.1em] text-ink"
              >
                {it.text}
              </span>
            ))}
          </FadeIn>
        </Row>
      );

    case "quote":
      return (
        <section className="mx-auto max-w-[1500px] px-4 py-24 text-center md:px-6 md:py-32">
          <FadeIn>
            <p className="font-display text-2xl font-light leading-snug text-ink md:text-4xl">
              &ldquo;{block.quote}&rdquo;
            </p>
            {(block.author || block.role) && (
              <p className="mt-6 font-mono text-[11px] tracking-[0.18em] text-mut uppercase">
                {block.author}
                {block.role ? ` · ${block.role}` : ""}
              </p>
            )}
          </FadeIn>
        </section>
      );

    case "gallery":
      return (
        <section className="mx-auto max-w-[1800px] px-4 py-16 md:px-6 md:py-24">
          {block.heading && (
            <FadeIn as="h2" className="mb-8 font-sans text-xl text-ink md:text-2xl">
              {block.heading}
            </FadeIn>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((it, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <LazyBg
                  src={it.src || galleryImage(slug, i)}
                  className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-ln bg-cover bg-center"
                />
                {it.caption && (
                  <p className="mt-2.5 font-sans text-sm text-mut">{it.caption}</p>
                )}
              </FadeIn>
            ))}
          </div>
        </section>
      );

    case "video":
      return (
        <section className="mx-auto max-w-[1800px] px-4 py-16 md:px-6 md:py-24">
          {block.heading && (
            <FadeIn as="h2" className="mb-8 font-sans text-xl text-ink md:text-2xl">
              {block.heading}
            </FadeIn>
          )}
          <div className="space-y-10">
            {block.items.map((it, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <VideoPlayer src={it.src ?? ""} />
                {it.caption && <p className="mt-3 font-sans text-sm text-mut">{it.caption}</p>}
              </FadeIn>
            ))}
          </div>
        </section>
      );

    case "embed":
      return (
        <section className="mx-auto max-w-[1800px] px-4 py-16 md:px-6 md:py-24">
          {block.heading && (
            <FadeIn as="h2" className="mb-3 font-sans text-xl text-ink md:text-2xl">
              {block.heading}
            </FadeIn>
          )}
          {block.body && (
            <FadeIn as="p" className="mb-8 max-w-2xl font-sans text-[15px] leading-relaxed text-mut">
              {block.body}
            </FadeIn>
          )}
          <div className="flex flex-wrap items-start justify-center gap-8">
            {block.items.map((it, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <DeviceFrame frame={it.label} src={it.src ?? ""} title={it.title} />
                <div className="mt-3 flex items-center justify-center gap-3">
                  {it.caption && <p className="text-center font-sans text-sm text-mut">{it.caption}</p>}
                  {it.src && (
                    <a
                      href={it.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-none font-mono text-[11px] tracking-[0.1em] text-acc transition-opacity hover:opacity-70"
                    >
                      Open live ↗
                    </a>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      );

    case "walkthrough":
      return (
        <section className="mx-auto max-w-[1500px] px-4 py-16 md:px-6 md:py-24">
          {block.heading && (
            <FadeIn as="h2" className="mb-3 font-sans text-xl text-ink md:text-2xl">
              {block.heading}
            </FadeIn>
          )}
          {block.body && (
            <FadeIn as="p" className="mb-10 max-w-2xl font-sans text-[15px] leading-relaxed text-mut">
              {block.body}
            </FadeIn>
          )}
          <div className="space-y-14">
            {block.items.map((it, i) => (
              <FadeIn key={i} delay={i * 0.06} className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <span className="flex-none font-mono text-sm text-acc">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  {it.src && (
                    <LazyBg
                      src={it.src}
                      className="mb-4 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-ln bg-cover bg-center"
                    />
                  )}
                  {it.title && (
                    <h3 className="font-display text-lg font-medium text-ink">{it.title}</h3>
                  )}
                  {it.body && (
                    <p className="mt-1.5 font-sans text-[15px] leading-relaxed text-mut">{it.body}</p>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      );

    case "demo":
      return (
        <Row label={block.heading || "Try it live"}>
          {block.body && (
            <FadeIn as="p" className="mb-6 max-w-2xl font-sans text-lg leading-relaxed text-mut">
              {block.body}
            </FadeIn>
          )}
          <FadeIn className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {block.items.map((it, i) =>
              it.src ? (
                <a
                  key={i}
                  href={it.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-ln p-5 transition-colors hover:border-acc"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg font-medium text-ink">
                      {it.title || "Live demo"}
                    </span>
                    <span className="block truncate font-mono text-[10px] tracking-[0.12em] text-mut uppercase">
                      {hostOf(it.src)}
                    </span>
                  </span>
                  <span className="ml-4 font-mono text-sm text-acc transition-transform group-hover:translate-x-0.5">
                    Launch ↗
                  </span>
                </a>
              ) : null
            )}
          </FadeIn>
        </Row>
      );

    default:
      return null;
  }
}

// ── media helpers ───────────────────────────────────────────────────────────

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** youtube/vimeo → embeddable iframe url; anything else → null (treat as file) */
function toEmbed(src: string): string | null {
  const yt = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function VideoPlayer({ src }: { src: string }) {
  const embed = toEmbed(src);
  if (embed)
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-ln bg-black">
        <iframe
          src={embed}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  if (!src) return null;
  return (
    <video
      src={src}
      controls
      playsInline
      className="w-full overflow-hidden rounded-2xl border border-ln bg-black"
    />
  );
}

/** wraps a live iframe in a browser/phone/tablet/desktop chrome */
function DeviceFrame({ frame, src, title }: { frame?: string; src: string; title?: string }) {
  const isAppetize = /appetize\.io/i.test(src);
  const f = isAppetize ? "appetize" : (frame || "browser").toLowerCase();
  const inner = (
    <iframe
      src={src}
      title={title || "Live embed"}
      loading="lazy"
      className="h-full w-full border-0 bg-white"
      {...(isAppetize
        ? { allow: "camera *; microphone *; clipboard-read *; clipboard-write *; encrypted-media *; fullscreen *" }
        : { sandbox: "allow-scripts allow-same-origin allow-forms allow-popups" })}
    />
  );
  // Appetize's own stream already draws real Android/iOS device chrome around
  // the app, so it gets no extra bezel here — just a plain frame, sized for
  // their default portrait embed.
  if (f === "appetize")
    return (
      <div className="mx-auto w-[380px] max-w-full overflow-hidden rounded-2xl bg-transparent">
        <div className="aspect-[380/760] w-full">{inner}</div>
      </div>
    );
  if (f === "phone")
    return (
      <div className="w-[300px] max-w-full overflow-hidden rounded-[2.2rem] border-[8px] border-neutral-800 bg-neutral-800 shadow-2xl">
        <div className="aspect-[9/19] w-full overflow-hidden rounded-[1.6rem]">{inner}</div>
      </div>
    );
  if (f === "tablet")
    return (
      <div className="w-[440px] max-w-full overflow-hidden rounded-[1.6rem] border-[10px] border-neutral-800 bg-neutral-800 shadow-2xl">
        <div className="aspect-[3/4] w-full overflow-hidden rounded-lg">{inner}</div>
      </div>
    );
  if (f === "bare")
    return (
      <div className="aspect-video w-[560px] max-w-full overflow-hidden rounded-xl border border-ln">
        {inner}
      </div>
    );
  // browser / desktop — chrome with a fake top bar
  return (
    <div className="w-[640px] max-w-full overflow-hidden rounded-xl border border-ln shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-ln bg-bg/60 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-mut/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-mut/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-mut/50" />
        <span className="ml-3 truncate font-mono text-[10px] text-mut">{hostOf(src)}</span>
      </div>
      <div className="aspect-[16/10] w-full overflow-hidden">{inner}</div>
    </div>
  );
}

export function BlocksView({ blocks, slug }: { blocks: Block[]; slug: string }) {
  return (
    <>
      {blocks.map((b) => (
        <OneBlock key={b.id} block={b} slug={slug} />
      ))}
    </>
  );
}
