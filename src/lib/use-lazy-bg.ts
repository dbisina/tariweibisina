"use client";

import { useEffect, useRef, useState } from "react";

/** Defers a CSS `background-image` fetch until the element is near the
 * viewport — plain `style={{ backgroundImage: url(...) }}` has no native
 * lazy-loading, so below-the-fold gallery/list images were all fetching
 * on initial page load. Returns a ref to attach to the element and the
 * url to use as `backgroundImage` (empty until it scrolls into range). */
const noIO = typeof IntersectionObserver === "undefined";

export function useLazyBg<T extends HTMLElement>(url: string, rootMargin = "600px") {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(noIO);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible || noIO) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) { setVisible(true); io.disconnect(); } },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return { ref, url: visible ? url : undefined };
}
