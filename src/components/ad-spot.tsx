"use client";

import { useStudioStore } from "@/lib/studio";

/**
 * Sponsorship slot — deliberately quiet: token colors, hairline border,
 * clear SPONSORED marking, one CTA. Copy and target come from the Studio
 * CMS (content.ad), so it is booked/edited from /studio; disabling it there
 * removes it from the page entirely.
 */
export function AdSpot() {
  const ad = useStudioStore((s) => s.config.content.ad);
  if (!ad.enabled) return null;

  return (
    <section className="w-full px-4 py-14 md:px-6">
      <div className="mx-auto max-w-[1800px]">
        <a
          href={ad.ctaHref}
          data-perch="THIS SPONSOR SLOT"
          style={{ borderRadius: "var(--radius, 16px)" }}
          className="group flex flex-wrap items-center justify-between gap-4 border border-dashed border-ln px-6 py-5 transition-colors hover:border-acc md:px-8"
        >
          <div className="flex items-center gap-5">
            <span className="rounded-full border border-ln px-2.5 py-1 font-mono text-[9px] tracking-[0.22em] text-mut">
              SPONSORED
            </span>
            <span className="font-sans text-[15px] text-mut">
              {ad.headline} <span className="text-ink">{ad.body}</span>
            </span>
          </div>
          <span className="font-mono text-[10.5px] tracking-[0.16em] text-acc">
            {ad.ctaLabel} ↗
          </span>
        </a>
      </div>
    </section>
  );
}

/** Compact pill for tight spaces (the navbar) — same Studio-controlled ad,
 * same enable/disable switch, just no room for the full copy line. */
export function AdSpotCompact() {
  const ad = useStudioStore((s) => s.config.content.ad);
  if (!ad.enabled) return null;

  return (
    <a
      href={ad.ctaHref}
      data-perch="THIS SPONSOR SLOT"
      className="hidden items-center gap-2 rounded-full border border-dashed border-ln px-3 py-1.5 transition-colors hover:border-acc lg:flex"
    >
      <span className="font-mono text-[8px] tracking-[0.18em] text-mut">SPONSORED</span>
      <span className="max-w-[140px] truncate font-sans text-[12px] text-ink">{ad.headline}</span>
      <span className="font-mono text-[10px] text-acc">↗</span>
    </a>
  );
}
