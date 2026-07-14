"use client";

import { useLazyBg } from "@/lib/use-lazy-bg";

/** Drop-in replacement for a `bg-cover bg-center` div with an inline
 * `backgroundImage` url — defers the actual image fetch until the tile is
 * within `rootMargin` of the viewport instead of firing on mount, since
 * CSS background-image has no native lazy-loading equivalent. */
export function LazyBg({
  src,
  className,
  rootMargin,
}: {
  src: string;
  className?: string;
  rootMargin?: string;
}) {
  const { ref, url } = useLazyBg<HTMLDivElement>(src, rootMargin);
  return (
    <div
      ref={ref}
      className={className}
      style={{ backgroundImage: url ? `url(${url})` : undefined }}
    />
  );
}
